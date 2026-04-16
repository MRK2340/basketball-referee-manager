import { format, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { MappedPayment, MappedGame, MappedTournament, MappedProfile } from './mappers';

const safeDate = (dateStr: string) => {
  try { return format(parseISO(dateStr), 'MMM d, yyyy'); } catch { return dateStr || '—'; }
};

export interface TournamentPayoutOptions {
  tournament: MappedTournament;
  payments: MappedPayment[];
  games: MappedGame[];
  referees: MappedProfile[];
  managerName: string;
}

export const exportTournamentPayoutReportPDF = (opts: TournamentPayoutOptions) => {
  const { tournament, payments, games, referees, managerName } = opts;

  // Filter games for this tournament, then find matching payments
  const tournamentGames = games.filter(g => g.tournamentId === tournament.id);
  const tournamentGameIds = new Set(tournamentGames.map(g => g.id));
  const tournamentPayments = payments.filter(p => tournamentGameIds.has(p.gameId));

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });

  const BLUE      = [0, 128, 200] as [number, number, number];
  const DEEP_BLUE = [0, 61, 122]  as [number, number, number];
  const ORANGE    = [255, 140, 0] as [number, number, number];
  const WHITE     = [255, 255, 255] as [number, number, number];
  const LIGHT_GREY= [245, 247, 250] as [number, number, number];
  const TEXT_DARK = [30, 41, 59]  as [number, number, number];
  const TEXT_MID  = [100, 116, 139] as [number, number, number];
  const GREEN     = [22, 163, 74] as [number, number, number];
  const RED       = [220, 38, 38] as [number, number, number];

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  // ── Header banner ────────────────────────────────────────────────────────
  doc.setFillColor(...DEEP_BLUE);
  doc.rect(0, 0, pageW, 32, 'F');

  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('iWhistle', margin, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 210, 235);
  doc.text('LEADERSHIP UNDER PRESSURE', margin, 18);

  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Tournament Payout Report', pageW - margin, 12, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 210, 235);
  doc.text(tournament.name, pageW - margin, 19, { align: 'right' });
  doc.text(`Manager: ${managerName}`, pageW - margin, 25, { align: 'right' });

  doc.setFillColor(...ORANGE);
  doc.rect(0, 32, pageW, 2, 'F');

  // ── Tournament info row ──────────────────────────────────────────────────
  const infoY = 40;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MID);

  const infoParts = [
    `Location: ${tournament.location || 'N/A'}`,
    `Dates: ${safeDate(tournament.startDate)} – ${safeDate(tournament.endDate)}`,
    `Courts: ${tournament.numberOfCourts || 'N/A'}`,
    `Games: ${tournamentGames.length}`,
  ];
  doc.text(infoParts.join('   |   '), margin, infoY);

  // ── Summary stats ────────────────────────────────────────────────────────
  const totalAmount = tournamentPayments.reduce((s, p) => s + p.amount, 0);
  const paidAmount = tournamentPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const pendingAmount = tournamentPayments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const uniqueRefereeIds = [...new Set(tournamentPayments.map(p => p.refereeId))];

  const statsY = 46;
  const cardW = (pageW - margin * 2 - 9) / 4;
  const statCards = [
    { label: 'Total Payouts', value: String(tournamentPayments.length) },
    { label: 'Total Amount',  value: `$${totalAmount.toLocaleString()}` },
    { label: 'Paid / Pending', value: `$${paidAmount} / $${pendingAmount}` },
    { label: 'Referees',       value: String(uniqueRefereeIds.length) },
  ];

  statCards.forEach((card, i) => {
    const x = margin + i * (cardW + 3);
    doc.setFillColor(...LIGHT_GREY);
    doc.roundedRect(x, statsY, cardW, 16, 2, 2, 'F');
    doc.setFillColor(...BLUE);
    doc.roundedRect(x, statsY, cardW, 3.5, 2, 2, 'F');
    doc.rect(x, statsY + 1.5, cardW, 2, 'F');
    doc.setTextColor(...TEXT_MID);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(card.label.toUpperCase(), x + cardW / 2, statsY + 8, { align: 'center' });
    doc.setTextColor(...TEXT_DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(card.value, x + cardW / 2, statsY + 14, { align: 'center' });
  });

  // ── Payout table ─────────────────────────────────────────────────────────
  const tableStartY = statsY + 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...DEEP_BLUE);
  doc.text('ALL PAYOUTS', margin, tableStartY);
  doc.setFillColor(...ORANGE);
  doc.rect(margin, tableStartY + 1, 22, 0.8, 'F');

  const tableRows = tournamentPayments
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .map(p => {
      const game = tournamentGames.find(g => g.id === p.gameId);
      const referee = referees.find(r => r.id === p.refereeId);
      const gameLabel = game ? `${game.homeTeam} vs ${game.awayTeam}` : 'N/A';
      const statusLabel = p.status.charAt(0).toUpperCase() + p.status.slice(1);
      return [
        referee?.name || 'Unknown',
        gameLabel,
        safeDate(p.date),
        game?.venue || '—',
        p.method || '—',
        statusLabel,
        `$${p.amount}`,
      ];
    });

  autoTable(doc, {
    startY: tableStartY + 4,
    head: [['Referee', 'Game', 'Date', 'Venue', 'Method', 'Status', 'Amount']],
    body: tableRows,
    foot: [['', '', '', '', '', 'TOTAL', `$${totalAmount.toLocaleString()}`]],
    margin: { left: margin, right: margin },
    headStyles: { fillColor: DEEP_BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 7.5, cellPadding: 2.5 },
    footStyles: { fillColor: LIGHT_GREY, textColor: TEXT_DARK, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7, textColor: TEXT_DARK, cellPadding: 2 },
    alternateRowStyles: { fillColor: [250, 251, 253] },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 44 },
      2: { cellWidth: 22 },
      3: { cellWidth: 30 },
      4: { cellWidth: 20 },
      5: { cellWidth: 18 },
      6: { cellWidth: 20, halign: 'right', fontStyle: 'bold', textColor: GREEN },
    },
    showFoot: 'lastPage',
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.2,
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const val = String(data.cell.raw).toLowerCase();
        if (val === 'paid') data.cell.styles.textColor = GREEN;
        else if (val === 'pending') data.cell.styles.textColor = [202, 138, 4];
        else if (val === 'failed') data.cell.styles.textColor = RED;
      }
    },
  });

  // ── Per-referee summary ──────────────────────────────────────────────────
  const afterTableY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 120;
  let summaryY = afterTableY + 10;

  // Check if we need a new page
  if (summaryY + 30 > doc.internal.pageSize.getHeight() - 20) {
    doc.addPage();
    summaryY = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...DEEP_BLUE);
  doc.text('SUMMARY BY REFEREE', margin, summaryY);
  doc.setFillColor(...ORANGE);
  doc.rect(margin, summaryY + 1, 30, 0.8, 'F');

  const refereeSummary = uniqueRefereeIds.map(refId => {
    const ref = referees.find(r => r.id === refId);
    const refPayments = tournamentPayments.filter(p => p.refereeId === refId);
    const total = refPayments.reduce((s, p) => s + p.amount, 0);
    const paid = refPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const pending = refPayments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
    return [
      ref?.name || 'Unknown',
      String(refPayments.length),
      `$${paid}`,
      `$${pending}`,
      `$${total}`,
    ];
  }).sort((a, b) => a[0].localeCompare(b[0]));

  autoTable(doc, {
    startY: summaryY + 5,
    head: [['Referee', 'Games', 'Paid', 'Pending', 'Total']],
    body: refereeSummary,
    foot: [['TOTAL', String(tournamentPayments.length), `$${paidAmount}`, `$${pendingAmount}`, `$${totalAmount}`]],
    margin: { left: margin, right: margin },
    headStyles: { fillColor: BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 7.5, cellPadding: 2.5 },
    footStyles: { fillColor: LIGHT_GREY, textColor: TEXT_DARK, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: TEXT_DARK, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [250, 251, 253] },
    columnStyles: {
      0: { cellWidth: 44 },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 24, halign: 'right', textColor: GREEN },
      3: { cellWidth: 24, halign: 'right', textColor: [202, 138, 4] },
      4: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
    },
    showFoot: 'lastPage',
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.2,
  });

  // ── Footer ───────────────────────────────────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(...LIGHT_GREY);
    doc.rect(0, pageH - 12, pageW, 12, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_MID);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Generated by iWhistle on ${format(new Date(), 'MMMM d, yyyy')}  ·  Page ${i} of ${pages}  ·  iWhistle – Leadership Under Pressure`,
      pageW / 2, pageH - 5, { align: 'center' },
    );
  }

  const safeName = tournament.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`iWhistle_Tournament_Payouts_${safeName}.pdf`);
};
