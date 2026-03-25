import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import CalendarDay from './CalendarDay';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarGrid = ({
  calendarDays,
  getGamesForDate,
  isDateAvailable,
  onDayClick
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="glass-effect border-slate-600">
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {dayNames.map((day) => (
              <div key={day} className="text-center py-2">
                <span className="text-slate-400 font-semibold text-sm">{day}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((calendarDay, index) => (
              <CalendarDay
                key={index}
                index={index}
                calendarDay={calendarDay}
                dayGames={getGamesForDate(calendarDay.date)}
                isAvailable={isDateAvailable(calendarDay.date)}
                onDayClick={onDayClick}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CalendarGrid;