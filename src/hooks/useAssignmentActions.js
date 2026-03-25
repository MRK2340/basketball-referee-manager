import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

export const useAssignmentActions = (user, fetchData, sendMessage, games) => {
  const assignRefereeToGame = async (gameId, refereeId) => {
    if (!user || user.role !== 'manager') return;
    const { error } = await supabase
        .from('game_assignments')
        .insert([{ game_id: gameId, referee_id: refereeId, status: 'assigned' }]);
    if (error) {
        toast({ title: "Assignment Failed", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "Referee Assigned! ✅", description: "The referee has been assigned to the game." });
        fetchData();
    }
  };

  const unassignRefereeFromGame = async (assignmentId) => {
      if (!user || user.role !== 'manager') return;
      const { error } = await supabase
          .from('game_assignments')
          .delete()
          .eq('id', assignmentId);
      if (error) {
          toast({ title: "Unassignment Failed", description: error.message, variant: "destructive" });
      } else {
          toast({ title: "Referee Unassigned", description: "The referee has been removed from the game." });
          fetchData();
      }
  };

  const updateAssignmentStatus = async (assignmentId, status, reason = null) => {
    if (!user || user.role !== 'referee') return;
    const updates = { status };
    if (status === 'declined' && reason) {
      updates.decline_reason = reason;
    }

    const { data, error } = await supabase
      .from('game_assignments')
      .update(updates)
      .eq('id', assignmentId)
      .eq('referee_id', user.id)
      .select('*, game:games(*, tournament:tournaments(manager_id))')
      .single();

    if (error) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Assignment Updated!", description: `You have ${status} the game.` });
      
      if (data && data.game && data.game.tournament) {
        const game = data.game;
        const managerId = game.tournament.manager_id;
        let messageContent = '';
        let subject = '';

        if (status === 'accepted') {
            subject = `Game Assignment Accepted: ${game.home_team} vs ${game.away_team}`;
            messageContent = `
              <p>Referee <strong>${user.name}</strong> has accepted the assignment for the game between <strong>${game.home_team} vs ${game.away_team}</strong> on ${new Date(game.game_date).toLocaleDateString()}.</p>
            `;
        } else if (status === 'declined') {
            subject = `Game Assignment Declined: ${game.home_team} vs ${game.away_team}`;
            messageContent = `
              <p>Assignment for game <strong>${game.home_team} vs ${game.away_team}</strong> on ${new Date(game.game_date).toLocaleDateString()} has been declined by <strong>${user.name}</strong>.</p>
              <p><strong>Reason:</strong> ${reason || 'No reason provided.'}</p>
            `;
        }

        if (managerId && subject && messageContent) {
           sendMessage({
              recipientId: managerId,
              subject: subject,
              content: messageContent,
            });
        }
      }
      
      fetchData();
    }
  };

  const assignRefereesToCourt = async (assignments) => {
    if (!user || user.role !== 'manager') return;

    const { error } = await supabase.from('court_assignments').insert(assignments);

    if (error) {
      toast({
        title: 'Court Assignment Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Court Schedule Saved! 🏀',
        description: 'Referees have been assigned to the court schedule.',
      });
      fetchData();
    }
  };

  const requestGameAssignment = async (gameId) => {
    if (!user || user.role !== 'referee') return;

    const { error } = await supabase
      .from('game_assignments')
      .insert([{ game_id: gameId, referee_id: user.id, status: 'requested' }])
      .select();

    if (error) {
      if (error.code === '23505') {
        toast({ title: "Already Requested", description: "You have already requested to officiate this game.", variant: "default" });
      } else {
        toast({
          title: "Request Failed",
          description: error.message,
          variant: "destructive",
        });
      }
      return;
    }

    toast({
      title: "Request Sent! 👍",
      description: "Your request to officiate this game has been sent to the manager.",
    });

    const game = games.find(g => g.id === gameId);
    if (game?.managerId) {
      sendMessage({
        recipientId: game.managerId,
        subject: `New Game Request: ${game.homeTeam} vs ${game.awayTeam}`,
        content: `Referee ${user.name} has requested to officiate the game between ${game.homeTeam} and ${game.awayTeam} on ${new Date(game.date).toLocaleDateString()}.`,
      });
    }

    fetchData();
  };


  return { assignRefereeToGame, unassignRefereeFromGame, updateAssignmentStatus, assignRefereesToCourt, requestGameAssignment };
};