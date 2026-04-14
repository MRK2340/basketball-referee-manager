import React, { useState } from 'react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { saveFeedback } from '@/lib/firestoreService';
import type { AppUser } from '@/lib/types';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AppUser;
}

const CATEGORIES = [
  { value: 'bug',      label: 'Bug Report' },
  { value: 'feature',  label: 'Feature Request' },
  { value: 'general',  label: 'General Feedback' },
  { value: 'other',    label: 'Other' },
];

export const FeedbackDialog: React.FC<FeedbackDialogProps> = ({ open, onOpenChange, user }) => {
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({ title: 'Message required', description: 'Please enter your feedback.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const result = await saveFeedback(user.id, category, message.trim());
    setLoading(false);
    if (result.error) {
      toast({ title: 'Could not send feedback', description: result.error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Feedback sent', description: 'Thank you! We appreciate your input.' });
    setMessage('');
    setCategory('general');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="feedback-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <MessageSquare className="h-5 w-5 text-brand-blue" />
            Send Feedback
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Share a bug report, feature idea, or any thoughts with the iWhistle team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-slate-700">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="feedback-category-select" className="border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-700">Message</Label>
            <Textarea
              data-testid="feedback-message-textarea"
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, 2000))}
              placeholder="Describe the issue or your idea in detail..."
              className="border-slate-300 resize-none min-h-[120px]"
            />
            <p className="text-xs text-slate-400 text-right">{message.length}/2000</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-300">
            Cancel
          </Button>
          <Button
            data-testid="feedback-submit-button"
            onClick={handleSubmit}
            disabled={loading || !message.trim()}
            className="basketball-gradient hover:opacity-90 text-white"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Send Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
