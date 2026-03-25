import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, Repeat } from 'lucide-react';

const ScheduleHeader = ({ userRole, onScheduleGame, onAssignCourtSchedule }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0"
    >
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Game Schedule</h1>
        <p className="text-slate-600">
          {userRole === 'manager' 
            ? 'Manage your game assignments and availability'
            : 'View your upcoming game assignments'}
        </p>
      </div>
      
      {userRole === 'manager' && (
        <div className="flex gap-2">
          <Button 
            variant="outline"
            className="border-slate-300 text-slate-800 hover:bg-slate-100"
            onClick={onAssignCourtSchedule}
          >
            <Repeat className="h-4 w-4 mr-2" />
            Assign Court Schedule
          </Button>
          <Button 
            className="basketball-gradient hover:opacity-90 text-white"
            onClick={onScheduleGame}
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule Game
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default ScheduleHeader;