import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Shield, Clock, Loader2, History } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { fetchLoginHistory, type LoginEvent } from '@/lib/firestoreService';
import type { AppUser } from '@/lib/types';

interface LoginHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AppUser;
}

const formatTS = (ts: string) => {
  try { return format(parseISO(ts), 'MMM d, yyyy · h:mm a'); } catch { return ts || '—'; }
};

const actionLabel = (action: string) => {
  if (action === 'login_mfa') return 'Login (2FA)';
  return 'Login';
};

export const LoginHistoryDialog: React.FC<LoginHistoryDialogProps> = ({ open, onOpenChange, user }) => {
  const [events, setEvents] = useState<LoginEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchLoginHistory(user.id).then(result => {
      if (result.data) setEvents(result.data);
      setLoading(false);
    });
  }, [open, user.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="login-history-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <History className="h-5 w-5 text-brand-blue" />
            Login History
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Your recent sign-in activity. Contact support if you see unrecognized logins.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-10">
              <Shield className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No login history available yet.</p>
              <p className="text-slate-400 text-xs mt-1">Events appear after your next sign-in.</p>
            </div>
          ) : (
            events.map(ev => (
              <div
                key={ev.id}
                data-testid={`login-event-${ev.id}`}
                className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <Clock className="h-3.5 w-3.5 text-brand-blue" />
                  </div>
                  <div>
                    <p className="text-slate-900 text-sm font-semibold">{actionLabel(ev.action)}</p>
                    <p className="text-slate-500 text-xs">{formatTS(ev.timestamp)}</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Success</Badge>
              </div>
            ))
          )}
        </div>

        <p className="text-xs text-slate-400 text-center pt-1">
          Showing last {events.length} sign-in event{events.length !== 1 ? 's' : ''}
        </p>
      </DialogContent>
    </Dialog>
  );
};
