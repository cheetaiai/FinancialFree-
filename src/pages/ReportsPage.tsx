import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  FileBarChart2,
  Download,
  Upload,
  Printer,
  FileSpreadsheet,
  FileCode,
  Users,
  AlertCircle,
  CheckCircle2,
  Search,
  Eye,
  RefreshCw,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  ComposedChart
} from 'recharts';
import { LiquidGlassCard } from '../components/ui/LiquidGlassCard';
import { LiquidButton } from '../components/ui/LiquidButton';
import { LiquidDropdown } from '../components/ui/LiquidDropdown';
import { Person, Transaction, BackupData } from '../types';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatINR, formatIndianDate, MONTH_NAMES, MONTH_SHORT_NAMES } from '../lib/formatters';

export const ReportsPage: React.FC = () => {
  const { showToast } = useToast();
  const { formatAmount, currencySymbol } = useCurrency();
  const [people, setPeople] = useState<Person[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string>('all');
  const [selectedReportType, setSelectedReportType] = useState<'all' | 'pending' | 'person' | 'monthly'>('all');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      const [peopleList, txList] = await Promise.all([
        api.getPeople(),
        api.getTransactions()
      ]);
      setPeople(peopleList);
      setTransactions(txList);
    } catch (err) {
      console.error('Failed to load reports data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute Last 6 Months Trends for Lending & Repayment
  const spendingTrendsData = useMemo(() => {
    const monthsData: {
      monthKey: string;
      label: string;
      given: number;
      returned: number;
      net: number;
    }[] = [];

    const now = new Date();

    // Generate chronological array for past 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthKey = `${y}-${m < 10 ? '0' + m : m}`;
      const label = `${MONTH_SHORT_NAMES[d.getMonth()]} ${y.toString().slice(-2)}`;

      monthsData.push({
        monthKey,
        label,
        given: 0,
        returned: 0,
        net: 0
      });
    }

    // Aggregate transactions into the 6 months buckets
    transactions.forEach(tx => {
      const txDate = new Date(tx.transaction_date);
      const txM = txDate.getMonth() + 1;
      const txY = txDate.getFullYear();
      const key = `${txY}-${txM < 10 ? '0' + txM : txM}`;

      const target = monthsData.find(d => d.monthKey === key);
      if (target) {
        if (tx.transaction_type === 'given') {
          target.given += tx.amount;
        } else if (tx.transaction_type === 'returned') {
          target.returned += tx.amount;
        }
      }
    });

    // Calculate net for each month
    monthsData.forEach(d => {
      d.net = d.given - d.returned;
    });

    return monthsData;
  }, [transactions]);

  // Overall 6-Month Aggregate Metrics
  const sixMonthGiven = useMemo(() => spendingTrendsData.reduce((acc, curr) => acc + curr.given, 0), [spendingTrendsData]);
  const sixMonthReturned = useMemo(() => spendingTrendsData.reduce((acc, curr) => acc + curr.returned, 0), [spendingTrendsData]);
  const recoveryRate = sixMonthGiven > 0 ? Math.round((sixMonthReturned / sixMonthGiven) * 100) : 0;

  // Filter transactions based on active report mode
  const getReportTransactions = (): Transaction[] => {
    switch (selectedReportType) {
      case 'person':
        if (selectedPersonId === 'all') return transactions;
        return transactions.filter(t => t.person_id === selectedPersonId);
      case 'pending':
        const pendingPersonIds = new Set(
          people.filter(p => (p.remaining_balance || 0) > 0).map(p => p.id)
        );
        return transactions.filter(t => pendingPersonIds.has(t.person_id));
      case 'monthly':
        return transactions.filter(t => t.month === selectedMonth && t.year === selectedYear);
      case 'all':
      default:
        return transactions;
    }
  };

  const reportTransactions = getReportTransactions();
  const reportGiven = reportTransactions
    .filter(t => t.transaction_type === 'given')
    .reduce((sum, t) => sum + t.amount, 0);
  const reportReturned = reportTransactions
    .filter(t => t.transaction_type === 'returned')
    .reduce((sum, t) => sum + t.amount, 0);
  const reportNet = reportGiven - reportReturned;

  // Export CSV
  const handleExportCSV = () => {
    try {
      setIsExporting(true);
      const rows = [
        ['Transaction ID', 'Date', 'Person Name', 'Type', `Amount (${currencySymbol})`, 'Payment Method', 'Month', 'Year', 'Financial Year', 'Purpose', 'Notes']
      ];

      reportTransactions.forEach(t => {
        rows.push([
          `"${t.id}"`,
          `"${t.transaction_date}"`,
          `"${t.person_name.replace(/"/g, '""')}"`,
          `"${t.transaction_type}"`,
          `"${t.amount}"`,
          `"${t.payment_method}"`,
          `"${t.month}"`,
          `"${t.year}"`,
          `"${t.financial_year}"`,
          `"${(t.purpose || '').replace(/"/g, '""')}"`,
          `"${(t.notes || '').replace(/"/g, '""')}"`
        ]);
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `financialfree_report_${selectedReportType}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('CSV Report downloaded successfully.', 'success');
    } catch (err: any) {
      showToast('Failed to export CSV', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Export JSON Backup
  const handleExportJSON = async () => {
    try {
      setIsExporting(true);
      const backup = await api.exportBackup();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backup, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `financialfree_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Full JSON backup downloaded.', 'success');
    } catch (err: any) {
      showToast('Failed to export backup', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Import JSON Backup
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.readAsText(files[0], 'UTF-8');
    fileReader.onload = async event => {
      try {
        setIsImporting(true);
        const parsed = JSON.parse(event.target?.result as string) as BackupData;
        if (!parsed.people || !parsed.transactions) {
          throw new Error('Invalid FinancialFree backup file format');
        }

        const res = await api.importBackup(parsed);
        showToast(`Backup restored! ${res.peopleCount} people and ${res.txCount} transactions imported.`, 'success');
        loadData();
      } catch (err: any) {
        showToast(err.message || 'Failed to restore backup file', 'error');
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
  };

  const selectedPersonObj = people.find(p => p.id === selectedPersonId);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-xl liquid-glass-secondary border border-slate-200/80 dark:border-white/10 shadow-lg text-xs space-y-1.5 backdrop-blur-md">
          <div className="font-bold text-slate-900 dark:text-white border-b border-black/5 dark:border-white/10 pb-1">
            {label}
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-mono font-black text-slate-900 dark:text-white">
                {formatAmount(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
            Export & Analytics
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Financial Reports & Trends
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Visualize lending patterns over time and generate printable audited statements.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap no-print">
          <LiquidButton
            variant="secondary"
            size="sm"
            onClick={() => window.print()}
            icon={<Printer size={15} />}
          >
            Print / PDF
          </LiquidButton>
          <LiquidButton
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            icon={<FileSpreadsheet size={15} />}
            isLoading={isExporting}
          >
            Export CSV
          </LiquidButton>
          <LiquidButton
            variant="primary"
            size="sm"
            onClick={handleExportJSON}
            icon={<Download size={15} />}
          >
            Full Backup (JSON)
          </LiquidButton>
        </div>
      </div>

      {/* SPENDING & REPAYMENT TRENDS (LAST 6 MONTHS LINE CHART) */}
      <LiquidGlassCard variant="primary" className="p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Spending Trends (Last 6 Months)
              </h3>
              <p className="text-xs text-slate-500">
                Monthly lending volume vs. incoming repayments visual trajectory.
              </p>
            </div>
          </div>

          {/* Aggregate Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold flex items-center gap-1.5">
              <ArrowUpRight size={13} />
              <span>6M Lent: {formatAmount(sixMonthGiven)}</span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
              <ArrowDownLeft size={13} />
              <span>6M Repaid: {formatAmount(sixMonthReturned)}</span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs font-bold">
              <span>Recovery Rate: {recoveryRate}%</span>
            </div>
          </div>
        </div>

        {/* Recharts Line / Area Chart */}
        <div className="w-full h-72 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={spendingTrendsData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={val => formatINR(val, false)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="given"
                name="Money Given (Lent)"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="returned"
                name="Money Returned (Repaid)"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </LiquidGlassCard>

      {/* Report Generator Controls */}
      <LiquidGlassCard variant="primary" className="p-5 space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Report Type:</span>
            {[
              { id: 'all', label: 'All Records' },
              { id: 'pending', label: 'Pending Dues Only' },
              { id: 'person', label: 'Person Statement' },
              { id: 'monthly', label: 'Monthly Report' }
            ].map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedReportType(type.id as any)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  selectedReportType === type.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-black/10'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Conditional Filters based on report type */}
          {selectedReportType === 'person' && (
            <div className="w-64">
              <LiquidDropdown<string>
                placeholder="Select Person"
                options={[
                  { value: 'all', label: 'All People' },
                  ...people.map(p => ({ value: p.id, label: p.full_name }))
                ]}
                value={selectedPersonId}
                onChange={v => setSelectedPersonId(v)}
              />
            </div>
          )}

          {selectedReportType === 'monthly' && (
            <div className="flex items-center gap-2">
              <LiquidDropdown<number>
                options={MONTH_NAMES.map((m, idx) => ({ value: idx + 1, label: m }))}
                value={selectedMonth}
                onChange={v => setSelectedMonth(Number(v))}
              />
              <LiquidDropdown<number>
                options={[2026, 2025, 2024].map(y => ({ value: y, label: y.toString() }))}
                value={selectedYear}
                onChange={v => setSelectedYear(Number(v))}
              />
            </div>
          )}
        </div>
      </LiquidGlassCard>

      {/* Printable Report Document Sheet */}
      <LiquidGlassCard variant="primary" className="p-6 sm:p-8 space-y-6">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-black/10 dark:border-white/10">
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              FinancialFree Statement of Account
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Generated on {formatIndianDate(new Date().toISOString())} • Authorized Single User Ledger
            </div>
            {selectedReportType === 'person' && selectedPersonObj && (
              <div className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                Target Contact: {selectedPersonObj.full_name} ({selectedPersonObj.phone || 'No phone'})
              </div>
            )}
          </div>

          {/* Document Summary Box */}
          <div className="p-3.5 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10 flex items-center gap-4 text-xs">
            <div>
              <div className="text-slate-400 uppercase font-bold text-[10px]">Total Given</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">{formatAmount(reportGiven)}</div>
            </div>
            <div className="h-6 w-[1px] bg-black/10 dark:bg-white/10" />
            <div>
              <div className="text-slate-400 uppercase font-bold text-[10px]">Total Returned</div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatAmount(reportReturned)}</div>
            </div>
            <div className="h-6 w-[1px] bg-black/10 dark:bg-white/10" />
            <div>
              <div className="text-slate-400 uppercase font-bold text-[10px]">Outstanding</div>
              <div className="text-sm font-black text-rose-600 dark:text-rose-400">{formatAmount(reportNet)}</div>
            </div>
          </div>
        </div>

        {/* Transactions Table in Statement */}
        {reportTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-black/10 dark:border-white/10 text-slate-400 text-[11px] uppercase font-bold tracking-wider">
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Contact / Person</th>
                  <th className="pb-3 px-3">Transaction Type</th>
                  <th className="pb-3 px-3">Method</th>
                  <th className="pb-3 px-3">Purpose & Notes</th>
                  <th className="pb-3 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {reportTransactions.map(tx => {
                  const isGiven = tx.transaction_type === 'given';
                  return (
                    <tr key={tx.id}>
                      <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {formatIndianDate(tx.transaction_date)}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {tx.person_name}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isGiven ? 'bg-blue-500/10 text-blue-600' : 'bg-emerald-500/10 text-emerald-600'
                        }`}>
                          {isGiven ? 'Money Given' : 'Money Returned'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {tx.payment_method}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {tx.purpose || tx.notes || '-'}
                      </td>
                      <td className={`py-3 px-3 text-right font-black whitespace-nowrap ${
                        isGiven ? 'text-slate-900 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {isGiven ? '-' : '+'}{formatAmount(tx.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            No transaction records found matching this report criteria.
          </div>
        )}
      </LiquidGlassCard>

      {/* Database Backup / Restore Panel */}
      <LiquidGlassCard variant="secondary" className="p-6 space-y-4 no-print">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
          <FileCode size={20} className="text-purple-500" />
          <span>Full JSON Backup & Restore</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
          You can create a standalone encrypted snapshot of all contacts, transaction ledgers, and reminders to download or restore on another machine at any time.
        </p>

        <div className="flex items-center gap-3 flex-wrap pt-2">
          <LiquidButton
            variant="secondary"
            size="sm"
            onClick={handleExportJSON}
            icon={<Download size={15} />}
          >
            Download Database Backup (.json)
          </LiquidButton>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <LiquidButton
            variant="primary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            icon={<Upload size={15} />}
            isLoading={isImporting}
          >
            Restore Backup from File
          </LiquidButton>
        </div>
      </LiquidGlassCard>
    </div>
  );
};
