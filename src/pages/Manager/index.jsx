import React from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, Trophy, Users, FileText } from 'lucide-react';
import TournamentsTab from './TournamentsTab';
import GameAssignmentsTab from './GameAssignmentsTab';
import RefereeManagementTab from './RefereeManagementTab';
import GameReportsTab from './GameReportsTab';

const Manager = () => {
  const { user } = useAuth();
  const { tournaments, games, referees, gameReports, addTournament, updateTournament, deleteTournament, assignRefereeToGame, unassignRefereeFromGame } = useData();

  if (user?.role !== 'manager') {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Management - Basketball Referee Manager</title>
        <meta name="description" content="Manage tournaments, assign games, and oversee referees for your league." />
      </Helmet>

      <div className="space-y-8" data-testid="manager-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          data-testid="manager-page-header"
        >
          <p className="app-kicker mb-3">Manager tools</p>
          <h1 className="app-heading mb-3 text-4xl text-slate-950">League Management</h1>
          <p className="max-w-2xl text-slate-600">Oversee tournaments, games, and referees from one central hub with cleaner workflows and faster tab access.</p>
        </motion.div>

        <Tabs defaultValue="tournaments" className="w-full" data-testid="manager-tabs-root">
          <TabsList className="grid w-full grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:grid-cols-4">
            <TabsTrigger value="tournaments" data-testid="manager-tab-tournaments">
              <Trophy className="h-4 w-4 mr-2" /> Tournaments
            </TabsTrigger>
            <TabsTrigger value="assignments" data-testid="manager-tab-assignments">
              <ClipboardList className="h-4 w-4 mr-2" /> Game Assignments
            </TabsTrigger>
            <TabsTrigger value="referees" data-testid="manager-tab-referees">
              <Users className="h-4 w-4 mr-2" /> Referees
            </TabsTrigger>
            <TabsTrigger value="reports" data-testid="manager-tab-reports">
              <FileText className="h-4 w-4 mr-2" /> Game Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tournaments">
            <TournamentsTab 
              tournaments={tournaments}
              addTournament={addTournament}
              updateTournament={updateTournament}
              deleteTournament={deleteTournament}
            />
          </TabsContent>

          <TabsContent value="assignments">
            <GameAssignmentsTab 
              games={games} 
              referees={referees} 
              assignRefereeToGame={assignRefereeToGame} 
              unassignRefereeFromGame={unassignRefereeFromGame} 
            />
          </TabsContent>

          <TabsContent value="referees">
            <RefereeManagementTab referees={referees} />
          </TabsContent>
          
          <TabsContent value="reports">
            <GameReportsTab gameReports={gameReports} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Manager;