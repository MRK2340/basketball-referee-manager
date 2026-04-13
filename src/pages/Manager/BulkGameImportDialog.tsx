import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Trophy,
  Loader2, ArrowRight, X, FileText, Plus, Calendar as CalendarIcon,
} from 'lucide-react';
import { parseManagerGameFile, type ParsedGameRow } from '@/lib/scheduleImportParsers';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { batchImportManagerGames, addTournament as addTournamentRecord } from '@/lib/firestoreService';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

type Step = 'upload' | 'tournament' | 'preview' | 'importing' | 'done';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BulkGameImportDialog = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const { tournaments, fetchData } = useData();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedGameRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<{ added: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Tournament selection
  const [tournamentId, setTournamentId] = useState('');
  const [creatingNew, setCreatingNew] = useState(false);
  const [newTournament, setNewTournament] = useState({ name: '', location: '', courts: '', from: undefined as Date | undefined, to: undefined as Date | undefined });

  const reset = useCallback(() => {
    setStep('upload');
    setFile(null);
    setRows([]);
    setSelected(new Set());
    setErrors([]);
    setResult(null);
    setTournamentId('');
    setCreatingNew(false);
    setNewTournament({ name: '', location: '', courts: '', from: undefined, to: undefined });
  }, []);

  const handleClose = useCallback((open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  }, [onOpenChange, reset]);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setErrors([]);
    const result = await parseManagerGameFile(f);
    if (result.errors.length > 0) {
      setErrors(result.errors);
      return;
    }
    setRows(result.rows);
    setSelected(new Set(result.rows.map((_, i) => i)));
    setStep('tournament');
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const toggleRow = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((_, i) => i)));
  };

  const selectedRows = useMemo(() => rows.filter((_, i) => selected.has(i)), [rows, selected]);

  const canProceedToPreview = creatingNew
    ? (newTournament.name && newTournament.location && newTournament.from && newTournament.to && newTournament.courts)
    : tournamentId;

  const handleProceedToPreview = () => {
    if (canProceedToPreview) setStep('preview');
  };

  const handleImport = async () => {
    if (!user) return;
    setStep('importing');

    let targetTournamentId = tournamentId;

    // Create new tournament if needed
    if (creatingNew) {
      const { error } = await addTournamentRecord(user, {
        name: newTournament.name,
        startDate: format(newTournament.from!, 'yyyy-MM-dd'),
        endDate: format(newTournament.to!, 'yyyy-MM-dd'),
        location: newTournament.location,
        numberOfCourts: parseInt(newTournament.courts, 10) || 1,
      });
      if (error) {
        toast({ title: 'Failed to create tournament', description: error.message, variant: 'destructive' });
        setStep('tournament');
        return;
      }
      // Query Firestore directly to get the new tournament ID
      const { getDocs, query: fsQuery, collection: fsCollection, where: fsWhere } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      const snap = await getDocs(fsQuery(
        fsCollection(db, 'tournaments'),
        fsWhere('manager_id', '==', user.id),
        fsWhere('name', '==', newTournament.name),
      ));
      if (snap.empty) {
        toast({ title: 'Error', description: 'Tournament created but could not be found. Please try again.', variant: 'destructive' });
        setStep('tournament');
        return;
      }
      targetTournamentId = snap.docs[0].id;
      toast({ title: 'Tournament Created', description: `${newTournament.name} has been created.` });
    }

    const gamesToImport = selectedRows.map(r => ({
      homeTeam: r.homeTeam,
      awayTeam: r.awayTeam,
      date: r.date,
      time: r.time,
      venue: r.venue,
      division: r.division,
      level: r.level,
      payment: r.payment,
    }));

    const { data, error } = await batchImportManagerGames(user, targetTournamentId, gamesToImport);
    if (error) {
      toast({ title: 'Import Failed', description: error.message, variant: 'destructive' });
      setStep('preview');
    } else if (data) {
      setResult(data);
      setStep('done');
      fetchData(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-white border-slate-200 text-slate-900 max-h-[85vh] flex flex-col" data-testid="bulk-game-import-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-brand-blue" />
            Bulk Game Import
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Upload a CSV or Excel file with tournament bracket data.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* ── STEP 1: Upload ──────────────────────────── */}
          {step === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
                  dragOver ? 'border-brand-blue bg-blue-50' : 'border-slate-300 hover:border-brand-blue/50'
                }`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => document.getElementById('bulk-game-file-input')?.click()}
                data-testid="bulk-game-import-dropzone"
              >
                <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-700 font-semibold mb-1">Drop your bracket file here</p>
                <p className="text-slate-500 text-sm">or click to browse</p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Badge variant="outline" className="border-slate-300 text-slate-500 text-xs gap-1">
                    <FileText className="h-3 w-3" /> CSV
                  </Badge>
                  <Badge variant="outline" className="border-slate-300 text-slate-500 text-xs gap-1">
                    <FileSpreadsheet className="h-3 w-3" /> Excel
                  </Badge>
                </div>
                <input
                  id="bulk-game-file-input"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={onFileInput}
                  data-testid="bulk-game-import-file-input"
                />
              </div>

              {errors.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <div className="text-sm text-red-700">
                      {errors.map((e, i) => <p key={i}>{e}</p>)}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
                <p className="text-sm text-blue-800 font-medium mb-1">Expected columns:</p>
                <p className="text-xs text-blue-600">Date, Time, Home Team, Away Team, Venue, Division, Level, Payment/Fee, Court</p>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Tournament Selection ────────────── */}
          {step === 'tournament' && (
            <motion.div key="tournament" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="text-xs border-slate-300">{file?.name} — {rows.length} games</Badge>
                <Button variant="ghost" size="sm" onClick={reset} className="text-slate-500 h-8 text-xs">
                  <X className="h-3 w-3 mr-1" /> Change file
                </Button>
              </div>

              <p className="text-sm text-slate-700 font-medium mb-3">Where should these games go?</p>

              {!creatingNew ? (
                <div className="space-y-3">
                  <Select value={tournamentId} onValueChange={(v) => { setTournamentId(v); setCreatingNew(false); }}>
                    <SelectTrigger className="border-slate-200" data-testid="bulk-import-tournament-select">
                      <SelectValue placeholder="Select an existing tournament" />
                    </SelectTrigger>
                    <SelectContent>
                      {tournaments.map((t: { id: string; name: string }) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs text-slate-400 uppercase">or</span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-dashed border-brand-blue text-brand-blue hover:bg-blue-50 gap-2"
                    onClick={() => setCreatingNew(true)}
                    data-testid="bulk-import-new-tournament-btn"
                  >
                    <Plus className="h-4 w-4" /> Create New Tournament
                  </Button>
                </div>
              ) : (
                <Card className="border-slate-200">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-slate-800">New Tournament</p>
                      <Button variant="ghost" size="sm" onClick={() => setCreatingNew(false)} className="h-7 text-xs text-slate-500">
                        Use existing
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs text-slate-600">Name *</Label>
                        <Input
                          value={newTournament.name}
                          onChange={e => setNewTournament(p => ({ ...p, name: e.target.value }))}
                          placeholder="e.g. Spring Classic 2026"
                          className="border-slate-200"
                          data-testid="bulk-import-new-tournament-name"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-600">Location *</Label>
                        <Input
                          value={newTournament.location}
                          onChange={e => setNewTournament(p => ({ ...p, location: e.target.value }))}
                          placeholder="e.g. Atlanta Sports Center"
                          className="border-slate-200"
                          data-testid="bulk-import-new-tournament-location"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-600">Courts *</Label>
                        <Input
                          type="number"
                          value={newTournament.courts}
                          onChange={e => setNewTournament(p => ({ ...p, courts: e.target.value }))}
                          placeholder="4"
                          className="border-slate-200"
                          data-testid="bulk-import-new-tournament-courts"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs text-slate-600">Date Range *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal border-slate-200",
                                !newTournament.from && "text-muted-foreground"
                              )}
                              data-testid="bulk-import-new-tournament-date-btn"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {newTournament.from ? (
                                newTournament.to
                                  ? `${format(newTournament.from, 'LLL dd')} - ${format(newTournament.to, 'LLL dd, y')}`
                                  : format(newTournament.from, 'LLL dd, y')
                              ) : 'Pick dates'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-white border-slate-200" align="start">
                            <Calendar
                              mode="range"
                              selected={{ from: newTournament.from, to: newTournament.to }}
                              onSelect={(range) => setNewTournament(p => ({ ...p, from: range?.from, to: range?.to }))}
                              numberOfMonths={2}
                              className="text-slate-900"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <DialogFooter className="mt-4 gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setStep('upload')} className="border-slate-300 text-slate-700">
                  Back
                </Button>
                <Button
                  onClick={handleProceedToPreview}
                  disabled={!canProceedToPreview}
                  className="basketball-gradient text-white hover:opacity-90 gap-2"
                  data-testid="bulk-import-proceed-btn"
                >
                  Review Games <ArrowRight className="h-4 w-4" />
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* ── STEP 3: Preview ────────────────────────── */}
          {step === 'preview' && (
            <motion.div key="preview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex flex-col min-h-0">
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="outline" className="text-xs border-slate-300">
                  <Trophy className="h-3 w-3 mr-1" />
                  {creatingNew ? newTournament.name : tournaments.find((t: { id: string }) => t.id === tournamentId)?.name}
                </Badge>
                <span className="text-sm text-slate-500">{selectedRows.length} games selected</span>
              </div>

              <ScrollArea className="flex-1 max-h-[300px] border rounded-lg border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selected.size === rows.length}
                          onCheckedChange={toggleAll}
                          data-testid="bulk-import-select-all"
                        />
                      </TableHead>
                      <TableHead className="text-slate-700 text-xs">Date</TableHead>
                      <TableHead className="text-slate-700 text-xs">Time</TableHead>
                      <TableHead className="text-slate-700 text-xs">Home</TableHead>
                      <TableHead className="text-slate-700 text-xs">Away</TableHead>
                      <TableHead className="text-slate-700 text-xs">Venue</TableHead>
                      <TableHead className="text-slate-700 text-xs">Division</TableHead>
                      <TableHead className="text-slate-700 text-xs">$</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow key={i} className={selected.has(i) ? '' : 'opacity-40'}>
                        <TableCell>
                          <Checkbox
                            checked={selected.has(i)}
                            onCheckedChange={() => toggleRow(i)}
                            data-testid={`bulk-import-row-check-${i}`}
                          />
                        </TableCell>
                        <TableCell className="text-xs font-medium">{row.date}</TableCell>
                        <TableCell className="text-xs">{row.time || '—'}</TableCell>
                        <TableCell className="text-xs">{row.homeTeam || '—'}</TableCell>
                        <TableCell className="text-xs">{row.awayTeam || '—'}</TableCell>
                        <TableCell className="text-xs truncate max-w-[100px]">{row.venue || '—'}</TableCell>
                        <TableCell className="text-xs">{row.division || '—'}</TableCell>
                        <TableCell className="text-xs">{row.payment ? `$${row.payment}` : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <DialogFooter className="mt-4 gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setStep('tournament')} className="border-slate-300 text-slate-700">
                  Back
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={selected.size === 0}
                  className="basketball-gradient text-white hover:opacity-90 gap-2"
                  data-testid="bulk-import-confirm-btn"
                >
                  Import {selectedRows.length} games
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* ── STEP 4: Importing ──────────────────────── */}
          {step === 'importing' && (
            <motion.div key="importing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-10">
              <Loader2 className="h-10 w-10 text-brand-blue animate-spin mb-4" />
              <p className="text-slate-700 font-semibold">Importing games...</p>
              <p className="text-slate-500 text-sm mt-1">Creating {selectedRows.length} games in Firestore</p>
            </motion.div>
          )}

          {/* ── STEP 5: Done ───────────────────────────── */}
          {step === 'done' && result && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-8">
              <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
              <p className="text-slate-900 font-bold text-lg mb-2">Import Complete</p>
              <p className="text-2xl font-bold text-brand-blue mb-1">{result.added}</p>
              <p className="text-sm text-slate-500 mb-6">games created and ready for referee assignment</p>
              <Button onClick={() => handleClose(false)} className="basketball-gradient text-white hover:opacity-90" data-testid="bulk-import-done-btn">
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
