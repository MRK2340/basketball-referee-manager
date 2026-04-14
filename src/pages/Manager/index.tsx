import React, { useState } from 'react';
import { Navigate } from 'react-router';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Trophy, Users, FileText, BarChart2, Medal, CalendarCheck, UserCheck, Sparkles, GitBranch } from 'lucide-react';
import TournamentsTab from './TournamentsTab';
import GameAssignmentsTab from './GameAssignmentsTab';
import RefereeManagementTab from './RefereeManagementTab';
import GameReportsTab from './GameReportsTab';
import StandingsTab from './StandingsTab';
import LeaderboardTab from './LeaderboardTab';
import AvailabilityCalendarTab from './AvailabilityCalendarTab';
import RosterTab from './RosterTab';
import { BracketEditor } from './BracketEditor';
import { AIAssistantPanel } from '@/components/AIAssistantPanel';

const Manager = () => {
  const { user } = useAuth();
  const { tournaments, games, referees, gameReports, connections, tournamentActions, assignmentActions, connectionActions, hasMoreTournaments, loadMoreTournaments, refreshing } = useData();
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [selectedBracketTournament, setSelectedBracketTournament] = useState('');

  // Compute the active bracket tournament ID
  const activeBracketTid = selectedBracketTournament || (tournaments.length > 0 ? tournaments[0].id : '');
  const activeBracketName = tournaments.find((t: { id: string; name: string }) => t.id === activeBracketTid)?.name || '';

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
          <TabsList className="flex overflow-x-auto gap-0.5 rounded-2xl border border-slate-200 bg-white p-1.5 sm:p-2 shadow-xs h-auto no-scrollbar" data-testid="manager-tabs-list">
            <TabsTrigger value="tournaments" data-testid="manager-tab-tournaments" className="flex-shrink-0 px-2.5 sm:px-3">
              <Trophy className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Tournaments</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" data-testid="manager-tab-assignments" className="flex-shrink-0 px-2.5 sm:px-3">
              <ClipboardList className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Assignments</span>
            </TabsTrigger>
            <TabsTrigger value="roster" data-testid="manager-tab-roster" className="flex-shrink-0 px-2.5 sm:px-3 relative">
              <UserCheck className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Roster</span>
              {connections?.filter(c => c.status === 'pending').length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: '#FF8C00' }}>
                  {connections.filter(c => c.status === 'pending').length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="referees" data-testid="manager-tab-referees" className="flex-shrink-0 px-2.5 sm:px-3">
              <Users className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Referees</span>
            </TabsTrigger>
            <TabsTrigger value="availability" data-testid="manager-tab-availability" className="flex-shrink-0 px-2.5 sm:px-3">
              <CalendarCheck className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Availability</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" data-testid="manager-tab-leaderboard" className="flex-shrink-0 px-2.5 sm:px-3">
              <Medal className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Leaderboard</span>
            </TabsTrigger>
            <TabsTrigger value="standings" data-testid="manager-tab-standings" className="flex-shrink-0 px-2.5 sm:px-3">
              <BarChart2 className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Standings</span>
            </TabsTrigger>
            <TabsTrigger value="reports" data-testid="manager-tab-reports" className="flex-shrink-0 px-2.5 sm:px-3">
              <FileText className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="brackets" data-testid="manager-tab-brackets" className="flex-shrink-0 px-2.5 sm:px-3">
              <GitBranch className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Brackets</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tournaments">
            <TournamentsTab 
              tournaments={tournaments}
              addTournament={tournamentActions.addTournament}
              updateTournament={tournamentActions.updateTournament}
              deleteTournament={tournamentActions.deleteTournament}
              archiveTournament={tournamentActions.archiveTournament}
              hasMoreTournaments={hasMoreTournaments}
              loadMoreTournaments={loadMoreTournaments}
              refreshing={refreshing}
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

          <TabsContent value="brackets">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Tournament Brackets</h2>
                <p className="text-sm text-slate-500">Visual bracket editor with real-time sync. Select a tournament to view or create its bracket.</p>
              </div>
              {tournaments.length === 0 ? (
                <p className="text-slate-400 text-sm py-8 text-center">No tournaments yet. Create one in the Tournaments tab.</p>
              ) : (
                <div className="space-y-4">
                  <Select value={activeBracketTid} onValueChange={setSelectedBracketTournament}>
                    <SelectTrigger className="w-64 border-slate-200" data-testid="bracket-tournament-select">
                      <SelectValue placeholder="Select tournament" />
                    </SelectTrigger>
                    <SelectContent>
                      {tournaments.map((t: { id: string; name: string }) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {activeBracketTid ? (
                    <BracketEditor key={activeBracketTid} tournamentId={activeBracketTid} tournamentName={activeBracketName} />
                  ) : null}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* AI Assistant Floating Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.5 }}
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-30"
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