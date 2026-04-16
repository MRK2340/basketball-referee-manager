import React, { useState, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Download, FileText, Users, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { exportTournamentPayoutReportPDF } from '@/lib/exportTournamentPayoutReport';
import type { MappedPayment, MappedGame, MappedTournament, MappedProfile } from '@/lib/mappers';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournaments: MappedTournament[];
  payments: MappedPayment[];
  games: MappedGame[];
  referees: MappedProfile[];
  managerName: string;
}

export const TournamentPayoutDialog: React.FC<Props> = ({
  open, onOpenChange, tournaments, payments, games, referees, managerName,
}) => {
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');

  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);

  const preview = useMemo(() => {
    if (!selectedTournament) return null;
    const tournamentGames = games.filter(g => g.tournamentId === selectedTournament.id);
    const gameIds = new Set(tournamentGames.map(g => g.id));
    const tournamentPayments = payments.filter(p => gameIds.has(p.gameId));
    const totalAmount = tournamentPayments.reduce((s, p) => s + p.amount, 0);
    const paidAmount = tournamentPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const pendingAmount = tournamentPayments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
    const uniqueReferees = [...new Set(tournamentPayments.map(p => p.refereeId))];
    return { tournamentPayments, totalAmount, paidAmount, pendingAmount, uniqueReferees, gameCount: tournamentGames.length };
  }, [selectedTournament, games, payments]);

  const handleGenerate = () => {
    if (!selectedTournament || !preview) return;
    try {
      exportTournamentPayoutReportPDF({
        tournament: selectedTournament,
        payments,
        games,
        referees,
        managerName,
      });
      toast({ title: 'Report generated', description: `${selectedTournament.name} payout report downloaded` });
    } catch {
      toast({ title: 'Generation failed', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" data-testid="tournament-payout-dialog">
        <DialogHeader>
          <DialogTitle className="text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-blue" />
            Tournament Payout Report
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Generate a PDF of all referee payouts for a tournament
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Tournament selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Select Tournament</label>
            <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
              <SelectTrigger data-testid="tournament-payout-select" className="border-slate-300">
                <SelectValue placeholder="Choose a tournament..." />
              </SelectTrigger>
              <SelectContent>
                {tournaments.map(t => (
                  <SelectItem key={t.id} value={t.id} data-testid={`tournament-option-${t.id}`}>
                    {t.name}
                    {t.archived && <span className="text-slate-400 ml-1">(Archived)</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview stats */}
          {preview && selectedTournament && (
            <div className="space-y-3" data-testid="tournament-payout-preview">
              <div className="text-sm font-medium text-slate-700">Preview</div>

              {preview.tournamentPayments.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-slate-500 text-sm">
                  No payouts found for this tournament
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-2.5">
                      <div className="p-1.5 bg-blue-100 rounded-md">
                        <DollarSign className="h-4 w-4 text-brand-blue" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 font-medium">Total</div>
                        <div className="text-lg font-bold text-slate-900">${preview.totalAmount.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-2.5">
                      <div className="p-1.5 bg-purple-100 rounded-md">
                        <Users className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 font-medium">Referees</div>
                        <div className="text-lg font-bold text-slate-900">{preview.uniqueReferees.length}</div>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-2.5">
                      <div className="p-1.5 bg-green-100 rounded-md">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 font-medium">Paid</div>
                        <div className="text-lg font-bold text-green-600">${preview.paidAmount.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-2.5">
                      <div className="p-1.5 bg-yellow-100 rounded-md">
                        <Clock className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 font-medium">Pending</div>
                        <div className="text-lg font-bold text-yellow-600">${preview.pendingAmount.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Badge variant="outline" className="text-xs border-slate-300">
                      {preview.tournamentPayments.length} payout{preview.tournamentPayments.length !== 1 ? 's' : ''}
                    </Badge>
                    <Badge variant="outline" className="text-xs border-slate-300">
                      {preview.gameCount} game{preview.gameCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Generate button */}
          <Button
            className="w-full basketball-gradient hover:opacity-90 text-white"
            data-testid="tournament-payout-generate-button"
            disabled={!selectedTournament || !preview || preview.tournamentPayments.length === 0}
            onClick={handleGenerate}
          >
            <Download className="h-4 w-4 mr-2" />
            Generate PDF Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
