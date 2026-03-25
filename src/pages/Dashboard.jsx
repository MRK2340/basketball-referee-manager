import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Trophy, 
  DollarSign, 
  Clock, 
  Star, 
  TrendingUp,
  Users,
  MapPin,
  Mail
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { games, payments } = useData();
  const navigate = useNavigate();

  const upcomingGames = games.filter(game => {
    if (user.role === 'referee') {
      return game.assignments.some(a => a.referee.id === user.id && a.status === 'accepted') && new Date(game.date) >= new Date();
    }
    return new Date(game.date) >= new Date();
  }).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 3);
  
  const recentPayments = payments.filter(payment => payment.status === 'paid').slice(0, 3);
  const totalEarnings = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = payments.filter(payment => payment.status === 'pending').length;

  const stats = [
    {
      title: 'Games This Month',
      value: games.length,
      icon: Trophy,
      color: 'text-brand-blue',
      bgColor: 'bg-brand-blue/10'
    },
    {
      title: 'Total Earnings',
      value: `${totalEarnings.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Pending Payments',
      value: pendingPayments,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Rating',
      value: user?.rating || '4.8',
      icon: Star,
      color: 'text-brand-orange',
      bgColor: 'bg-orange-100'
    }
  ];

  const handleQuickAction = (action) => {
    switch(action) {
      case 'view-schedule': navigate('/schedule'); break;
      case 'view-payments': navigate('/payments'); break;
      case 'update-availability': navigate('/calendar'); break;
      case 'view-messages': navigate('/messages'); break;
      case 'update-profile': navigate('/profile'); break;
      case 'submit-report': navigate('/game-report'); break;
      default: break;
    }
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - Basketball Referee Manager</title>
        <meta name="description" content="View your referee dashboard with upcoming games, earnings, and performance statistics." />
      </Helmet>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center lg:text-left"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {user?.name}! 🏀
          </h1>
          <p className="text-slate-600">
            Here's what's happening with your referee activities
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass-effect border-slate-200 hover:border-slate-300 transition-all duration-300 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-slate-600 text-sm font-medium">{stat.title}</p>
                        <p className="text-slate-900 text-xl font-bold">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-effect border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-brand-orange" />
                  <span>Upcoming Games</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Your next scheduled assignments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingGames.length > 0 ? (
                  upcomingGames.map((game) => (
                    <div key={game.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-slate-900 font-semibold">
                            {game.homeTeam} vs {game.awayTeam}
                          </h4>
                          <p className="text-slate-600 text-sm">{game.division}</p>
                        </div>
                        <Badge className="basketball-gradient text-white border-0">
                          ${game.payment}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-slate-700">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{game.date} at {game.time}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{game.venue}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600">No upcoming games scheduled</p>
                  </div>
                )}
                <Button 
                  className="w-full basketball-gradient hover:opacity-90 text-white"
                  onClick={() => handleQuickAction('view-schedule')}
                >
                  View Full Schedule
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <Card className="glass-effect border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span>Recent Payments</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Your latest payment history
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentPayments.length > 0 ? (
                  recentPayments.map((payment) => {
                    const game = games.find(g => g.id === payment.gameId);
                    return (
                      <div key={payment.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-slate-900 font-semibold">
                              {game ? `${game.homeTeam} vs ${game.awayTeam}` : 'Game Payment'}
                            </h4>
                            <p className="text-slate-600 text-sm">{payment.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-green-600 font-bold">${payment.amount}</p>
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-0">
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600">No recent payments</p>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  className="w-full border-slate-300 text-slate-700 hover:bg-slate-100"
                  onClick={() => handleQuickAction('view-payments')}
                >
                  View All Payments
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="glass-effect border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-900">Quick Actions</CardTitle>
              <CardDescription className="text-slate-600">
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2 border-slate-300 hover:bg-slate-100 text-slate-800"
                  onClick={() => handleQuickAction('update-availability')}
                >
                  <Calendar className="h-6 w-6 text-brand-blue" />
                  <span className="text-sm">Update Availability</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2 border-slate-300 hover:bg-slate-100 text-slate-800"
                  onClick={() => handleQuickAction('submit-report')}
                >
                  <Trophy className="h-6 w-6 text-green-600" />
                  <span className="text-sm">Submit Game Report</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2 border-slate-300 hover:bg-slate-100 text-slate-800"
                  onClick={() => handleQuickAction('view-messages')}
                >
                  <Mail className="h-6 w-6 text-purple-600" />
                  <span className="text-sm">Check Messages</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col space-y-2 border-slate-300 hover:bg-slate-100 text-slate-800"
                  onClick={() => handleQuickAction('update-profile')}
                >
                  <Star className="h-6 w-6 text-yellow-500" />
                  <span className="text-sm">Update Profile</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default Dashboard;