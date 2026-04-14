import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Sparkles, UserCheck, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { generateAutoAssignSuggestions, assignReferee } from '@/lib/firestoreService';
import { toast } from '@/components/ui/use-toast';

interface Suggestion {
  gameId: string;
  gameLabel: string;
  refereeId: string;
  refereeName: string;
  reason: string;
}

type Step = 'idle' | 'generating' | 'review' | 'assigning' | 'done';

interface Props {
  tournamentId: string;
  onComplete: () => void;
}

export const AutoAssignPanel = ({ tournamentId, onComplete }: Props) => {
  const { user } = useAuth();
  const { fetchData } = useData();
  const [step, setStep] = useState<Step>('idle');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [resultCount, setResultCount] = useState(0);
  const [error, setError] = useState('');

  const handleGenerate = useCallback(async () => {
    if (!user || !tournamentId) return;
    setStep('generating');
    setError('');

    const { data, error: err } = await generateAutoAssignSuggestions(user, tournamentId);
    if (err) {
      setError(err.message);
      setStep('idle');
      return;
    }
    if (!data || data.length === 0) {
      setError('No suggestions available. Either all games are already assigned, or no connected referees were found.');
      setStep('idle');
      return;
    }
    setSuggestions(data);
    setSelected(new Set(data.map((_, i) => i)));
    setStep('review');
  }, [user, tournamentId]);

  const toggleRow = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleAssign = useCallback(async () => {
    if (!user) return;
    setStep('assigning');
    let count = 0;

    for (const idx of selected) {
      const s = suggestions[idx];
      if (!s) continue;
      const { error: err } = await assignReferee(user, s.gameId, s.refereeId);
      if (!err) count++;
    }

    setResultCount(count);
    setStep('done');
    fetchData(false);
    toast({ title: 'Referees Assigned', description: `${count} referee${count !== 1 ? 's' : ''} assigned successfully.` });
  }, [user, suggestions, selected, fetchData]);

  if (step === 'idle') {
    return (
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full border-dashed border-brand-blue text-brand-blue hover:bg-blue-50 gap-2"
          onClick={handleGenerate}
          data-testid="auto-assign-generate-btn"
        >
          <Sparkles className="h-4 w-4" />
          Auto-Assign Referees
        </Button>
        {error && (
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">{error}</p>
          </div>
        )}
      </div>
    );
  }

  if (step === 'generating') {
    return (
      <div className="flex items-center justify-center py-6 gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-brand-blue" />
        <p className="text-sm text-slate-600">Analyzing referees and availability...</p>
      </div>
    );
  }

  if (step === 'review') {
    return (
      <div className="space-y-3" data-testid="auto-assign-review">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">
            Suggested Assignments ({suggestions.length})
          </p>
          <Badge variant="outline" className="text-xs border-brand-blue text-brand-blue">
            {selected.size} selected
          </Badge>
        </div>

        <ScrollArea className="max-h-[200px]">
          <div className="space-y-1.5">
            {suggestions.map((s, i) => (
              <Card key={i} className={`border-slate-200 shadow-none ${selected.has(i) ? '' : 'opacity-40'}`} data-testid={`auto-assign-suggestion-${i}`}>
                <CardContent className="p-2.5 flex items-center gap-2.5">
                  <Checkbox
                    checked={selected.has(i)}
                    onCheckedChange={() => toggleRow(i)}
                    data-testid={`auto-assign-check-${i}`}
                  />
                  <UserCheck className="h-4 w-4 text-brand-blue shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-800 truncate">{s.gameLabel}</p>
                    <p className="text-[10px] text-slate-500">
                      <span className="font-semibold text-brand-blue">{s.refereeName}</span> — {s.reason}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Button
            size="sm"
            className="basketball-gradient text-white hover:opacity-90 gap-1.5 flex-1 h-9"
            onClick={handleAssign}
            disabled={selected.size === 0}
            data-testid="auto-assign-confirm-btn"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Assign {selected.size} Referees
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-slate-200 text-slate-600 h-9"
            onClick={() => { setStep('idle'); setSuggestions([]); }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'assigning') {
    return (
      <div className="flex items-center justify-center py-6 gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-brand-blue" />
        <p className="text-sm text-slate-600">Assigning referees...</p>
      </div>
    );
  }

  // done
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4" data-testid="auto-assign-done">
      <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
      <p className="text-sm font-bold text-slate-800">{resultCount} referees assigned</p>
      <Button size="sm" variant="outline" className="mt-3 border-slate-200 text-slate-600" onClick={onComplete}>
        Close
      </Button>
    </motion.div>
  );
};
