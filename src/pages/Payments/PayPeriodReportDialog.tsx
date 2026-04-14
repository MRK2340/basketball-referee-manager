import React, { useState } from 'react';
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  subWeeks, subMonths, format, isWithinInterval, parseISO,
} from 'date-fns';
import { FileText, Download, Loader2, DollarSign, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { exportPayPeriodReportPDF, type PeriodType } from '@/lib/exportPayPeriodReport';
import type { MappedPayment, MappedGame } from '@/lib/mappers';

interface PayPeriodReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payments: MappedPayment[];
  games: MappedGame[];
  refereeName: string;
}

type MonthOffset = '0' | '1' | '2' | '3' | '4' | '5';

const buildPeriodOptions = () => {
  const now = new Date();
  const periods = [];

  // Last 6 months
  for (let i = 0; i < 6; i++) {
    const d = subMonths(now, i);
    periods.push({
      value: `monthly-${i}` as const,
      label: format(d, 'MMMM yyyy'),
      type: 'monthly' as PeriodType,
      start: startOfMonth(d),
      end: endOfMonth(d),
    });
  }

  return periods;
};

export const PayPeriodReportDialog: React.FC<PayPeriodReportDialogProps> = ({
  open, onOpenChange, payments, games, refereeName,
}) => {
  const [periodType, setPeriodType]       = useState<PeriodType>('monthly');
  const [monthOffset, setMonthOffset]     = useState<MonthOffset>('0');
  const [weekOffset, setWeekOffset]       = useState('0');
  const [biweekOffset, setBiweekOffset]   = useState('0');
  const [loading, setLoading]             = useState(false);

  const now = new Date();

  const getPeriodDates = (): { start: Date; end: Date; label: string } => {
    if (periodType === 'monthly') {
      const d = subMonths(now, Number(monthOffset));
      return {
        start: startOfMonth(d),
        end: endOfMonth(d),
        label: format(d, 'MMMM yyyy'),
      };
    }
    if (periodType === 'biweekly') {
      const offsetWeeks = Number(biweekOffset) * 2;
      const start = startOfWeek(subWeeks(now, offsetWeeks), { weekStartsOn: 0 });
      const end   = endOfWeek(subWeeks(now, offsetWeeks - 1), { weekStartsOn: 0 });
      return {
        start,
        end,
        label: `${format(start, 'MMM d')}–${format(end, 'MMM d, yyyy')}`,
      };
    }
    // weekly
    const d = subWeeks(now, Number(weekOffset));
    const start = startOfWeek(d, { weekStartsOn: 0 });
    const end   = endOfWeek(d, { weekStartsOn: 0 });
    return {
      start,
      end,
      label: `${format(start, 'MMM d')}–${format(end, 'MMM d, yyyy')}`,
    };
  };

  const { start, end, label } = getPeriodDates();

  const periodPayments = payments.filter(p => {
    if (!p.date) return false;
    try {
      return isWithinInterval(parseISO(p.date), { start, end });
    } catch { return false; }
  });
  const totalEarnings  = periodPayments.reduce((s, p) => s + p.amount, 0);
  const paidEarnings   = periodPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const pendingEarnings= periodPayments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);

  const handleGenerate = () => {
    if (periodPayments.length === 0) {
      toast({ title: 'No payments', description: 'No payments found for this period.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      exportPayPeriodReportPDF({
        payments: periodPayments,
        games,
        refereeName,
        periodType,
        startDate: format(start, 'yyyy-MM-dd'),
        endDate:   format(end,   'yyyy-MM-dd'),
        periodLabel: label,
      });
      toast({ title: 'Report generated', description: `${label} pay period report downloaded.` });
    } catch {
      toast({ title: 'Could not generate PDF', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const MONTH_OPTS: { value: MonthOffset; label: string }[] = Array.from({ length: 6 }, (_, i) => ({
    value: String(i) as MonthOffset,
    label: format(subMonths(now, i), 'MMMM yyyy'),
  }));

  const WEEK_OPTS = Array.from({ length: 8 }, (_, i) => ({
    value: String(i),
    label: i === 0 ? 'This week' : `${i} week${i > 1 ? 's' : ''} ago`,
  }));

  const BIWEEK_OPTS = Array.from({ length: 6 }, (_, i) => ({
    value: String(i),
    label: i === 0 ? 'Current 2 weeks' : `${i * 2} weeks ago`,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="pay-period-report-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <FileText className="h-5 w-5 text-brand-blue" />
            Pay Period Report
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Generate a PDF earnings report for any pay period.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Period Type */}
          <div className="space-y-1.5">
            <Label className="text-slate-700">Period Type</Label>
            <Select value={periodType} onValueChange={v => setPeriodType(v as PeriodType)}>
              <SelectTrigger data-testid="pay-period-type-select" className="border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Period selector */}
          <div className="space-y-1.5">
            <Label className="text-slate-700">Period</Label>
            {periodType === 'monthly' && (
              <Select value={monthOffset} onValueChange={v => setMonthOffset(v as MonthOffset)}>
                <SelectTrigger data-testid="pay-period-month-select" className="border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {periodType === 'weekly' && (
              <Select value={weekOffset} onValueChange={setWeekOffset}>
                <SelectTrigger data-testid="pay-period-week-select" className="border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEK_OPTS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {periodType === 'biweekly' && (
              <Select value={biweekOffset} onValueChange={setBiweekOffset}>
                <SelectTrigger data-testid="pay-period-biweek-select" className="border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BIWEEK_OPTS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Summary preview */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <Calendar className="h-3.5 w-3.5" />
              {label}
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2 bg-white border border-slate-200 rounded-lg">
                <p className="text-slate-500 text-xs">Games</p>
                <p className="text-slate-900 font-bold">{periodPayments.length}</p>
              </div>
              <div className="p-2 bg-white border border-slate-200 rounded-lg">
                <p className="text-slate-500 text-xs">Paid</p>
                <p className="text-green-600 font-bold">${paidEarnings}</p>
              </div>
              <div className="p-2 bg-white border border-slate-200 rounded-lg">
                <p className="text-slate-500 text-xs">Pending</p>
                <p className="text-yellow-600 font-bold">${pendingEarnings}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-2">
              <span className="text-slate-700 text-sm font-semibold flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-brand-blue" />Total
              </span>
              <span className="text-slate-900 font-bold">${totalEarnings}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-300">
            Close
          </Button>
          <Button
            data-testid="pay-period-generate-button"
            onClick={handleGenerate}
            disabled={loading || periodPayments.length === 0}
            className="basketball-gradient hover:opacity-90 text-white"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
            Generate PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
