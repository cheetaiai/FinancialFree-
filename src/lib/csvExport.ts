import { Transaction, MonthlyAnalytics } from '../types';
import { MONTH_NAMES } from './formatters';

/**
 * Escapes a cell value according to RFC 4180 CSV standard.
 */
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export interface ExportCSVOptions {
  year: number;
  month: number;
  analytics: MonthlyAnalytics;
  currencyCode?: string;
  currencySymbol?: string;
}

/**
 * Exports monthly transaction ledger and executive summary into an RFC 4180 CSV
 * compatible with Microsoft Excel, Google Sheets, Tally, Zoho Books, Xero, and QuickBooks.
 */
export function exportMonthlySummaryToCSV({
  year,
  month,
  analytics,
  currencyCode = 'INR',
  currencySymbol = '₹'
}: ExportCSVOptions): boolean {
  const monthName = MONTH_NAMES[month - 1] || `Month ${month}`;
  const totalGiven = Number(analytics.total_given) || 0;
  const totalReturned = Number(analytics.total_returned) || 0;
  const netBalance = Number(analytics.net_balance) || 0;
  const transactions = analytics.transactions || [];
  const peopleCount = analytics.people_count || (analytics.people_involved ? analytics.people_involved.length : 0);

  const rows: string[] = [];

  // ================= 1. EXECUTIVE ACCOUNTING HEADER =================
  rows.push([escapeCSV('FINANCIALFREE — MONTHLY TRANSACTION ACCOUNTING LEDGER')].join(','));
  rows.push([escapeCSV('Accounting Period'), escapeCSV(`${monthName} ${year}`)].join(','));
  rows.push([escapeCSV('Report Generation Timestamp'), escapeCSV(new Date().toISOString())].join(','));
  rows.push([escapeCSV('Base Currency'), escapeCSV(`${currencyCode} (${currencySymbol})`)].join(','));
  rows.push([escapeCSV('Total Transaction Count'), escapeCSV(transactions.length)].join(','));
  rows.push([escapeCSV('Active Counterparties'), escapeCSV(peopleCount)].join(','));
  rows.push(''); // blank line

  // ================= 2. PERIOD CASHFLOW SUMMARY =================
  rows.push([escapeCSV('--- FINANCIAL SUMMARY ---')].join(','));
  rows.push([escapeCSV('Total Money Given (Cash Outflow / Debits)'), escapeCSV(totalGiven.toFixed(2))].join(','));
  rows.push([escapeCSV('Total Money Returned (Cash Inflow / Credits)'), escapeCSV(totalReturned.toFixed(2))].join(','));
  rows.push([escapeCSV('Net Monthly Flow (Given - Returned)'), escapeCSV(netBalance.toFixed(2))].join(','));
  rows.push(''); // blank line

  // ================= 3. TRANSACTION LEDGER TABLE =================
  const headers = [
    'Transaction Ref / ID',
    'Date',
    'Counterparty Name',
    'Transaction Type',
    'Accounting Direction',
    `Amount (${currencyCode})`,
    'Payment Method',
    'Category',
    'Purpose / Description',
    'Financial Period',
    'Notes'
  ];
  rows.push(headers.map(escapeCSV).join(','));

  // Sort transactions chronologically
  const sortedTx = [...transactions].sort(
    (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
  );

  sortedTx.forEach((tx) => {
    const isGiven = tx.transaction_type === 'given';
    const row = [
      tx.id,
      tx.transaction_date,
      tx.person_name || 'N/A',
      isGiven ? 'Given (Loan / Advance)' : 'Returned (Repayment)',
      isGiven ? 'Outflow (Debit)' : 'Inflow (Credit)',
      Number(tx.amount || 0).toFixed(2),
      tx.payment_method || 'UPI',
      tx.category || 'General',
      tx.purpose || '',
      tx.financial_year || `${monthName} ${year}`,
      tx.notes || ''
    ];
    rows.push(row.map(escapeCSV).join(','));
  });

  // ================= 4. LEDGER TOTALS =================
  rows.push('');
  rows.push([
    escapeCSV('TOTALS'),
    escapeCSV(''),
    escapeCSV(''),
    escapeCSV(''),
    escapeCSV('Net Flow:'),
    escapeCSV(netBalance.toFixed(2)),
    escapeCSV(''),
    escapeCSV(''),
    escapeCSV(''),
    escapeCSV(''),
    escapeCSV('')
  ].join(','));

  // Prepend UTF-8 BOM (\uFEFF) for immediate character recognition in MS Excel
  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `FinancialFree_Monthly_Summary_${year}_${String(month).padStart(2, '0')}.csv`;

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}
