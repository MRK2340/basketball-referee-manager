import React, { useState } from 'react';
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
  const { tournaments, games, referees, gameReports, addTournament, updateTournament, assignRefereeToGame, unassignRefereeFromGame } = useData();

  if (user?.role !== 'manager') {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Management - Basketball Referee Manager</title>
        <meta name="description" content="Manage tournaments, assign games, and oversee referees for your league." />
      </Helmet>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-white mb-2">League Management</h1>
          <p className="text-slate-400">Oversee tournaments, games, and referees from one central hub.</p>
        </motion.div>

        <Tabs defaultValue="tournaments" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800">
            <TabsTrigger value="tournaments">
              <Trophy className="h-4 w-4 mr-2" /> Tournaments
            </TabsTrigger>
            <TabsTrigger value="assignments">
              <ClipboardList className="h-4 w-4 mr-2" /> Game Assignments
            </TabsTrigger>
            <TabsTrigger value="referees">
              <Users className="h-4 w-4 mr-2" /> Referees
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="h-4 w-4 mr-2" /> Game Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tournaments">
            <TournamentsTab 
              tournaments={tournaments}
              onAddTournament={addTournament}
              onUpdateTournament={updateTournament}
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