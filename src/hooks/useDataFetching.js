import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { fetchAppData } from '@/lib/demoDataService';

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

  const fetchData = useCallback(async (isInitialLoad = true) => {
    if (!user) {
      setGames([]);
      setPayments([]);
      setMessages([]);
      setNotifications([]);
      setTournaments([]);
      setReferees([]);
      setAvailability([]);
      setGameReports([]);
      setConnections([]);
      setManagerProfiles([]);
      setLoading(false);
      return;
    }

    if (isInitialLoad) setLoading(true);
    else setRefreshing(true);

    try {
      const data = fetchAppData(user);
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

  return { 
    loading,
    refreshing,
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
    fetchData,
  };
};