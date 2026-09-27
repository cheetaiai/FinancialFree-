import { useState, useEffect, useCallback } from 'react';
import { api } from './api';

export interface RemindersBadgeData {
  pendingCount: number;
  overdueCount: number;
  totalPendingPayments: number;
  totalBadgeCount: number;
  refresh: () => Promise<void>;
}

export function useRemindersBadge(): RemindersBadgeData {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [overdueCount, setOverdueCount] = useState<number>(0);
  const [totalPendingPayments, setTotalPendingPayments] = useState<number>(0);
  const [totalBadgeCount, setTotalBadgeCount] = useState<number>(0);

  const calculateCounts = useCallback(async () => {
    try {
      // 1. Fetch active reminders
      const reminders = await api.getReminders().catch(() => []);
      const todayStr = new Date().toISOString().split('T')[0];

      let pendingReminders = 0;
      let overdueReminders = 0;

      for (const r of reminders) {
        if (r.status === 'pending') {
          pendingReminders++;
          if (r.reminder_date && r.reminder_date <= todayStr) {
            overdueReminders++;
          }
        }
      }

      // 2. Fetch people to count pending and overdue borrower balances
      const people = await api.getPeople().catch(() => []);
      const pendingPeople = people.filter(p => {
        const net = Number(p.net_balance) || 0;
        return net > 0 && (p.status === 'Pending' || p.status === 'Partially Paid');
      });

      setPendingCount(pendingReminders);
      setOverdueCount(overdueReminders);
      setTotalPendingPayments(pendingPeople.length);

      // The badge represents overdue or pending payments:
      // If specific reminders are set, prioritize overdue + pending reminders;
      // otherwise, show borrowers with pending payment balances
      const count = pendingReminders > 0 ? pendingReminders : pendingPeople.length;
      setTotalBadgeCount(count);
    } catch (err) {
      console.warn('Failed to calculate reminders badge count:', err);
    }
  }, []);

  useEffect(() => {
    calculateCounts();

    // Listen for custom app events that alter payments, transactions, or reminders
    const handleUpdate = () => {
      calculateCounts();
    };

    window.addEventListener('reminders-updated', handleUpdate);
    window.addEventListener('transactions-updated', handleUpdate);
    window.addEventListener('people-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // Periodic check every 30 seconds
    const interval = setInterval(calculateCounts, 30000);

    return () => {
      window.removeEventListener('reminders-updated', handleUpdate);
      window.removeEventListener('transactions-updated', handleUpdate);
      window.removeEventListener('people-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, [calculateCounts]);

  return {
    pendingCount,
    overdueCount,
    totalPendingPayments,
    totalBadgeCount,
    refresh: calculateCounts
  };
}
