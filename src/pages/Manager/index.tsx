import React, { useState } from 'react';
import { Navigate } from 'react-router';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ClipboardList, Trophy, Users, FileText, BarChart2, Medal, CalendarCheck, UserCheck, Sparkles } from 'lucide-react';
import TournamentsTab from './TournamentsTab';
import GameAssignmentsTab from './GameAssignmentsTab';
import RefereeManagementTab from './RefereeManagementTab';
import GameReportsTab from './GameReportsTab';
import StandingsTab from './StandingsTab';
import LeaderboardTab from './LeaderboardTab';
import AvailabilityCalendarTab from './AvailabilityCalendarTab';
import RosterTab from './RosterTab';
import { AIAssistantPanel } from '@/components/AIAssistantPanel';

const Manager = () => {
  const { user } = useAuth();
  const { tournaments, games, referees, gameReports, connections, tournamentActions, assignmentActions, connectionActions } = useData();
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  if (user?.role !== 'manager') {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Management - iWhistle</title>
        <meta name="description" content="Manage tournaments, assign games, and oversee referees for your league." />
      </Helmet>

      <div className="space-y-8" data-testid="manager-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          data-testid="manager-page-header"
        >
          <p className="app-kicker mb-3">Manager tools</p>
          <h1 className="app-heading mb-3 text-4xl" style={{ color: '#0080C8' }}>League Management</h1>
          <p className="max-w-2xl text-slate-600 dark:text-blue-200/70">Oversee tournaments, games, and referees from one central hub with cleaner workflows and faster tab access.</p>
        </motion.div>

        <Tabs defaultValue="tournaments" className="w-full" data-testid="manager-tabs-root">
          <TabsList className="flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-xs h-auto">
            <TabsTrigger value="tournaments" data-testid="manager-tab-tournaments" className="flex-1 min-w-[100px]">
              <Trophy className="h-4 w-4 mr-1.5" /> Tournaments
            </TabsTrigger>
            <TabsTrigger value="assignments" data-testid="manager-tab-assignments" className="flex-1 min-w-[100px]">
              <ClipboardList className="h-4 w-4 mr-1.5" /> Assignments
            </TabsTrigger>
            <TabsTrigger value="roster" data-testid="manager-tab-roster" className="flex-1 min-w-[90px] relative">
              <UserCheck className="h-4 w-4 mr-1.5" /> Roster
              {connections?.filter(c => c.status === 'pending').length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: '#FF8C00' }}>
                  {connections.filter(c => c.status === 'pending').length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="referees" data-testid="manager-tab-referees" className="flex-1 min-w-[80px]">
              <Users className="h-4 w-4 mr-1.5" /> Referees
            </TabsTrigger>
            <TabsTrigger value="availability" data-testid="manager-tab-availability" className="flex-1 min-w-[100px]">
              <CalendarCheck className="h-4 w-4 mr-1.5" /> Availability
            </TabsTrigger>
            <TabsTrigger value="leaderboard" data-testid="manager-tab-leaderboard" className="flex-1 min-w-[100px]">
              <Medal className="h-4 w-4 mr-1.5" /> Leaderboard
            </TabsTrigger>
            <TabsTrigger value="standings" data-testid="manager-tab-standings" className="flex-1 min-w-[90px]">
              <BarChart2 className="h-4 w-4 mr-1.5" /> Standings
            </TabsTrigger>
            <TabsTrigger value="reports" data-testid="manager-tab-reports" className="flex-1 min-w-[80px]">
              <FileText className="h-4 w-4 mr-1.5" /> Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tournaments">
            <TournamentsTab 
              tournaments={tournaments}
              addTournament={tournamentActions.addTournament}
              updateTournament={tournamentActions.updateTournament}
              deleteTournament={tournamentActions.deleteTournament}
            />
          </TabsContent>

          <TabsContent value="assignments">
            <GameAssignmentsTab 
              games={games} 
              referees={referees} 
              assignRefereeToGame={assignmentActions.assignRefereeToGame} 
              unassignRefereeFromGame={assignmentActions.unassignRefereeFromGame} 
            />
          </TabsContent>

          <TabsContent value="roster">
            <RosterTab
              connections={connections || []}
              referees={referees}
              respondToConnection={connectionActions.respondToConnection}
            />
          </TabsContent>

          <TabsContent value="referees">
            <RefereeManagementTab referees={referees} />
          </TabsContent>

          <TabsContent value="availability">
            <AvailabilityCalendarTab referees={referees} games={games} />
          </TabsContent>

          <TabsContent value="leaderboard">
            <LeaderboardTab referees={referees} games={games} />
          </TabsContent>

          <TabsContent value="standings">
            <StandingsTab tournaments={tournaments} games={games} />
          </TabsContent>
          
          <TabsContent value="reports">
            <GameReportsTab gameReports={gameReports} />
          </TabsContent>
        </Tabs>
      </div>

      {/* AI Assistant Floating Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.5 }}
        className="fixed bottom-6 right-6 z-30"
      >
        <Button
          onClick={() => setAiPanelOpen(true)}
          className="h-14 w-14 rounded-2xl shadow-lg basketball-gradient text-white hover:opacity-90 hover:shadow-xl transition-all"
          data-testid="ai-assistant-fab"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      </motion.div>

      {/* AI Assistant Panel */}
      <AIAssistantPanel open={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />
    </>
  );
};

export default Manager;