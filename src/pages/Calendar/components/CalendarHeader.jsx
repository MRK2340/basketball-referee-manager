import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';

const CalendarHeader = ({ currentDate, navigateMonth, onAddAvailabilityClick, onSyncCalendarClick }) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 mb-6"
    >
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigateMonth(-1)}
          className="border-slate-600 text-slate-300 hover:bg-slate-800"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold text-white text-center w-48">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigateMonth(1)}
          className="border-slate-600 text-slate-300 hover:bg-slate-800"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          className="border-slate-600 text-slate-300 hover:bg-slate-800"
          onClick={onSyncCalendarClick}
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          Sync Calendar
        </Button>
        <Button
          className="basketball-gradient hover:opacity-90"
          onClick={onAddAvailabilityClick}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Availability
        </Button>
      </div>
    </motion.div>
  );
};

export default CalendarHeader;