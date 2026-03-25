import React from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, Trophy, Users, FileText } from 'lucide-react';
import TournamentsTab from '@/pages/Manager/TournamentsTab';
import GameAssignmentsTab from '@/pages/Manager/GameAssignmentsTab';
import RefereeManagementTab from '@/pages/Manager/RefereeManagementTab';
import GameReportsTab from '@/pages/Manager/GameReportsTab';

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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">League Management</h1>
          <p className="text-slate-600">Oversee tournaments, games, and referees from one central hub.</p>
        </motion.div>

        <Tabs defaultValue="tournaments" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1 border border-slate-200">
            <TabsTrigger value="tournaments" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-brand-orange text-slate-700 font-semibold">
              <Trophy className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Tournaments</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-brand-orange text-slate-700 font-semibold">
              <ClipboardList className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Assignments</span>
            </TabsTrigger>
            <TabsTrigger value="referees" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-brand-orange text-slate-700 font-semibold">
              <Users className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Referees</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-brand-orange text-slate-700 font-semibold">
              <FileText className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tournaments" className="mt-4">
            <TournamentsTab 
              tournaments={tournaments}
              addTournament={addTournament}
              updateTournament={updateTournament}
            />
          </TabsContent>

          <TabsContent value="assignments" className="mt-4">
            <GameAssignmentsTab 
              games={games} 
              referees={referees} 
              assignRefereeToGame={assignRefereeToGame} 
              unassignRefereeFromGame={unassignRefereeFromGame} 
            />
          </TabsContent>

          <TabsContent value="referees" className="mt-4">
            <RefereeManagementTab referees={referees} />
          </TabsContent>
          
          <TabsContent value="reports" className="mt-4">
            <GameReportsTab gameReports={gameReports} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Manager;