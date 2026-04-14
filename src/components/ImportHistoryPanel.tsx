import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { fetchImportHistory, undoImport, type ImportHistoryRecord } from '@/lib/firestoreService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { History, Undo2, FileText, Calendar, ClipboardList, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface Props {
  /** Filter by import type: 'referee_schedule' | 'manager_games' | undefined (all) */
  importType?: string;
}

export const ImportHistoryPanel = ({ importType }: Props) => {
  const { user } = useAuth();
  const { fetchData } = useData();
  const [history, setHistory] = useState<ImportHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [undoingId, setUndoingId] = useState<string | null>(null);
  const [confirmUndoId, setConfirmUndoId] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await fetchImportHistory(user.id);
    if (data) {
      const filtered = importType ? data.filter(h => h.importType === importType) : data;
      setHistory(filtered);
    }
    setLoading(false);
  }, [user, importType]);

  useEffect(() => {
    if (expanded) loadHistory();
  }, [expanded, loadHistory]);

  const handleUndo = async () => {
    if (!user || !confirmUndoId) return;
    setUndoingId(confirmUndoId);
    setConfirmUndoId(null);
    const { error } = await undoImport(user, confirmUndoId);
    if (error) {
      toast({ title: 'Undo Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Import Undone', description: 'All records from this import have been removed.' });
      setHistory(prev => prev.filter(h => h.id !== undoingId));
      fetchData(false);
    }
    setUndoingId(null);
  };

  const formatDate = (dateStr: string) => {
    try { return format(parseISO(dateStr), 'MMM d, yyyy h:mm a'); } catch { return dateStr; }
  };

  if (!user) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors py-1"
          data-testid="import-history-toggle"
        >
          <History className="h-4 w-4" />
          <span className="font-medium">Import History</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-sm text-slate-400 py-3 pl-6">No imports yet.</p>
              ) : (
                <div className="space-y-2 mt-2">
                  {history.map(record => (
                    <Card key={record.id} className="border-slate-200 shadow-none" data-testid={`import-history-item-${record.id}`}>
                      <CardContent className="p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-1.5 rounded-lg shrink-0 ${record.importType === 'referee_schedule' ? 'bg-purple-50' : 'bg-blue-50'}`}>
                            {record.importType === 'referee_schedule'
                              ? <ClipboardList className="h-4 w-4 text-purple-500" />
                              : <Calendar className="h-4 w-4 text-brand-blue" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-800 truncate">{record.fileName}</span>
                              <Badge variant="outline" className="text-[10px] border-slate-200 shrink-0">
                                {record.importType === 'referee_schedule' ? 'Schedule' : 'Games'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span>{formatDate(record.createdAt)}</span>
                              {record.gamesAdded > 0 && <span>{record.gamesAdded} games</span>}
                              {record.availabilityAdded > 0 && <span>{record.availabilityAdded} avail.</span>}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0 gap-1 h-8"
                          disabled={undoingId === record.id}
                          onClick={() => setConfirmUndoId(record.id)}
                          data-testid={`import-history-undo-${record.id}`}
                        >
                          {undoingId === record.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Undo2 className="h-3.5 w-3.5" />}
                          <span className="text-xs">Undo</span>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Undo Confirmation */}
      <AlertDialog open={!!confirmUndoId} onOpenChange={() => setConfirmUndoId(null)}>
        <AlertDialogContent data-testid="import-undo-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">Undo Import?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              This will permanently delete all records created by this import. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-300 text-slate-700" data-testid="import-undo-cancel-btn">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUndo}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="import-undo-confirm-btn"
            >
              Undo Import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
