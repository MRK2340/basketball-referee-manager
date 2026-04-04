import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkeletonStatCard, SkeletonGameCard } from '@/components/SkeletonCard';
import { 
  Calendar, 
  Trophy, 
  DollarSign, 
  Clock, 
  Star, 
  TrendingUp,
  Users,
  MapPin,
  Mail,
  Bell,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ACTIVITY_ICONS = {
  assignment: { icon: Trophy, color: 'text-brand-orange', bg: 'bg-orange-100' },
  message:    { icon: MessageCircle, color: 'text-blue-600', bg: 'bg-blue-100' },
  payment:    { icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
  conflict:   { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
  default:    { icon: Bell, color: 'text-slate-600', bg: 'bg-slate-100' },
};

const Dashboard = () => {
  const { user } = useAuth();
  const { games, payments, notifications, loading } = useData();
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
  const recentActivity = (notifications || []).slice(0, 6);

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

      <div className="space-y-8" data-testid="dashboard-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-left"
          data-testid="dashboard-header"
        >
          <p className="app-kicker mb-3">Overview</p>
          <h1 className="app-heading mb-3 text-4xl sm:text-5xl text-slate-950">Welcome back, {user?.name}</h1>
          <p className="max-w-2xl text-base text-slate-600">Here is your live view of assignments, earnings, and the most important next actions.</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }, (_, i) => <SkeletonStatCard key={i} />)
          ) : (
            stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass-effect border-slate-200 hover:-translate-y-0.5 transition-all duration-300 shadow-sm" data-testid={`dashboard-stat-${stat.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="app-kicker mb-2 text-[11px]">{stat.title}</p>
                          <p className="text-2xl font-bold text-slate-950">{stat.value}</p>
                        </div>
                        <div className={`rounded-2xl p-3 ${stat.bgColor}`}>
                          <Icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-effect border-slate-200 shadow-sm" data-testid="dashboard-upcoming-games-card">
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
                    <div key={game.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4" data-testid={`dashboard-upcoming-game-${game.id}`}>
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
                  data-testid="dashboard-view-full-schedule-button"
                  onClick={() => handleQuickAction('view-schedule')}
                >
                  View Full Schedule
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <Card className="glass-effect border-slate-200 shadow-sm" data-testid="dashboard-recent-payments-card">
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
                      <div key={payment.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4" data-testid={`dashboard-payment-${payment.id}`}>
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
                  data-testid="dashboard-view-all-payments-button"
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
          <Card className="glass-effect border-slate-200 shadow-sm" data-testid="dashboard-quick-actions-card">
            <CardHeader>
              <CardTitle className="text-slate-900">Quick Actions</CardTitle>
              <CardDescription className="text-slate-600">
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Button 
                  variant="outline" 
                  data-testid="dashboard-update-availability-button"
                  className="h-20 flex-col space-y-2 border-slate-300 hover:bg-slate-100 text-slate-800"
                  onClick={() => handleQuickAction('update-availability')}
                >
                  <Calendar className="h-6 w-6 text-brand-blue" />
                  <span className="text-sm">Update Availability</span>
                </Button>
                <Button 
                  variant="outline" 
                  data-testid="dashboard-submit-report-button"
                  className="h-20 flex-col space-y-2 border-slate-300 hover:bg-slate-100 text-slate-800"
                  onClick={() => handleQuickAction('submit-report')}
                >
                  <Trophy className="h-6 w-6 text-green-600" />
                  <span className="text-sm">Submit Game Report</span>
                </Button>
                <Button 
                  variant="outline" 
                  data-testid="dashboard-view-messages-button"
                  className="h-20 flex-col space-y-2 border-slate-300 hover:bg-slate-100 text-slate-800"
                  onClick={() => handleQuickAction('view-messages')}
                >
                  <Mail className="h-6 w-6 text-purple-600" />
                  <span className="text-sm">Check Messages</span>
                </Button>
                <Button 
                  variant="outline" 
                  data-testid="dashboard-update-profile-button"
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

        {/* Live Activity Feed */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="glass-effect border-slate-200 shadow-sm" data-testid="dashboard-activity-feed-card">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-brand-blue" />
                Live Activity Feed
              </CardTitle>
              <CardDescription className="text-slate-600">
                Recent events and updates for your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">No recent activity</p>
                  <p className="text-slate-400 text-sm">Events like assignments, payments, and messages will appear here.</p>
                </div>
              ) : (
                <div className="relative space-y-0">
                  <div className="absolute left-5 top-2 bottom-2 w-px bg-slate-200" aria-hidden="true" />
                  {recentActivity.map((item, index) => {
                    const cfg = ACTIVITY_ICONS[item.type] || ACTIVITY_ICONS.default;
                    const Icon = cfg.icon;
                    let timeAgo = '';
                    try { timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true }); } catch { timeAgo = ''; }
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative flex gap-4 pb-5 last:pb-0"
                        data-testid={`dashboard-activity-${item.id}`}
                      >
                        <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center shadow-sm`}>
                          <Icon className={`h-4 w-4 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 pt-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-900 text-sm">{item.title}</p>
                              <p className="text-slate-600 text-sm mt-0.5">{item.body}</p>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-2 mt-0.5">
                              {!item.read && (
                                <span className="inline-block w-2 h-2 rounded-full bg-brand-orange flex-shrink-0" />
                              )}
                              <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default Dashboard;