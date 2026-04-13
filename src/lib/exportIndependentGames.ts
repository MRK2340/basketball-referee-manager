import { format, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const GAME_TYPE_LABELS = {
  league: 'League Game',
  tournament: 'Tournament',
  scrimmage: 'Scrimmage',
  playoff: 'Playoff',
  other: 'Other',
};

const safeDate = (dateStr) => {
  try { return format(parseISO(dateStr), 'MMM d, yyyy'); } catch { return dateStr || ''; }
};

// ── CSV Export ────────────────────────────────────────────────────────────────
export const exportToCSV = (games, year, refereeName = 'Referee') => {
  const headers = ['Date', 'Time', 'Organization / League', 'Location', 'Game Type', 'Fee ($)', 'Notes'];

  const rows = games.map(g => [
    safeDate(g.date),
    g.time || '',
    g.organization || '',
    g.location || '',
    GAME_TYPE_LABELS[g.game_type] || 'Other',
    Number(g.fee) || 0,
    (g.notes || '').replace(/,/g, ';'),   // escape commas in notes
  ]);

  const totalFee = games.reduce((sum, g) => sum + (Number(g.fee) || 0), 0);
  rows.push([]);
  rows.push(['', '', '', '', 'TOTAL', totalFee, '']);

  const csv = [
    [`iWhistle Independent Game Log — ${year} Year-End Report`],
    [`Referee: ${refereeName}`],
    [`Generated: ${format(new Date(), 'MMM d, yyyy')}`],
    [],
    headers,
    ...rows,
  ]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `iWhistle_IndependentGames_${year}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

// ── PDF Export ────────────────────────────────────────────────────────────────
export const exportToPDF = (games, year, refereeName = 'Referee') => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

  const BLUE = [0, 128, 200];      // #0080C8
  const DEEP_BLUE = [0, 61, 122];  // #003D7A
  const ORANGE = [255, 140, 0];    // #FF8C00
  const WHITE = [255, 255, 255];
  const LIGHT_GREY = [245, 247, 250];
  const TEXT_DARK = [30, 41, 59];
  const TEXT_MID = [100, 116, 139];

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;

  // ── Header banner ──
  doc.setFillColor(...DEEP_BLUE);
  doc.rect(0, 0, pageW, 36, 'F');

  // iWhistle title
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('iWhistle', margin, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 210, 235);
  doc.text('LEADERSHIP UNDER PRESSURE', margin, 21);

  // Report title on right
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`${year} Year-End Report`, pageW - margin, 13, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 210, 235);
  doc.text('Independent Game Log', pageW - margin, 20, { align: 'right' });
  doc.text(`Referee: ${refereeName}`, pageW - margin, 27, { align: 'right' });

  // Orange accent line
  doc.setFillColor(...ORANGE);
  doc.rect(0, 36, pageW, 2.5, 'F');

  // ── Summary stats row ──
  const totalFee = games.reduce((sum, g) => sum + (Number(g.fee) || 0), 0);
  const byType = games.reduce((acc, g) => { acc[g.game_type] = (acc[g.game_type] || 0) + 1; return acc; }, {});
  const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];

  const statsY = 48;
  const cardW = (pageW - margin * 2 - 6) / 3;

  const statCards = [
    { label: 'Total Games', value: String(games.length) },
    { label: 'Total Earnings', value: `$${totalFee.toLocaleString()}` },
    { label: 'Top Game Type', value: topType ? GAME_TYPE_LABELS[topType[0]] : '—' },
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

  // Type breakdown (small pills)
  const breakdownY = statsY + 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MID);
  doc.text('BREAKDOWN BY TYPE', margin, breakdownY);

  let pillX = margin + 44;
  const pillY = breakdownY - 3.5;
  Object.entries(byType).forEach(([type, count]) => {
    const label = `${GAME_TYPE_LABELS[type] || 'Other'}: ${count}`;
    const textW = doc.getTextWidth(label) + 6;
    doc.setFillColor(...BLUE);
    doc.roundedRect(pillX, pillY, textW, 6, 1.5, 1.5, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(7);
    doc.text(label, pillX + textW / 2, pillY + 4, { align: 'center' });
    pillX += textW + 3;
  });

  // ── Section title ──
  const tableStartY = breakdownY + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...DEEP_BLUE);
  doc.text('GAME DETAILS', margin, tableStartY);
  doc.setFillColor(...ORANGE);
  doc.rect(margin, tableStartY + 1, 22, 0.8, 'F');

  // ── Table ──
  const tableRows = games.map(g => [
    safeDate(g.date),
    g.time || '—',
    g.organization || '—',
    g.location || '—',
    GAME_TYPE_LABELS[g.game_type] || 'Other',
    `$${Number(g.fee).toLocaleString()}`,
  ]);

  autoTable(doc, {
    startY: tableStartY + 5,
    head: [['Date', 'Time', 'Organization / League', 'Location', 'Type', 'Fee']],
    body: tableRows,
    foot: [['', '', '', '', 'TOTAL', `$${totalFee.toLocaleString()}`]],
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: DEEP_BLUE,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 3,
    },
    footStyles: {
      fillColor: LIGHT_GREY,
      textColor: TEXT_DARK,
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: TEXT_DARK,
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [250, 251, 253],
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 18 },
      2: { cellWidth: 52 },
      3: { cellWidth: 46 },
      4: { cellWidth: 24 },
      5: { cellWidth: 20, halign: 'right', fontStyle: 'bold', textColor: [22, 163, 74] },
    },
    showFoot: 'lastPage',
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.2,
  });

  // ── Footer ──
  const finalY = doc.lastAutoTable.finalY || doc.internal.pageSize.getHeight() - 20;
  const footerY = Math.min(finalY + 12, doc.internal.pageSize.getHeight() - 14);

  doc.setFillColor(...LIGHT_GREY);
  doc.rect(0, footerY - 4, pageW, 16, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(...TEXT_MID);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Generated by iWhistle on ${format(new Date(), 'MMMM d, yyyy')}  ·  iWhistle – Leadership Under Pressure`,
    pageW / 2,
    footerY + 4,
    { align: 'center' }
  );

  doc.save(`iWhistle_IndependentGames_${year}.pdf`);
};
