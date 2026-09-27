import React, { useState } from 'react';
import {
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Sliders,
  ShieldCheck,
  Bell,
  RefreshCw,
  Info
} from 'lucide-react';
import { useBudget } from '../../context/BudgetContext';
import { useCurrency } from '../../context/CurrencyContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidButton } from '../ui/LiquidButton';
import { useToast } from '../../context/ToastContext';

export const BudgetSettingsCard: React.FC = () => {
  const {
    monthlyBudgetLimit,
    setMonthlyBudgetLimit,
    currentMonthOutflow,
    budgetPercentage,
    isBudgetExceeded,
    isBudgetApproaching,
    isAlertDismissed,
    resetAlertDismissal,
    remainingBudget,
    overspendAmount
  } = useBudget();
  const { formatAmount } = useCurrency();
  const { showToast } = useToast();

  const [inputLimit, setInputLimit] = useState(monthlyBudgetLimit.toString());
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(inputLimit);
    if (!isNaN(val) && val > 0) {
      setMonthlyBudgetLimit(val);
      setIsEditing(false);
      showToast('Monthly spending alert threshold updated!', 'success');
    } else {
      showToast('Please enter a valid positive budget amount.', 'error');
    }
  };

  const quickPresets = [10000, 25000, 50000, 100000, 250000];

  return (
    <LiquidGlassCard variant="primary" className="p-5 sm:p-6 space-y-5 border border-slate-200/80 dark:border-white/10 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 flex-shrink-0">
            <Bell size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Monthly Spending Limit & Alert System
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Active Guard
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Set a monthly outflow limit to receive real-time alerts when lending or spending surpasses your budget.
            </p>
          </div>
        </div>

        <div className="text-right flex items-center gap-2 sm:flex-col sm:items-end">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Monthly Limit</span>
          <span className="text-xl font-black text-slate-900 dark:text-white">
            {formatAmount(monthlyBudgetLimit)}
          </span>
        </div>
      </div>

      {/* Real-time Current Month Status */}
      <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Current Month Outflow (Given)
            </span>
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {formatAmount(currentMonthOutflow)} / {formatAmount(monthlyBudgetLimit)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isBudgetExceeded
                ? 'bg-rose-500'
                : isBudgetApproaching
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-slate-500 dark:text-slate-400">
            {budgetPercentage}% consumed
          </span>
          <span className={isBudgetExceeded ? 'text-rose-600 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}>
            {isBudgetExceeded ? (
              `Exceeded by ${formatAmount(overspendAmount)}`
            ) : (
              `${formatAmount(remainingBudget)} left to spend`
            )}
          </span>
        </div>
      </div>

      {/* Preset Buttons & Custom Input Form */}
      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-3 pt-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Set Custom Monthly Spending Limit:
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="number"
              min="100"
              step="100"
              value={inputLimit}
              onChange={e => setInputLimit(e.target.value)}
              className="flex-1 min-w-[140px] px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              placeholder="e.g. 50000"
            />
            <LiquidButton type="submit" variant="emerald" size="sm">
              Save Limit
            </LiquidButton>
            <LiquidButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setInputLimit(monthlyBudgetLimit.toString());
                setIsEditing(false);
              }}
            >
              Cancel
            </LiquidButton>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 pt-2 flex-wrap">
            <span className="text-[11px] text-slate-400 mr-1">Quick Presets:</span>
            {quickPresets.map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => setInputLimit(preset.toString())}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                {formatAmount(preset)}
              </button>
            ))}
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Info size={14} />
            <span>Alerts trigger automatically when monthly money given exceeds the threshold.</span>
          </div>

          <div className="flex items-center gap-2">
            {isAlertDismissed && (
              <button
                type="button"
                onClick={resetAlertDismissal}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
              >
                Reset Dismissal
              </button>
            )}
            <LiquidButton
              variant="secondary"
              size="sm"
              onClick={() => {
                setInputLimit(monthlyBudgetLimit.toString());
                setIsEditing(true);
              }}
              icon={<Sliders size={14} />}
            >
              Configure Limit
            </LiquidButton>
          </div>
        </div>
      )}
    </LiquidGlassCard>
  );
};
