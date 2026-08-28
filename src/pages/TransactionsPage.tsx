import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Receipt,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Edit2,
  Trash2,
  Calendar,
  CreditCard,
  User,
  Plus,
  RefreshCw,
  Download,
  Image as ImageIcon,
  X,
  SlidersHorizontal,
  CalendarRange,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { LiquidGlassCard } from '../components/ui/LiquidGlassCard';
import { LiquidButton } from '../components/ui/LiquidButton';
import { LiquidSegmentedControl } from '../components/ui/LiquidSegmentedControl';
import { LiquidDropdown } from '../components/ui/LiquidDropdown';
import { LiquidModal } from '../components/ui/LiquidModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Transaction, Person, PaymentMethod } from '../types';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatINR, formatIndianDate, MONTH_NAMES } from '../lib/formatters';

interface TransactionsPageProps {
  onOpenGiveModal: () => void;
  onOpenReturnModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

type DatePreset = 'all' | 'today' | 'this_week' | 'this_month' | 'last_30_days' | 'this_fy';

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  onOpenGiveModal,
  onOpenReturnModal,
  onEditTransaction
}) => {
  const { showToast } = useToast();
  const { formatAmount, currencySymbol } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([2026, 2025, 2024]);
  const [availableFys, setAvailableFys] = useState<string[]>(['FY 2026-27', 'FY 2025-26']);
  const [isLoading, setIsLoading] = useState(true);

  // Global Search & Primary Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [selectedFy, setSelectedFy] = useState<string>('all');

  // Date Range Filtering
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Deletion State
  const [deleteTxId, setDeleteTxId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Receipt preview modal
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [txList, peopleList, periods] = await Promise.all([
        api.getTransactions(),
        api.getPeople(),
        api.getPeriods().catch(() => ({ years: [2026, 2025], financial_years: ['FY 2026-27'] }))
      ]);
      setTransactions(txList);
      setPeople(peopleList);
      if (periods.years?.length) setAvailableYears(periods.years);
      if (periods.financial_years?.length) setAvailableFys(periods.financial_years);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Preset Date Range Selection
  const applyDatePreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'this_week') {
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diffToMonday));
      setStartDate(monday.toISOString().split('T')[0]);
      setEndDate(new Date().toISOString().split('T')[0]);
    } else if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'last_30_days') {
      const priorDate = new Date();
      priorDate.setDate(priorDate.getDate() - 30);
      setStartDate(priorDate.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'this_fy') {
      const curMonth = now.getMonth() + 1;
      const curYear = now.getFullYear();
      const fyStartYear = curMonth >= 4 ? curYear : curYear - 1;
      setStartDate(`${fyStartYear}-04-01`);
      setEndDate(todayStr);
    }
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setDatePreset('all'); // Custom range overrides presets
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setSelectedPersonId('all');
    setSelectedMethod('all');
    setSelectedFy('all');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    typeFilter !== 'all' ||
    selectedPersonId !== 'all' ||
    selectedMethod !== 'all' ||
    selectedFy !== 'all' ||
    startDate ||
    endDate
  );

  const handleDelete = async () => {
    if (!deleteTxId) return;
    setIsDeleting(true);
    try {
      await api.deleteTransaction(deleteTxId);
      showToast('Transaction deleted and ledger balances recalculated.', 'info');
      setDeleteTxId(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete transaction', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // 1. Search Query (Person Name, purpose, notes, method, amount)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = tx.person_name && tx.person_name.toLowerCase().includes(q);
        const matchesPurpose = tx.purpose && tx.purpose.toLowerCase().includes(q);
        const matchesNotes = tx.notes && tx.notes.toLowerCase().includes(q);
        const matchesMethod = tx.payment_method && tx.payment_method.toLowerCase().includes(q);
        const matchesAmount = tx.amount.toString().includes(q);
        if (!matchesName && !matchesPurpose && !matchesNotes && !matchesMethod && !matchesAmount) {
          return false;
        }
      }

      // 2. Type Filter
      if (typeFilter !== 'all' && tx.transaction_type !== typeFilter) {
        return false;
      }

      // 3. Person Filter
      if (selectedPersonId !== 'all' && tx.person_id !== selectedPersonId) {
        return false;
      }

      // 4. Payment Method
      if (selectedMethod !== 'all' && tx.payment_method !== selectedMethod) {
        return false;
      }

      // 5. Financial Year
      if (selectedFy !== 'all' && tx.financial_year !== selectedFy) {
        return false;
      }

      // 6. Date Range Filter
      if (startDate && tx.transaction_date < startDate) {
        return false;
      }
      if (endDate && tx.transaction_date > endDate) {
        return false;
      }

      return true;
    });
  }, [transactions, searchQuery, typeFilter, selectedPersonId, selectedMethod, selectedFy, startDate, endDate]);

  // Calculate filtered totals
  const filteredGiven = useMemo(() => {
    return filteredTransactions
      .filter(t => t.transaction_type === 'given')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const filteredReturned = useMemo(() => {
    return filteredTransactions
      .filter(t => t.transaction_type === 'returned')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const filteredNet = filteredGiven - filteredReturned;

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
            Accounting Ledger
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Transactions ({transactions.length})
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Complete audit trail with global search, date range filters, and real-time reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <LiquidButton
            variant="primary"
            size="sm"
            onClick={onOpenGiveModal}
            icon={<ArrowUpRight size={15} />}
          >
            Give Money
          </LiquidButton>
          <LiquidButton
            variant="emerald"
            size="sm"
            onClick={onOpenReturnModal}
            icon={<ArrowDownLeft size={15} />}
          >
            Record Return
          </LiquidButton>
        </div>
      </div>

      {/* GLOBAL SEARCH & FILTER BAR (TOP SECTION) */}
      <LiquidGlassCard variant="primary" className="p-4 sm:p-5 space-y-4 shadow-sm border border-slate-200/80 dark:border-white/10">
        {/* Main Search Input & Primary Type Toggle */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
          {/* Global Search Input */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search transactions by person name, purpose, or notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl liquid-glass-secondary border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Type Segmented Control */}
          <div className="flex-shrink-0">
            <LiquidSegmentedControl
              layoutId="tx-type-filter-main"
              size="sm"
              options={[
                { id: 'all', label: 'All Types' },
                { id: 'given', label: 'Given (Lent)' },
                { id: 'returned', label: 'Returned (Repaid)' }
              ]}
              value={typeFilter}
              onChange={setTypeFilter}
            />
          </div>

          {/* Toggle Advanced Filters Button */}
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
              showAdvancedFilters || hasActiveFilters
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-transparent hover:bg-black/10'
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"></span>
            )}
          </button>
        </div>

        {/* Date Range Quick Presets & Custom Pickers */}
        <div className="pt-2 border-t border-black/5 dark:border-white/5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] uppercase font-bold text-slate-400 mr-1 flex items-center gap-1">
              <CalendarRange size={12} />
              <span>Range:</span>
            </span>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_30_days', label: 'Last 30 Days' },
              { id: 'this_fy', label: 'Current FY' }
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyDatePreset(p.id as DatePreset)}
                className={`text-xs px-2.5 py-1 rounded-xl font-medium transition-colors cursor-pointer ${
                  datePreset === p.id && !startDate && !endDate && p.id === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : datePreset === p.id && p.id !== 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-black/10 dark:hover:bg-white/10'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers: From and To */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-white/10 text-xs">
              <span className="text-slate-400 text-[11px]">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => handleCustomDateChange(e.target.value, endDate)}
                className="bg-transparent text-slate-800 dark:text-slate-200 text-xs focus:outline-none cursor-pointer"
              />
            </div>
            <span className="text-slate-400 text-xs">-</span>
            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-white/10 text-xs">
              <span className="text-slate-400 text-[11px]">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={e => handleCustomDateChange(startDate, e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 text-xs focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Advanced Filters (Person, Method, Financial Year) */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden pt-3 border-t border-black/5 dark:border-white/5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Person Dropdown */}
                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">Filter by Person</label>
                  <LiquidDropdown<string>
                    placeholder="All People"
                    options={[
                      { value: 'all', label: 'All People' },
                      ...people.map(p => ({ value: p.id, label: p.full_name }))
                    ]}
                    value={selectedPersonId}
                    onChange={v => setSelectedPersonId(v)}
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">Payment Method</label>
                  <LiquidDropdown<string>
                    placeholder="All Methods"
                    options={[
                      { value: 'all', label: 'All Payment Methods' },
                      { value: 'UPI', label: 'UPI' },
                      { value: 'Bank Transfer', label: 'Bank Transfer' },
                      { value: 'Cash', label: 'Cash' },
                      { value: 'Other', label: 'Other' }
                    ]}
                    value={selectedMethod}
                    onChange={v => setSelectedMethod(v)}
                  />
                </div>

                {/* Financial Year Period */}
                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">Financial Year</label>
                  <LiquidDropdown<string>
                    placeholder="All FY Periods"
                    options={[
                      { value: 'all', label: 'All FY Periods' },
                      ...availableFys.map(fy => ({ value: fy, label: fy }))
                    ]}
                    value={selectedFy}
                    onChange={v => setSelectedFy(v)}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filter Chips & Reset Bar */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/5 dark:border-white/5 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 font-medium text-[11px]">Active Filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                  Query: "{searchQuery}"
                  <button type="button" onClick={() => setSearchQuery('')}><X size={12} /></button>
                </span>
              )}
              {typeFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold capitalize">
                  Type: {typeFilter}
                  <button type="button" onClick={() => setTypeFilter('all')}><X size={12} /></button>
                </span>
              )}
              {selectedPersonId !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold">
                  Person: {people.find(p => p.id === selectedPersonId)?.full_name || 'Selected'}
                  <button type="button" onClick={() => setSelectedPersonId('all')}><X size={12} /></button>
                </span>
              )}
              {(startDate || endDate) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                  Dates: {startDate || 'Earliest'} to {endDate || 'Latest'}
                  <button type="button" onClick={() => { setStartDate(''); setEndDate(''); setDatePreset('all'); }}><X size={12} /></button>
                </span>
              )}
              {selectedMethod !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  Method: {selectedMethod}
                  <button type="button" onClick={() => setSelectedMethod('all')}><X size={12} /></button>
                </span>
              )}
              {selectedFy !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-semibold">
                  FY: {selectedFy}
                  <button type="button" onClick={() => setSelectedFy('all')}><X size={12} /></button>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 font-semibold cursor-pointer transition-colors"
            >
              <RotateCcw size={12} />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </LiquidGlassCard>

      {/* Filtered Live Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <LiquidGlassCard variant="primary" className="p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Total Money Given</div>
            <div className="text-lg sm:text-xl font-black text-slate-950 dark:text-white mt-0.5">
              {formatAmount(filteredGiven)}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <ArrowUpRight size={18} />
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard variant="primary" className="p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Total Returned</div>
            <div className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
              {formatAmount(filteredReturned)}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ArrowDownLeft size={18} />
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard variant="primary" className="p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Net Outstanding Dues</div>
            <div className={`text-lg sm:text-xl font-black mt-0.5 ${filteredNet > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-950 dark:text-white'}`}>
              {formatAmount(filteredNet)}
            </div>
          </div>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${filteredNet > 0 ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-slate-500/10 text-slate-400'}`}>
            <Receipt size={18} />
          </div>
        </LiquidGlassCard>
      </div>

      {/* Transactions Table View */}
      <LiquidGlassCard variant="primary" className="p-0 overflow-hidden shadow-sm">
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-[11px] uppercase font-bold tracking-wider bg-slate-50/80 dark:bg-white/[0.02]">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Person</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Purpose / Proof</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                <AnimatePresence mode="popLayout" initial={false}>
                  {filteredTransactions.map((tx, idx) => {
                    const isGiven = tx.transaction_type === 'given';

                    return (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0, y: 8, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
                        transition={{
                          duration: 0.28,
                          ease: [0.16, 1, 0.3, 1],
                          delay: Math.min(idx * 0.02, 0.2)
                        }}
                        className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-200 whitespace-nowrap">
                          {formatIndianDate(tx.transaction_date)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-950 dark:text-white whitespace-nowrap">
                          {tx.person_name}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isGiven
                                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            }`}
                          >
                            {isGiven ? <ArrowUpRight size={13} /> : <ArrowDownLeft size={13} />}
                            {isGiven ? 'Given' : 'Returned'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {tx.payment_method}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 max-w-xs">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{tx.purpose || tx.notes || '-'}</span>
                            {tx.receipt_image && (
                              <button
                                type="button"
                                onClick={() => setPreviewReceiptUrl(tx.receipt_image!)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 text-[11px] font-bold cursor-pointer flex-shrink-0"
                                title="View receipt attachment"
                              >
                                <ImageIcon size={12} />
                                <span>Receipt</span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className={`py-3.5 px-4 text-right font-black whitespace-nowrap ${
                          isGiven ? 'text-slate-950 dark:text-white' : 'text-emerald-700 dark:text-emerald-400'
                        }`}>
                          {isGiven ? '-' : '+'}{formatAmount(tx.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onEditTransaction(tx)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-500/10 transition-colors cursor-pointer"
                              title="Edit Transaction"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTxId(tx.id)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete Transaction"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs font-medium">
            <Search size={28} className="mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="font-medium">No transactions match your search and filter criteria.</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Clear All Filters</span>
              </button>
            )}
          </div>
        )}

        {/* Live Filtered Summary Bar at Bottom */}
        <div className="p-4 bg-black/[0.03] dark:bg-white/[0.03] border-t border-black/5 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 font-medium">
            Showing <strong className="text-slate-900 dark:text-white">{filteredTransactions.length}</strong> of {transactions.length} total transactions
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <div>
              <span className="text-slate-400 mr-1.5">Given:</span>
              <strong className="text-slate-900 dark:text-white font-bold">{formatAmount(filteredGiven)}</strong>
            </div>
            <div>
              <span className="text-slate-400 mr-1.5">Returned:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatAmount(filteredReturned)}</strong>
            </div>
            <div>
              <span className="text-slate-400 mr-1.5">Net Dues:</span>
              <strong className="text-rose-600 dark:text-rose-400 font-black">{formatAmount(filteredNet)}</strong>
            </div>
          </div>
        </div>
      </LiquidGlassCard>

      {/* Receipt Preview Modal */}
      <LiquidModal
        isOpen={!!previewReceiptUrl}
        onClose={() => setPreviewReceiptUrl(null)}
        title="Transaction Proof / Receipt"
        subtitle="Uploaded payment verification attachment"
        maxWidth="md"
      >
        {previewReceiptUrl && (
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 max-h-[70vh] flex items-center justify-center bg-black/5">
              <img
                src={previewReceiptUrl}
                alt="Receipt Proof"
                referrerPolicy="no-referrer"
                className="w-full h-auto max-h-[65vh] object-contain"
              />
            </div>
            <div className="flex justify-end">
              <LiquidButton
                variant="secondary"
                size="md"
                onClick={() => setPreviewReceiptUrl(null)}
              >
                Close Preview
              </LiquidButton>
            </div>
          </div>
        )}
      </LiquidModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTxId}
        onClose={() => setDeleteTxId(null)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? All affected person balances will be automatically recalculated immediately."
        confirmText="Delete & Recalculate"
        isLoading={isDeleting}
      />
    </div>
  );
};
