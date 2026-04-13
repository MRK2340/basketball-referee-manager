import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Plus, Edit, Trash2, FileSpreadsheet } from 'lucide-react';
import TournamentFormDialog from '@/pages/Manager/TournamentFormDialog';
import { BulkGameImportDialog } from '@/pages/Manager/BulkGameImportDialog';

const TournamentsTab = ({ tournaments, addTournament, updateTournament, deleteTournament }) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTournament, setDeletingTournament] = useState(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  const handleAddTournament = (data) => {
    addTournament(data);
  };
  
  const handleEditTournament = (data) => {
    if (editingTournament) {
      updateTournament(editingTournament.id, data);
    }
  };

  const openEditDialog = (tournament) => {
    setEditingTournament(tournament);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (tournament) => {
    setDeletingTournament(tournament);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingTournament) {
      deleteTournament(deletingTournament.id);
    }
    setDeleteDialogOpen(false);
    setDeletingTournament(null);
  };

  return (
    <>
      <TournamentFormDialog 
        open={addDialogOpen}
        setOpen={setAddDialogOpen}
        onSubmit={handleAddTournament}
      />
      <TournamentFormDialog 
        open={editDialogOpen}
        setOpen={setEditDialogOpen}
        tournament={editingTournament}
        onSubmit={handleEditTournament}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="delete-tournament-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">Delete Tournament?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              This will permanently delete <strong>{deletingTournament?.name}</strong> and all of its associated games, assignments, and reports. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="delete-tournament-cancel-button" className="border-slate-300 text-slate-700 hover:bg-slate-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="delete-tournament-confirm-button"
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Tournament
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
            <Button className="basketball-gradient hover:opacity-90 text-white shadow-md" data-testid="manager-add-tournament-button" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Tournament
            </Button>
            <Button variant="outline" className="border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white shadow-sm ml-2 gap-2" data-testid="manager-bulk-import-button" onClick={() => setBulkImportOpen(true)}>
              <FileSpreadsheet className="h-4 w-4" /> Bulk Import Games
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
                {tournaments.map((t) => (
                  <TableRow key={t.id} className="border-b-slate-100 hover:bg-slate-50/80 transition-colors" data-testid={`manager-tournament-row-${t.id}`}>
                    <TableCell className="font-bold text-slate-900">{t.name}</TableCell>
                    <TableCell className="text-slate-600 font-medium">{format(new Date(t.startDate), "MMM dd")} - {format(new Date(t.endDate), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="text-slate-600 font-medium">{t.location}</TableCell>
                    <TableCell className="text-center text-slate-700 font-semibold">{t.numberOfCourts || 'N/A'}</TableCell>
                    <TableCell className="text-center text-slate-700 font-semibold">{t.games}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" data-testid={`manager-edit-tournament-${t.id}`} onClick={() => openEditDialog(t)} className="hover:text-brand-blue hover:bg-blue-50 text-slate-500">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" data-testid={`manager-delete-tournament-${t.id}`} onClick={() => openDeleteDialog(t)} className="hover:text-red-600 hover:bg-red-50 text-slate-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Game Import Dialog */}
      <BulkGameImportDialog open={bulkImportOpen} onOpenChange={setBulkImportOpen} />
    </>
  );
};

export default TournamentsTab;