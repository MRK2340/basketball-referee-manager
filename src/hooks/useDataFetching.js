import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { fetchAppData, fetchMoreMessages } from '@/lib/firestoreService';

const MESSAGE_PAGE_SIZE = 50;

export const useDataFetching = (user) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [games, setGames] = useState([]);
  const [payments, setPayments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [referees, setReferees] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [gameReports, setGameReports] = useState([]);
  const [refereeRatings, setRefereeRatings] = useState([]);
  const [notificationPreferences, setNotificationPreferences] = useState({});
  const [connections, setConnections] = useState([]);
  const [managerProfiles, setManagerProfiles] = useState([]);
  const [independentGames, setIndependentGames] = useState([]);
  // Pagination state
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
      // If we got a full page, there may be more
      setHasMoreMessages(data.messages.length === MESSAGE_PAGE_SIZE);
    } catch (error) {
      toast({
        title: "Error fetching data",
        description: error.message || 'Could not load app data.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Load the next page of messages and append to the existing list
  const loadMoreMessages = useCallback(async (currentMessages, currentReferees, currentManagers) => {
    if (!user || !hasMoreMessages) return;
    const oldest = currentMessages[currentMessages.length - 1];
    if (!oldest?.timestamp) return;

    setRefreshing(true);
    try {
      const allUsers = [...currentReferees, ...currentManagers,
        { id: user.id, name: user.name, avatarUrl: user.avatarUrl }];
      const { data: more, error } = await fetchMoreMessages(user, oldest.timestamp, allUsers);
      if (error) throw new Error(error.message);
      setMessages(prev => [...prev, ...(more || [])]);
      setHasMoreMessages((more || []).length === MESSAGE_PAGE_SIZE);
    } catch (err) {
      toast({ title: 'Failed to load more messages', description: err.message, variant: 'destructive' });
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