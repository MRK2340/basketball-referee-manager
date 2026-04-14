import { format, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { MappedPayment, MappedGame } from './mappers';

const safeDate = (dateStr: string) => {
  try { return format(parseISO(dateStr), 'MMM d, yyyy'); } catch { return dateStr || '—'; }
};

export type PeriodType = 'weekly' | 'biweekly' | 'monthly';

export interface PayPeriodReportOptions {
  payments: MappedPayment[];
  games: MappedGame[];
  refereeName: string;
  periodType: PeriodType;
  startDate: string;   // ISO date string
  endDate: string;     // ISO date string
  periodLabel: string; // e.g. "February 2026" or "Feb 1–7, 2026"
}

export const exportPayPeriodReportPDF = (opts: PayPeriodReportOptions) => {
  const { payments, games, refereeName, startDate, endDate, periodLabel } = opts;

  // Filter payments in range
  const start = new Date(startDate); start.setHours(0, 0, 0, 0);
  const end   = new Date(endDate);   end.setHours(23, 59, 59, 999);
  const filtered = payments.filter(p => {
    if (!p.date) return false;
    const d = new Date(p.date);
    return d >= start && d <= end;
  });

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

  // ── Header banner ──────────────────────────────────────────────────────────
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
  doc.text('Pay Period Report', pageW - margin, 13, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 210, 235);
  doc.text(periodLabel, pageW - margin, 20, { align: 'right' });
  doc.text(`Referee: ${refereeName}`, pageW - margin, 27, { align: 'right' });

  doc.setFillColor(...ORANGE);
  doc.rect(0, 36, pageW, 2.5, 'F');

  // ── Summary stats row ──────────────────────────────────────────────────────
  const totalEarnings = filtered.reduce((s, p) => s + p.amount, 0);
  const paidEarnings  = filtered.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const pendingEarnings = filtered.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);

  const statsY = 48;
  const cardW = (pageW - margin * 2 - 6) / 3;
  const statCards = [
    { label: 'Total Games',      value: String(filtered.length) },
    { label: 'Total Earnings',   value: `$${totalEarnings.toLocaleString()}` },
    { label: 'Paid / Pending',   value: `$${paidEarnings} / $${pendingEarnings}` },
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
    doc.setFontSize(12);
    doc.text(card.value, x + cardW / 2, statsY + 16, { align: 'center' });
  });

  // ── Period info bar ────────────────────────────────────────────────────────
  const periodY = statsY + 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MID);
  doc.text('PERIOD', margin, periodY);

  let pillX = margin + 18;
  const pills = [
    `${safeDate(startDate)} – ${safeDate(endDate)}`,
    `${filtered.length} game${filtered.length !== 1 ? 's' : ''}`,
  ];
  pills.forEach(label => {
    const textW = doc.getTextWidth(label) + 8;
    doc.setFillColor(...BLUE);
    doc.roundedRect(pillX, periodY - 4, textW, 6.5, 1.5, 1.5, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(7);
    doc.text(label, pillX + textW / 2, periodY, { align: 'center' });
    pillX += textW + 4;
  });

  // ── Table ──────────────────────────────────────────────────────────────────
  const tableStartY = periodY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...DEEP_BLUE);
  doc.text('PAYMENT DETAILS', margin, tableStartY);
  doc.setFillColor(...ORANGE);
  doc.rect(margin, tableStartY + 1, 28, 0.8, 'F');

  const tableRows = filtered.map(p => {
    const game = games.find(g => g.id === p.gameId);
    const gameLabel = game ? `${game.homeTeam} vs ${game.awayTeam}` : 'N/A';
    const tournamentLabel = game?.tournamentName || 'N/A';
    const statusLabel = p.status.charAt(0).toUpperCase() + p.status.slice(1);
    return [safeDate(p.date), gameLabel, tournamentLabel, p.method || '—', statusLabel, `$${p.amount}`];
  });

  autoTable(doc, {
    startY: tableStartY + 5,
    head: [['Date', 'Game', 'Tournament', 'Method', 'Status', 'Amount']],
    body: tableRows,
    foot: [['', '', '', '', 'TOTAL', `$${totalEarnings.toLocaleString()}`]],
    margin: { left: margin, right: margin },
    headStyles: { fillColor: DEEP_BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 8, cellPadding: 3 },
    footStyles: { fillColor: LIGHT_GREY, textColor: TEXT_DARK, fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 7.5, textColor: TEXT_DARK, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [250, 251, 253] },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 46 },
      2: { cellWidth: 42 },
      3: { cellWidth: 22 },
      4: { cellWidth: 20 },
      5: { cellWidth: 22, halign: 'right', fontStyle: 'bold', textColor: GREEN },
    },
    showFoot: 'lastPage',
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.2,
  });

  // ── Footer ─────────────────────────────────────────────────────────────────
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || doc.internal.pageSize.getHeight() - 20;
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

  const safeLabel = periodLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`iWhistle_PayPeriod_${safeLabel}.pdf`);
};
