import React, { useState } from 'react';
import { FileText, Download, Loader2, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import type { MappedPayment, MappedGame } from '@/lib/mappers';

interface TaxDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payments: MappedPayment[];
  games: MappedGame[];
  refereeName: string;
}

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

export const TaxDocumentsDialog: React.FC<TaxDocumentsDialogProps> = ({
  open, onOpenChange, payments, games, refereeName,
}) => {
  const [year, setYear]         = useState(String(currentYear));
  const [loading, setLoading]   = useState(false);

  const paidForYear = payments.filter(
    p => p.status === 'paid' && p.date?.startsWith(year),
  );
  const totalPaid = paidForYear.reduce((s, p) => s + p.amount, 0);

  const handleDownload = async () => {
    if (paidForYear.length === 0) {
      toast({ title: 'No paid payments', description: `No paid payments found for ${year}.`, variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;
      const { format } = await import('date-fns');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
      const BLUE      = [0, 128, 200] as [number, number, number];
      const DEEP_BLUE = [0, 61, 122]  as [number, number, number];
      const ORANGE    = [255, 140, 0] as [number, number, number];
      const WHITE     = [255, 255, 255] as [number, number, number];
      const LIGHT_GREY= [245, 247, 250] as [number, number, number];
      const TEXT_DARK = [30, 41, 59]  as [number, number, number];
      const TEXT_MID  = [100, 116, 139] as [number, number, number];
      const GREEN     = [22, 163, 74] as [number, number, number];

      const pageW = doc.internal.pageSize.getWidth();
      const margin = 16;

      // Header
      doc.setFillColor(...DEEP_BLUE);
      doc.rect(0, 0, pageW, 36, 'F');
      doc.setTextColor(...WHITE);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('iWhistle', margin, 14);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 210, 235);
      doc.text('LEADERSHIP UNDER PRESSURE', margin, 21);
      doc.setTextColor(...WHITE);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(`${year} Earnings Summary`, pageW - margin, 13, { align: 'right' });
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 210, 235);
      doc.text('Tax Document', pageW - margin, 20, { align: 'right' });
      doc.text(`Referee: ${refereeName}`, pageW - margin, 27, { align: 'right' });
      doc.setFillColor(...ORANGE);
      doc.rect(0, 36, pageW, 2.5, 'F');

      // Summary cards
      const statsY = 48;
      const cardW  = (pageW - margin * 2 - 6) / 3;
      const statCards = [
        { label: 'Tax Year',         value: year },
        { label: 'Total Paid',        value: `$${totalPaid.toLocaleString()}` },
        { label: 'Games Officiated',  value: String(paidForYear.length) },
      ];
      statCards.forEach((card, i) => {
        const x = margin + i * (cardW + 3);
        doc.setFillColor(...LIGHT_GREY);
        doc.roundedRect(x, statsY, cardW, 18, 2, 2, 'F');
        doc.setFillColor(...BLUE);
        doc.roundedRect(x, statsY, cardW, 4, 2, 2, 'F');
        doc.rect(x, statsY + 2, cardW, 2, 'F');
        doc.setTextColor(...TEXT_MID);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(card.label.toUpperCase(), x + cardW / 2, statsY + 9.5, { align: 'center' });
        doc.setTextColor(...TEXT_DARK);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(card.value, x + cardW / 2, statsY + 16, { align: 'center' });
      });

      // Disclaimer
      const noteY = statsY + 26;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(...TEXT_MID);
      doc.text(
        'This document is an earnings summary provided for informational purposes. Consult a tax professional for official filing.',
        margin, noteY, { maxWidth: pageW - margin * 2 },
      );

      // Table
      const tableStartY = noteY + 14;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...DEEP_BLUE);
      doc.text('PAID PAYMENTS', margin, tableStartY);
      doc.setFillColor(...ORANGE);
      doc.rect(margin, tableStartY + 1, 24, 0.8, 'F');

      const rows = paidForYear.map(p => {
        const game = games.find(g => g.id === p.gameId);
        return [
          p.date || '—',
          game ? `${game.homeTeam} vs ${game.awayTeam}` : 'N/A',
          game?.tournamentName || 'N/A',
          p.method || '—',
          `$${p.amount}`,
        ];
      });

      autoTable(doc, {
        startY: tableStartY + 5,
        head: [['Date', 'Game', 'Tournament', 'Method', 'Amount']],
        body: rows,
        foot: [['', '', '', 'TOTAL', `$${totalPaid.toLocaleString()}`]],
        margin: { left: margin, right: margin },
        headStyles: { fillColor: DEEP_BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 8, cellPadding: 3 },
        footStyles: { fillColor: LIGHT_GREY, textColor: TEXT_DARK, fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { fontSize: 8, textColor: TEXT_DARK, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: [250, 251, 253] },
        columnStyles: {
          0: { cellWidth: 24 },
          1: { cellWidth: 52 },
          2: { cellWidth: 48 },
          3: { cellWidth: 24 },
          4: { cellWidth: 22, halign: 'right', fontStyle: 'bold', textColor: GREEN },
        },
        showFoot: 'lastPage',
        tableLineColor: [226, 232, 240],
        tableLineWidth: 0.2,
      });

      const finalY = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || doc.internal.pageSize.getHeight() - 20;
      const footerY = Math.min(finalY + 12, doc.internal.pageSize.getHeight() - 14);
      doc.setFillColor(...LIGHT_GREY);
      doc.rect(0, footerY - 4, pageW, 16, 'F');
      doc.setFontSize(7.5);
      doc.setTextColor(...TEXT_MID);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Generated by iWhistle on ${format(new Date(), 'MMMM d, yyyy')}  ·  iWhistle – Leadership Under Pressure`,
        pageW / 2, footerY + 4, { align: 'center' },
      );

      doc.save(`iWhistle_TaxSummary_${year}.pdf`);
      toast({ title: 'Tax summary downloaded', description: `${year} earnings summary saved as PDF.` });
    } catch {
      toast({ title: 'Download failed', description: 'Could not generate PDF.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" data-testid="tax-documents-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <FileText className="h-5 w-5 text-brand-blue" />
            Tax Documents
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Download your annual earnings summary for tax purposes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-slate-700">Tax Year</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger data-testid="tax-year-select" className="border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 text-sm">Paid payments</span>
              <span className="text-slate-900 font-semibold">{paidForYear.length}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-slate-700 text-sm font-semibold flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-green-600" /> Total Earnings
              </span>
              <span className="text-green-600 text-lg font-bold">${totalPaid.toLocaleString()}</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center">
            This is an informational summary. Consult a tax professional for filing.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-300">
            Close
          </Button>
          <Button
            data-testid="tax-download-button"
            onClick={handleDownload}
            disabled={loading}
            className="basketball-gradient hover:opacity-90 text-white"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
