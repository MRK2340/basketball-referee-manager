import React from 'react';
import { motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

const getStatusColor = (status) => {
  switch (status) {
    case 'scheduled':
    case 'assigned':
    case 'accepted':
      return 'bg-blue-500';
    case 'in-progress':
      return 'bg-orange-500';
    case 'completed':
      return 'bg-green-500';
    case 'declined':
      return 'bg-red-500';
    default:
      return 'bg-slate-500';
  }
};

const CalendarDay = ({ calendarDay, dayGames, isAvailable, onDayClick, index }) => {
  const isToday = calendarDay.date.toDateString() === new Date().toDateString();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.01 }}
      onClick={() => calendarDay.isCurrentMonth && onDayClick(calendarDay.date)}
      className={`min-h-[120px] p-2 border border-slate-700 rounded-lg transition-all duration-200 relative ${
        !calendarDay.isCurrentMonth ? 'opacity-50' : 'cursor-pointer hover:border-orange-500'
      } ${isToday ? 'ring-2 ring-orange-500 bg-orange-500/10' : 'bg-slate-800/30'} ${
        isAvailable && dayGames.length === 0 ? 'bg-green-900/30' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-sm font-semibold ${
            isToday ? 'text-orange-400' : calendarDay.isCurrentMonth ? 'text-white' : 'text-slate-500'
          }`}
        >
          {calendarDay.day}
        </span>
        {dayGames.length > 0 ? (
          <Badge className="basketball-gradient text-white text-xs">{dayGames.length}</Badge>
        ) : isAvailable && (
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full" title="Available"></div>
        )}
      </div>

      <div className="space-y-1">
        {dayGames.slice(0, 2).map((game) => (
          <div
            key={game.id}
            className={`p-1.5 rounded text-xs text-white ${getStatusColor(game.status)}`}
          >
            <div className="font-semibold truncate">
              {game.homeTeam} vs {game.awayTeam}
            </div>
            <div className="flex items-center space-x-1 opacity-90 text-white/80">
              <Clock className="h-3 w-3" />
              <span>{game.time}</span>
            </div>
          </div>
        ))}
        {dayGames.length > 2 && (
          <div className="text-xs text-slate-400 text-center mt-1">
            +{dayGames.length - 2} more
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CalendarDay;