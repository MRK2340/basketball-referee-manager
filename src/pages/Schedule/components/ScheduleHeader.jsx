import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, Repeat } from 'lucide-react';

const ScheduleHeader = ({ userRole, onScheduleGame, onAssignCourtSchedule }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
      data-testid="schedule-page-header"
    >
      <div>
        <p className="app-kicker mb-3">Scheduling</p>
        <h1 className="app-heading mb-3 text-4xl text-slate-950">Game Schedule</h1>
        <p className="max-w-2xl text-slate-600">
          {userRole === 'manager' 
            ? 'Manage your game assignments and availability'
            : 'View your upcoming game assignments'}
        </p>
      </div>
      
      {userRole === 'manager' && (
        <div className="flex gap-2">
          <Button 
            variant="outline"
            data-testid="schedule-assign-court-button"
            className="border-slate-300 text-slate-800 hover:bg-slate-100"
            onClick={onAssignCourtSchedule}
          >
            <Repeat className="h-4 w-4 mr-2" />
            Assign Court Schedule
          </Button>
          <Button 
            className="basketball-gradient hover:opacity-90 text-white"
            data-testid="schedule-game-button"
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