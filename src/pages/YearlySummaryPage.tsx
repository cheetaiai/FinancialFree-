import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  CalendarRange,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Award,
  BarChart3,
  Calendar,
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
  Line,
  Area
} from 'recharts';
import { LiquidGlassCard } from '../components/ui/LiquidGlassCard';
import { LiquidSegmentedControl } from '../components/ui/LiquidSegmentedControl';
import { LiquidDropdown } from '../components/ui/LiquidDropdown';
import { AiGraphAnalysisCard } from '../components/AiGraphAnalysisCard';
import { YearlyAnalytics, FinancialYearAnalytics } from '../types';
import { api } from '../lib/api';
import { useCurrency } from '../context/CurrencyContext';
import { formatINR, MONTH_SHORT_NAMES } from '../lib/formatters';

export const YearlySummaryPage: React.FC = () => {
  const { formatAmount } = useCurrency();
  const currentYear = new Date().getFullYear();
  const [viewType, setViewType] = useState<'calendar' | 'financial'>('financial');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedFy, setSelectedFy] = useState<string>('FY 2026-27');
  const [availableYears, setAvailableYears] = useState<number[]>([2026, 2025, 2024]);
  const [availableFys, setAvailableFys] = useState<string[]>(['FY 2026-27', 'FY 2025-26']);

  const [calendarData, setCalendarData] = useState<YearlyAnalytics | null>(null);
  const [fyData, setFyData] = useState<FinancialYearAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getPeriods().then(p => {
      if (p.years?.length) setAvailableYears(p.years);
      if (p.financial_years?.length) {
        setAvailableFys(p.financial_years);
        setSelectedFy(p.financial_years[0]);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (viewType === 'calendar') {
          const res = await api.getYearlyAnalytics(selectedYear);
          setCalendarData(res);
        } else {
          const res = await api.getFinancialYearAnalytics(selectedFy);
          setFyData(res);
        }
      } catch (err) {
        console.error('Failed to load yearly analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [viewType, selectedYear, selectedFy]);

  const activeTotalGiven = viewType === 'calendar' ? calendarData?.total_given || 0 : fyData?.total_given || 0;
  const activeTotalReturned = viewType === 'calendar' ? calendarData?.total_returned || 0 : fyData?.total_returned || 0;
  const activeNet = activeTotalGiven - activeTotalReturned;
  const activeRecoveryRate = activeTotalGiven > 0 ? (activeTotalReturned / activeTotalGiven) * 100 : 0;
  const monthsList = viewType === 'calendar' ? calendarData?.monthly_breakdown || [] : fyData?.monthly_breakdown || [];

  const chartData = monthsList.map(m => ({
    name: m.month_name.slice(0, 3),
    fullName: m.month_name,
    given: m.given,
    returned: m.returned,
    net: m.net
  }));

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-xl liquid-glass-secondary border border-slate-200/80 dark:border-white/10 shadow-lg text-xs space-y-1.5 backdrop-blur-md">
          <div className="font-bold text-slate-900 dark:text-white border-b border-black/5 dark:border-white/10 pb-1">
            {payload[0]?.payload?.fullName || label}
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
      {/* Header with Type toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
            Yearly Audit & Trends
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {viewType === 'calendar' ? `Calendar Year ${selectedYear}` : selectedFy}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {viewType === 'calendar' ? '12-month summary (January - December)' : 'Indian Financial Year (April - March)'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Calendar vs Financial Year Segment */}
          <LiquidSegmentedControl
            layoutId="yearly-view-type"
            size="sm"
            options={[
              { id: 'financial', label: 'Financial Year (Apr-Mar)' },
              { id: 'calendar', label: 'Calendar Year (Jan-Dec)' }
            ]}
            value={viewType}
            onChange={v => setViewType(v as 'calendar' | 'financial')}
          />

          {viewType === 'calendar' ? (
            <LiquidDropdown<number>
              options={availableYears.map(y => ({ value: y, label: y.toString() }))}
              value={selectedYear}
              onChange={y => setSelectedYear(Number(y))}
            />
          ) : (
            <LiquidDropdown<string>
              options={availableFys.map(fy => ({ value: fy, label: fy }))}
              value={selectedFy}
              onChange={setSelectedFy}
            />
          )}
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <LiquidGlassCard variant="primary" hoverEffect>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Given in Period
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatAmount(activeTotalGiven)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Lent during this financial cycle</div>
        </LiquidGlassCard>

        <LiquidGlassCard variant="primary" hoverEffect>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Returned in Period
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatAmount(activeTotalReturned)}
          </div>
          <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">Recovered repayments</div>
        </LiquidGlassCard>

        <LiquidGlassCard variant="primary" hoverEffect>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Net Period Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {formatAmount(activeNet)}
          </div>
          <div className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-1">Net outflow difference</div>
        </LiquidGlassCard>

        <LiquidGlassCard variant="primary" hoverEffect>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Period Recovery Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Award size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {activeRecoveryRate.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Returned vs Given ratio</div>
        </LiquidGlassCard>
      </div>

      {/* 📊 RECHARTS POWERED 12-MONTH FLOW GRAPH */}
      <LiquidGlassCard variant="primary" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Month-by-Month Money Flow Graph 📊</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                12-month side-by-side comparison of Money Given vs Returned.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-md bg-blue-500" />
              <span className="text-slate-600 dark:text-slate-300">Money Given</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-md bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-300">Money Returned</span>
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="w-full h-72 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              barGap={3}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
              <XAxis
                dataKey="name"
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
                maxBarSize={28}
              />
              <Bar
                dataKey="returned"
                name="Money Returned"
                fill="#10B981"
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </LiquidGlassCard>

      {/* 📊 AI GRAPH ANALYSIS COMPONENT */}
      <AiGraphAnalysisCard
        title={`📊 AI Yearly Graph & Period Trajectory Analysis (${viewType === 'calendar' ? selectedYear : selectedFy})`}
        type="yearly"
        graphData={{
          period_type: viewType,
          period_label: viewType === 'calendar' ? `Calendar Year ${selectedYear}` : selectedFy,
          total_given: activeTotalGiven,
          total_returned: activeTotalReturned,
          net_balance: activeNet,
          recovery_rate: activeRecoveryRate,
          monthly_breakdown: monthsList
        }}
      />

      {/* Monthly Breakdown Table */}
      <LiquidGlassCard variant="primary" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarRange size={18} className="text-indigo-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Tabular Audit Breakdown
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/10 text-slate-400 text-[11px] uppercase font-bold tracking-wider">
                <th className="pb-3 px-3">Month</th>
                <th className="pb-3 px-3 text-right">Money Given</th>
                <th className="pb-3 px-3 text-right">Money Returned</th>
                <th className="pb-3 px-3 text-right">Net Flow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {monthsList.map((m, idx) => (
                <tr key={idx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    {m.month_name}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-800 dark:text-slate-200">
                    {formatAmount(m.given)}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                    {formatAmount(m.returned)}
                  </td>
                  <td className={`py-3 px-3 text-right font-black ${
                    m.net > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                  }`}>
                    {formatAmount(m.net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LiquidGlassCard>
    </div>
  );
};
