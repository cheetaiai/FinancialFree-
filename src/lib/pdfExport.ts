import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Person, Transaction } from '../types';

// Format currency for PDF output (clean ASCII symbol or INR format for font compatibility)
const formatCurrencyPdf = (amount: number): string => {
  return 'Rs. ' + Math.round(amount).toLocaleString('en-IN');
};

const formatDatePdf = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

/**
 * 1. Export Formatted Reports / Audit Ledger PDF
 */
export const exportReportsPdf = (
  transactions: Transaction[],
  reportTitle: string,
  summary: {
    given: number;
    returned: number;
    net: number;
    totalCount: number;
    periodLabel?: string;
  }
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const timeStr = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Header Banner
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent Line
  doc.setFillColor(37, 99, 235); // Blue 600
  doc.rect(0, 27, pageWidth, 1.5, 'F');

  // Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('FINANCIALFREE', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(191, 219, 254);
  doc.text('Personal Financial Ledger & Audit Statement', 14, 18);

  // Document Title & Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(reportTitle.toUpperCase(), pageWidth - 14, 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Generated: ${todayStr} at ${timeStr}`, pageWidth - 14, 18, { align: 'right' });

  // Summary Metrics Section (3 KPI Cards)
  const startY = 34;
  const cardWidth = (pageWidth - 28 - 8) / 3;
  const cardHeight = 18;

  // Card 1: Total Given
  doc.setFillColor(239, 246, 255); // Blue 50
  doc.roundedRect(14, startY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(14, startY, cardWidth, cardHeight, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 64, 175); // Blue 800
  doc.text('TOTAL MONEY GIVEN', 17, startY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 58, 138);
  doc.text(formatCurrencyPdf(summary.given), 17, startY + 13);

  // Card 2: Total Returned
  const card2X = 14 + cardWidth + 4;
  doc.setFillColor(236, 253, 245); // Emerald 50
  doc.roundedRect(card2X, startY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(card2X, startY, cardWidth, cardHeight, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(6, 95, 70); // Emerald 800
  doc.text('TOTAL RETURNED', card2X + 3, startY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(6, 78, 59);
  doc.text(formatCurrencyPdf(summary.returned), card2X + 3, startY + 13);

  // Card 3: Net Pending Balance
  const card3X = card2X + cardWidth + 4;
  doc.setFillColor(255, 241, 242); // Rose 50
  doc.roundedRect(card3X, startY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(card3X, startY, cardWidth, cardHeight, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(159, 18, 57); // Rose 800
  doc.text('NET PENDING RECOVERY', card3X + 3, startY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(136, 19, 55);
  doc.text(formatCurrencyPdf(summary.net), card3X + 3, startY + 13);

  // Scope info subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Scope: ${summary.periodLabel || 'All Records'} | Total Transactions: ${summary.totalCount}`,
    14,
    startY + 23
  );

  // Table Data
  const tableData = transactions.map((t, idx) => {
    const isGiven = t.transaction_type === 'given';
    return [
      (idx + 1).toString(),
      formatDatePdf(t.transaction_date),
      t.person_name || '-',
      t.category || t.purpose || '-',
      t.payment_method || '-',
      isGiven ? formatCurrencyPdf(t.amount) : '-',
      !isGiven ? formatCurrencyPdf(t.amount) : '-',
      t.transaction_type.toUpperCase()
    ];
  });

  autoTable(doc, {
    startY: startY + 26,
    head: [[
      '#',
      'Date',
      'Person Name',
      'Category / Purpose',
      'Method',
      'Given (Debit)',
      'Returned (Credit)',
      'Type'
    ]],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 22 },
      2: { fontStyle: 'bold', cellWidth: 36 },
      3: { cellWidth: 44 },
      4: { cellWidth: 20 },
      5: { halign: 'right', cellWidth: 24, fontStyle: 'bold', textColor: [37, 99, 235] },
      6: { halign: 'right', cellWidth: 24, fontStyle: 'bold', textColor: [5, 150, 105] },
      7: { halign: 'center', cellWidth: 16 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14, bottom: 18 },
    foot: [[
      '',
      '',
      'TOTALS',
      '',
      '',
      formatCurrencyPdf(summary.given),
      formatCurrencyPdf(summary.returned),
      ''
    ]],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'right'
    },
    didDrawPage: (data) => {
      const str = 'Page ' + (doc as any).getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'FinancialFree Confidential Audit Statement',
        14,
        doc.internal.pageSize.getHeight() - 8
      );
      doc.text(
        str,
        pageWidth - 14,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'right' }
      );
    }
  });

  const filename = `FinancialFree_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

/**
 * 2. Export Formatted People Directory / Borrowers Ledger PDF
 */
export const exportPeopleDirectoryPdf = (
  people: Person[],
  filters?: {
    status?: string;
    category?: string;
    search?: string;
  }
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // Header Banner
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFillColor(16, 185, 129); // Emerald 500 accent
  doc.rect(0, 27, pageWidth, 1.5, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('FINANCIALFREE', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(167, 243, 208);
  doc.text('Borrowers & Contact Directory Statement', 14, 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('PEOPLE LEDGER DIRECTORY', pageWidth - 14, 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Generated: ${todayStr}`, pageWidth - 14, 18, { align: 'right' });

  // Summary Metrics
  const totalGiven = people.reduce((s, p) => s + (p.total_given || 0), 0);
  const totalReturned = people.reduce((s, p) => s + (p.total_returned || 0), 0);
  const totalPending = people.reduce((s, p) => s + (p.remaining_balance || 0), 0);

  const startY = 34;
  const cardWidth = (pageWidth - 28 - 8) / 3;
  const cardHeight = 18;

  // Box 1
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(14, startY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(14, startY, cardWidth, cardHeight, 2, 2, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 64, 175);
  doc.text('TOTAL ADVANCES (GIVEN)', 17, startY + 5);
  doc.setFontSize(12);
  doc.setTextColor(30, 58, 138);
  doc.text(formatCurrencyPdf(totalGiven), 17, startY + 13);

  // Box 2
  const card2X = 14 + cardWidth + 4;
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(card2X, startY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(card2X, startY, cardWidth, cardHeight, 2, 2, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(6, 95, 70);
  doc.text('TOTAL RECOVERED (RETURNED)', card2X + 3, startY + 5);
  doc.setFontSize(12);
  doc.setTextColor(6, 78, 59);
  doc.text(formatCurrencyPdf(totalReturned), card2X + 3, startY + 13);

  // Box 3
  const card3X = card2X + cardWidth + 4;
  doc.setFillColor(255, 241, 242);
  doc.roundedRect(card3X, startY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(card3X, startY, cardWidth, cardHeight, 2, 2, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(159, 18, 57);
  doc.text('OUTSTANDING BALANCE', card3X + 3, startY + 5);
  doc.setFontSize(12);
  doc.setTextColor(136, 19, 55);
  doc.text(formatCurrencyPdf(totalPending), card3X + 3, startY + 13);

  const filterSummary = `Showing ${people.length} profiles | Status: ${filters?.status || 'All'} | Category: ${filters?.category || 'All'}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(filterSummary, 14, startY + 23);

  const tableData = people.map((p, idx) => {
    return [
      (idx + 1).toString(),
      p.full_name,
      p.category || 'General',
      p.phone || '-',
      formatCurrencyPdf(p.total_given || 0),
      formatCurrencyPdf(p.total_returned || 0),
      formatCurrencyPdf(p.remaining_balance || 0),
      (p.status || 'PENDING').toUpperCase()
    ];
  });

  autoTable(doc, {
    startY: startY + 26,
    head: [[
      '#',
      'Name',
      'Category',
      'Phone',
      'Total Given',
      'Returned',
      'Balance',
      'Status'
    ]],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { fontStyle: 'bold', cellWidth: 40 },
      2: { cellWidth: 24 },
      3: { cellWidth: 26 },
      4: { halign: 'right', cellWidth: 26, fontStyle: 'bold', textColor: [37, 99, 235] },
      5: { halign: 'right', cellWidth: 24, fontStyle: 'bold', textColor: [5, 150, 105] },
      6: { halign: 'right', cellWidth: 26, fontStyle: 'bold', textColor: [225, 29, 72] },
      7: { halign: 'center', cellWidth: 18 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14, bottom: 18 },
    foot: [[
      '',
      'PORTFOLIO TOTALS',
      '',
      '',
      formatCurrencyPdf(totalGiven),
      formatCurrencyPdf(totalReturned),
      formatCurrencyPdf(totalPending),
      ''
    ]],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'right'
    },
    didDrawPage: () => {
      const str = 'Page ' + (doc as any).getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'FinancialFree Directory Ledger Document',
        14,
        doc.internal.pageSize.getHeight() - 8
      );
      doc.text(
        str,
        pageWidth - 14,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'right' }
      );
    }
  });

  const filename = `FinancialFree_People_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

/**
 * 3. Export Formatted Individual Borrower Account Statement PDF
 */
export const exportPersonStatementPdf = (
  person: Person,
  transactions: Transaction[]
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setFillColor(59, 130, 246); // Blue 500
  doc.rect(0, 29, pageWidth, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('FINANCIALFREE', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(191, 219, 254);
  doc.text('Borrower Personal Account Ledger Statement', 14, 19);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('OFFICIAL ACCOUNT STATEMENT', pageWidth - 14, 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Date of Issue: ${todayStr}`, pageWidth - 14, 19, { align: 'right' });

  // Borrower Profile Card
  const startY = 36;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, startY, pageWidth - 28, 24, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, startY, pageWidth - 28, 24, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(person.full_name, 19, startY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Category: ${person.category || 'General'}   |   Phone: ${person.phone || 'N/A'}   |   Email: ${person.email || 'N/A'}`,
    19,
    startY + 14
  );
  if (person.address) {
    doc.text(`Address: ${person.address}`, 19, startY + 19);
  }

  // Account Balances Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('OUTSTANDING BALANCE', pageWidth - 19, startY + 7, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(225, 29, 72); // Rose 600
  doc.text(formatCurrencyPdf(person.remaining_balance || 0), pageWidth - 19, startY + 15, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const statusColor = person.remaining_balance <= 0 ? [5, 150, 105] : [225, 29, 72];
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(`Status: ${(person.status || 'PENDING').toUpperCase()}`, pageWidth - 19, startY + 20, { align: 'right' });

  // Sorted Transactions chronologically for running balance calculation
  const sortedTxs = [...transactions].sort(
    (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
  );

  let runningBalance = 0;
  const tableData = sortedTxs.map((t, idx) => {
    const isGiven = t.transaction_type === 'given';
    if (isGiven) {
      runningBalance += t.amount;
    } else {
      runningBalance -= t.amount;
    }

    return [
      (idx + 1).toString(),
      formatDatePdf(t.transaction_date),
      t.category || t.purpose || (isGiven ? 'Money Given' : 'Money Returned'),
      t.payment_method || 'UPI',
      isGiven ? formatCurrencyPdf(t.amount) : '-',
      !isGiven ? formatCurrencyPdf(t.amount) : '-',
      formatCurrencyPdf(Math.max(0, runningBalance))
    ];
  });

  autoTable(doc, {
    startY: startY + 28,
    head: [[
      '#',
      'Date',
      'Description / Purpose',
      'Method',
      'Given (Debit)',
      'Returned (Credit)',
      'Balance'
    ]],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 24 },
      2: { cellWidth: 54 },
      3: { cellWidth: 22 },
      4: { halign: 'right', cellWidth: 26, fontStyle: 'bold', textColor: [37, 99, 235] },
      5: { halign: 'right', cellWidth: 26, fontStyle: 'bold', textColor: [5, 150, 105] },
      6: { halign: 'right', cellWidth: 28, fontStyle: 'bold', textColor: [225, 29, 72] }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14, bottom: 25 },
    foot: [[
      '',
      '',
      'TOTAL ACCUMULATED',
      '',
      formatCurrencyPdf(person.total_given || 0),
      formatCurrencyPdf(person.total_returned || 0),
      formatCurrencyPdf(person.remaining_balance || 0)
    ]],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'right'
    },
    didDrawPage: () => {
      const pageHeight = doc.internal.pageSize.getHeight();
      const str = 'Page ' + (doc as any).getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Borrower Statement: ${person.full_name} | Generated via FinancialFree`,
        14,
        pageHeight - 8
      );
      doc.text(
        str,
        pageWidth - 14,
        pageHeight - 8,
        { align: 'right' }
      );
    }
  });

  const cleanName = person.full_name.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Statement_${cleanName}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
