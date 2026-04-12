import { toast } from '@/components/ui/use-toast';
import { addAvailabilityRecord } from '@/lib/firestoreService';

export const useAvailabilityActions = (user, fetchData) => {
  const addAvailability = async (startDate, endDate) => {
    if (!user || user.role !== 'referee') return;
    
    const startOfDay = new Date(startDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { error } = await addAvailabilityRecord(user, startOfDay.toISOString(), endOfDay.toISOString());

    if (error) {
        toast({
            title: "Error saving availability",
            description: error.message,
            variant: "destructive",
        });
    } else {
        toast({
            title: "Availability Saved",
            description: "Your available dates have been updated.",
        });
        fetchData(false);
    }
  };

  return { addAvailability };
};