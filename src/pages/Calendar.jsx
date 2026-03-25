import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as DayPickerCalendar } from '@/components/ui/calendar';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  CheckCircle,
  Users,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';

export default function Calendar() {
  
  const { toast } = useToast();
  const { games = [], availability = [], addAvailability } = useData();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [showEventDetailsDialog, setShowEventDetailsDialog] = useState(false);
  const [availabilityDateRange, setAvailabilityDateRange] = useState({ from: undefined, to: undefined });


  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const calendarDays = useMemo(() => {
    const days = [];
    
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const prevMonthDays = new Date(prevYear, prevMonth + 1, 0).getDate();
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(prevYear, prevMonth, prevMonthDays - i)
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(currentYear, currentMonth, day)
      });
    }

    const remainingDays = 42 - days.length; 
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(nextYear, nextMonth, day)
      });
    }

    return days;
  }, [currentMonth, currentYear, daysInMonth, firstDayOfMonth]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowEventDetailsDialog(true);
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const handleSaveAvailability = () => {
    if (availabilityDateRange?.from) {
      const toDate = availabilityDateRange.to || availabilityDateRange.from;
      if (addAvailability) {
        addAvailability(availabilityDateRange.from, toDate);
      }
      setShowAvailabilityDialog(false);
      setAvailabilityDateRange({ from: undefined, to: undefined });
      toast({
        title: "Availability Updated",
        description: "Your availability has been successfully saved.",
      });
    } else {
      toast({
        title: "No date selected",
        description: "Please select a date or date range.",
        variant: "destructive"
      });
    }
  };

  const handleFeatureClick = (feature) => {
    let description = "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀";
    if (feature === 'sync-calendar') {
      description = "Full calendar sync with services like Google Calendar or Outlook is coming soon.";
    }
    toast({
      title: "🚧 Feature Coming Soon!",
      description: description,
    });
  };

  const getGamesForDate = (date) => {
    if (!games || !date) return [];
    const dateString = date.toISOString().split('T')[0];
    return games.filter(game => game.date === dateString);
  };

  const isDateAvailable = (date) => {
    if (!availability || !date) return false;
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return availability.some(range => {
      const startDate = new Date(range.start_time);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(range.end_time);
      endDate.setHours(0, 0, 0, 0);
      return checkDate >= startDate && checkDate <= endDate;
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
      case 'assigned':
      case 'accepted':
        return 'bg-blue-600 text-white';
      case 'in-progress':
        return 'bg-orange-500 text-white';
      case 'completed':
        return 'bg-green-600 text-white';
      case 'declined':
        return 'bg-red-600 text-white';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
      case 'assigned':
        return { color: 'bg-blue-100 text-blue-700', text: 'Scheduled' };
      case 'accepted':
        return { color: 'bg-teal-100 text-teal-700', text: 'Accepted' };
      case 'completed':
        return { color: 'bg-green-100 text-green-700', text: 'Completed' };
      case 'declined':
        return { color: 'bg-red-100 text-red-700', text: 'Declined' };
      default:
        return { color: 'bg-slate-100 text-slate-700', text: 'Unknown' };
    }
  };

  const selectedDateGames = selectedDate ? getGamesForDate(selectedDate) : [];
  const selectedDateAvailable = selectedDate ? isDateAvailable(selectedDate) : false;

  return (
    <>
      <Helmet>
        <title>Calendar - Referee Management</title>
        <meta name="description" content="View your game schedule and manage your availability." />
      </Helmet>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Calendar</h1>
            <p className="text-slate-600">View your game schedule and availability</p>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
              onClick={() => handleFeatureClick('sync-calendar')}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Sync Calendar
            </Button>
            <Button 
              className="basketball-gradient hover:opacity-90 text-white"
              onClick={() => setShowAvailabilityDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Availability
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-effect border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateMonth(-1)}
                    className="border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <h2 className="text-xl font-bold text-slate-900 min-w-[200px] text-center">
                    {monthNames[currentMonth]} {currentYear}
                  </h2>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateMonth(1)}
                    className="border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex space-x-2">
                  {['month', 'week', 'day'].map((viewType) => (
                    <Button
                      key={viewType}
                      variant={view === viewType ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setView(viewType)}
                      className={view === viewType 
                        ? 'basketball-gradient hover:opacity-90 text-white' 
                        : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                      }
                    >
                      {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-effect border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {dayNames.map((day) => (
                  <div key={day} className="text-center py-2">
                    <span className="text-slate-600 font-bold text-sm uppercase tracking-wider">{day}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((calendarDay, index) => {
                  const dayGames = getGamesForDate(calendarDay.date);
                  const isToday = calendarDay.date.toDateString() === new Date().toDateString();
                  const isAvailable = isDateAvailable(calendarDay.date);
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.01 }}
                      onClick={() => calendarDay.isCurrentMonth && handleDateSelect(calendarDay.date)}
                      className={`min-h-[120px] p-2 border border-slate-200 rounded-lg transition-all duration-200 relative ${
                        !calendarDay.isCurrentMonth ? 'opacity-40 bg-slate-50' : 'cursor-pointer hover:border-brand-orange hover:shadow-md bg-white'
                      } ${isToday ? 'ring-2 ring-brand-orange bg-orange-50' : ''} ${
                        isAvailable && dayGames.length === 0 ? 'bg-green-50 border-green-200' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-bold ${
                          isToday ? 'text-brand-orange' : 
                          calendarDay.isCurrentMonth ? 'text-slate-800' : 'text-slate-400'
                        }`}>
                          {calendarDay.day}
                        </span>
                        {dayGames.length > 0 ? (
                          <Badge className="basketball-gradient text-white text-xs border-0">
                            {dayGames.length}
                          </Badge>
                        ) : isAvailable && (
                          <div className="w-2.5 h-2.5 bg-green-500 rounded-full" title="Available"></div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        {dayGames.slice(0, 2).map((game) => (
                          <div
                            key={game.id}
                            className={`p-1.5 rounded text-xs shadow-sm border border-transparent ${getStatusColor(game.status)}`}
                          >
                            <div className="font-bold truncate">
                              {game.homeTeam} vs {game.awayTeam}
                            </div>
                            <div className="flex items-center space-x-1 opacity-90 font-medium">
                              <Clock className="h-3 w-3" />
                              <span>{game.time}</span>
                            </div>
                          </div>
                        ))}
                        {dayGames.length > 2 && (
                          <div className="text-xs font-medium text-slate-500 text-center mt-1 bg-slate-100 rounded py-0.5">
                            +{dayGames.length - 2} more
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-effect border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-900">Upcoming Games This Month</CardTitle>
              <CardDescription className="text-slate-600">
                Quick overview of your scheduled assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {games.filter(game => {
                  const gameDate = new Date(game.date);
                  return gameDate.getMonth() === currentMonth && 
                         gameDate.getFullYear() === currentYear &&
                         (game.status === 'scheduled' || game.status === 'assigned');
                }).slice(0, 5).map((game) => (
                  <div key={game.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex-1">
                      <h4 className="text-slate-900 font-bold">
                        {game.homeTeam} vs {game.awayTeam}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-slate-600 mt-1 font-medium">
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="h-4 w-4 text-brand-blue" />
                          <span>{game.date}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-brand-orange" />
                          <span>{game.time}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4 text-green-600" />
                          <span>{game.venue}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-600 font-bold text-lg">${game.payment}</p>
                      <Badge variant="secondary" className="text-xs mt-1 bg-slate-200 text-slate-800 border-none font-semibold">
                        {game.division}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {games.filter(game => {
                  const gameDate = new Date(game.date);
                  return gameDate.getMonth() === currentMonth && 
                         gameDate.getFullYear() === currentYear &&
                         (game.status === 'scheduled' || game.status === 'assigned');
                }).length === 0 && (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">No scheduled games this month</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
        <DialogContent className="sm:max-w-[425px] bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle>Set Your Availability</DialogTitle>
            <DialogDescription className="text-slate-600">
              Select a date or a range of dates you are available to referee.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <DayPickerCalendar
              mode="range"
              selected={availabilityDateRange}
              onSelect={setAvailabilityDateRange}
              className="rounded-md border bg-slate-50 border-slate-200"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAvailabilityDialog(false)} className="border-slate-300 text-slate-700 hover:bg-slate-100">
              Cancel
            </Button>
            <Button onClick={handleSaveAvailability} className="basketball-gradient hover:opacity-90 text-white">
              Save Availability
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEventDetailsDialog} onOpenChange={setShowEventDetailsDialog}>
        <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <CalendarIcon className="h-5 w-5 mr-2 text-brand-orange" />
              {selectedDate ? `Schedule for ${format(selectedDate, 'MMMM d, yyyy')}` : 'Schedule Details'}
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              A summary of your events for the selected day.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
            {selectedDateGames.length === 0 && !selectedDateAvailable && (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No scheduled events for this day.</p>
              </div>
            )}

            {selectedDateAvailable && selectedDateGames.length === 0 && (
              <div className="flex items-center p-4 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle className="h-8 w-8 text-green-600 mr-4" />
                <div>
                  <h4 className="font-bold text-slate-900">You are available!</h4>
                  <p className="text-sm text-green-800 font-medium">You've marked this day as available for assignments.</p>
                </div>
              </div>
            )}
            
            {selectedDateGames.length > 0 && (
              <div className="space-y-4">
                {selectedDateGames.map(game => {
                  const statusInfo = getStatusInfo(game.status);
                  return (
                    <div key={game.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-start">
                        <h4 className="text-slate-900 font-bold flex-1 pr-2 text-lg">
                          {game.homeTeam} vs {game.awayTeam}
                        </h4>
                        <Badge className={`${statusInfo.color} border-0 font-bold`}>{statusInfo.text}</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-slate-700 mt-4 font-medium">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-brand-orange" />
                          <span>{game.time}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-brand-blue" />
                          <span>{game.venue}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-purple-600" />
                          <span>{game.division}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-bold text-green-700 text-base">${game.payment}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDetailsDialog(false)} className="border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}