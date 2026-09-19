import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  CalendarDays,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  Users,
  ChevronLeft,
  ChevronRight,
  FileBarChart,
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
  ComposedChart,
  Line
} from 'recharts';
import { LiquidGlassCard } from '../components/ui/LiquidGlassCard';
import { LiquidDropdown } from '../components/ui/LiquidDropdown';
import { AiGraphAnalysisCard } from '../components/AiGraphAnalysisCard';
import { MonthlyAnalytics } from '../types';
import { api } from '../lib/api';
import { useCurrency } from '../context/CurrencyContext';
import { formatINR, formatIndianDate, MONTH_NAMES } from '../lib/formatters';

export const MonthlySummaryPage: React.FC = () => {
  const { formatAmount } = useCurrency();
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [analytics, setAnalytics] = useState<MonthlyAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMonthly = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMonthlyAnalytics(selectedYear, selectedMonth);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load monthly summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthly();
  }, [selectedYear, selectedMonth]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const totalGiven = analytics?.total_given || 0;
  const totalReturned = analytics?.total_returned || 0;
  const netMonthly = analytics?.net_balance || 0;

  // Aggregate monthly transactions into Weekly / 5-day intervals for chart
  const monthlyTimelineData = useMemo(() => {
    const intervals = [
      { key: 'W1', label: '1st - 7th', given: 0, returned: 0 },
      { key: 'W2', label: '8th - 14th', given: 0, returned: 0 },
      { key: 'W3', label: '15th - 21st', given: 0, returned: 0 },
      { key: 'W4', label: '22nd - 28th', given: 0, returned: 0 },
      { key: 'W5', label: '29th - End', given: 0, returned: 0 }
    ];

    (analytics?.transactions || []).forEach(tx => {
      const date = new Date(tx.transaction_date);
      const day = date.getDate();

      let target = intervals[0];
      if (day > 28) target = intervals[4];
      else if (day > 21) target = intervals[3];
      else if (day > 14) target = intervals[2];
      else if (day > 7) target = intervals[1];

      if (tx.transaction_type === 'given') {
        target.given += tx.amount;
      } else if (tx.transaction_type === 'returned') {
        target.returned += tx.amount;
      }
    });

    return intervals;
  }, [analytics]);

  const CustomTooltip = ({ active, payload, label }: any) => {
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
      {/* Header with Month / Year Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
            Monthly Flow Analytics
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Monthly Summary & AI Graph
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Lending and return activities for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.
          </p>
        </div>

        {/* Month Stepper Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-2xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10 hover:bg-white text-slate-600 dark:text-slate-300 cursor-pointer"
            aria-label="Previous Month"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2">
            <LiquidDropdown<number>
              options={MONTH_NAMES.map((m, idx) => ({ value: idx + 1, label: m }))}
              value={selectedMonth}
              onChange={val => setSelectedMonth(Number(val))}
            />
            <LiquidDropdown<number>
              options={[2026, 2025, 2024, 2023].map(y => ({ value: y, label: y.toString() }))}
              value={selectedYear}
              onChange={val => setSelectedYear(Number(val))}
            />
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-2xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10 hover:bg-white text-slate-600 dark:text-slate-300 cursor-pointer"
            aria-label="Next Month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* 3 Metric Cards for Selected Month */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <LiquidGlassCard variant="primary" hoverEffect>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
              Money Given this Month
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatAmount(totalGiven)}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Outflow lent in {MONTH_NAMES[selectedMonth - 1]}</div>
        </LiquidGlassCard>

        <LiquidGlassCard variant="primary" hoverEffect>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
              Money Returned this Month
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatAmount(totalReturned)}
          </div>
          <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 font-medium">Inflow recovered in {MONTH_NAMES[selectedMonth - 1]}</div>
        </LiquidGlassCard>

        <LiquidGlassCard variant="primary" hoverEffect>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
              Net Monthly Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className={`text-2xl font-black ${netMonthly > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {formatAmount(netMonthly)}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Net pending change this month</div>
        </LiquidGlassCard>
      </div>

      {/* 📊 INTERACTIVE MONTHLY TIMELINE GRAPH */}
      <LiquidGlassCard variant="primary" className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{MONTH_NAMES[selectedMonth - 1]} Money Given vs Taken Graph 📊</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Weekly distribution of lending outlays and returned payments.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-md bg-blue-500 shadow-xs" />
              <span className="text-slate-600 dark:text-slate-300">Money Given</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-md bg-emerald-500 shadow-xs" />
              <span className="text-slate-600 dark:text-slate-300">Money Returned</span>
            </div>
          </div>
        </div>

        <div className="w-full h-64 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyTimelineData}
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
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="given"
                name="Money Given"
                fill="#3B82F6"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
              <Bar
                dataKey="returned"
                name="Money Returned"
                fill="#10B981"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </LiquidGlassCard>

      {/* 📊 AI GRAPH ANALYSIS COMPONENT */}
      <AiGraphAnalysisCard
        title={`📊 AI Graph Analysis: ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
        type="monthly"
        graphData={{
          month_name: MONTH_NAMES[selectedMonth - 1],
          year: selectedYear,
          total_given: totalGiven,
          total_returned: totalReturned,
          net_flow: netMonthly,
          weekly_distribution: monthlyTimelineData,
          people_involved: analytics?.people_involved || [],
          transactions_count: analytics?.transactions?.length || 0
        }}
      />

      {/* People Involved in Selected Month */}
      <LiquidGlassCard variant="primary" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-blue-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Borrower Activity in {MONTH_NAMES[selectedMonth - 1]}
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            {analytics?.people_involved?.length || 0} People Active
          </span>
        </div>

        {analytics?.people_involved && analytics.people_involved.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analytics.people_involved.map((person, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl liquid-glass-secondary border border-slate-200 dark:border-white/10 flex items-center justify-between"
              >
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {person.name}
                </div>
                <div className="text-right space-y-0.5">
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    Given: <strong className="text-slate-950 dark:text-white font-bold">{formatAmount(person.given)}</strong>
                  </div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-400">
                    Returned: <strong className="font-bold">{formatAmount(person.returned)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs font-medium">
            No borrower transactions logged in {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.
          </div>
        )}
      </LiquidGlassCard>

      {/* Transactions in Month */}
      <LiquidGlassCard variant="primary" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileBarChart size={18} className="text-emerald-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Month's Ledger Records ({analytics?.transactions?.length || 0})
            </h3>
          </div>
        </div>

        {analytics?.transactions && analytics.transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-[11px] uppercase font-bold tracking-wider">
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Person</th>
                  <th className="pb-3 px-3">Type</th>
                  <th className="pb-3 px-3">Method</th>
                  <th className="pb-3 px-3">Purpose</th>
                  <th className="pb-3 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                {analytics.transactions.map(tx => {
                  const isGiven = tx.transaction_type === 'given';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02]">
                      <td className="py-3 px-3 font-medium text-slate-900 dark:text-slate-200 whitespace-nowrap">
                        {formatIndianDate(tx.transaction_date)}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-950 dark:text-white">
                        {tx.person_name}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isGiven ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold'
                        }`}>
                          {isGiven ? 'Given' : 'Returned'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                        {tx.payment_method}
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                        {tx.purpose || '-'}
                      </td>
                      <td className={`py-3 px-3 text-right font-black ${
                        isGiven ? 'text-slate-950 dark:text-white' : 'text-emerald-700 dark:text-emerald-400'
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
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs font-medium">
            No entries for this month.
          </div>
        )}
      </LiquidGlassCard>
    </div>
  );
};
