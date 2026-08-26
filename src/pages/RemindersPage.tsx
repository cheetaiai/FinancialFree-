import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  Plus,
  CheckCircle2,
  XCircle,
  Trash2,
  MessageCircle,
  Sparkles,
  Calendar,
  User,
  Clock,
  Check
} from 'lucide-react';
import { LiquidGlassCard } from '../components/ui/LiquidGlassCard';
import { LiquidButton } from '../components/ui/LiquidButton';
import { LiquidSegmentedControl } from '../components/ui/LiquidSegmentedControl';
import { Reminder } from '../types';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { formatINR, formatIndianDate } from '../lib/formatters';

interface RemindersPageProps {
  onOpenReminderModal: () => void;
}

export const RemindersPage: React.FC<RemindersPageProps> = ({ onOpenReminderModal }) => {
  const { showToast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'dismissed'>('pending');
  const [isLoading, setIsLoading] = useState(true);

  const fetchReminders = async () => {
    setIsLoading(true);
    try {
      const data = await api.getReminders();
      setReminders(data);
    } catch (err) {
      console.error('Failed to load reminders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'completed' | 'dismissed' | 'pending') => {
    try {
      await api.updateReminderStatus(id, status);
      showToast(`Reminder marked as ${status}.`, 'success');
      fetchReminders();
    } catch (err: any) {
      showToast(err.message || 'Failed to update reminder', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteReminder(id);
      showToast('Reminder deleted.', 'info');
      fetchReminders();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete reminder', 'error');
    }
  };

  const handleWhatsApp = (reminder: Reminder) => {
    const text = reminder.note || `Hi ${reminder.person_name}, gentle reminder regarding the outstanding balance of ${formatINR(reminder.pending_amount)}. Thank you!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredReminders = reminders.filter(r => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
            Follow-Ups
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Reminders ({reminders.length})
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Schedule courteous payment follow-ups and draft considerate messages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <LiquidButton
            variant="primary"
            size="sm"
            onClick={onOpenReminderModal}
            icon={<Plus size={15} />}
          >
            New Reminder
          </LiquidButton>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-start">
        <LiquidSegmentedControl
          layoutId="reminders-status-filter"
          size="sm"
          options={[
            { id: 'pending', label: 'Pending' },
            { id: 'completed', label: 'Completed' },
            { id: 'dismissed', label: 'Dismissed' },
            { id: 'all', label: 'All' }
          ]}
          value={statusFilter}
          onChange={v => setStatusFilter(v as any)}
        />
      </div>

      {/* Reminders List */}
      {filteredReminders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReminders.map(rem => {
            const isPending = rem.status === 'pending';

            return (
              <LiquidGlassCard
                key={rem.id}
                variant="primary"
                className="p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {rem.person_name}
                      </h4>
                      <div className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-0.5">
                        Pending: {formatINR(rem.pending_amount)}
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                        rem.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : rem.status === 'dismissed'
                          ? 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {rem.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar size={13} className="text-blue-500" />
                    <span>Follow-up Date: <strong className="text-slate-800 dark:text-slate-200">{formatIndianDate(rem.reminder_date)}</strong></span>
                  </div>

                  {rem.note && (
                    <div className="p-3 rounded-xl liquid-glass-secondary border border-black/5 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                      {rem.note}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/5 gap-2 flex-wrap">
                  <button
                    onClick={() => handleWhatsApp(rem)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer shadow-sm"
                  >
                    <MessageCircle size={14} />
                    <span>WhatsApp</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(rem.id, 'completed')}
                          className="p-1.5 rounded-xl hover:bg-emerald-500/10 text-emerald-600 transition-colors cursor-pointer"
                          title="Mark Completed"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(rem.id, 'dismissed')}
                          className="p-1.5 rounded-xl hover:bg-slate-500/10 text-slate-400 transition-colors cursor-pointer"
                          title="Dismiss"
                        >
                          <XCircle size={16} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(rem.id, 'pending')}
                        className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                      >
                        Re-open
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(rem.id)}
                      className="p-1.5 rounded-xl hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
                      title="Delete Reminder"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </LiquidGlassCard>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl liquid-glass-secondary border border-dashed border-slate-200 dark:border-white/10">
          <Bell size={36} className="mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Reminders in this category
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Schedule a follow-up date for any contact with an outstanding balance.
          </p>
        </div>
      )}
    </div>
  );
};
