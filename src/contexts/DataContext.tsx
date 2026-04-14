import React, { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDataFetching } from '@/hooks/useDataFetching';
import { useTournamentActions } from '@/hooks/useTournamentActions';
import { useGameActions } from '@/hooks/useGameActions';
import { useAssignmentActions } from '@/hooks/useAssignmentActions';
import { useMessageActions } from '@/hooks/useMessageActions';
import { useAvailabilityActions } from '@/hooks/useAvailabilityActions';
import { useReportActions } from '@/hooks/useReportActions';
import { useNotificationActions } from '@/hooks/useNotificationActions';
import { usePaymentActions } from '@/hooks/usePaymentActions';
import { useConnectionActions } from '@/hooks/useConnectionActions';
import { useSettingsActions } from '@/hooks/useSettingsActions';
import { useIndependentGameActions } from '@/hooks/useIndependentGameActions';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import type { DataContextValue } from '@/lib/types';
import type { MappedProfile } from '@/lib/mappers';

const DataContext = createContext<DataContextValue | null>(null);

export const useData = (): DataContextValue => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const {
    loading, refreshing,
    games, payments, messages, setMessages,
    notifications, setNotifications,
    tournaments, referees, availability,
    gameReports, refereeRatings, notificationPreferences,
    connections, managerProfiles, independentGames,
    hasMoreMessages, loadMoreMessages,
    hasMoreGames, loadMoreGames,
    hasMoreTournaments, loadMoreTournaments,
    hasMoreNotifications, loadMoreNotifications,
    fetchData,
  } = useDataFetching(user);

  // Stable id→profile map for resolving sender names in messages
  const usersMap = useMemo(() => {
    const map: Record<string, MappedProfile> = {};
    [...referees, ...managerProfiles].forEach((u: MappedProfile) => { map[u.id] = u; });
    if (user) map[user.id] = user as unknown as MappedProfile;
    return map;
  }, [referees, managerProfiles, user]);

  useRealtimeNotifications(user, setNotifications);
  useRealtimeMessages(user, setMessages, usersMap);

  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (user && user.id !== userIdRef.current) {
      userIdRef.current = user.id;
      fetchData(true);
    } else if (!user) {
      userIdRef.current = null;
      fetchData(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const tournamentActions    = useTournamentActions(user, fetchData);
  const gameActions          = useGameActions(user, fetchData);
  const assignmentActions    = useAssignmentActions(user, fetchData);
  const messageActions       = useMessageActions(user, fetchData);
  const availabilityActions  = useAvailabilityActions(user, fetchData);
  const reportActions        = useReportActions(user, fetchData);
  const notificationActions  = useNotificationActions(user, fetchData);
  const paymentActions       = usePaymentActions(user, fetchData);
  const connectionActions    = useConnectionActions(user, fetchData);
  const settingsActions      = useSettingsActions(user, fetchData);
  const independentGameActions = useIndependentGameActions(user, fetchData);

  const value: DataContextValue = {
    loading, refreshing,
    games, payments, messages, notifications,
    tournaments, referees, availability,
    gameReports, refereeRatings, notificationPreferences,
    connections, managerProfiles, independentGames,
    hasMoreMessages, loadMoreMessages,
    hasMoreGames, loadMoreGames,
    hasMoreTournaments, loadMoreTournaments,
    hasMoreNotifications, loadMoreNotifications,
    fetchData,
    tournamentActions,
    gameActions,
    assignmentActions,
    messageActions,
    availabilityActions,
    reportActions,
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
