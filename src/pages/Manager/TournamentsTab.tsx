import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, FileSpreadsheet, Loader2, Archive, ArchiveRestore, CalendarRange } from 'lucide-react';
import TournamentFormDialog from '@/pages/Manager/TournamentFormDialog';
import { BulkGameImportDialog } from '@/pages/Manager/BulkGameImportDialog';
import { LeagueImportDialog } from '@/pages/Manager/LeagueImportDialog';
import { ImportHistoryPanel } from '@/components/ImportHistoryPanel';

const TournamentsTab = ({ tournaments, addTournament, updateTournament, deleteTournament, archiveTournament, hasMoreTournaments, loadMoreTournaments, refreshing }) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTournament, setDeletingTournament] = useState(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archivingTournament, setArchivingTournament] = useState(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [leagueImportOpen, setLeagueImportOpen] = useState(false);

  const activeTournaments = useMemo(() => tournaments.filter(t => !t.archived), [tournaments]);
  const archivedTournaments = useMemo(() => tournaments.filter(t => t.archived), [tournaments]);

  const handleAddTournament = (data) => { addTournament(data); };
  const handleEditTournament = (data) => { if (editingTournament) updateTournament(editingTournament.id, data); };
  const openEditDialog = (tournament) => { setEditingTournament(tournament); setEditDialogOpen(true); };
  const openDeleteDialog = (tournament) => { setDeletingTournament(tournament); setDeleteDialogOpen(true); };
  const handleConfirmDelete = () => { if (deletingTournament) deleteTournament(deletingTournament.id); setDeleteDialogOpen(false); setDeletingTournament(null); };

  const openArchiveDialog = (tournament) => { setArchivingTournament(tournament); setArchiveDialogOpen(true); };
  const handleConfirmArchive = () => {
    if (archivingTournament) {
      const willArchive = !archivingTournament.archived;
      archiveTournament(archivingTournament.id, willArchive);
    }
    setArchiveDialogOpen(false);
    setArchivingTournament(null);
  };

  const renderTable = (items, isArchived = false) => (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 border-b-slate-200 hover:bg-slate-50">
            <TableHead className="text-slate-900 font-bold">Name</TableHead>
            <TableHead className="text-slate-900 font-bold">Dates</TableHead>
            <TableHead className="text-slate-900 font-bold">Location</TableHead>
            <TableHead className="text-slate-900 font-bold text-center">Courts</TableHead>
            <TableHead className="text-slate-900 font-bold text-center">Games</TableHead>
            <TableHead className="text-right text-slate-900 font-bold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                {isArchived ? 'No archived tournaments.' : 'No active tournaments. Create one to get started.'}
              </TableCell>
            </TableRow>
          ) : items.map((t) => (
            <TableRow
              key={t.id}
              className={`border-b-slate-100 hover:bg-slate-50/80 transition-colors ${isArchived ? 'opacity-70' : ''}`}
              data-testid={`manager-tournament-row-${t.id}`}
            >
              <TableCell className="font-bold text-slate-900">
                {t.name}
                {isArchived && <Badge variant="secondary" className="ml-2 text-xs">Archived</Badge>}
              </TableCell>
              <TableCell className="text-slate-600 font-medium">
                {format(new Date(t.startDate), "MMM dd")} - {format(new Date(t.endDate), "MMM dd, yyyy")}
              </TableCell>
              <TableCell className="text-slate-600 font-medium">{t.location}</TableCell>
              <TableCell className="text-center text-slate-700 font-semibold">{t.numberOfCourts || 'N/A'}</TableCell>
              <TableCell className="text-center text-slate-700 font-semibold">{t.games}</TableCell>
              <TableCell className="text-right">
                {!isArchived && (
                  <>
                    <Button variant="ghost" size="icon" data-testid={`manager-edit-tournament-${t.id}`} onClick={() => openEditDialog(t)} className="hover:text-brand-blue hover:bg-blue-50 text-slate-500" title="Edit">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" data-testid={`manager-archive-tournament-${t.id}`} onClick={() => openArchiveDialog(t)} className="hover:text-amber-600 hover:bg-amber-50 text-slate-500" title="Archive">
                      <Archive className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {isArchived && (
                  <Button variant="ghost" size="icon" data-testid={`manager-restore-tournament-${t.id}`} onClick={() => openArchiveDialog(t)} className="hover:text-green-600 hover:bg-green-50 text-slate-500" title="Restore">
                    <ArchiveRestore className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" data-testid={`manager-delete-tournament-${t.id}`} onClick={() => openDeleteDialog(t)} className="hover:text-red-600 hover:bg-red-50 text-slate-500" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <TournamentFormDialog open={addDialogOpen} setOpen={setAddDialogOpen} onSubmit={handleAddTournament} />
      <TournamentFormDialog open={editDialogOpen} setOpen={setEditDialogOpen} tournament={editingTournament} onSubmit={handleEditTournament} />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="delete-tournament-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">Delete Tournament?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              This will permanently delete <strong>{deletingTournament?.name}</strong> and all of its associated games, assignments, and reports. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="delete-tournament-cancel-button" className="border-slate-300 text-slate-700 hover:bg-slate-100">Cancel</AlertDialogCancel>
            <AlertDialogAction data-testid="delete-tournament-confirm-button" onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete Tournament</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive/Restore Confirmation */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent data-testid="archive-tournament-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">
              {archivingTournament?.archived ? 'Restore Tournament?' : 'Archive Tournament?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              {archivingTournament?.archived
                ? <>Restore <strong>{archivingTournament?.name}</strong> to your active tournaments list.</>
                : <>Move <strong>{archivingTournament?.name}</strong> to the archive. Games and data will be preserved. You can restore it later.</>
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-300 text-slate-700 hover:bg-slate-100">Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="archive-tournament-confirm-button"
              onClick={handleConfirmArchive}
              className={archivingTournament?.archived ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}
            >
              {archivingTournament?.archived ? 'Restore' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="glass-effect border-slate-200 shadow-xs" data-testid="manager-tournaments-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-slate-900">Tournaments</CardTitle>
              <CardDescription className="text-slate-600">Create and manage your league's tournaments.</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button className="basketball-gradient hover:opacity-90 text-white shadow-md" data-testid="manager-add-tournament-button" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Tournament
              </Button>
              <Button variant="outline" className="border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white shadow-sm gap-2" data-testid="manager-bulk-import-button" onClick={() => setBulkImportOpen(true)}>
                <FileSpreadsheet className="h-4 w-4" /> Bulk Import Games
              </Button>
              <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-600 hover:text-white shadow-sm gap-2" data-testid="manager-league-import-button" onClick={() => setLeagueImportOpen(true)}>
                <CalendarRange className="h-4 w-4" /> Import League Schedule
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active">
            <TabsList className="mb-4">
              <TabsTrigger value="active" data-testid="tournaments-active-tab">
                Active
                {activeTournaments.length > 0 && <Badge variant="secondary" className="ml-1.5 text-xs">{activeTournaments.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="archived" data-testid="tournaments-archived-tab">
                Archived
                {archivedTournaments.length > 0 && <Badge variant="secondary" className="ml-1.5 text-xs">{archivedTournaments.length}</Badge>}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="active">{renderTable(activeTournaments, false)}</TabsContent>
            <TabsContent value="archived">{renderTable(archivedTournaments, true)}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {hasMoreTournaments && (
        <div className="flex justify-center mt-3">
          <Button variant="outline" size="sm" onClick={loadMoreTournaments} disabled={refreshing} data-testid="load-more-tournaments-btn">
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Load more tournaments
          </Button>
        </div>
      )}

      <BulkGameImportDialog open={bulkImportOpen} onOpenChange={setBulkImportOpen} />
      <LeagueImportDialog open={leagueImportOpen} onOpenChange={setLeagueImportOpen} />
      <div className="mt-4">
        <ImportHistoryPanel importType="manager_games" />
      </div>
    </>
  );
};

export default TournamentsTab;
