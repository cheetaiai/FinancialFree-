import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  ChevronRight,
  RefreshCw,
  Bell,
  Plus,
  BarChart3,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ComposedChart
} from 'recharts';
import { LiquidGlassCard } from '../components/ui/LiquidGlassCard';
import { LiquidButton } from '../components/ui/LiquidButton';
import { AiGraphAnalysisCard } from '../components/AiGraphAnalysisCard';
import { DashboardSummary, Person, Transaction } from '../types';
import { api } from '../lib/api';
import { useCurrency } from '../context/CurrencyContext';
import { formatINR, formatIndianDate, getTimeOfDayGreeting, getStatusBadgeConfig, MONTH_SHORT_NAMES } from '../lib/formatters';

interface DashboardPageProps {
  onNavigateToPeople: () => void;
  onNavigateToTransactions: () => void;
  onOpenGiveModal: (personId?: string) => void;
  onOpenReturnModal: (personId?: string) => void;
  onOpenAddPersonModal: () => void;
  onOpenReminderModal: (personId?: string) => void;
  onOpenAiDrawer: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToPeople,
  onNavigateToTransactions,
  onOpenGiveModal,
  onOpenReturnModal,
  onOpenAddPersonModal,
  onOpenReminderModal,
  onOpenAiDrawer
}) => {
  const { formatAmount, currencySymbol } = useCurrency();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [summaryData, txData] = await Promise.all([
        api.getDashboardSummary(),
        api.getTransactions()
      ]);
      setSummary(summaryData);
      setAllTransactions(txData);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalGiven = summary?.total_given || 0;
  const totalReturned = summary?.total_returned || 0;
  const totalPending = summary?.total_pending || 0;
  const recoveryRate = totalGiven > 0 ? (totalReturned / totalGiven) * 100 : 0;

  // Build 6-Month Chronological Graph Data (Money Given vs Taken)
  const dashboardGraphData = useMemo(() => {
    const monthsData: {
      monthKey: string;
      label: string;
      given: number;
      returned: number;
      net: number;
    }[] = [];

    const now = new Date();
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

    allTransactions.forEach(tx => {
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

    monthsData.forEach(d => {
      d.net = d.given - d.returned;
    });

    return monthsData;
  }, [allTransactions]);

  // Custom Chart Tooltip
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-xl liquid-glass-secondary border border-slate-200/80 dark:border-white/10 shadow-lg text-xs space-y-1.5 backdrop-blur-md">
          <div className="font-bold text-slate-900 dark:text-white border-b border-black/5 dark:border-white/10 pb-1">
            {label}
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4">
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
      {/* Header Greeting & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
            Overview
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {getTimeOfDayGreeting()}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Here is your live money lending balance, recovery graphs, and AI analysis.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <LiquidButton
            variant="secondary"
            size="sm"
            onClick={loadData}
            icon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
          >
            Refresh
          </LiquidButton>
          <LiquidButton
            variant="emerald"
            size="sm"
            onClick={() => onOpenReturnModal()}
            icon={<ArrowDownLeft size={15} />}
          >
            Money Returned
          </LiquidButton>
          <LiquidButton
            variant="primary"
            size="sm"
            onClick={() => onOpenGiveModal()}
            icon={<ArrowUpRight size={15} />}
          >
            Give Money
          </LiquidButton>
        </div>
      </div>

      {/* 4 Primary Liquid Glass Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Given */}
        <LiquidGlassCard variant="primary" hoverEffect className="relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Money Given
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatAmount(totalGiven)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span>Cumulative principal lent</span>
          </div>
        </LiquidGlassCard>

        {/* Card 2: Total Returned */}
        <LiquidGlassCard variant="primary" hoverEffect className="relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Money Returned
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatAmount(totalReturned)}
          </div>
          <div className="mt-2 text-xs text-emerald-600/80 dark:text-emerald-400/80 flex items-center gap-1">
            <CheckCircle2 size={13} />
            <span>Successfully recovered</span>
          </div>
        </LiquidGlassCard>

        {/* Card 3: Total Pending */}
        <LiquidGlassCard variant="primary" hoverEffect className="relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending Balance
            </span>
            <div className="w-9 h-9 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
            {formatAmount(totalPending)}
          </div>
          <div className="mt-2 text-xs text-rose-600/80 dark:text-rose-400/80 flex items-center gap-1">
            <AlertCircle size={13} />
            <span>Due to be returned</span>
          </div>
        </LiquidGlassCard>

        {/* Card 4: Recovery Rate */}
        <LiquidGlassCard variant="primary" hoverEffect className="relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Recovery Rate
            </span>
            <div className="w-9 h-9 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
            {recoveryRate.toFixed(1)}%
          </div>
          {/* Liquid Progress Bar */}
          <div className="w-full bg-black/5 dark:bg-white/10 h-2 rounded-full mt-2.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, recoveryRate))}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 h-full rounded-full"
            />
          </div>
        </LiquidGlassCard>
      </div>

      {/* 📊 INTERACTIVE GRAPH: MONEY GIVEN VS TAKEN (LAST 6 MONTHS) */}
      <LiquidGlassCard variant="primary" className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Money Given & Taken Graph 📊</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  Last 6 Months Flow
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visual side-by-side comparison of monthly lending disbursements vs incoming repayments.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-md bg-blue-500 shadow-xs" />
              <span className="text-slate-600 dark:text-slate-300">Money Given (Lent)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-md bg-emerald-500 shadow-xs" />
              <span className="text-slate-600 dark:text-slate-300">Money Taken (Returned)</span>
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="w-full h-72 pt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dashboardGraphData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              barGap={4}
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
              <Tooltip content={<CustomChartTooltip />} />
              <Bar
                dataKey="given"
                name="Money Given"
                fill="#3B82F6"
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="returned"
                name="Money Returned"
                fill="#10B981"
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </LiquidGlassCard>

      {/* 📊 AI GRAPH ANALYSIS COMPONENT */}
      <AiGraphAnalysisCard
        title="📊 AI Graph & Money Flow Analysis"
        type="dashboard"
        graphData={{
          summary: {
            total_given: totalGiven,
            total_returned: totalReturned,
            total_pending: totalPending,
            recovery_rate: recoveryRate
          },
          six_month_trajectory: dashboardGraphData,
          active_people_count: summary?.people_count || 0
        }}
      />

      {/* Two Column Grid: Top Pending Borrowers & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Top Pending Borrowers */}
        <LiquidGlassCard variant="primary" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-blue-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Pending Borrowers
              </h3>
            </div>
            <button
              onClick={onNavigateToPeople}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({summary?.people_count || 0})</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {summary?.top_debtors && summary.top_debtors.length > 0 ? (
            <div className="space-y-2.5">
              {summary.top_debtors.map(person => {
                const badge = getStatusBadgeConfig(person.status);

                return (
                  <div
                    key={person.id}
                    className="p-3.5 rounded-2xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-3 hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: person.avatar_color || '#3B82F6' }}
                      >
                        {person.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {person.full_name}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {person.category || 'General'} • Given {formatAmount(person.total_given || 0)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-black text-rose-600 dark:text-rose-400">
                          {formatAmount(person.remaining_balance || 0)}
                        </div>
                        <div className="text-[10px] text-slate-400">Remaining</div>
                      </div>

                      <button
                        onClick={() => onOpenReturnModal(person.id)}
                        className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                        title="Record Return Payment"
                      >
                        <ArrowDownLeft size={16} />
                      </button>

                      <button
                        onClick={() => onOpenReminderModal(person.id)}
                        className="p-2 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors cursor-pointer"
                        title="Schedule Reminder"
                      >
                        <Bell size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                All Cleared!
              </div>
              <div className="text-xs text-slate-500 mt-1">
                No outstanding pending amounts at the moment.
              </div>
            </div>
          )}
        </LiquidGlassCard>

        {/* Right: Recent Transactions */}
        <LiquidGlassCard variant="primary" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Transactions
              </h3>
            </div>
            <button
              onClick={onNavigateToTransactions}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({allTransactions.length})</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {summary?.recent_transactions && summary.recent_transactions.length > 0 ? (
            <div className="space-y-2.5">
              {summary.recent_transactions.map(tx => {
                const isGiven = tx.transaction_type === 'given';

                return (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-2xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          isGiven
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isGiven ? <ArrowUpRight size={17} /> : <ArrowDownLeft size={17} />}
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {tx.person_name}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {formatIndianDate(tx.transaction_date)} • {tx.payment_method}
                          {tx.purpose ? ` • ${tx.purpose}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div
                        className={`text-sm font-black ${
                          isGiven ? 'text-slate-900 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isGiven ? '-' : '+'}{formatAmount(tx.amount)}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {isGiven ? 'Money Given' : 'Returned'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10">
              <Plus size={32} className="mx-auto text-slate-400 mb-2" />
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No Transactions Yet
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Record your first lending or return transaction.
              </div>
            </div>
          )}
        </LiquidGlassCard>
      </div>
    </div>
  );
};
