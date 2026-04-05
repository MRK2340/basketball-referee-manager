import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, MapPin, Clock, DollarSign, Pencil, Trash2, Globe } from 'lucide-react';
import LogExternalGameDialog from '@/pages/Schedule/components/LogExternalGameDialog';

const ExternalGamesTab = () => {
  const { externalGames, deleteExternalGame } = useData();
  const [logOpen, setLogOpen] = useState(false);
  const [editGame, setEditGame] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleEdit = (game) => {
    setEditGame(game);
    setLogOpen(true);
  };

  const handleDialogClose = (open) => {
    setLogOpen(open);
    if (!open) setEditGame(null);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteExternalGame(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const getPaymentStatusStyle = (status) =>
    status === 'paid'
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-yellow-100 text-yellow-700 border-yellow-200';

  return (
    <>
      <LogExternalGameDialog open={logOpen} setOpen={handleDialogClose} existingGame={editGame} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-white border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this game entry?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              This will permanently remove{' '}
              <span className="font-semibold text-slate-900">
                {deleteTarget ? `${deleteTarget.homeTeam} vs ${deleteTarget.awayTeam}` : 'this game'}
              </span>{' '}
              from your external game log. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-slate-600 text-sm">
            {externalGames.length === 0
              ? 'No external games logged yet.'
              : `${externalGames.length} external game${externalGames.length !== 1 ? 's' : ''} logged`}
          </p>
          <Button
            className="basketball-gradient hover:opacity-90 text-white"
            onClick={() => { setEditGame(null); setLogOpen(true); }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Log External Game
          </Button>
        </div>

        {externalGames.length === 0 ? (
          <Card className="glass-effect border-slate-200 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-slate-100 p-4 mb-4">
                <Globe className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-slate-900 font-semibold mb-1">No external games yet</h3>
              <p className="text-slate-500 text-sm max-w-sm mb-6">
                Log games you officiate outside of iWhistle to keep all your work in one place and track your full earnings.
              </p>
              <Button
                className="basketball-gradient hover:opacity-90 text-white"
                onClick={() => { setEditGame(null); setLogOpen(true); }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Log Your First Game
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {externalGames.map((game) => (
              <Card key={game.id} className="glass-effect border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="text-slate-900 font-semibold text-sm">
                          {game.homeTeam} vs {game.awayTeam}
                        </h4>
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs border">
                          External
                        </Badge>
                        <Badge className={`text-xs border ${getPaymentStatusStyle(game.paymentStatus)}`}>
                          {game.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                        </Badge>
                      </div>

                      {game.tournamentName !== 'External Game' && (
                        <p className="text-slate-500 text-xs mb-2">{game.tournamentName}</p>
                      )}

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {game.date}{game.time ? ` at ${game.time}` : ''}
                        </span>
                        {game.venue && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {game.venue}
                          </span>
                        )}
                        <span className="flex items-center gap-1 font-medium text-green-700">
                          <DollarSign className="h-3 w-3" />
                          {game.payment != null ? `$${game.payment}` : '—'}
                          {game.paymentMethod ? ` · ${game.paymentMethod}` : ''}
                        </span>
                      </div>

                      {(game.division || game.level) && (
                        <p className="text-slate-500 text-xs mt-1">
                          {[game.division, game.level].filter(Boolean).join(' · ')}
                        </p>
                      )}

                      {game.notes && (
                        <p className="text-slate-500 text-xs mt-2 italic line-clamp-2">{game.notes}</p>
                      )}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-300 text-slate-600 hover:bg-slate-100 h-8 w-8 p-0"
                        onClick={() => handleEdit(game)}
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                        onClick={() => setDeleteTarget(game)}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ExternalGamesTab;
