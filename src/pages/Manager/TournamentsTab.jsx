import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import TournamentFormDialog from '@/pages/Manager/TournamentFormDialog';

const TournamentsTab = ({ tournaments, addTournament, updateTournament }) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);

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
  
  const handleFeatureClick = (feature) => {
    toast({
      title: "🚧 Feature Coming Soon!",
      description: "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
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
      <Card className="glass-effect border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-slate-900">Tournaments</CardTitle>
              <CardDescription className="text-slate-600">Create and manage your league's tournaments.</CardDescription>
            </div>
            <Button className="basketball-gradient hover:opacity-90 text-white shadow-md" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Tournament
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
                  <TableRow key={t.id} className="border-b-slate-100 hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-bold text-slate-900">{t.name}</TableCell>
                    <TableCell className="text-slate-600 font-medium">{format(new Date(t.startDate), "MMM dd")} - {format(new Date(t.endDate), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="text-slate-600 font-medium">{t.location}</TableCell>
                    <TableCell className="text-center text-slate-700 font-semibold">{t.numberOfCourts || 'N/A'}</TableCell>
                    <TableCell className="text-center text-slate-700 font-semibold">{t.games}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(t)} className="hover:text-brand-blue hover:bg-blue-50 text-slate-500">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleFeatureClick('delete-tournament')} className="hover:text-red-600 hover:bg-red-50 text-slate-500">
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
    </>
  );
};

export default TournamentsTab;