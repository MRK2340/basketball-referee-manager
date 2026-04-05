import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDataFetching } from '@/hooks/useDataFetching';
import { useTournamentActions } from '@/hooks/useTournamentActions';
import { useGameActions } from '@/hooks/useGameActions';
import { useAssignmentActions } from '@/hooks/useAssignmentActions';
import { useMessageActions } from '@/hooks/useMessageActions';
import { useAvailabilityActions } from '@/hooks/useAvailabilityActions';
import { useReportActions } from '@/hooks/useReportActions';
import { markNotificationReadRecord, markAllNotificationsReadRecord, batchUnassignRefereesRecord, batchMarkPaymentsPaidRecord, rateRefereeRecord, saveNotificationPreferencesRecord, addReportResolutionRecord, requestManagerConnectionRecord, respondToConnectionRecord, withdrawConnectionRecord, addIndependentGameRecord, updateIndependentGameRecord, deleteIndependentGameRecord } from '@/lib/demoDataService';
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
    fetchData
  } = useDataFetching(user);

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

  const markNotificationRead = (notificationId) => {
    if (!user) return;
    try {
      markNotificationReadRecord(user, notificationId);
    } catch (e) {
      console.error('markNotificationRead error:', e);
    }
    fetchData(false);
  };

  const markAllNotificationsRead = () => {
    if (!user) return;
    try {
      markAllNotificationsReadRecord(user);
    } catch (e) {
      console.error('markAllNotificationsRead error:', e);
    }
    fetchData(false);
  };

  const batchUnassignReferees = (gameIds) => {
    if (!user || user.role !== 'manager') return;
    const { error } = batchUnassignRefereesRecord(user, gameIds);
    if (error) {
      toast({ title: 'Batch unassign failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Referees Unassigned', description: `Removed all referee assignments from ${gameIds.length} game(s).` });
      fetchData(false);
    }
  };

  const batchMarkPaymentsPaid = (paymentIds) => {
    if (!user) return;
    batchMarkPaymentsPaidRecord(user, paymentIds);
    toast({ title: 'Payments Updated', description: `${paymentIds.length} payment(s) marked as paid.` });
    fetchData(false);
  };

  const rateReferee = (gameId, refereeId, stars, feedback) => {
    if (!user || user.role !== 'manager') return;
    const { error } = rateRefereeRecord(user, gameId, refereeId, stars, feedback);
    if (error) {
      toast({ title: 'Rating failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Rating submitted', description: `${stars}-star rating saved.` });
      fetchData(false);
    }
  };

  const saveNotificationPreferences = (prefs) => {
    if (!user) return;
    saveNotificationPreferencesRecord(user, prefs);
    fetchData(false);
  };

  const addReportResolution = (reportId, note) => {
    if (!user || user.role !== 'manager') return;
    const { error } = addReportResolutionRecord(user, reportId, note);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Report resolved', description: 'Resolution note added and report marked as reviewed.' });
      fetchData(false);
    }
  };

  const requestManagerConnection = (managerId, note) => {
    if (!user || user.role !== 'referee') return;
    const { error } = requestManagerConnectionRecord(user, managerId, note);
    if (error) {
      toast({ title: 'Request failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Request sent!', description: 'Your roster request has been sent to the manager.' });
      fetchData(false);
    }
  };

  const respondToConnection = (connectionId, status) => {
    if (!user || user.role !== 'manager') return;
    const { error } = respondToConnectionRecord(user, connectionId, status);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      const label = status === 'connected' ? 'accepted' : 'declined';
      toast({ title: `Request ${label}`, description: `Referee roster request has been ${label}.` });
      fetchData(false);
    }
  };

  const withdrawConnection = (managerId) => {
    if (!user || user.role !== 'referee') return;
    const { error } = withdrawConnectionRecord(user, managerId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Request withdrawn', description: 'Your connection request has been withdrawn.' });
      fetchData(false);
    }
  };

  const addIndependentGame = (gameData) => {
    if (!user || user.role !== 'referee') return;
    const { error } = addIndependentGameRecord(user, gameData);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Game logged!', description: 'Independent game has been added to your log.' });
      fetchData(false);
    }
  };

  const updateIndependentGame = (gameId, gameData) => {
    if (!user || user.role !== 'referee') return;
    const { error } = updateIndependentGameRecord(user, gameId, gameData);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Game updated', description: 'Your independent game has been updated.' });
      fetchData(false);
    }
  };

  const deleteIndependentGame = (gameId) => {
    if (!user || user.role !== 'referee') return;
    const { error } = deleteIndependentGameRecord(user, gameId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Game removed', description: 'Independent game removed from your log.' });
      fetchData(false);
    }
  };

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
    markNotificationRead,
    markAllNotificationsRead,
    batchUnassignReferees,
    batchMarkPaymentsPaid,
    rateReferee,
    saveNotificationPreferences,
    addReportResolution,
    requestManagerConnection,
    respondToConnection,
    withdrawConnection,
    addIndependentGame,
    updateIndependentGame,
    deleteIndependentGame,
    ...tournamentActions,
    ...gameActions,
    ...assignmentActions,
    ...messageActions,
    ...availabilityActions,
    ...reportActions
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};