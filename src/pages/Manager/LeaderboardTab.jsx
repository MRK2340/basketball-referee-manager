import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Star, Trophy, TrendingUp, Award, ArrowUpDown, ClipboardList } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

const AssignFromLeaderboardDialog = ({ open, setOpen, referee, games, onAssign }) => {
  const [selectedGameId, setSelectedGameId] = useState('');
  const scheduledGames = games.filter((g) => g.status !== 'completed');

  const handleAssign = () => {
    if (selectedGameId && referee) {
      onAssign(selectedGameId, referee.id);
      setOpen(false);
      setSelectedGameId('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm bg-white border-slate-200 text-slate-900" data-testid="leaderboard-assign-dialog">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Assign {referee?.name}</DialogTitle>
          <DialogDescription className="text-slate-600">Select a game to assign this referee to.</DialogDescription>
        </DialogHeader>
        <div className="py-3">
          <Select value={selectedGameId} onValueChange={setSelectedGameId}>
            <SelectTrigger className="w-full bg-white border-slate-300" data-testid="leaderboard-assign-game-select">
              <SelectValue placeholder="Choose a game..." />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              {scheduledGames.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.date} — {g.homeTeam} vs {g.awayTeam}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="border-slate-300 text-slate-700">Cancel</Button>
          <Button onClick={handleAssign} disabled={!selectedGameId} className="basketball-gradient text-white" data-testid="leaderboard-confirm-assign-button">
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const SORT_OPTIONS = [
  { value: 'rating', label: 'Rating' },
  { value: 'games', label: 'Games Officiated' },
  { value: 'acceptance', label: 'Acceptance Rate' },
];

const LeaderboardTab = ({ referees, games }) => {
  const { assignmentActions } = useData();
  const [sortBy, setSortBy] = useState('rating');
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const enrichedReferees = useMemo(() => {
    return referees.map((ref) => {
      const allGames = games || [];
      const refAssignments = allGames.flatMap((g) => g.assignments || []).filter((a) => a.refereeId === ref.id);
      const total = refAssignments.length;
      const accepted = refAssignments.filter((a) => a.status === 'accepted').length;
      const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
      return { ...ref, acceptanceRate, totalAssignments: total };
    });
  }, [referees, games]);

  const sorted = useMemo(() => {
    return [...enrichedReferees].sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'games') return (b.gamesOfficiated || 0) - (a.gamesOfficiated || 0);
      if (sortBy === 'acceptance') return b.acceptanceRate - a.acceptanceRate;
      return 0;
    });
  }, [enrichedReferees, sortBy]);

  const handleAssignClick = (referee) => {
    setAssignTarget(referee);
    setAssignDialogOpen(true);
  };

  const getRankBadge = (index) => {
    if (index === 0) return <span className="inline-flex items-center justify-center w-7 h-7 bg-yellow-100 rounded-full text-yellow-700 text-xs font-bold">1</span>;
    if (index === 1) return <span className="inline-flex items-center justify-center w-7 h-7 bg-slate-200 rounded-full text-slate-600 text-xs font-bold">2</span>;
    if (index === 2) return <span className="inline-flex items-center justify-center w-7 h-7 bg-orange-100 rounded-full text-orange-700 text-xs font-bold">3</span>;
    return <span className="text-slate-500 text-sm font-semibold w-7 inline-flex justify-center">{index + 1}</span>;
  };

  return (
    <div className="space-y-6 mt-4" data-testid="manager-leaderboard-tab">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">Referee Leaderboard</h3>
          <p className="text-sm text-slate-600">Ranked by performance metrics across all games.</p>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-slate-500" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48 bg-white border-slate-300 text-slate-900" data-testid="leaderboard-sort-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Referees', value: referees.length, icon: Trophy, color: 'text-brand-blue', bg: 'bg-blue-100' },
          { label: 'Avg Rating', value: referees.length ? (referees.reduce((s, r) => s + (r.rating || 0), 0) / referees.length).toFixed(1) : '—', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-100' },
          { label: 'Avg Games', value: referees.length ? Math.round(referees.reduce((s, r) => s + (r.gamesOfficiated || 0), 0) / referees.length) : 0, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="glass-effect border-slate-200 shadow-xs">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bg}`}><Icon className={`h-5 w-5 ${stat.color}`} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="glass-effect border-slate-200 shadow-xs">
        <CardContent className="p-0">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-slate-200">
                  <TableHead className="text-slate-900 font-bold w-12 pl-4">#</TableHead>
                  <TableHead className="text-slate-900 font-bold">Referee</TableHead>
                  <TableHead className="text-center text-slate-900 font-bold">Rating</TableHead>
                  <TableHead className="text-center text-slate-900 font-bold">Games</TableHead>
                  <TableHead className="text-center text-slate-900 font-bold">Accept%</TableHead>
                  <TableHead className="text-slate-900 font-bold">Certs</TableHead>
                  <TableHead className="text-right text-slate-900 font-bold pr-4">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((referee, index) => (
                  <motion.tr
                    key={referee.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
                    data-testid={`leaderboard-row-${referee.id}`}
                  >
                    <TableCell className="pl-4">{getRankBadge(index)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={referee.avatarUrl} />
                          <AvatarFallback className="bg-slate-200 text-slate-700 text-xs">{referee.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{referee.name}</p>
                          <p className="text-xs text-slate-500">{referee.experience}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="font-bold text-slate-900">{referee.rating?.toFixed(1) || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-bold text-slate-900">{referee.gamesOfficiated || 0}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`text-xs font-bold border-0 ${
                        referee.acceptanceRate >= 80 ? 'bg-green-100 text-green-700' :
                        referee.acceptanceRate >= 60 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {referee.acceptanceRate}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(referee.certifications || []).slice(0, 2).map((cert) => (
                          <Badge key={cert} variant="outline" className="text-xs border-slate-300 text-slate-600 py-0">{cert}</Badge>
                        ))}
                        {(referee.certifications || []).length > 2 && (
                          <Badge variant="outline" className="text-xs border-slate-300 text-slate-500 py-0">+{referee.certifications.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <Button
                        size="sm"
                        className="basketball-gradient hover:opacity-90 text-white text-xs"
                        onClick={() => handleAssignClick(referee)}
                        data-testid={`leaderboard-assign-${referee.id}`}
                      >
                        <ClipboardList className="h-3 w-3 mr-1" />
                        Assign
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AssignFromLeaderboardDialog
        open={assignDialogOpen}
        setOpen={setAssignDialogOpen}
        referee={assignTarget}
        games={games}
        onAssign={assignmentActions.assignRefereeToGame}
      />
    </div>
  );
};

export default LeaderboardTab;
