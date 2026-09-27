import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { api, subscribeSyncEvents } from '../lib/api';
import { Transaction } from '../types';
import { useToast } from './ToastContext';
import { useCurrency } from './CurrencyContext';

interface BudgetContextType {
  monthlyBudgetLimit: number;
  setMonthlyBudgetLimit: (limit: number) => void;
  currentMonthOutflow: number;
  remainingBudget: number;
  overspendAmount: number;
  budgetPercentage: number;
  isBudgetExceeded: boolean;
  isBudgetApproaching: boolean;
  isAlertDismissed: boolean;
  dismissAlert: () => void;
  resetAlertDismissal: () => void;
  refreshBudgetCalculation: () => Promise<void>;
}

const BUDGET_LIMIT_STORAGE_KEY = 'financialfree_monthly_budget_limit';
const BUDGET_DISMISSED_KEY = 'financialfree_budget_alert_dismissed_month';
const DEFAULT_MONTHLY_LIMIT = 50000;

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const { formatAmount } = useCurrency();

  const [monthlyBudgetLimit, setMonthlyBudgetLimitState] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(BUDGET_LIMIT_STORAGE_KEY);
      if (stored) {
        const val = parseFloat(stored);
        if (!isNaN(val) && val > 0) return val;
      }
    } catch {
      // fallback
    }
    return DEFAULT_MONTHLY_LIMIT;
  });

  const [currentMonthOutflow, setCurrentMonthOutflow] = useState<number>(0);
  const [isAlertDismissed, setIsAlertDismissed] = useState<boolean>(() => {
    try {
      const currentMonthKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
      const dismissed = localStorage.getItem(BUDGET_DISMISSED_KEY);
      return dismissed === currentMonthKey;
    } catch {
      return false;
    }
  });

  // Calculate current month's money given (outflow)
  const calculateOutflow = useCallback(async () => {
    try {
      const txs = await api.getTransactions();
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-indexed

      let totalOutflow = 0;
      for (const tx of txs) {
        if (tx.transaction_type === 'given') {
          const d = new Date(tx.transaction_date);
          if (!isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
            totalOutflow += Number(tx.amount) || 0;
          }
        }
      }
      setCurrentMonthOutflow(totalOutflow);
    } catch (err) {
      console.warn('Failed to calculate current month outflow:', err);
    }
  }, []);

  useEffect(() => {
    calculateOutflow();

    // Re-calculate when transactions change
    const unsubscribe = subscribeSyncEvents((event) => {
      if (event.type === 'success') {
        calculateOutflow();
      }
    });

    const handleTxUpdate = () => calculateOutflow();
    window.addEventListener('financialfree_data_reconciled', handleTxUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('financialfree_data_reconciled', handleTxUpdate);
    };
  }, [calculateOutflow]);

  const setMonthlyBudgetLimit = (limit: number) => {
    const validLimit = Math.max(100, Math.round(limit));
    setMonthlyBudgetLimitState(validLimit);
    try {
      localStorage.setItem(BUDGET_LIMIT_STORAGE_KEY, validLimit.toString());
      // Reset dismissal when limit changes
      localStorage.removeItem(BUDGET_DISMISSED_KEY);
      setIsAlertDismissed(false);
      showToast(`Monthly spending limit updated to ${formatAmount(validLimit)}`, 'success');
    } catch {
      // ignore
    }
  };

  const dismissAlert = () => {
    try {
      const currentMonthKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
      localStorage.setItem(BUDGET_DISMISSED_KEY, currentMonthKey);
      setIsAlertDismissed(true);
      showToast('Budget alert dismissed for this month', 'info');
    } catch {
      setIsAlertDismissed(true);
    }
  };

  const resetAlertDismissal = () => {
    try {
      localStorage.removeItem(BUDGET_DISMISSED_KEY);
    } catch {
      // ignore
    }
    setIsAlertDismissed(false);
  };

  const isBudgetExceeded = monthlyBudgetLimit > 0 && currentMonthOutflow > monthlyBudgetLimit;
  const budgetPercentage = monthlyBudgetLimit > 0 ? Math.round((currentMonthOutflow / monthlyBudgetLimit) * 100) : 0;
  const isBudgetApproaching = !isBudgetExceeded && budgetPercentage >= 80;
  const remainingBudget = Math.max(0, monthlyBudgetLimit - currentMonthOutflow);
  const overspendAmount = Math.max(0, currentMonthOutflow - monthlyBudgetLimit);

  return (
    <BudgetContext.Provider
      value={{
        monthlyBudgetLimit,
        setMonthlyBudgetLimit,
        currentMonthOutflow,
        remainingBudget,
        overspendAmount,
        budgetPercentage,
        isBudgetExceeded,
        isBudgetApproaching,
        isAlertDismissed,
        dismissAlert,
        resetAlertDismissal,
        refreshBudgetCalculation: calculateOutflow
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within BudgetProvider');
  }
  return context;
};
