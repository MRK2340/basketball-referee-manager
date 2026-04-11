import React, { useState, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/components/ui/use-toast';
import CalendarHeader from './components/CalendarHeader';
import CalendarGrid from './components/CalendarGrid';
import AvailabilityDialog from './components/AvailabilityDialog';
import EventDetailsDialog from './components/EventDetailsDialog';

const Calendar = () => {
  // Hooks at the top
  const { games, availability, availabilityActions } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] = useState(false);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const calendarDays = useMemo(() => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const days = [];
    
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayOfMonth; i > 0; i--) {
      const day = prevMonthDays - i + 1;
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(currentYear, currentMonth - 1, day),
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(currentYear, currentMonth, day),
      });
    }

    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(currentYear, currentMonth + 1, day),
      });
    }

    return days;
  }, [currentDate]);

  const getGamesForDate = useCallback((date) => {
    if (!games || !date) return [];
    const dateString = date.toISOString().split('T')[0];
    return games.filter(game => {
      const gameDate = new Date(game.date).toISOString().split('T')[0];
      return gameDate === dateString;
    });
  }, [games]);

  const isDateAvailable = useCallback((date) => {
    if (!availability || !date) return false;
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return availability.some(range => {
      const startDate = new Date(range.startTime);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(range.endTime);
      endDate.setHours(0, 0, 0, 0);
      return checkDate >= startDate && checkDate <= endDate;
    });
  }, [availability]);

  const navigateMonth = (direction) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() + direction);
      return newDate;
    });
  };

  const handleDayClick = (date) => {
    setSelectedDate(date);
    setIsEventDetailsOpen(true);
  };
  
  const handleSyncCalendarClick = () => {
    toast({
      title: "🚧 Feature Coming Soon!",
      description: "Full calendar sync with Google Calendar or Outlook is on the way. Request it in your next prompt to make it a priority! 🚀",
    });
  };

  return (
    <>
      <Helmet>
        <title>Calendar - iWhistle</title>
        <meta name="description" content="View your game schedule and manage your availability." />
      </Helmet>
      <div className="space-y-6">
        <CalendarHeader
          currentDate={currentDate}
          navigateMonth={navigateMonth}
          onAddAvailabilityClick={() => setIsAvailabilityDialogOpen(true)}
          onSyncCalendarClick={handleSyncCalendarClick}
        />
        <CalendarGrid
          calendarDays={calendarDays}
          getGamesForDate={getGamesForDate}
          isDateAvailable={isDateAvailable}
          onDayClick={handleDayClick}
        />
        <AvailabilityDialog
          isOpen={isAvailabilityDialogOpen}
          onOpenChange={setIsAvailabilityDialogOpen}
          addAvailability={availabilityActions.addAvailability}
        />
        <EventDetailsDialog
          isOpen={isEventDetailsOpen}
          onOpenChange={setIsEventDetailsOpen}
          selectedDate={selectedDate}
          games={selectedDate ? getGamesForDate(selectedDate) : []}
          isAvailable={selectedDate ? isDateAvailable(selectedDate) : false}
        />
      </div>
    </>
  );
};

export default Calendar;