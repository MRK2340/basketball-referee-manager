import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, getMonth } from 'date-fns';
import { DollarSign, Trophy, Star, TrendingUp } from 'lucide-react';

const PerformanceAnalytics = () => {
  const { payments, games, gameReports } = useData();
  const { user } = useAuth();

  const monthlyEarningsData = useMemo(() => {
    const months = Array(12).fill(0).map((_, i) => ({
      name: format(new Date(0, i), 'MMM'),
      earnings: 0,
    }));
    payments.forEach(payment => {
      if (payment.status === 'paid') {
        const monthIndex = getMonth(new Date(payment.date));
        months[monthIndex].earnings += payment.amount;
      }
    });
    return months;
  }, [payments]);
  
  // For referees, only count games they were personally assigned to
  const myGames = useMemo(() => {
    if (user?.role === 'referee') {
      return games.filter(g => g.assignments.some(a => a.referee.id === user.id));
    }
    return games;
  }, [games, user]);

  const monthlyGamesData = useMemo(() => {
      const months = Array(12).fill(0).map((_, i) => ({
          name: format(new Date(0, i), 'MMM'),
          games: 0,
      }));
      myGames.forEach(game => {
          const monthIndex = getMonth(new Date(game.date));
          months[monthIndex].games += 1;
      });
      return months;
  }, [myGames]);

  const ratingDistribution = useMemo(() => {
    const ratings = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
    gameReports.forEach(report => {
      ratings[report.professionalismRating] = (ratings[report.professionalismRating] || 0) + 1;
    });
    return Object.entries(ratings).map(([name, value]) => ({ name: `${name} Star`, value })).reverse();
  }, [gameReports]);
  
  const COLORS = ['#0080C8', '#FF8C00', '#10B981', '#F59E0B', '#EF4444'];

  const totalEarnings = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalGames = myGames.length;
  const avgRating = gameReports.length > 0
    ? (gameReports.reduce((sum, r) => sum + r.professionalismRating, 0) / gameReports.length).toFixed(1)
    : 'N/A';

  const acceptanceRate = useMemo(() => {
    if (user?.role !== 'referee') return null;
    const myAssignments = games.flatMap(g => g.assignments.filter(a => a.referee.id === user.id));
    if (myAssignments.length === 0) return null;
    const accepted = myAssignments.filter(a => a.status === 'accepted').length;
    return Math.round((accepted / myAssignments.length) * 100);
  }, [games, user]);


  return (
    <>
      <Helmet>
        <title>Performance Analytics - iWhistle</title>
        <meta name="description" content="Detailed performance analytics for basketball referees, including earnings, game history, and ratings." />
      </Helmet>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Performance Analytics</h1>
          <p className="text-slate-600">A detailed breakdown of your refereeing activity.</p>
        </motion.div>

        <div className={`grid gap-4 ${acceptanceRate !== null ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
            <Card className="glass-effect border-slate-200 shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Total Earnings</CardTitle>
                    <DollarSign className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-slate-900">${totalEarnings.toFixed(2)}</div>
                </CardContent>
            </Card>
             <Card className="glass-effect border-slate-200 shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Total Games</CardTitle>
                    <Trophy className="h-5 w-5 text-brand-blue" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-slate-900">{totalGames}</div>
                </CardContent>
            </Card>
             <Card className="glass-effect border-slate-200 shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Average Rating</CardTitle>
                    <Star className="h-5 w-5 text-brand-orange" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-slate-900">{avgRating}</div>
                </CardContent>
            </Card>
            {acceptanceRate !== null && (
              <Card className="glass-effect border-slate-200 shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Acceptance Rate</CardTitle>
                    <TrendingUp className="h-5 w-5 text-brand-blue" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-slate-900">{acceptanceRate}%</div>
                </CardContent>
              </Card>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-effect border-slate-200 shadow-xs">
              <CardHeader>
                <CardTitle className="text-slate-900">Monthly Earnings</CardTitle>
                <CardDescription className="text-slate-600">Your total income per month.</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyEarningsData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: '#475569' }} fontSize={12} fontWeight={600} />
                    <YAxis tick={{ fill: '#475569' }} fontSize={12} fontWeight={600} tickFormatter={(value) => `$${value}`} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 'bold', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="earnings" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-effect border-slate-200 shadow-xs">
              <CardHeader>
                <CardTitle className="text-slate-900">Games Per Month</CardTitle>
                <CardDescription className="text-slate-600">Number of games officiated each month.</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyGamesData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: '#475569' }} fontSize={12} fontWeight={600} />
                    <YAxis tick={{ fill: '#475569' }} fontSize={12} fontWeight={600} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 'bold', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="games" fill="#0080C8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="glass-effect border-slate-200 shadow-xs">
              <CardHeader>
                <CardTitle className="text-slate-900">Rating Distribution</CardTitle>
                <CardDescription className="text-slate-600">Breakdown of professionalism ratings from game reports.</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {gameReports.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                    No game reports yet.
                  </div>
                ) : (
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={ratingDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            stroke="#ffffff"
                            strokeWidth={2}
                        >
                            {ratingDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 'bold', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend wrapperStyle={{ color: '#475569', fontWeight: 'bold' }} />
                    </PieChart>
                </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>
      </div>
    </>
  );
};

export default PerformanceAnalytics;