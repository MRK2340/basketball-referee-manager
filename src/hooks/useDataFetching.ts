import { useState, useCallback, type Dispatch, type SetStateAction } from 'react';
import { toast } from '@/components/ui/use-toast';
import { fetchAppData, fetchMoreMessages } from '@/lib/firestoreService';
import type { AppUser } from '@/lib/types';
import type { MappedProfile, MappedMessage } from '@/lib/mappers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyArr = any[];

const MESSAGE_PAGE_SIZE = 100;

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
  const [hasMoreMessages, setHasMoreMessages] = useState(false);

  const fetchData = useCallback(async (isInitialLoad = true) => {
    if (!user) {
      setGames([]); setPayments([]); setMessages([]); setNotifications([]);
      setTournaments([]); setReferees([]); setAvailability([]); setGameReports([]);
      setConnections([]); setManagerProfiles([]); setHasMoreMessages(false);
      setLoading(false);
      return;
    }

    if (isInitialLoad) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await fetchAppData(user);
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
      setHasMoreMessages(data.messages.length === MESSAGE_PAGE_SIZE);
    } catch (error: unknown) {
      if (isInitialLoad) {
        setGames([]); setPayments([]); setMessages([]); setNotifications([]);
        setTournaments([]); setReferees([]); setAvailability([]); setGameReports([]);
        setConnections([]); setManagerProfiles([]); setHasMoreMessages(false);
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
  }, [user]);

  const loadMoreMessages = useCallback(async (
    currentMessages: MappedMessage[],
    currentReferees: MappedProfile[],
    currentManagers: MappedProfile[],
  ) => {
    if (!user || !hasMoreMessages) return;
    const oldest = currentMessages[currentMessages.length - 1];
    if (!oldest?.timestamp) return;

    setRefreshing(true);
    try {
      const allUsers = [...currentReferees, ...currentManagers,
        { id: user.id, name: user.name, avatarUrl: user.avatarUrl } as MappedProfile];
      const { data: more, error } = await fetchMoreMessages(user, oldest.timestamp, allUsers);
      if (error) throw new Error(error.message);
      setMessages(prev => [...prev, ...((more as MappedMessage[]) || [])]);
      setHasMoreMessages(((more as MappedMessage[]) || []).length === MESSAGE_PAGE_SIZE);
    } catch (err: unknown) {
      toast({ title: 'Failed to load more messages', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  }, [user, hasMoreMessages]);

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
    fetchData,
  };
};
