import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, TrendingUp, Target } from 'lucide-react';

const StandingsTab = ({ tournaments, games }) => {
  const [selectedTournamentId, setSelectedTournamentId] = useState(
    tournaments[0]?.id || ''
  );

  const completedGames = useMemo(
    () => games.filter((g) => g.tournamentId === selectedTournamentId && g.status === 'completed'),
    [games, selectedTournamentId]
  );

  const standings = useMemo(() => {
    const teamMap = {};
    completedGames.forEach((game) => {
      const home = game.homeTeam;
      const away = game.awayTeam;
      if (!teamMap[home]) teamMap[home] = { team: home, wins: 0, losses: 0, pf: 0, pa: 0, games: 0 };
      if (!teamMap[away]) teamMap[away] = { team: away, wins: 0, losses: 0, pf: 0, pa: 0, games: 0 };

      const hs = game.homeScore ?? 0;
      const as = game.awayScore ?? 0;

      teamMap[home].games += 1;
      teamMap[away].games += 1;
      teamMap[home].pf += hs;
      teamMap[home].pa += as;
      teamMap[away].pf += as;
      teamMap[away].pa += hs;

      if (hs > as) {
        teamMap[home].wins += 1;
        teamMap[away].losses += 1;
      } else if (as > hs) {
        teamMap[away].wins += 1;
        teamMap[home].losses += 1;
      }
    });

    return Object.values(teamMap).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return (b.pf - b.pa) - (a.pf - a.pa);
    });
  }, [completedGames]);

  const totalGames = useMemo(
    () => games.filter((g) => g.tournamentId === selectedTournamentId),
    [games, selectedTournamentId]
  );

  return (
    <div className="space-y-6 mt-4" data-testid="manager-standings-tab">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">Tournament Standings</h3>
          <p className="text-sm text-slate-600">Win/loss records based on completed game scores.</p>
        </div>
        <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
          <SelectTrigger className="w-64 bg-white border-slate-300 text-slate-900" data-testid="standings-tournament-select">
            <SelectValue placeholder="Select tournament..." />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            {tournaments.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-effect border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100"><Trophy className="h-5 w-5 text-brand-blue" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Games</p>
              <p className="text-2xl font-bold text-slate-900">{totalGames.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-effect border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100"><TrendingUp className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Completed</p>
              <p className="text-2xl font-bold text-slate-900">{completedGames.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-effect border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100"><Target className="h-5 w-5 text-orange-600" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Teams</p>
              <p className="text-2xl font-bold text-slate-900">{standings.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-effect border-slate-200 shadow-xs">
        <CardHeader>
          <CardTitle className="text-slate-900">Team Standings</CardTitle>
          <CardDescription className="text-slate-600">Sorted by wins, then point differential</CardDescription>
        </CardHeader>
        <CardContent>
          {standings.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No completed games yet</p>
              <p className="text-slate-400 text-sm mt-1">Standings will appear once games are completed with scores.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50 border-slate-200">
                    <TableHead className="text-slate-900 font-bold w-8">#</TableHead>
                    <TableHead className="text-slate-900 font-bold">Team</TableHead>
                    <TableHead className="text-center text-slate-900 font-bold">GP</TableHead>
                    <TableHead className="text-center text-slate-900 font-bold">W</TableHead>
                    <TableHead className="text-center text-slate-900 font-bold">L</TableHead>
                    <TableHead className="text-center text-slate-900 font-bold">PF</TableHead>
                    <TableHead className="text-center text-slate-900 font-bold">PA</TableHead>
                    <TableHead className="text-center text-slate-900 font-bold">Diff</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standings.map((row, index) => (
                    <TableRow key={row.team} className="border-slate-100 hover:bg-slate-50/80" data-testid={`standings-row-${index}`}>
                      <TableCell className="font-bold text-slate-500 text-sm">
                        {index === 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-100 rounded-full text-yellow-700 text-xs font-bold">1</span>
                        ) : index + 1}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900">{row.team}</TableCell>
                      <TableCell className="text-center text-slate-700">{row.games}</TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold text-green-700">{row.wins}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold text-red-600">{row.losses}</span>
                      </TableCell>
                      <TableCell className="text-center text-slate-700">{row.pf}</TableCell>
                      <TableCell className="text-center text-slate-700">{row.pa}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={`text-xs font-bold border-0 ${
                          (row.pf - row.pa) > 0 ? 'bg-green-100 text-green-700' :
                          (row.pf - row.pa) < 0 ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {(row.pf - row.pa) > 0 ? '+' : ''}{row.pf - row.pa}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {completedGames.length > 0 && (
        <Card className="glass-effect border-slate-200 shadow-xs">
          <CardHeader>
            <CardTitle className="text-slate-900">Game Results</CardTitle>
            <CardDescription className="text-slate-600">Completed game scores for this tournament</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedGames.map((game) => (
                <div key={game.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200" data-testid={`standings-game-result-${game.id}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900">{game.homeTeam}</span>
                      <span className="text-2xl font-black text-brand-orange">
                        {game.homeScore ?? '—'} – {game.awayScore ?? '—'}
                      </span>
                      <span className="font-bold text-slate-900">{game.awayTeam}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{game.date} · {game.venue} · {game.division}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Final</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StandingsTab;
