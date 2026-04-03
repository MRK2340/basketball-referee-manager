import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDataFetching } from '@/hooks/useDataFetching';
import { useTournamentActions } from '@/hooks/useTournamentActions';
import { useGameActions } from '@/hooks/useGameActions';
import { useAssignmentActions } from '@/hooks/useAssignmentActions';
import { useMessageActions } from '@/hooks/useMessageActions';
import { useAvailabilityActions } from '@/hooks/useAvailabilityActions';
import { useReportActions } from '@/hooks/useReportActions';
import { markNotificationReadRecord, markAllNotificationsReadRecord } from '@/lib/demoDataService';
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
    fetchData,
    markNotificationRead,
    markAllNotificationsRead,
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