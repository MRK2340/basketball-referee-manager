import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDataFetching } from '@/hooks/useDataFetching';
import { useTournamentActions } from '@/hooks/useTournamentActions';
import { useGameActions } from '@/hooks/useGameActions';
import { useAssignmentActions } from '@/hooks/useAssignmentActions';
import { useMessageActions } from '@/hooks/useMessageActions';
import { useAvailabilityActions } from '@/hooks/useAvailabilityActions';
import { useReportActions } from '@/hooks/useReportActions';
import { markNotificationReadRecord, markAllNotificationsReadRecord, batchUnassignRefereesRecord, batchMarkPaymentsPaidRecord, rateRefereeRecord, saveNotificationPreferencesRecord, addReportResolutionRecord, requestManagerConnectionRecord, respondToConnectionRecord, withdrawConnectionRecord, addIndependentGameRecord, updateIndependentGameRecord, deleteIndependentGameRecord } from '@/lib/firestoreService';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { toast } from '@/components/ui/use-toast';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const {
    loading,
    refreshing,
    games,
    payments,
    messages,
    setMessages,
    notifications,
    setNotifications,
    tournaments,
    referees,
    availability,
    gameReports,
    refereeRatings,
    notificationPreferences,
    connections,
    managerProfiles,
    independentGames,
    fetchData
  } = useDataFetching(user);

  // Build a stable id→profile map for resolving sender names in messages
  const usersMap = useMemo(() => {
    const map = {};
    [...referees, ...managerProfiles].forEach(u => { map[u.id] = u; });
    if (user) map[user.id] = user;
    return map;
  }, [referees, managerProfiles, user]);

  // Real-time Firestore listeners
  useRealtimeNotifications(user, setNotifications);
  useRealtimeMessages(user, setMessages, usersMap);

  useEffect(() => {
    if (user) {
      fetchData(); // initial load — shows full loading spinner
    }
  }, [user, fetchData]);

  const tournamentActions = useTournamentActions(user, fetchData);
  const gameActions = useGameActions(user, fetchData);
  const messageActions = useMessageActions(user, fetchData);
  const assignmentActions = useAssignmentActions(user, fetchData);
  const availabilityActions = useAvailabilityActions(user, fetchData);
  const reportActions = useReportActions(user, fetchData);

  const markNotificationRead = async (notificationId) => {
    if (!user) return;
    try {
      await markNotificationReadRecord(user, notificationId);
      await fetchData(false);
    } catch (e) {
      console.error('markNotificationRead error:', e);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!user) return;
    try {
      await markAllNotificationsReadRecord(user);
      await fetchData(false);
    } catch (e) {
      console.error('markAllNotificationsRead error:', e);
    }
  };

  const batchUnassignReferees = async (gameIds) => {
    if (!user || user.role !== 'manager') return;
    const { error } = await batchUnassignRefereesRecord(user, gameIds);
    if (error) {
      toast({ title: 'Batch unassign failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Referees Unassigned', description: `Removed all referee assignments from ${gameIds.length} game(s).` });
      fetchData(false);
    }
  };

  const batchMarkPaymentsPaid = async (paymentIds) => {
    if (!user) return;
    try {
      await batchMarkPaymentsPaidRecord(user, paymentIds);
      toast({ title: 'Payments Updated', description: `${paymentIds.length} payment(s) marked as paid.` });
      await fetchData(false);
    } catch (e) {
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' });
    }
  };

  const rateReferee = async (gameId, refereeId, stars, feedback) => {
    if (!user || user.role !== 'manager') return;
    const { error } = await rateRefereeRecord(user, gameId, refereeId, stars, feedback);
    if (error) {
      toast({ title: 'Rating failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Rating submitted', description: `${stars}-star rating saved.` });
      fetchData(false);
    }
  };

  const saveNotificationPreferences = async (prefs) => {
    if (!user) return;
    try {
      await saveNotificationPreferencesRecord(user, prefs);
      await fetchData(false);
    } catch (e) {
      console.error('saveNotificationPreferences error:', e);
    }
  };

  const addReportResolution = async (reportId, note) => {
    if (!user || user.role !== 'manager') return;
    const { error } = await addReportResolutionRecord(user, reportId, note);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Report resolved', description: 'Resolution note added and report marked as reviewed.' });
      fetchData(false);
    }
  };

  const requestManagerConnection = async (managerId, note) => {
    if (!user || user.role !== 'referee') return;
    const { error } = await requestManagerConnectionRecord(user, managerId, note);
    if (error) {
      toast({ title: 'Request failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Request sent!', description: 'Your roster request has been sent to the manager.' });
      fetchData(false);
    }
  };

  const respondToConnection = async (connectionId, status) => {
    if (!user || user.role !== 'manager') return;
    const { error } = await respondToConnectionRecord(user, connectionId, status);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      const label = status === 'connected' ? 'accepted' : 'declined';
      toast({ title: `Request ${label}`, description: `Referee roster request has been ${label}.` });
      fetchData(false);
    }
  };

  const withdrawConnection = async (managerId) => {
    if (!user || user.role !== 'referee') return;
    const { error } = await withdrawConnectionRecord(user, managerId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Request withdrawn', description: 'Your connection request has been withdrawn.' });
      fetchData(false);
    }
  };

  const addIndependentGame = async (gameData) => {
    if (!user || user.role !== 'referee') return;
    const { error } = await addIndependentGameRecord(user, gameData);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Game logged!', description: 'Independent game has been added to your log.' });
      fetchData(false);
    }
  };

  const updateIndependentGame = async (gameId, gameData) => {
    if (!user || user.role !== 'referee') return;
    const { error } = await updateIndependentGameRecord(user, gameId, gameData);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Game updated', description: 'Your independent game has been updated.' });
      fetchData(false);
    }
  };

  const deleteIndependentGame = async (gameId) => {
    if (!user || user.role !== 'referee') return;
    const { error } = await deleteIndependentGameRecord(user, gameId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Game removed', description: 'Independent game removed from your log.' });
      fetchData(false);
    }
  };

  // Group inline functions into namespaces
  const notificationActions = { markNotificationRead, markAllNotificationsRead };
  const paymentActions = { batchMarkPaymentsPaid, rateReferee };
  const connectionActions = { requestManagerConnection, respondToConnection, withdrawConnection };
  const settingsActions = { saveNotificationPreferences };
  const independentGameActions = { addIndependentGame, updateIndependentGame, deleteIndependentGame };

  const value = {
    loading,
    refreshing,
    games,
    payments,
    messages,
    notifications,
    tournaments,
    referees,
    availability,
    gameReports,
    refereeRatings,
    notificationPreferences,
    connections,
    managerProfiles,
    independentGames,
    fetchData,
    tournamentActions,
    gameActions,
    assignmentActions: { ...assignmentActions, batchUnassignReferees },
    messageActions,
    availabilityActions,
    reportActions: { ...reportActions, addReportResolution },
    notificationActions,
    paymentActions,
    connectionActions,
    settingsActions,
    independentGameActions,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};