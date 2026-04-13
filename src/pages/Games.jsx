import React from 'react';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Clock,
  MapPin,
  Star,
  TrendingUp,
  Calendar,
  DollarSign,
  ClipboardList,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { IndependentGamesTab } from '@/pages/Games/IndependentGamesTab';

// ── Assigned Games Panel ─────────────────────────────────────────────────────
const getStatusColor = (status) => {
  switch (status) {
    case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'in-progress': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'completed': return 'bg-green-100 text-green-700 border-green-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const AssignedGamesContent = ({ games, onFeatureClick }) => {
  const completedGames = games.filter(g => g.status === 'completed');
  const upcomingGames = games.filter(g => g.status === 'scheduled');
  const inProgressGames = games.filter(g => g.status === 'in-progress');

  return (
    <div className="grid lg:grid-cols-3 gap-6 mt-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
        <Card className="glass-effect border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <span>In Progress</span>
            </CardTitle>
            <CardDescription className="text-slate-600">Currently active games</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {inProgressGames.length > 0 ? (
              inProgressGames.map((game) => (
                <div key={game.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-slate-900 font-semibold text-sm">{game.homeTeam} vs {game.awayTeam}</h4>
                      <p className="text-slate-600 text-xs">{game.division}</p>
                    </div>
                    <Badge className={`border text-xs ${getStatusColor(game.status)}`}>Live</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>{game.venue}</span>
                    <span className="font-medium">${game.payment}</span>
                  </div>
                  <Button size="sm" data-testid={`games-manage-live-${game.id}`} className="w-full mt-3 basketball-gradient hover:opacity-90 text-white" onClick={() => onFeatureClick('manage-live-game')}>
                    Manage Game
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 text-sm">No games in progress</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="glass-effect border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <span>Upcoming</span>
            </CardTitle>
            <CardDescription className="text-slate-600">Scheduled assignments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingGames.slice(0, 3).map((game) => (
              <div key={game.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-slate-900 font-semibold text-sm">{game.homeTeam} vs {game.awayTeam}</h4>
                    <p className="text-slate-600 text-xs">{game.division}</p>
                  </div>
                  <Badge className="basketball-gradient text-white text-xs border-0">${game.payment}</Badge>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-600 mb-3">
                  <Calendar className="h-3 w-3" />
                  <span>{game.date} at {game.time}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <MapPin className="h-3 w-3" />
                  <span>{game.venue}</span>
                </div>
              </div>
            ))}
            {upcomingGames.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 text-sm">No upcoming games</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
        <Card className="glass-effect border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-green-500" />
              <span>Completed</span>
            </CardTitle>
            <CardDescription className="text-slate-600">Recent game history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {completedGames.slice(0, 3).map((game) => (
              <div key={game.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-slate-900 font-semibold text-sm">{game.homeTeam} vs {game.awayTeam}</h4>
                    <p className="text-slate-600 text-xs">{game.division}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Completed</Badge>
                </div>
                {game.homeScore !== undefined && (
                  <div className="text-slate-900 text-sm font-semibold mb-2">
                    {game.homeScore} - {game.awayScore}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>{game.date}</span>
                  <span className="text-green-600 font-semibold">${game.payment}</span>
                </div>
                <Button size="sm" variant="outline" data-testid={`games-view-report-${game.id}`} className="w-full mt-3 border-slate-300 text-slate-700 hover:bg-slate-100" onClick={() => onFeatureClick('view-game-report')}>
                  View Report
                </Button>
              </div>
            ))}
            {completedGames.length === 0 && (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 text-sm">No completed games</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

// ── Main Games Page ──────────────────────────────────────────────────────────
const Games = () => {
  const { games, payments, independentGames } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const totalEarnings = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const averageRating = 4.8;

  const currentYear = new Date().getFullYear();
  const indEarningsThisYear = user?.role === 'referee'
    ? (independentGames || [])
        .filter(g => g.date?.startsWith(String(currentYear)))
        .reduce((sum, g) => sum + (Number(g.fee) || 0), 0)
    : 0;
  const indGamesThisYear = user?.role === 'referee'
    ? (independentGames || []).filter(g => g.date?.startsWith(String(currentYear))).length
    : 0;

  const handleFeatureClick = (feature) => {
    if (feature === 'detailed-analytics') {
      navigate('/analytics');
    } else {
      toast({
        title: "Feature Coming Soon!",
        description: "This feature isn't implemented yet — stay tuned!",
      });
    }
  };

  const statsRow = user?.role === 'referee'
    ? [
        { title: 'Assigned Games', value: games.length, icon: Trophy, color: 'text-blue-600', bgColor: 'bg-blue-100' },
        { title: 'Independent Games', value: indGamesThisYear, icon: ClipboardList, color: 'text-purple-600', bgColor: 'bg-purple-100' },
        { title: 'Platform Earnings', value: `$${totalEarnings}`, icon: DollarSign, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
        { title: 'Independent Earnings', value: `$${indEarningsThisYear}`, icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-100' },
      ]
    : [
        { title: 'Total Games', value: games.length, icon: Trophy, color: 'text-blue-600', bgColor: 'bg-blue-100' },
        { title: 'Completed', value: games.filter(g => g.status === 'completed').length, icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-100' },
        { title: 'Total Earnings', value: `$${totalEarnings}`, icon: DollarSign, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
        { title: 'Avg Rating', value: averageRating, icon: Star, color: 'text-orange-600', bgColor: 'bg-orange-100' },
      ];

  return (
    <>
      <Helmet>
        <title>Games - iWhistle</title>
        <meta name="description" content="Track your game history, performance statistics, and manage game reports as a basketball referee." />
      </Helmet>

      <div className="space-y-8" data-testid="games-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-left"
          data-testid="games-page-header"
        >
          <p className="app-kicker mb-3">Performance</p>
          <h1 className="app-heading mb-3 text-4xl text-slate-950">Game Management</h1>
          <p className="max-w-2xl text-slate-600">
            Track completed work, monitor active assignments, and manage all your game history — including games from outside this platform.
          </p>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statsRow.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass-effect border-slate-200 shadow-sm" data-testid={`games-stat-${stat.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
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

        {/* Tabbed view for referees, flat view for managers */}
        {user?.role === 'referee' ? (
          <Tabs defaultValue="assigned" className="w-full" data-testid="games-tabs-root">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              <TabsTrigger value="assigned" data-testid="games-tab-assigned">
                <Trophy className="mr-2 h-4 w-4" />
                Assigned Games
              </TabsTrigger>
              <TabsTrigger value="independent" data-testid="games-tab-independent">
                <ClipboardList className="mr-2 h-4 w-4" />
                Independent Log
              </TabsTrigger>
            </TabsList>
            <TabsContent value="assigned">
              <AssignedGamesContent games={games} onFeatureClick={handleFeatureClick} />
            </TabsContent>
            <TabsContent value="independent">
              <IndependentGamesTab />
            </TabsContent>
          </Tabs>
        ) : (
          <AssignedGamesContent games={games} onFeatureClick={handleFeatureClick} />
        )}
      </div>
    </>
  );
};

export default Games;
