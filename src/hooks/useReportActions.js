import { toast } from '@/components/ui/use-toast';
import { submitGameReportRecord } from '@/lib/firestoreService';

export const useReportActions = (user, fetchData) => {
  const submitGameReport = async (reportData) => {
    if (!user || user.role !== 'referee') return false;
    const { error } = await submitGameReportRecord(user, reportData);
    if (error) {
      toast({ title: "Report Submission Failed", description: error.message, variant: "destructive" });
      return false;
    } else {
      toast({ title: "Game Report Submitted! 📝", description: "Your report has been sent to the manager." });
      fetchData(false);
      return true;
    }
  };

  return { submitGameReport };
};