import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, ThumbsUp } from 'lucide-react';
import ScheduleHeader from '@/pages/Schedule/components/ScheduleHeader.jsx';
import MyScheduleTab from '@/pages/Schedule/tabs/MyScheduleTab.jsx';
import OpenGamesTab from '@/pages/Schedule/tabs/OpenGamesTab.jsx';
import AddGameDialog from '@/pages/Schedule/components/AddGameDialog.jsx';
import AssignCourtScheduleDialog from '@/pages/Schedule/components/AssignCourtScheduleDialog.jsx';

const Schedule = () => {
  // Hooks at the top
  const { games, referees } = useData();
  const { user } = useAuth();
  const [addGameOpen, setAddGameOpen] = useState(false);
  const [courtScheduleOpen, setCourtScheduleOpen] = useState(false);
  const openGames = games.filter((game) => {
    if (game.status === 'completed') return false;
    return game.assignments.length === 0 || game.assignments.some(
      (assignment) => assignment.referee.id === user?.id && assignment.status === 'requested'
    );
  });

  return (
    <>
      <Helmet>
        <title>Schedule - iWhistle</title>
        <meta name="description" content="View and manage your game schedule, assignments, and availability as a basketball referee." />
      </Helmet>

      <AddGameDialog open={addGameOpen} setOpen={setAddGameOpen} />
      <AssignCourtScheduleDialog open={courtScheduleOpen} setOpen={setCourtScheduleOpen} />

      <div className="space-y-8" data-testid="schedule-page">
        <ScheduleHeader 
          userRole={user?.role}
          onScheduleGame={() => setAddGameOpen(true)}
          onAssignCourtSchedule={() => setCourtScheduleOpen(true)}
        />
        
        {user.role === 'referee' ? (
          <Tabs defaultValue="my-schedule" className="w-full" data-testid="schedule-tabs-root">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              <TabsTrigger value="my-schedule" data-testid="schedule-tab-my-schedule"><ClipboardList className="mr-2 h-4 w-4" /> My Schedule</TabsTrigger>
              <TabsTrigger value="open-games" data-testid="schedule-tab-open-games"><ThumbsUp className="mr-2 h-4 w-4" /> Open Games</TabsTrigger>
            </TabsList>
            <TabsContent value="my-schedule">
              <MyScheduleTab games={games.filter(g => g.assignments.some(a => a.referee.id === user.id))} referees={referees} />
            </TabsContent>
            <TabsContent value="open-games">
              <OpenGamesTab games={openGames} />
            </TabsContent>
          </Tabs>
        ) : (
          <div data-testid="schedule-manager-view">
            <MyScheduleTab games={games} referees={referees} />
          </div>
        )}
      </div>
    </>
  );
};

export default Schedule;