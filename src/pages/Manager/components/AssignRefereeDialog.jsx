import React, { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import {
  AlertCircle,
  CheckCircle,
  Star,
  Award,
  Clock,
  XCircle,
  HelpCircle,
  Trophy,
  ChevronRight,
} from 'lucide-react';
import { rankReferees } from '@/lib/conflictUtils';

const STATUS_CONFIG = {
  available: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    label: 'Available',
    badge: 'bg-green-100 text-green-700 border-green-200',
  },
  'no-data': {
    icon: HelpCircle,
    color: 'text-slate-500',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    label: 'No Availability Logged',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  'missing-certs': {
    icon: Award,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    label: 'Missing Certifications',
    badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  unavailable: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Marked Unavailable',
    badge: 'bg-red-100 text-red-700 border-red-200',
  },
  conflict: {
    icon: AlertCircle,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    label: 'Schedule Conflict',
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
  },
};

const RefereeCard = ({ referee, game, isSelected, onSelect }) => {
  const cfg = STATUS_CONFIG[referee.fitStatus?.status] || STATUS_CONFIG['no-data'];
  const StatusIcon = cfg.icon;
  const isIssue = ['conflict', 'unavailable', 'missing-certs'].includes(referee.fitStatus?.status);

  return (
    <button
      data-testid={`assign-referee-card-${referee.id}`}
      onClick={() => onSelect(referee)}
      className={`w-full text-left rounded-xl border-2 p-3 transition-all duration-150 hover:shadow-sm ${
        isSelected
          ? 'border-brand-blue bg-blue-50 shadow-sm'
          : `${cfg.border} ${cfg.bg} hover:border-slate-300`
      }`}
    >
      <div className="flex items-center gap-3">
        <img
          src={referee.avatar_url}
          alt={referee.name}
          className="h-10 w-10 rounded-full ring-2 ring-white shadow-sm flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p className={`font-semibold text-sm truncate ${isSelected ? 'text-brand-blue' : 'text-slate-900'}`}>
              {referee.name}
            </p>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="h-3.5 w-3.5 text-yellow-400 fill-current" />
              <span className="text-xs font-bold text-slate-700">{referee.rating?.toFixed(1)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${cfg.badge}`}
              data-testid={`referee-status-badge-${referee.id}`}
            >
              <StatusIcon className="h-3 w-3" />
              {cfg.label}
            </span>
            <span className="text-xs text-slate-500">{referee.games_officiated} games</span>
          </div>
        </div>
        {isSelected && <ChevronRight className="h-4 w-4 text-brand-blue flex-shrink-0" />}
      </div>

      {/* Conflict detail inline */}
      {isSelected && isIssue && (
        <div className={`mt-2 rounded-lg border px-3 py-2 text-xs ${cfg.border} bg-white`}>
          {referee.fitStatus?.status === 'conflict' && referee.fitStatus.conflicts.length > 0 && (
            <p className="text-orange-700 font-medium">
              Conflict: already assigned to{' '}
              <strong>
                {referee.fitStatus.conflicts[0].home_team} vs {referee.fitStatus.conflicts[0].away_team}
              </strong>{' '}
              at the same time.
            </p>
          )}
          {referee.fitStatus?.status === 'unavailable' && (
            <p className="text-red-700 font-medium">
              This referee has marked themselves unavailable during this time slot.
            </p>
          )}
          {referee.fitStatus?.status === 'missing-certs' && (
            <p className="text-yellow-700 font-medium">
              Missing required: {(game.required_certifications || game.requiredCertifications || []).join(', ')}
            </p>
          )}
        </div>
      )}
    </button>
  );
};

const AssignRefereeDialog = ({ open, setOpen, game, referees, games, onAssign }) => {
  const [selectedReferee, setSelectedReferee] = useState(null);

  const alreadyAssignedIds = useMemo(() => {
    if (!game?.game_assignments) return new Set();
    return new Set(game.game_assignments.map((a) => a.referee_id));
  }, [game]);

  const rankedReferees = useMemo(() => {
    if (!game || !referees) return [];
    return rankReferees(
      referees.filter((r) => !alreadyAssignedIds.has(r.id)),
      game,
      games || []
    );
  }, [game, referees, games, alreadyAssignedIds]);

  const bestFit = rankedReferees[0];

  const gameDate = game?.game_date
    ? (() => {
        try {
          return format(parseISO(game.game_date), 'MMM d, yyyy');
        } catch {
          return game.game_date;
        }
      })()
    : '';

  const handleClose = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) setSelectedReferee(null);
  };

  const handleAssign = () => {
    if (!game || !selectedReferee) {
      toast({ title: 'Select a referee', description: 'Please choose a referee to assign.', variant: 'destructive' });
      return;
    }
    onAssign(game.id, selectedReferee.id);
    setOpen(false);
    setSelectedReferee(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-lg bg-white border-slate-200 text-slate-900 gap-0 p-0 overflow-hidden"
        data-testid="assign-referee-dialog"
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-slate-900 text-lg font-bold">Assign Referee</DialogTitle>
          <DialogDescription className="text-slate-600 text-sm mt-0.5">
            {game?.home_team} vs {game?.away_team}
            {gameDate && (
              <span className="inline-flex items-center gap-1 ml-2 text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                {gameDate} at {game?.game_time?.slice(0, 5)}
              </span>
            )}
          </DialogDescription>

          {/* Required certs */}
          {(game?.required_certifications || game?.requiredCertifications || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="text-xs text-slate-500 font-medium mr-1">Required:</span>
              {(game.required_certifications || game.requiredCertifications).map((cert) => (
                <Badge key={cert} variant="outline" className="text-xs border-orange-200 text-orange-700 bg-orange-50">
                  <Award className="h-2.5 w-2.5 mr-1" />
                  {cert}
                </Badge>
              ))}
            </div>
          )}
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {/* Best fit highlight */}
          {bestFit && bestFit.fitStatus?.status === 'available' && (
            <div
              className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-2.5"
              data-testid="best-fit-referee-banner"
            >
              <Trophy className="h-4 w-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800 font-medium">
                <strong>{bestFit.name}</strong> is the best match — available, certified, and rated{' '}
                {bestFit.rating?.toFixed(1)}.
              </p>
            </div>
          )}

          {/* Referee list */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Referees — sorted by fit
            </p>
            <ScrollArea className="h-64 pr-3" data-testid="assign-referee-list">
              <div className="space-y-2">
                {rankedReferees.length > 0 ? (
                  rankedReferees.map((referee) => (
                    <RefereeCard
                      key={referee.id}
                      referee={referee}
                      game={game}
                      isSelected={selectedReferee?.id === referee.id}
                      onSelect={setSelectedReferee}
                    />
                  ))
                ) : (
                  <p className="text-slate-400 italic text-sm py-4 text-center">
                    No available referees to assign.
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/60">
          <Button
            type="button"
            variant="outline"
            data-testid="assign-referee-cancel-button"
            onClick={() => setOpen(false)}
            className="border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            type="button"
            data-testid="assign-referee-confirm-button"
            onClick={handleAssign}
            disabled={!selectedReferee}
            className="basketball-gradient hover:opacity-90 text-white font-semibold"
          >
            Assign {selectedReferee ? selectedReferee.name : 'Referee'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignRefereeDialog;
