import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Plus, Pencil, Trash2, MapPin, Clock, DollarSign, Building2,
  TrendingUp, Trophy, Search, X, ClipboardList, Download, FileText, Sheet, FileUp,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { exportToCSV, exportToPDF } from '@/lib/exportIndependentGames';
import { ScheduleImportDialog } from '@/pages/Games/ScheduleImportDialog';

const GAME_TYPES = [
  { value: 'league', label: 'League Game', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'tournament', label: 'Tournament', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'scrimmage', label: 'Scrimmage', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'playoff', label: 'Playoff', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'other', label: 'Other', color: 'bg-slate-100 text-slate-600 border-slate-200' },
];

const typeInfo = (type) => GAME_TYPES.find(t => t.value === type) || GAME_TYPES[4];

const EMPTY_FORM = { date: '', time: '', location: '', organization: '', game_type: 'league', fee: '', notes: '' };

export const IndependentGamesTab = () => {
  const { independentGames, independentGameActions } = useData();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [exportYear, setExportYear] = useState(String(new Date().getFullYear()));
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const currentYear = new Date().getFullYear();

  // Build list of years that have games, plus current year
  const availableYears = useMemo(() => {
    const years = new Set([String(currentYear)]);
    (independentGames || []).forEach(g => {
      if (g.date) years.add(g.date.slice(0, 4));
    });
    return [...years].sort((a, b) => b - a);
  }, [independentGames, currentYear]);

  const gamesForExportYear = useMemo(() => {
    return (independentGames || []).filter(g => g.date?.startsWith(exportYear));
  }, [independentGames, exportYear]);

  const handleExportCSV = () => {
    exportToCSV(gamesForExportYear, exportYear, user?.name || 'Referee');
  };

  const handleExportPDF = () => {
    exportToPDF(gamesForExportYear, exportYear, user?.name || 'Referee');
  };

  const yearStats = useMemo(() => {
    const thisYear = (independentGames || []).filter(g => g.date?.startsWith(String(currentYear)));
    const totalEarnings = thisYear.reduce((sum, g) => sum + (Number(g.fee) || 0), 0);
    const byType = thisYear.reduce((acc, g) => {
      acc[g.game_type] = (acc[g.game_type] || 0) + 1;
      return acc;
    }, {});
    return { count: thisYear.length, earnings: totalEarnings, byType };
  }, [independentGames, currentYear]);

  const filtered = useMemo(() => {
    return (independentGames || [])
      .filter(g => typeFilter === 'all' || g.game_type === typeFilter)
      .filter(g => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
          g.organization?.toLowerCase().includes(q) ||
          g.location?.toLowerCase().includes(q) ||
          g.notes?.toLowerCase().includes(q)
        );
      });
  }, [independentGames, typeFilter, searchTerm]);

  const openAddDialog = () => {
    setEditingGame(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (game) => {
    setEditingGame(game);
    setForm({
      date: game.date || '',
      time: game.time || '',
      location: game.location || '',
      organization: game.organization || '',
      game_type: game.game_type || 'league',
      fee: game.fee !== undefined ? String(game.fee) : '',
      notes: game.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.date || !form.organization) return;
    if (editingGame) {
      independentGameActions.updateIndependentGame(editingGame.id, form);
    } else {
      independentGameActions.addIndependentGame(form);
    }
    setDialogOpen(false);
    setForm(EMPTY_FORM);
    setEditingGame(null);
  };

  const handleDelete = (id) => {
    independentGameActions.deleteIndependentGame(id);
    setConfirmDeleteId(null);
  };

  const formatDate = (dateStr) => {
    try { return format(parseISO(dateStr), 'MMM d, yyyy'); } catch { return dateStr; }
  };

  const isUpcoming = (dateStr) => {
    try { return parseISO(dateStr) >= new Date(new Date().setHours(0,0,0,0)); } catch { return false; }
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Year-End Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: `Games in ${currentYear}`, value: yearStats.count, icon: Trophy, color: 'text-brand-blue', bg: 'bg-blue-50' },
          { label: `Earnings in ${currentYear}`, value: `$${yearStats.earnings.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
          {
            label: 'Top Type',
            value: Object.keys(yearStats.byType).length > 0
              ? typeInfo(Object.entries(yearStats.byType).sort((a,b) => b[1]-a[1])[0][0]).label
              : '—',
            icon: TrendingUp, color: 'text-brand-orange', bg: 'bg-orange-50'
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              data-testid={`ind-stat-${stat.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
            >
              <Card className="glass-effect border-slate-200 shadow-xs">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs font-medium">{stat.label}</p>
                      <p className="text-slate-900 text-xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            data-testid="ind-search-input"
            placeholder="Search by org or location…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 border-slate-200"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-slate-400 hover:text-slate-700" />
            </button>
          )}
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter} data-testid="ind-type-filter">
          <SelectTrigger className="w-full sm:w-44 border-slate-200" data-testid="ind-type-filter-trigger">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {GAME_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          className="border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white shrink-0 gap-2"
          data-testid="ind-import-schedule-btn"
          onClick={() => setImportDialogOpen(true)}
        >
          <FileUp className="h-4 w-4" />
          Import Schedule
        </Button>
        <Button
          className="basketball-gradient text-white hover:opacity-90 shrink-0"
          data-testid="ind-log-game-btn"
          onClick={openAddDialog}
        >
          <Plus className="h-4 w-4 mr-2" />
          Log Game
        </Button>
      </div>

      {/* Export Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-100"
        data-testid="ind-export-banner"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-blue/10">
            <Download className="h-4 w-4 text-brand-blue" />
          </div>
          <div>
            <p className="text-slate-900 font-semibold text-sm">Year-End Export</p>
            <p className="text-slate-500 text-xs">Download your game log for taxes or records</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={exportYear} onValueChange={setExportYear}>
            <SelectTrigger className="w-24 border-slate-200 bg-white text-sm h-9" data-testid="ind-export-year-trigger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(y => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white gap-2 h-9 text-sm shrink-0"
                data-testid="ind-export-btn"
                disabled={gamesForExportYear.length === 0}
              >
                <Download className="h-4 w-4" />
                Export {exportYear}
                {gamesForExportYear.length === 0 && ' (no games)'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={handleExportCSV}
                className="cursor-pointer gap-2"
                data-testid="ind-export-csv-btn"
              >
                <Sheet className="h-4 w-4 text-green-600" />
                <span>Download CSV</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportPDF}
                className="cursor-pointer gap-2"
                data-testid="ind-export-pdf-btn"
              >
                <FileText className="h-4 w-4 text-red-500" />
                <span>Download PDF</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* Games List */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-testid="ind-empty-state"
          >
            <Card className="glass-effect border-slate-200 border-dashed shadow-xs">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <ClipboardList className="h-14 w-14 text-slate-300 mb-4" />
                <h3 className="text-slate-700 font-semibold text-lg mb-1">
                  {searchTerm || typeFilter !== 'all' ? 'No games match your filter' : 'No independent games logged yet'}
                </h3>
                <p className="text-slate-500 text-sm mb-6 max-w-xs">
                  {searchTerm || typeFilter !== 'all'
                    ? 'Try adjusting your search or filter.'
                    : 'Start tracking games you referee outside of this platform — leagues, scrimmages, and more.'}
                </p>
                {!searchTerm && typeFilter === 'all' && (
                  <Button className="basketball-gradient text-white hover:opacity-90" onClick={openAddDialog} data-testid="ind-empty-log-btn">
                    <Plus className="h-4 w-4 mr-2" />
                    Log Your First Game
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          filtered.map((game, index) => {
            const info = typeInfo(game.game_type);
            const upcoming = isUpcoming(game.date);
            return (
              <motion.div
                key={game.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.04 }}
                data-testid={`ind-game-card-${game.id}`}
              >
                <Card className={`glass-effect border-slate-200 shadow-xs hover:shadow-md transition-shadow ${upcoming ? 'ring-1 ring-brand-blue/30' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Top row: org + type badge */}
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="font-bold text-slate-900 text-base truncate">
                            {game.organization || 'Unnamed Organization'}
                          </span>
                          <Badge className={`border text-xs shrink-0 ${info.color}`}>
                            {info.label}
                          </Badge>
                          {upcoming && (
                            <Badge className="bg-blue-50 text-brand-blue border-blue-200 text-xs shrink-0">
                              Upcoming
                            </Badge>
                          )}
                        </div>
                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-brand-orange shrink-0" />
                            {formatDate(game.date)}{game.time ? ` · ${game.time}` : ''}
                          </span>
                          {game.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-brand-blue shrink-0" />
                              <span className="truncate">{game.location}</span>
                            </span>
                          )}
                        </div>
                        {game.notes && (
                          <p className="text-slate-500 text-xs mt-1.5 italic">{game.notes}</p>
                        )}
                      </div>

                      {/* Right: fee + actions */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-green-600 font-bold text-lg">
                          ${Number(game.fee).toLocaleString()}
                        </span>
                        <div className="flex gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-brand-blue hover:bg-blue-50"
                            data-testid={`ind-edit-btn-${game.id}`}
                            onClick={() => openEditDialog(game)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                            data-testid={`ind-delete-btn-${game.id}`}
                            onClick={() => setConfirmDeleteId(game.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </AnimatePresence>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-900" data-testid="ind-game-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-brand-blue" />
              {editingGame ? 'Edit Independent Game' : 'Log Independent Game'}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Record a game you refereed outside of this platform.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ind-date" className="text-slate-700 font-medium">Date *</Label>
              <Input
                id="ind-date"
                type="date"
                data-testid="ind-form-date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ind-time" className="text-slate-700 font-medium">Time</Label>
              <Input
                id="ind-time"
                type="time"
                data-testid="ind-form-time"
                value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="border-slate-200"
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="ind-org" className="text-slate-700 font-medium">Organization / League *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="ind-org"
                  placeholder="e.g. Atlanta Rec League, Fulton County AAU"
                  data-testid="ind-form-org"
                  value={form.organization}
                  onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                  className="pl-9 border-slate-200"
                />
              </div>
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="ind-location" className="text-slate-700 font-medium">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="ind-location"
                  placeholder="Venue or address"
                  data-testid="ind-form-location"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="pl-9 border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-700 font-medium">Game Type</Label>
              <Select
                value={form.game_type}
                onValueChange={v => setForm(f => ({ ...f, game_type: v }))}
              >
                <SelectTrigger className="border-slate-200" data-testid="ind-form-type-trigger">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GAME_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ind-fee" className="text-slate-700 font-medium">Fee Earned ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="ind-fee"
                  type="number"
                  min="0"
                  step="5"
                  placeholder="0"
                  data-testid="ind-form-fee"
                  value={form.fee}
                  onChange={e => setForm(f => ({ ...f, fee: e.target.value }))}
                  className="pl-9 border-slate-200"
                />
              </div>
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="ind-notes" className="text-slate-700 font-medium">Notes <span className="text-slate-400 font-normal">(optional)</span></Label>
              <Textarea
                id="ind-notes"
                placeholder="Any extra details — division, partner refs, etc."
                data-testid="ind-form-notes"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="border-slate-200 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-testid="ind-dialog-cancel-btn"
              className="border-slate-300 text-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.date || !form.organization}
              data-testid="ind-dialog-save-btn"
              className="basketball-gradient text-white hover:opacity-90"
            >
              {editingGame ? 'Save Changes' : 'Log Game'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <DialogContent className="sm:max-w-sm bg-white border-slate-200 text-slate-900" data-testid="ind-delete-dialog">
          <DialogHeader>
            <DialogTitle>Remove game?</DialogTitle>
            <DialogDescription className="text-slate-500">
              This game will be permanently removed from your log. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)} data-testid="ind-delete-cancel-btn" className="border-slate-300 text-slate-700">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDelete(confirmDeleteId)}
              data-testid="ind-delete-confirm-btn"
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Import Dialog */}
      <ScheduleImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
    </div>
  );
};

export default IndependentGamesTab;
