import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Person,
  Transaction,
  ShoppingSpend,
  PublicShareData,
  MonthlyAnalytics,
  YearlyAnalytics,
  FinancialYearAnalytics
} from '../types';

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

/**
 * 6. Export All Details Shopping & Groceries Spends PDF
 */
export const exportShoppingSpendsPdf = (
  spends: ShoppingSpend[],
  categoryFilterTitle: string = 'All Spending & Services'
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // Calculate totals
  const totalSpend = spends.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const groceriesTotal = spends
    .filter(s => s.category === 'groceries' || s.category === 'supermarket')
    .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const shoppingTotal = spends
    .filter(s => s.category === 'shopping')
    .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const homeServicesTotal = spends
    .filter(s => s.is_home_service)
    .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  // Modern Dark Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 30, 'F');

  // Accent Line
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(0, 29, pageWidth, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('FINANCIALFREE', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('Shopping, Groceries & Home Services Spends Statement', 14, 21);

  doc.setFontSize(8);
  doc.text(`Generated: ${todayStr}`, pageWidth - 14, 13, { align: 'right' });
  doc.text(`Filter: ${categoryFilterTitle}`, pageWidth - 14, 21, { align: 'right' });

  // Summary Metrics Box
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.roundedRect(14, 35, pageWidth - 28, 22, 2.5, 2.5, 'F');
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.3);
  doc.roundedRect(14, 35, pageWidth - 28, 22, 2.5, 2.5, 'S');

  const colW = (pageWidth - 28) / 4;

  // Box 1: Total Spent
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL SPEND', 14 + 5, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrencyPdf(totalSpend), 14 + 5, 51);

  // Box 2: Groceries & Mart
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('GROCERIES & MART', 14 + colW + 5, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105); // Emerald 600
  doc.text(formatCurrencyPdf(groceriesTotal), 14 + colW + 5, 51);

  // Box 3: Shopping
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PERSONAL SHOPPING', 14 + colW * 2 + 5, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(217, 119, 6); // Amber 600
  doc.text(formatCurrencyPdf(shoppingTotal), 14 + colW * 2 + 5, 51);

  // Box 4: Home Services & Bills
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('HOME SERVICES & BILLS', 14 + colW * 3 + 5, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235); // Blue 600
  doc.text(formatCurrencyPdf(homeServicesTotal), 14 + colW * 3 + 5, 51);

  // Table rows
  const sorted = [...spends].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const rows = sorted.map((s, idx) => [
    (idx + 1).toString(),
    formatDatePdf(s.date),
    s.category.replace(/_/g, ' ').toUpperCase(),
    s.title,
    s.merchant || '-',
    s.payment_method || 'UPI',
    s.notes || '-',
    formatCurrencyPdf(s.amount)
  ]);

  autoTable(doc, {
    startY: 62,
    head: [[
      '#',
      'Date',
      'Category',
      'Item / Service Name',
      'Merchant / Vendor',
      'Payment',
      'Notes',
      'Amount'
    ]],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 3.5,
      halign: 'left'
    },
    styles: {
      font: 'helvetica',
      fontStyle: 'normal',
      fontSize: 8.5,
      cellPadding: 3,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 22 },
      2: { cellWidth: 28, fontStyle: 'bold', textColor: [30, 41, 59] },
      3: { cellWidth: 40, fontStyle: 'bold' },
      4: { cellWidth: 26 },
      5: { cellWidth: 18 },
      6: { cellWidth: 24 },
      7: { halign: 'right', cellWidth: 22, fontStyle: 'bold', textColor: [15, 23, 42] }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14, bottom: 20 },
    foot: [[
      '',
      '',
      '',
      'TOTAL ACCUMULATED SPENDS',
      '',
      '',
      `${spends.length} Items`,
      formatCurrencyPdf(totalSpend)
    ]],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 3.5,
      halign: 'right'
    },
    didDrawPage: () => {
      const totalPages = (doc as any).getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'FinancialFree • Verified Spends Record',
        14,
        pageHeight - 8
      );
      doc.text(
        `Page ${doc.getCurrentPageInfo().pageNumber} of ${totalPages}`,
        pageWidth - 14,
        pageHeight - 8,
        { align: 'right' }
      );
    }
  });

  const filename = `Spends_Details_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

/**
 * 7. Export Public Share (Money Given & Taken Only) Statement PDF
 */
export const exportPublicSharePdf = (share: PublicShareData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // Dark Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Accent Line
  const net = share.netBalance;
  if (net > 0) doc.setFillColor(5, 150, 105); // Emerald
  else if (net < 0) doc.setFillColor(225, 29, 72); // Rose
  else doc.setFillColor(100, 116, 139); // Slate
  doc.rect(0, 31, pageWidth, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('FINANCIALFREE', 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Official Settlement Statement: ${share.personName}`, 14, 22);

  doc.setFontSize(8);
  doc.text(`Share Ref: #${share.shareId}`, pageWidth - 14, 14, { align: 'right' });
  doc.text(`Generated: ${todayStr}`, pageWidth - 14, 22, { align: 'right' });

  // Summary Metrics Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 38, pageWidth - 28, 24, 2.5, 2.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, 38, pageWidth - 28, 24, 2.5, 2.5, 'S');

  const colW = (pageWidth - 28) / 3;

  // Given
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('MONEY GIVEN (LENT)', 14 + 6, 46);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(formatCurrencyPdf(share.totalGiven), 14 + 6, 56);

  // Taken / Returned
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('MONEY RETURNED (TAKEN)', 14 + colW + 6, 46);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(formatCurrencyPdf(share.totalReturned), 14 + colW + 6, 56);

  // Net Balance
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const statusLabel = net > 0 ? 'RECEIVABLE BALANCE' : net < 0 ? 'PAYABLE BALANCE' : 'SETTLED BALANCE';
  doc.text(statusLabel, 14 + colW * 2 + 6, 46);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  if (net > 0) doc.setTextColor(5, 150, 105);
  else if (net < 0) doc.setTextColor(225, 29, 72);
  else doc.setTextColor(100, 116, 139);
  doc.text(formatCurrencyPdf(Math.abs(net)), 14 + colW * 2 + 6, 56);

  // Transactions Table
  const rows = (share.transactions || []).map((t, idx) => [
    (idx + 1).toString(),
    formatDatePdf(t.date),
    t.type === 'given' ? 'Money Given' : 'Money Returned',
    t.notes || t.category || '-',
    t.type === 'given' ? formatCurrencyPdf(t.amount) : '-',
    t.type === 'returned' ? formatCurrencyPdf(t.amount) : '-'
  ]);

  autoTable(doc, {
    startY: 68,
    head: [[
      '#',
      'Date',
      'Transaction Type',
      'Notes / Purpose',
      'Given (+)',
      'Returned (-)'
    ]],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left'
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
      lineWidth: 0.15
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 26 },
      2: { cellWidth: 34, fontStyle: 'bold' },
      3: { cellWidth: 54 },
      4: { halign: 'right', cellWidth: 30, fontStyle: 'bold', textColor: [37, 99, 235] },
      5: { halign: 'right', cellWidth: 30, fontStyle: 'bold', textColor: [5, 150, 105] }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14, bottom: 20 },
    foot: [[
      '',
      '',
      'NET SETTLEMENT',
      statusLabel,
      formatCurrencyPdf(share.totalGiven),
      formatCurrencyPdf(share.totalReturned)
    ]],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'right'
    },
    didDrawPage: () => {
      const totalPages = (doc as any).getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `FinancialFree Public Ledger • Ref #${share.shareId}`,
        14,
        pageHeight - 8
      );
      doc.text(
        `Page ${doc.getCurrentPageInfo().pageNumber} of ${totalPages}`,
        pageWidth - 14,
        pageHeight - 8,
        { align: 'right' }
      );
    }
  });

  const cleanName = share.personName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Ledger_${cleanName}_${share.shareId}.pdf`;
  doc.save(filename);
};

const MONTH_NAMES_LIST = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * 8. Export Ultra-Clarity Monthly Accounting Ledger & Audit PDF
 */
export const exportMonthlySummaryPdf = ({
  year,
  month,
  analytics,
  currencySymbol = 'Rs.'
}: {
  year: number;
  month: number;
  analytics: MonthlyAnalytics;
  currencySymbol?: string;
}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  doc.setProperties({
    title: `Monthly Ledger - ${MONTH_NAMES_LIST[month - 1]} ${year}`,
    subject: 'FinancialFree Monthly Accounting & Audit Report',
    author: 'FinancialFree Pro',
    creator: 'Ultra-Clarity High-Definition PDF Engine'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const monthName = MONTH_NAMES_LIST[month - 1] || `Month ${month}`;
  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // Top Dark Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Accent Line
  doc.setFillColor(37, 99, 235); // Blue 600
  doc.rect(0, 31, pageWidth, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('FINANCIALFREE PRO', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(191, 219, 254);
  doc.text('Monthly Accounting Ledger & Audit Statement', 14, 21);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(`${monthName.toUpperCase()} ${year}`, pageWidth - 14, 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Generated: ${todayStr}`, pageWidth - 14, 21, { align: 'right' });

  // 4 Ultra-Clarity Metric Cards
  const startY = 38;
  const colW = (pageWidth - 28 - 9) / 4;
  const cardH = 20;

  // Card 1: Money Given
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(14, startY, colW, cardH, 2, 2, 'F');
  doc.setDrawColor(191, 219, 254);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, startY, colW, cardH, 2, 2, 'S');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text('MONEY GIVEN', 17, startY + 6);
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text(formatCurrencyPdf(analytics.total_given), 17, startY + 15);

  // Card 2: Money Returned
  const c2X = 14 + colW + 3;
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(c2X, startY, colW, cardH, 2, 2, 'F');
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(c2X, startY, colW, cardH, 2, 2, 'S');

  doc.setFontSize(7.5);
  doc.setTextColor(6, 95, 70);
  doc.text('MONEY RETURNED', c2X + 3, startY + 6);
  doc.setFontSize(11);
  doc.setTextColor(6, 78, 59);
  doc.text(formatCurrencyPdf(analytics.total_returned), c2X + 3, startY + 15);

  // Card 3: Net Balance
  const c3X = 14 + (colW + 3) * 2;
  const net = analytics.net_balance;
  doc.setFillColor(net > 0 ? 255 : 241, net > 0 ? 241 : 245, net > 0 ? 242 : 249);
  doc.roundedRect(c3X, startY, colW, cardH, 2, 2, 'F');
  doc.setDrawColor(net > 0 ? 254 : 203, net > 0 ? 205 : 213, net > 0 ? 211 : 225);
  doc.roundedRect(c3X, startY, colW, cardH, 2, 2, 'S');

  doc.setFontSize(7.5);
  doc.setTextColor(net > 0 ? 159 : 71, net > 0 ? 18 : 85, net > 0 ? 57 : 105);
  doc.text('NET MONTHLY FLOW', c3X + 3, startY + 6);
  doc.setFontSize(11);
  doc.setTextColor(net > 0 ? 190 : 30, net > 0 ? 18 : 41, net > 0 ? 60 : 59);
  doc.text(formatCurrencyPdf(net), c3X + 3, startY + 15);

  // Card 4: Volume & People
  const c4X = 14 + (colW + 3) * 3;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(c4X, startY, colW, cardH, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(c4X, startY, colW, cardH, 2, 2, 'S');

  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('RECORDS & USERS', c4X + 3, startY + 6);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${analytics.transaction_count} Tx • ${analytics.people_count} People`, c4X + 3, startY + 15);

  // Transactions Itemized Table
  const txRows = (analytics.transactions || []).map((t, idx) => {
    const txDate = t.transaction_date || (t as any).date;
    const txType = t.transaction_type || (t as any).type;
    const isGiven = txType === 'given';
    return [
      (idx + 1).toString(),
      formatDatePdf(txDate),
      t.person_name || 'Direct',
      isGiven ? 'Money Given' : 'Money Returned',
      (t.payment_method || 'UPI').toUpperCase(),
      t.notes || t.category || t.purpose || '-',
      isGiven ? `+${formatCurrencyPdf(t.amount)}` : `-${formatCurrencyPdf(t.amount)}`
    ];
  });

  autoTable(doc, {
    startY: 65,
    head: [[
      '#',
      'Date',
      'Person / Counterparty',
      'Type',
      'Payment',
      'Notes / Details',
      'Amount'
    ]],
    body: txRows.length > 0 ? txRows : [['-', '-', 'No transactions recorded for this month', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 3.5,
      halign: 'left'
    },
    styles: {
      font: 'helvetica',
      fontStyle: 'normal',
      fontSize: 8.5,
      cellPadding: 3,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 22 },
      2: { cellWidth: 38, fontStyle: 'bold' },
      3: { cellWidth: 28 },
      4: { cellWidth: 22 },
      5: { cellWidth: 38 },
      6: { halign: 'right', cellWidth: 26, fontStyle: 'bold', textColor: [15, 23, 42] }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14, bottom: 20 },
    foot: [[
      '',
      '',
      '',
      'MONTHLY TOTALS',
      '',
      `Given: ${formatCurrencyPdf(analytics.total_given)} | Ret: ${formatCurrencyPdf(analytics.total_returned)}`,
      `Net: ${formatCurrencyPdf(analytics.net_balance)}`
    ]],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: 3.2,
      halign: 'right'
    },
    didDrawPage: () => {
      const totalPages = (doc as any).getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `FinancialFree Monthly Ledger • ${monthName} ${year}`,
        14,
        pageHeight - 8
      );
      doc.text(
        `Page ${doc.getCurrentPageInfo().pageNumber} of ${totalPages}`,
        pageWidth - 14,
        pageHeight - 8,
        { align: 'right' }
      );
    }
  });

  const filename = `Monthly_Ledger_${year}_${String(month).padStart(2, '0')}.pdf`;
  doc.save(filename);
};

/**
 * 9. Export Ultra-Clarity Yearly Financial Statement & Annual Audit PDF
 */
export const exportYearlySummaryPdf = ({
  year,
  fyLabel,
  viewType,
  data,
  currencySymbol = 'Rs.'
}: {
  year?: number;
  fyLabel?: string;
  viewType: 'calendar' | 'financial' | 'fy';
  data: YearlyAnalytics | FinancialYearAnalytics;
  currencySymbol?: string;
}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const periodTitle = viewType === 'calendar' ? `Calendar Year ${year}` : `${fyLabel || 'Financial Year'}`;

  doc.setProperties({
    title: `Annual Statement - ${periodTitle}`,
    subject: 'FinancialFree Pro Annual Financial Statement & Audit',
    author: 'FinancialFree Pro',
    creator: 'Ultra-Clarity High-Definition PDF Engine'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // Top Dark Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Accent Line
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(0, 31, pageWidth, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('FINANCIALFREE PRO', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(167, 243, 208);
  doc.text('Annual Financial Statement & Audit Report', 14, 21);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(periodTitle.toUpperCase(), pageWidth - 14, 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Generated: ${todayStr}`, pageWidth - 14, 21, { align: 'right' });

  // 4 Ultra-Clarity Metric Cards
  const startY = 38;
  const colW = (pageWidth - 28 - 9) / 4;
  const cardH = 20;

  const totalGiven = data.total_given || 0;
  const totalReturned = data.total_returned || 0;
  const netFlow = totalGiven - totalReturned;
  const recoveryRate = totalGiven > 0 ? (totalReturned / totalGiven) * 100 : 0;

  // Card 1: Annual Given
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(14, startY, colW, cardH, 2, 2, 'F');
  doc.setDrawColor(191, 219, 254);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, startY, colW, cardH, 2, 2, 'S');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text('ANNUAL GIVEN', 17, startY + 6);
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text(formatCurrencyPdf(totalGiven), 17, startY + 15);

  // Card 2: Annual Returned
  const c2X = 14 + colW + 3;
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(c2X, startY, colW, cardH, 2, 2, 'F');
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(c2X, startY, colW, cardH, 2, 2, 'S');

  doc.setFontSize(7.5);
  doc.setTextColor(6, 95, 70);
  doc.text('ANNUAL RETURNED', c2X + 3, startY + 6);
  doc.setFontSize(11);
  doc.setTextColor(6, 78, 59);
  doc.text(formatCurrencyPdf(totalReturned), c2X + 3, startY + 15);

  // Card 3: Net Annual Flow
  const c3X = 14 + (colW + 3) * 2;
  doc.setFillColor(netFlow > 0 ? 255 : 241, netFlow > 0 ? 241 : 245, netFlow > 0 ? 242 : 249);
  doc.roundedRect(c3X, startY, colW, cardH, 2, 2, 'F');
  doc.setDrawColor(netFlow > 0 ? 254 : 203, netFlow > 0 ? 205 : 213, netFlow > 0 ? 211 : 225);
  doc.roundedRect(c3X, startY, colW, cardH, 2, 2, 'S');

  doc.setFontSize(7.5);
  doc.setTextColor(netFlow > 0 ? 159 : 71, netFlow > 0 ? 18 : 85, netFlow > 0 ? 57 : 105);
  doc.text('NET OUTSTANDING', c3X + 3, startY + 6);
  doc.setFontSize(11);
  doc.setTextColor(netFlow > 0 ? 190 : 30, netFlow > 0 ? 18 : 41, netFlow > 0 ? 60 : 59);
  doc.text(formatCurrencyPdf(netFlow), c3X + 3, startY + 15);

  // Card 4: Recovery Rate
  const c4X = 14 + (colW + 3) * 3;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(c4X, startY, colW, cardH, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(c4X, startY, colW, cardH, 2, 2, 'S');

  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('RECOVERY RATE', c4X + 3, startY + 6);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${recoveryRate.toFixed(1)}%`, c4X + 3, startY + 15);

  // Month-by-Month Breakdown Table
  const monthlyBreakdown = (data as any).monthly_breakdown || [];
  const monthRows = monthlyBreakdown.map((m: any, idx: number) => [
    (idx + 1).toString(),
    m.month_name,
    formatCurrencyPdf(m.given || 0),
    formatCurrencyPdf(m.returned || 0),
    formatCurrencyPdf((m.given || 0) - (m.returned || 0)),
    (m.transaction_count || m.count || 0).toString()
  ]);

  autoTable(doc, {
    startY: 65,
    head: [[
      '#',
      'Month',
      'Money Given (+)',
      'Money Returned (-)',
      'Net Flow',
      'Tx Count'
    ]],
    body: monthRows.length > 0 ? monthRows : [['-', 'No monthly records', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 3.5,
      halign: 'left'
    },
    styles: {
      font: 'helvetica',
      fontStyle: 'normal',
      fontSize: 8.5,
      cellPadding: 3,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { halign: 'right', cellWidth: 34, textColor: [37, 99, 235], fontStyle: 'bold' },
      3: { halign: 'right', cellWidth: 34, textColor: [5, 150, 105], fontStyle: 'bold' },
      4: { halign: 'right', cellWidth: 34, fontStyle: 'bold', textColor: [15, 23, 42] },
      5: { halign: 'center', cellWidth: 28 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14, bottom: 20 },
    foot: [[
      '',
      'ANNUAL TOTALS',
      formatCurrencyPdf(totalGiven),
      formatCurrencyPdf(totalReturned),
      formatCurrencyPdf(netFlow),
      `${data.transaction_count || 0} Tx`
    ]],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 3.5,
      halign: 'right'
    },
    didDrawPage: () => {
      const totalPages = (doc as any).getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `FinancialFree Annual Statement • ${periodTitle}`,
        14,
        pageHeight - 8
      );
      doc.text(
        `Page ${doc.getCurrentPageInfo().pageNumber} of ${totalPages}`,
        pageWidth - 14,
        pageHeight - 8,
        { align: 'right' }
      );
    }
  });

  const safePeriod = periodTitle.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Annual_Statement_${safePeriod}.pdf`;
  doc.save(filename);
};

