import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { fetchAppData } from '@/lib/demoDataService';

export const useDataFetching = (user, page = 1, pageSize = 20) => {
  const [loading, setLoading] = useState(true);
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
  const [hasMoreGames, setHasMoreGames] = useState(true);

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
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const data = fetchAppData(user, page, pageSize);

      if (isInitialLoad) {
        setTournaments(data.tournaments);
        setPayments(data.payments);
        setMessages(data.messages);
        setNotifications(data.notifications);
        setReferees(data.referees);
        setAvailability(data.availability);
        setGameReports(data.gameReports);
        setRefereeRatings(data.refereeRatings || []);
        setNotificationPreferences(data.notificationPreferences || {});
      }

      setHasMoreGames(data.games.length === pageSize);
      setGames((previousGames) => (isInitialLoad ? data.games : [...previousGames, ...data.games]));

    } catch (error) {
      toast({
        title: "Error fetching data",
        description: error.message || 'Could not load app data.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, page, pageSize]);

  return { 
    loading,
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
    fetchData,
    hasMoreGames
  };
};