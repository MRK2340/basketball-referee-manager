import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

export const useDataFetching = (user, page = 1, pageSize = 20) => {
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState([]);
  const [payments, setPayments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [referees, setReferees] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [gameReports, setGameReports] = useState([]);
  const [hasMoreGames, setHasMoreGames] = useState(true);

  const fetchData = useCallback(async (isInitialLoad = true) => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Fetch all non-paginated data only on initial load
      if (isInitialLoad) {
        const { data: tournamentsData, error: tournamentsError } = await supabase
          .from('tournaments')
          .select('id, name, start_date, end_date, location, number_of_courts, games(count)');
        if (tournamentsError) throw tournamentsError;
        
        setTournaments(tournamentsData.map(t => ({
          id: t.id,
          name: t.name,
          startDate: t.start_date,
          endDate: t.end_date,
          location: t.location,
          numberOfCourts: t.number_of_courts,
          games: t.games[0] ? t.games[0].count : 0,
          refereesNeeded: 0 
        })));

        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('id, game_id, amount, status, payment_date, payment_method')
          .eq('referee_id', user.id);
        if (paymentsError) throw paymentsError;
        setPayments(paymentsData.map(p => ({
          id: p.id,
          gameId: p.game_id,
          amount: p.amount,
          status: p.status,
          date: p.payment_date,
          method: p.payment_method
        })));

        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('id, subject, content, created_at, is_read, sender:sender_id(name, avatar_url)')
          .or(`recipient_id.eq.${user.id},sender_id.eq.${user.id}`)
          .order('created_at', { ascending: false });
        if (messagesError) throw messagesError;
        setMessages(messagesData.map(m => ({
          id: m.id,
          from: m.sender?.name || 'System',
          fromAvatar: m.sender?.avatar_url,
          subject: m.subject,
          content: m.content,
          timestamp: m.created_at,
          read: m.is_read
        })));

        if (user.role === 'manager') {
          const { data: refereesData, error: refereesError } = await supabase
            .from('profiles')
            .select('id, name, phone, role, avatar_url, experience, certifications, rating, games_officiated, referee_availability(*)')
            .eq('role', 'referee');
          if (refereesError) throw refereesError;
          setReferees(refereesData);
        }

        if (user.role === 'referee') {
          const { data: availabilityData, error: availabilityError } = await supabase
            .from('referee_availability')
            .select('id, start_time, end_time')
            .eq('referee_id', user.id);
          if (availabilityError) throw availabilityError;
          setAvailability(availabilityData);
        }

        const { data: reportsData, error: reportsError } = await supabase
          .from('game_reports')
          .select('*, game:games(home_team, away_team), referee:referee_id(name)');
        if (reportsError) throw reportsError;
        setGameReports(reportsData.map(r => ({
          id: r.id,
          gameId: r.game_id,
          gameTitle: `${r.game.home_team} vs ${r.game.away_team}`,
          refereeId: r.referee_id,
          refereeName: r.referee.name,
          managerId: r.manager_id,
          homeScore: r.home_score,
          awayScore: r.away_score,
          professionalismRating: r.professionalism_rating,
          incidents: r.incidents,
          notes: r.notes,
          status: r.status,
          createdAt: r.created_at,
        })));
      }

      // Fetch paginated games data
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select('*, tournament:tournaments(name, manager_id), game_assignments(*, profiles(id, name, avatar_url))')
        .order('game_date', { ascending: false })
        .range(from, to);
      if (gamesError) throw gamesError;
      
      const newGames = gamesData.map(g => ({
        id: g.id,
        homeTeam: g.home_team,
        awayTeam: g.away_team,
        date: g.game_date,
        time: g.game_time,
        venue: g.venue,
        status: g.status,
        payment: g.payment_amount,
        division: g.division,
        homeScore: g.home_score,
        awayScore: g.away_score,
        tournamentName: g.tournament?.name || 'N/A',
        managerId: g.tournament?.manager_id,
        assignments: g.game_assignments?.map(a => ({
          id: a.id,
          status: a.status,
          declineReason: a.decline_reason,
          referee: {
            id: a.profiles.id,
            name: a.profiles.name,
            avatarUrl: a.profiles.avatar_url
          }
        })) || []
      }));
      
      setHasMoreGames(newGames.length === pageSize);
      setGames(prevGames => isInitialLoad ? newGames : [...prevGames, ...newGames]);

    } catch (error) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, page, pageSize]);

  return { 
    loading,
    games, setGames,
    payments, setPayments,
    messages, setMessages,
    notifications, setNotifications,
    tournaments, setTournaments,
    referees, setReferees,
    availability, setAvailability,
    gameReports, setGameReports,
    fetchData,
    hasMoreGames
  };
};