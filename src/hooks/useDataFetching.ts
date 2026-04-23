import { useState, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import {
  fetchAppData,
  fetchMoreMessages,
  fetchMoreGames,
  fetchMoreTournaments,
  fetchMoreNotifications,
} from '@/lib/firestoreService';
import { traceAsync } from '@/lib/performanceTraces';
import type { AppUser, AppNotification, RefereeRating, IndependentGame, RefereeWithAvailability, NotificationPreferences } from '@/lib/types';
import type {
  MappedProfile, MappedGame, MappedTournament, MappedPayment,
  MappedMessage, MappedAvailability, MappedGameReport, MappedConnection,
} from '@/lib/mappers';

export const useDataFetching = (user: AppUser | null) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [games, setGames] = useState<MappedGame[]>([]);
  const [payments, setPayments] = useState<MappedPayment[]>([]);
  const [messages, setMessages] = useState<MappedMessage[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [tournaments, setTournaments] = useState<MappedTournament[]>([]);
  const [referees, setReferees] = useState<RefereeWithAvailability[]>([]);
  const [availability, setAvailability] = useState<MappedAvailability[]>([]);
  const [gameReports, setGameReports] = useState<MappedGameReport[]>([]);
  const [refereeRatings, setRefereeRatings] = useState<RefereeRating[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    gameAssignments: true, scheduleChanges: true, paymentUpdates: true,
    messages: true, emailNotifications: true, pushNotifications: false, smsNotifications: false,
  });
  const [connections, setConnections] = useState<MappedConnection[]>([]);
  const [managerProfiles, setManagerProfiles] = useState<MappedProfile[]>([]);
  const [independentGames, setIndependentGames] = useState<IndependentGame[]>([]);

  // Pagination state
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [hasMoreGames, setHasMoreGames] = useState(false);
  const [hasMoreTournaments, setHasMoreTournaments] = useState(false);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(false);

  const userRef = useRef(user);
  userRef.current = user;

  const fetchData = useCallback(async (isInitialLoad = true) => {
    const currentUser = userRef.current;
    if (!currentUser) {
      setGames([]); setPayments([]); setMessages([]); setNotifications([]);
      setTournaments([]); setReferees([]); setAvailability([]); setGameReports([]);
      setConnections([]); setManagerProfiles([]); setIndependentGames([]);
      setHasMoreMessages(false); setHasMoreGames(false);
      setHasMoreTournaments(false); setHasMoreNotifications(false);
      setLoading(false);
      return;
    }

    if (isInitialLoad) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await traceAsync('fetch_app_data', () => fetchAppData(currentUser));
      setGames(data.games || []);
      setTournaments(data.tournaments || []);
      setPayments(data.payments || []);
      setMessages(data.messages || []);
      setNotifications(data.notifications || []);
      setReferees(data.referees || []);
      setAvailability(data.availability || []);
      setGameReports(data.gameReports || []);
      setRefereeRatings(data.refereeRatings || []);
      setNotificationPreferences(data.notificationPreferences || {
        gameAssignments: true, scheduleChanges: true, paymentUpdates: true,
        messages: true, emailNotifications: true, pushNotifications: false, smsNotifications: false,
      });
      setConnections(data.connections || []);
      setManagerProfiles(data.managerProfiles || []);
      setIndependentGames(data.independentGames || []);
      setHasMoreMessages(!!data.hasMoreMessages);
      setHasMoreGames(!!data.hasMoreGames);
      setHasMoreTournaments(!!data.hasMoreTournaments);
      setHasMoreNotifications(!!data.hasMoreNotifications);
    } catch (error: unknown) {
      if (isInitialLoad) {
        setGames([]); setPayments([]); setMessages([]); setNotifications([]);
        setTournaments([]); setReferees([]); setAvailability([]); setGameReports([]);
        setConnections([]); setManagerProfiles([]); setIndependentGames([]);
        setHasMoreMessages(false); setHasMoreGames(false);
        setHasMoreTournaments(false); setHasMoreNotifications(false);
      }
      toast({
        title: "Error fetching data",
        description: (error as Error).message || 'Could not load app data. Please refresh the page.',
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMoreMessages = useCallback(async (
    currentMessages: MappedMessage[],
    currentReferees: MappedProfile[],
    currentManagers: MappedProfile[],
  ) => {
    const currentUser = userRef.current;
    if (!currentUser || !hasMoreMessages) return;
    const oldest = currentMessages[currentMessages.length - 1];
    if (!oldest?.timestamp) return;

    const cursorDate = new Date(oldest.timestamp);
    if (Number.isNaN(cursorDate.getTime())) return;

    setRefreshing(true);
    try {
      const allUsers = [...currentReferees, ...currentManagers,
        { id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl } as MappedProfile];
      const { data, error } = await fetchMoreMessages(currentUser, cursorDate, allUsers);
      if (error) throw new Error(error.message);
      const result = data as { items: MappedMessage[]; hasMore: boolean };
      setMessages(prev => [...prev, ...result.items]);
      setHasMoreMessages(result.hasMore);
    } catch (err: unknown) {
      toast({ title: 'Failed to load more messages', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  }, [hasMoreMessages]);

  const loadMoreGames = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser || !hasMoreGames || currentUser.role !== 'manager') return;

    setRefreshing(true);
    try {
      const lastGame = games[games.length - 1];
      if (!lastGame) return;
      const cursor = lastGame.date || '';
      const assignmentsRaw: Record<string, unknown>[] = games.flatMap((g) =>
        g.assignments.map((a) => ({
          id: a.id,
          game_id: g.id,
          referee_id: a.refereeId,
          status: a.status,
          decline_reason: a.declineReason,
        }))
      );
      const tournamentsRaw: Record<string, unknown>[] = tournaments.map((t) => ({
        id: t.id,
        name: t.name,
        manager_id: t.managerId,
      }));
      const allUsers = [...referees, ...managerProfiles];

      const { data, error } = await fetchMoreGames(currentUser.id, cursor, assignmentsRaw, allUsers, tournamentsRaw);
      if (error) throw new Error(error.message);
      const result = data as { items: MappedGame[]; hasMore: boolean };
      setGames(prev => [...prev, ...result.items]);
      setHasMoreGames(result.hasMore);
    } catch (err: unknown) {
      toast({ title: 'Failed to load more games', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  }, [hasMoreGames, games, referees, managerProfiles, tournaments]);

  const loadMoreTournaments = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser || !hasMoreTournaments || currentUser.role !== 'manager') return;

    setRefreshing(true);
    try {
      const lastTournament = tournaments[tournaments.length - 1];
      if (!lastTournament) return;
      const cursor = lastTournament.name || '';
      const gamesRaw: Record<string, unknown>[] = games.map((g) => ({
        id: g.id,
        tournament_id: g.tournamentId,
      }));

      const { data, error } = await fetchMoreTournaments(currentUser.id, cursor, gamesRaw);
      if (error) throw new Error(error.message);
      const result = data as { items: MappedTournament[]; hasMore: boolean };
      setTournaments(prev => [...prev, ...result.items]);
      setHasMoreTournaments(result.hasMore);
    } catch (err: unknown) {
      toast({ title: 'Failed to load more tournaments', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  }, [hasMoreTournaments, tournaments, games]);

  const loadMoreNotifications = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser || !hasMoreNotifications) return;

    const lastNotif = notifications[notifications.length - 1];
    if (!lastNotif) return;
    const cursorDate = new Date(lastNotif.created_at || '');
    if (Number.isNaN(cursorDate.getTime())) return;

    setRefreshing(true);
    try {
      const { data, error } = await fetchMoreNotifications(currentUser.id, cursorDate);
      if (error) throw new Error(error.message);
      const result = data as { items: AppNotification[]; hasMore: boolean };
      setNotifications(prev => [...prev, ...result.items]);
      setHasMoreNotifications(result.hasMore);
    } catch (err: unknown) {
      toast({ title: 'Failed to load more notifications', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  }, [hasMoreNotifications, notifications]);

  return {
    loading, refreshing,
    games, setGames,
    payments, setPayments,
    messages, setMessages,
    notifications, setNotifications,
    tournaments, setTournaments,
    referees, setReferees,
    availability, setAvailability,
    gameReports, setGameReports,
    refereeRatings, setRefereeRatings,
    notificationPreferences, setNotificationPreferences,
    connections, setConnections,
    managerProfiles, setManagerProfiles,
    independentGames, setIndependentGames,
    hasMoreMessages, loadMoreMessages,
    hasMoreGames, loadMoreGames,
    hasMoreTournaments, loadMoreTournaments,
    hasMoreNotifications, loadMoreNotifications,
    fetchData,
  };
};
