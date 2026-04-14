import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Upload, FileText, AlertCircle, CheckCircle2, Calendar, ClipboardList,
  Loader2, ArrowRight, X, FileSpreadsheet, FileUp, Download, AlertTriangle,
} from 'lucide-react';
import { parseRefereeScheduleFile, isDateInPast, downloadRefereeTemplate, type ParsedScheduleRow } from '@/lib/scheduleImportParsers';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { batchImportRefereeSchedule, checkRefereeDuplicates } from '@/lib/firestoreService';
import { toast } from '@/components/ui/use-toast';

type Step = 'upload' | 'preview' | 'importing' | 'done';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ScheduleImportDialog = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const { fetchData } = useData();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedScheduleRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<{ gamesAdded: number; availabilityAdded: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [duplicates, setDuplicates] = useState<Set<string>>(new Set());

  const reset = useCallback(() => {
    setStep('upload');
    setFile(null);
    setRows([]);
    setSelected(new Set());
    setErrors([]);
    setResult(null);
    setDuplicates(new Set());
  }, []);

  const handleClose = useCallback((open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  }, [onOpenChange, reset]);

  const pastRows = useMemo(() => rows.filter((_, i) => selected.has(i) && isDateInPast(rows[i].date)), [rows, selected]);
  const futureRows = useMemo(() => rows.filter((_, i) => selected.has(i) && !isDateInPast(rows[i].date)), [rows, selected]);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setErrors([]);
    setDuplicates(new Set());
    const result = await parseRefereeScheduleFile(f);
    if (result.errors.length > 0) {
      setErrors(result.errors);
      return;
    }
    setRows(result.rows);
    // Check for duplicates
    if (user) {
      const { data: dupes } = await checkRefereeDuplicates(
        user.id,
        result.rows.map(r => ({ date: r.date, organization: r.organization })),
      );
      if (dupes && dupes.size > 0) {
        setDuplicates(dupes);
        // Auto-deselect duplicates
        const nonDupeSet = new Set(result.rows.map((_, i) => i).filter(i => !dupes.has(String(i))));
        setSelected(nonDupeSet);
      } else {
        setSelected(new Set(result.rows.map((_, i) => i)));
      }
    } else {
      setSelected(new Set(result.rows.map((_, i) => i)));
    }
    setStep('preview');
  }, [user]);

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

  const handleImport = async () => {
    if (!user) return;
    setStep('importing');
    const { data, error } = await batchImportRefereeSchedule(
      user,
      pastRows.map(r => ({ date: r.date, time: r.time, location: r.location, organization: r.organization, fee: r.fee, level: r.level })),
      futureRows.map(r => ({ date: r.date, time: r.time })),
      file?.name || 'unknown',
    );
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
      <DialogContent className="sm:max-w-2xl bg-white border-slate-200 text-slate-900 max-h-[85vh] flex flex-col" data-testid="schedule-import-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-brand-blue" />
            Import Schedule
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Upload a CSV, Excel, or PDF export from ArbiterSports, GameOfficials, or Assigning.net.
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
                onClick={() => document.getElementById('schedule-file-input')?.click()}
                data-testid="schedule-import-dropzone"
              >
                <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-700 font-semibold mb-1">Drop your schedule file here</p>
                <p className="text-slate-500 text-sm">or click to browse</p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Badge variant="outline" className="border-slate-300 text-slate-500 text-xs gap-1">
                    <FileText className="h-3 w-3" /> CSV
                  </Badge>
                  <Badge variant="outline" className="border-slate-300 text-slate-500 text-xs gap-1">
                    <FileSpreadsheet className="h-3 w-3" /> Excel
                  </Badge>
                  <Badge variant="outline" className="border-slate-300 text-slate-500 text-xs gap-1">
                    <FileText className="h-3 w-3" /> PDF
                  </Badge>
                </div>
                <input
                  id="schedule-file-input"
                  type="file"
                  accept=".csv,.xlsx,.xls,.pdf"
                  className="hidden"
                  onChange={onFileInput}
                  data-testid="schedule-import-file-input"
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
                <p className="text-sm text-blue-800 font-medium mb-1">Supported platforms:</p>
                <p className="text-xs text-blue-600">ArbiterSports, GameOfficials, Assigning.net — export as CSV for best results.</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full border-slate-200 text-slate-600 hover:text-brand-blue hover:border-brand-blue gap-2"
                onClick={(e) => { e.stopPropagation(); downloadRefereeTemplate(); }}
                data-testid="schedule-import-download-template"
              >
                <Download className="h-3.5 w-3.5" />
                Download CSV Template
              </Button>
            </motion.div>
          )}

          {/* ── STEP 2: Preview ────────────────────────── */}
          {step === 'preview' && (
            <motion.div key="preview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs border-slate-300">{file?.name}</Badge>
                  <span className="text-sm text-slate-500">{rows.length} rows found</span>
                </div>
                <Button variant="ghost" size="sm" onClick={reset} className="text-slate-500 h-8 text-xs">
                  <X className="h-3 w-3 mr-1" /> Change file
                </Button>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Card className="border-slate-200 shadow-none">
                  <CardContent className="p-3 flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-xs text-slate-500">Past → Game Log</p>
                      <p className="text-sm font-bold text-slate-900">{pastRows.length} games</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-none">
                  <CardContent className="p-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-brand-blue" />
                    <div>
                      <p className="text-xs text-slate-500">Future → Availability</p>
                      <p className="text-sm font-bold text-slate-900">{futureRows.length} dates</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Duplicate warning */}
              {duplicates.size > 0 && (
                <div className="mb-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2" data-testid="schedule-import-duplicate-warning">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-800">
                    <span className="font-semibold">{duplicates.size} duplicate{duplicates.size > 1 ? 's' : ''} detected</span> — matching games already in your log were auto-deselected.
                  </div>
                </div>
              )}

              {/* Table */}
              <ScrollArea className="flex-1 max-h-[300px] border rounded-lg border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selected.size === rows.length}
                          onCheckedChange={toggleAll}
                          data-testid="schedule-import-select-all"
                        />
                      </TableHead>
                      <TableHead className="text-slate-700 text-xs">Date</TableHead>
                      <TableHead className="text-slate-700 text-xs">Time</TableHead>
                      <TableHead className="text-slate-700 text-xs">Teams</TableHead>
                      <TableHead className="text-slate-700 text-xs">Location</TableHead>
                      <TableHead className="text-slate-700 text-xs">Fee</TableHead>
                      <TableHead className="text-slate-700 text-xs">Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => {
                      const past = isDateInPast(row.date);
                      const isDupe = duplicates.has(String(i));
                      return (
                        <TableRow key={i} className={`${selected.has(i) ? '' : 'opacity-40'} ${isDupe ? 'bg-amber-50/50' : ''}`}>
                          <TableCell>
                            <Checkbox
                              checked={selected.has(i)}
                              onCheckedChange={() => toggleRow(i)}
                              data-testid={`schedule-import-row-check-${i}`}
                            />
                          </TableCell>
                          <TableCell className="text-xs font-medium">{row.date}</TableCell>
                          <TableCell className="text-xs">{row.time || '—'}</TableCell>
                          <TableCell className="text-xs">
                            {row.homeTeam && row.awayTeam
                              ? `${row.homeTeam} vs ${row.awayTeam}`
                              : row.homeTeam || row.organization || '—'}
                          </TableCell>
                          <TableCell className="text-xs truncate max-w-[120px]">{row.location || '—'}</TableCell>
                          <TableCell className="text-xs">{row.fee ? `$${row.fee}` : '—'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className={`text-[10px] ${past ? 'border-purple-200 text-purple-600' : 'border-blue-200 text-blue-600'}`}>
                                {past ? 'Game Log' : 'Availability'}
                              </Badge>
                              {isDupe && (
                                <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600" data-testid={`schedule-import-dupe-badge-${i}`}>
                                  Duplicate
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>

              <DialogFooter className="mt-4 gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => handleClose(false)} className="border-slate-300 text-slate-700" data-testid="schedule-import-cancel-btn">
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={selected.size === 0}
                  className="basketball-gradient text-white hover:opacity-90 gap-2"
                  data-testid="schedule-import-confirm-btn"
                >
                  Import {selected.size} rows
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* ── STEP 3: Importing ──────────────────────── */}
          {step === 'importing' && (
            <motion.div key="importing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-10">
              <Loader2 className="h-10 w-10 text-brand-blue animate-spin mb-4" />
              <p className="text-slate-700 font-semibold">Importing your schedule...</p>
              <p className="text-slate-500 text-sm mt-1">Writing {selected.size} records to Firestore</p>
            </motion.div>
          )}

          {/* ── STEP 4: Done ───────────────────────────── */}
          {step === 'done' && result && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-8">
              <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
              <p className="text-slate-900 font-bold text-lg mb-2">Import Complete</p>
              <div className="flex gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{result.gamesAdded}</p>
                  <p className="text-xs text-slate-500">games logged</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-brand-blue">{result.availabilityAdded}</p>
                  <p className="text-xs text-slate-500">availability dates</p>
                </div>
              </div>
              <Button onClick={() => handleClose(false)} className="basketball-gradient text-white hover:opacity-90" data-testid="schedule-import-done-btn">
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
