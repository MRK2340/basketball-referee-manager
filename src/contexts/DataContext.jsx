import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDataFetching } from '@/hooks/useDataFetching';
import { useTournamentActions } from '@/hooks/useTournamentActions';
import { useGameActions } from '@/hooks/useGameActions';
import { useAssignmentActions } from '@/hooks/useAssignmentActions';
import { useMessageActions } from '@/hooks/useMessageActions';
import { useAvailabilityActions } from '@/hooks/useAvailabilityActions';
import { useReportActions } from '@/hooks/useReportActions';
import { markNotificationReadRecord, markAllNotificationsReadRecord, batchUnassignRefereesRecord, batchMarkPaymentsPaidRecord, rateRefereeRecord, saveNotificationPreferencesRecord, addReportResolutionRecord, requestManagerConnectionRecord, respondToConnectionRecord, withdrawConnectionRecord } from '@/lib/demoDataService';
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
    fetchData
  } = useDataFetching(user);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const tournamentActions = useTournamentActions(user, fetchData);
  const gameActions = useGameActions(user, fetchData);
  const messageActions = useMessageActions(user, fetchData);
  const assignmentActions = useAssignmentActions(user, fetchData, messageActions.sendMessage, games);
  const availabilityActions = useAvailabilityActions(user, fetchData);
  const reportActions = useReportActions(user, fetchData);

  const markNotificationRead = (notificationId) => {
    if (!user) return;
    markNotificationReadRecord(user, notificationId);
    fetchData();
  };

  const markAllNotificationsRead = () => {
    if (!user) return;
    markAllNotificationsReadRecord(user);
    fetchData();
  };

  const batchUnassignReferees = (gameIds) => {
    if (!user || user.role !== 'manager') return;
    const { error } = batchUnassignRefereesRecord(user, gameIds);
    if (error) {
      toast({ title: 'Batch unassign failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Referees Unassigned', description: `Removed all referee assignments from ${gameIds.length} game(s).` });
      fetchData();
    }
  };

  const batchMarkPaymentsPaid = (paymentIds) => {
    if (!user) return;
    batchMarkPaymentsPaidRecord(user, paymentIds);
    toast({ title: 'Payments Updated', description: `${paymentIds.length} payment(s) marked as paid.` });
    fetchData();
  };

  const rateReferee = (gameId, refereeId, stars, feedback) => {
    if (!user || user.role !== 'manager') return;
    const { error } = rateRefereeRecord(user, gameId, refereeId, stars, feedback);
    if (error) {
      toast({ title: 'Rating failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Rating submitted', description: `${stars}-star rating saved.` });
      fetchData();
    }
  };

  const saveNotificationPreferences = (prefs) => {
    if (!user) return;
    saveNotificationPreferencesRecord(user, prefs);
    fetchData();
  };

  const addReportResolution = (reportId, note) => {
    if (!user || user.role !== 'manager') return;
    const { error } = addReportResolutionRecord(user, reportId, note);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Report resolved', description: 'Resolution note added and report marked as reviewed.' });
      fetchData();
    }
  };

  const requestManagerConnection = (managerId, note) => {
    if (!user || user.role !== 'referee') return;
    const { error } = requestManagerConnectionRecord(user, managerId, note);
    if (error) {
      toast({ title: 'Request failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Request sent!', description: 'Your roster request has been sent to the manager.' });
      fetchData();
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
      fetchData();
    }
  };

  const withdrawConnection = (managerId) => {
    if (!user || user.role !== 'referee') return;
    const { error } = withdrawConnectionRecord(user, managerId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Request withdrawn', description: 'Your connection request has been withdrawn.' });
      fetchData();
    }
  };

  const value = {
    loading,
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