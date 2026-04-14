import React from 'react';
import { format, parseISO } from 'date-fns';
import { Receipt, CheckCircle, Clock, XCircle, DollarSign, Calendar, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { MappedPayment, MappedGame } from '@/lib/mappers';

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: MappedPayment | null;
  game: MappedGame | undefined;
}

const statusConfig = {
  paid:    { icon: CheckCircle, color: 'bg-green-100 text-green-700 border-green-200', label: 'Paid' },
  pending: { icon: Clock,       color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Pending' },
  failed:  { icon: XCircle,     color: 'bg-red-100 text-red-700 border-red-200', label: 'Failed' },
};

const safeDate = (d: string) => {
  try { return format(parseISO(d), 'MMMM d, yyyy'); } catch { return d || '—'; }
};

export const ReceiptDialog: React.FC<ReceiptDialogProps> = ({ open, onOpenChange, payment, game }) => {
  if (!payment) return null;
  const cfg = statusConfig[payment.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = cfg.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" data-testid="receipt-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Receipt className="h-5 w-5 text-brand-blue" />
            Payment Receipt
          </DialogTitle>
        </DialogHeader>

        {/* Receipt card */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-brand-deep-blue p-4 text-white">
            <p className="text-xs text-blue-200 font-medium uppercase tracking-wider">iWhistle</p>
            <p className="text-2xl font-bold mt-1">${payment.amount}</p>
            <p className="text-blue-200 text-sm mt-0.5">Game Payment</p>
          </div>

          {/* Details */}
          <div className="p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm">Status</span>
              <Badge className={`border text-xs ${cfg.color}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {cfg.label}
              </Badge>
            </div>

            {game && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-sm">Game</span>
                <span className="text-slate-900 text-sm font-medium text-right max-w-[180px] truncate">
                  {game.homeTeam} vs {game.awayTeam}
                </span>
              </div>
            )}

            {game?.tournamentName && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-sm">Tournament</span>
                <span className="text-slate-900 text-sm font-medium text-right max-w-[180px] truncate">
                  {game.tournamentName}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Date
              </span>
              <span className="text-slate-900 text-sm font-medium">{safeDate(payment.date)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5" /> Method
              </span>
              <span className="text-slate-900 text-sm font-medium">{payment.method || '—'}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" /> Amount
              </span>
              <span className="text-green-600 text-sm font-bold">${payment.amount}</span>
            </div>

            <div className="pt-2 border-t border-dashed border-slate-200">
              <p className="text-xs text-slate-400 text-center">
                Receipt ID: {payment.id.slice(0, 12).toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
