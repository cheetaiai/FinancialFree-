import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  TrendingUp,
  X,
  Sliders,
  DollarSign,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useBudget } from '../../context/BudgetContext';
import { useCurrency } from '../../context/CurrencyContext';
import { LiquidButton } from '../ui/LiquidButton';

interface BudgetAlertBannerProps {
  className?: string;
  showWhenHealthy?: boolean;
}

export const BudgetAlertBanner: React.FC<BudgetAlertBannerProps> = ({
  className = '',
  showWhenHealthy = false
}) => {
  const {
    monthlyBudgetLimit,
    setMonthlyBudgetLimit,
    currentMonthOutflow,
    budgetPercentage,
    isBudgetExceeded,
    isBudgetApproaching,
    isAlertDismissed,
    dismissAlert,
    overspendAmount,
    remainingBudget
  } = useBudget();
  const { formatAmount } = useCurrency();

  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [newLimitInput, setNewLimitInput] = useState(monthlyBudgetLimit.toString());

  // If dismissed and not explicitly asked to show healthy, don't show
  if (isAlertDismissed && !showWhenHealthy) {
    return null;
  }

  // If healthy (< 80%) and not requested to show, don't show
  if (!isBudgetExceeded && !isBudgetApproaching && !showWhenHealthy) {
    return null;
  }

  const handleSaveLimit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(newLimitInput);
    if (!isNaN(parsed) && parsed > 0) {
      setMonthlyBudgetLimit(parsed);
      setIsEditingLimit(false);
    }
  };

  // Severity styling
  const config = isBudgetExceeded
    ? {
        border: 'border-rose-500/40 dark:border-rose-500/30',
        bg: 'bg-rose-500/10 dark:bg-rose-950/25',
        text: 'text-rose-950 dark:text-rose-200',
        badge: 'bg-rose-500 text-white',
        iconBg: 'bg-rose-500/20 text-rose-600 dark:text-rose-400',
        title: 'Monthly Spending Limit Exceeded!',
        barColor: 'bg-rose-500',
        icon: ShieldAlert
      }
    : isBudgetApproaching
    ? {
        border: 'border-amber-500/40 dark:border-amber-500/30',
        bg: 'bg-amber-500/10 dark:bg-amber-950/25',
        text: 'text-amber-950 dark:text-amber-200',
        badge: 'bg-amber-500 text-white',
        iconBg: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
        title: 'Approaching Monthly Spending Limit',
        barColor: 'bg-amber-500',
        icon: AlertTriangle
      }
    : {
        border: 'border-emerald-500/30 dark:border-emerald-500/20',
        bg: 'bg-emerald-500/10 dark:bg-emerald-950/20',
        text: 'text-emerald-950 dark:text-emerald-200',
        badge: 'bg-emerald-500 text-white',
        iconBg: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
        title: 'Monthly Budget on Track',
        barColor: 'bg-emerald-500',
        icon: CheckCircle2
      };

  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`rounded-2xl border p-4 shadow-sm backdrop-blur-md relative overflow-hidden ${config.border} ${config.bg} ${config.text} ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Icon & Title & Summary */}
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${config.iconBg}`}>
            <IconComponent size={20} />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold tracking-tight">
                {config.title}
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.badge}`}>
                {budgetPercentage}% of limit
              </span>
            </div>

            <p className="text-xs opacity-90 leading-relaxed">
              {isBudgetExceeded ? (
                <>
                  You have given <strong>{formatAmount(currentMonthOutflow)}</strong> this month, exceeding your spending limit of <strong>{formatAmount(monthlyBudgetLimit)}</strong> by{' '}
                  <span className="font-bold underline">{formatAmount(overspendAmount)}</span>.
                </>
              ) : isBudgetApproaching ? (
                <>
                  You have given <strong>{formatAmount(currentMonthOutflow)}</strong> out of your <strong>{formatAmount(monthlyBudgetLimit)}</strong> monthly limit. Only <strong>{formatAmount(remainingBudget)}</strong> remaining.
                </>
              ) : (
                <>
                  Spending is well controlled: <strong>{formatAmount(currentMonthOutflow)}</strong> given of <strong>{formatAmount(monthlyBudgetLimit)}</strong> limit.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={() => {
              setNewLimitInput(monthlyBudgetLimit.toString());
              setIsEditingLimit(!isEditingLimit);
            }}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white/70 dark:bg-black/30 hover:bg-white dark:hover:bg-black/50 border border-black/10 dark:border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Sliders size={13} />
            <span>{isEditingLimit ? 'Cancel' : 'Change Limit'}</span>
          </button>

          {!isAlertDismissed && (
            <button
              type="button"
              onClick={dismissAlert}
              className="p-1.5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer opacity-70 hover:opacity-100"
              title="Dismiss notification for this month"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 w-full bg-black/10 dark:bg-white/10 h-2 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(budgetPercentage, 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${config.barColor}`}
        />
      </div>

      {/* Inline Quick Limit Editor */}
      <AnimatePresence>
        {isEditingLimit && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSaveLimit}
            className="overflow-hidden mt-3 pt-3 border-t border-black/10 dark:border-white/10 flex items-center gap-2"
          >
            <span className="text-xs font-semibold whitespace-nowrap">New Monthly Spending Limit:</span>
            <input
              type="number"
              min="100"
              step="100"
              value={newLimitInput}
              onChange={e => setNewLimitInput(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold w-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 50000"
            />
            <LiquidButton type="submit" variant="emerald" size="sm">
              Save Limit
            </LiquidButton>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
