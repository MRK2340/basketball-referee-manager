import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Star, Trophy, AlertTriangle, Users, Award } from 'lucide-react';

const GameReport = () => {
  const { user } = useAuth();
  const { games, gameReports, reportActions } = useData();
  const navigate = useNavigate();

  const [selectedGameId, setSelectedGameId] = useState('');
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [professionalismRating, setProfessionalismRating] = useState(0);
  const [incidents, setIncidents] = useState('');
  const [notes, setNotes] = useState('');
  const [technicalFouls, setTechnicalFouls] = useState(0);
  const [personalFouls, setPersonalFouls] = useState(0);
  const [ejections, setEjections] = useState(0);
  const [mvpPlayer, setMvpPlayer] = useState('');

  const reportableGames = useMemo(() => {
    const reportedGameIds = new Set(gameReports.map(r => r.gameId));
    return games.filter(game => 
      game.status === 'completed' &&
      game.assignments.some(a => a.referee.id === user.id) &&
      !reportedGameIds.has(game.id)
    );
  }, [games, gameReports, user.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGameId || homeScore === '' || awayScore === '' || professionalismRating === 0) {
      toast({
        title: 'Missing Information',
        description: 'Please select a game, enter the final score, and provide a professionalism rating.',
        variant: 'destructive',
      });
      return;
    }

    const selectedGame = games.find(g => g.id === selectedGameId);
    if (!selectedGame || !selectedGame.managerId) {
        toast({ title: "Error", description: "Could not find the manager for this game.", variant: "destructive" });
        return;
    }

    const reportData = {
      game_id: selectedGameId,
      referee_id: user.id,
      manager_id: selectedGame.managerId,
      home_score: parseInt(homeScore, 10),
      away_score: parseInt(awayScore, 10),
      professionalism_rating: professionalismRating,
      incidents,
      notes,
      technical_fouls: technicalFouls,
      personal_fouls: personalFouls,
      ejections,
      mvp_player: mvpPlayer,
    };

    const success = await reportActions.submitGameReport(reportData);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <>
      <Helmet>
        <title>Submit Game Report - iWhistle</title>
        <meta name="description" content="Submit your post-game report including final score, incidents, and notes." />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <Card className="glass-effect border-slate-200 shadow-md">
          <CardHeader className="text-center">
            <Trophy className="h-12 w-12 text-brand-orange mx-auto mb-4" />
            <CardTitle className="text-slate-900 text-3xl font-black">Submit Game Report</CardTitle>
            <CardDescription className="text-slate-600 font-medium">
              Provide the details for the completed game.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="game" className="text-slate-800 font-bold mb-1.5 block">Select Game</Label>
                <Select onValueChange={setSelectedGameId} value={selectedGameId}>
                  <SelectTrigger id="game" className="w-full bg-white border-slate-300 text-slate-900 font-medium">
                    <SelectValue placeholder="Choose a completed game..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    {reportableGames.length > 0 ? (
                      reportableGames.map(game => (
                        <SelectItem key={game.id} value={game.id} className="font-medium">
                          {game.date} - {game.homeTeam} vs {game.awayTeam}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-3 text-slate-500 font-medium text-sm text-center">No games available to report.</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="homeScore" className="text-slate-800 font-bold mb-1.5 block">Home Team Score</Label>
                  <Input
                    id="homeScore"
                    type="number"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    className="bg-white border-slate-300 text-slate-900 font-bold text-lg"
                    placeholder="e.g., 88"
                  />
                </div>
                <div>
                  <Label htmlFor="awayScore" className="text-slate-800 font-bold mb-1.5 block">Away Team Score</Label>
                  <Input
                    id="awayScore"
                    type="number"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    className="bg-white border-slate-300 text-slate-900 font-bold text-lg"
                    placeholder="e.g., 85"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <Label className="text-slate-800 font-bold block text-center">Coach & Player Professionalism</Label>
                <div className="flex items-center justify-center space-x-3 mt-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-10 w-10 cursor-pointer transition-all hover:scale-110 ${
                        professionalismRating >= star ? 'text-yellow-400 fill-yellow-400 drop-shadow-sm' : 'text-slate-300'
                      }`}
                      onClick={() => setProfessionalismRating(star)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="incidents" className="text-slate-800 font-bold mb-1.5 block">Incidents or Issues</Label>
                <Textarea
                  id="incidents"
                  value={incidents}
                  onChange={(e) => setIncidents(e.target.value)}
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 min-h-[100px]"
                  placeholder="Describe any technical fouls, ejections, or notable incidents..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="techFouls" className="text-slate-800 font-bold mb-1.5 block flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-orange-500" /> Technical Fouls
                  </Label>
                  <Input
                    id="techFouls"
                    type="number"
                    min="0"
                    value={technicalFouls}
                    onChange={(e) => setTechnicalFouls(Number(e.target.value))}
                    className="bg-white border-slate-300 text-slate-900"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="personalFouls" className="text-slate-800 font-bold mb-1.5 block flex items-center gap-1">
                    <Users className="h-4 w-4 text-slate-500" /> Personal Fouls
                  </Label>
                  <Input
                    id="personalFouls"
                    type="number"
                    min="0"
                    value={personalFouls}
                    onChange={(e) => setPersonalFouls(Number(e.target.value))}
                    className="bg-white border-slate-300 text-slate-900"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="ejections" className="text-slate-800 font-bold mb-1.5 block flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-red-500" /> Ejections
                  </Label>
                  <Input
                    id="ejections"
                    type="number"
                    min="0"
                    value={ejections}
                    onChange={(e) => setEjections(Number(e.target.value))}
                    className="bg-white border-slate-300 text-slate-900"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="mvpPlayer" className="text-slate-800 font-bold mb-1.5 block flex items-center gap-1">
                  <Award className="h-4 w-4 text-yellow-500" /> Game MVP (Optional)
                </Label>
                <Input
                  id="mvpPlayer"
                  value={mvpPlayer}
                  onChange={(e) => setMvpPlayer(e.target.value)}
                  className="bg-white border-slate-300 text-slate-900"
                  placeholder="e.g., Player Name (Team Name)"
                />
              </div>

              <div>
                <Label htmlFor="notes" className="text-slate-800 font-bold mb-1.5 block">General Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 min-h-[100px]"
                  placeholder="Any other comments about the game, facility, or staff..."
                />
              </div>

              <Button type="submit" className="w-full basketball-gradient hover:opacity-90 text-white text-lg font-bold py-6 shadow-lg transform transition-all hover:scale-[1.02]">
                Submit Official Report
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

export default GameReport;