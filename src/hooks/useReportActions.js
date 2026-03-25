import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

export const useReportActions = (user, fetchData) => {
  const submitGameReport = async (reportData) => {
    if (!user || user.role !== 'referee') return false;
    const { error } = await supabase.from('game_reports').insert([reportData]);
    if (error) {
      toast({ title: "Report Submission Failed", description: error.message, variant: "destructive" });
      return false;
    } else {
      toast({ title: "Game Report Submitted! 📝", description: "Your report has been sent to the manager." });
      fetchData();
      return true;
    }
  };

  return { submitGameReport };
};