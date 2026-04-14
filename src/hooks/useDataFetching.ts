import { useState, useCallback, useRef, type Dispatch, type SetStateAction } from 'react';
import { toast } from '@/components/ui/use-toast';
import {
  fetchAppData,
  fetchMoreMessages,
  fetchMoreGames,
  fetchMoreTournaments,
  fetchMoreNotifications,
} from '@/lib/firestoreService';
import { traceAsync } from '@/lib/performanceTraces';
import type { AppUser } from '@/lib/types';
import type { MappedProfile, MappedMessage } from '@/lib/mappers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyArr = any[];

const PAGE_SIZE = 50;

export const useDataFetching = (user: AppUser | null) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [games, setGames] = useState<AnyArr>([]);
  const [payments, setPayments] = useState<AnyArr>([]);
  const [messages, setMessages] = useState<MappedMessage[]>([]);
  const [notifications, setNotifications] = useState<AnyArr>([]);
  const [tournaments, setTournaments] = useState<AnyArr>([]);
  const [referees, setReferees] = useState<MappedProfile[]>([]);
  const [availability, setAvailability] = useState<AnyArr>([]);
  const [gameReports, setGameReports] = useState<AnyArr>([]);
  const [refereeRatings, setRefereeRatings] = useState<AnyArr>([]);
  const [notificationPreferences, setNotificationPreferences] = useState<Record<string, boolean>>({});
  const [connections, setConnections] = useState<AnyArr>([]);
  const [managerProfiles, setManagerProfiles] = useState<MappedProfile[]>([]);
  const [independentGames, setIndependentGames] = useState<AnyArr>([]);

  // Pagination state
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [hasMoreGames, setHasMoreGames] = useState(false);
  const [hasMoreTournaments, setHasMoreTournaments] = useState(false);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(false);

  // Ref to avoid recreating fetchData when user object reference changes
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
      setGames(data.games);
      setTournaments(data.tournaments);
      setPayments(data.payments);
      setMessages(data.messages);
      setNotifications(data.notifications);
      setReferees(data.referees);
      setAvailability(data.availability);
      setGameReports(data.gameReports);
      setRefereeRatings(data.refereeRatings || []);
      setNotificationPreferences(data.notificationPreferences || {});
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
  }, []); // Stable — uses userRef instead of user

  const loadMoreMessages = useCallback(async (
    currentMessages: MappedMessage[],
    currentReferees: MappedProfile[],
    currentManagers: MappedProfile[],
  ) => {
    const currentUser = userRef.current;
    if (!currentUser || !hasMoreMessages) return;
    const oldest = currentMessages[currentMessages.length - 1];
    if (!oldest?.timestamp) return;

    setRefreshing(true);
    try {
      const allUsers = [...currentReferees, ...currentManagers,
        { id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl } as MappedProfile];
      const { data, error } = await fetchMoreMessages(currentUser, oldest.timestamp, allUsers);
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
      const cursor = lastGame.gameDate || lastGame.game_date || '';
      // We pass empty arrays for assignments/users/tournaments since the raw game data
      // from fetchMoreGames needs the same mapper args. For simplicity, re-fetch raw.
      const { data, error } = await fetchMoreGames(currentUser.id, cursor, [], [], []);
      if (error) throw new Error(error.message);
      const result = data as { items: AnyArr; hasMore: boolean };
      setGames(prev => [...prev, ...result.items]);
      setHasMoreGames(result.hasMore);
    } catch (err: unknown) {
      toast({ title: 'Failed to load more games', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  }, [hasMoreGames, games]);

  const loadMoreTournaments = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser || !hasMoreTournaments || currentUser.role !== 'manager') return;

    setRefreshing(true);
    try {
      const lastTournament = tournaments[tournaments.length - 1];
      if (!lastTournament) return;
      const cursor = lastTournament.name || '';
      const { data, error } = await fetchMoreTournaments(currentUser.id, cursor, []);
      if (error) throw new Error(error.message);
      const result = data as { items: AnyArr; hasMore: boolean };
      setTournaments(prev => [...prev, ...result.items]);
      setHasMoreTournaments(result.hasMore);
    } catch (err: unknown) {
      toast({ title: 'Failed to load more tournaments', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  }, [hasMoreTournaments, tournaments]);

  const loadMoreNotifications = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser || !hasMoreNotifications) return;

    setRefreshing(true);
    try {
      const lastNotif = notifications[notifications.length - 1];
      if (!lastNotif) return;
      const cursor = lastNotif.created_at || '';
      const { data, error } = await fetchMoreNotifications(currentUser.id, cursor);
      if (error) throw new Error(error.message);
      const result = data as { items: AnyArr; hasMore: boolean };
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
