import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Send,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  Sparkles,
  Users,
  ShoppingBag,
  FileText,
  X
} from 'lucide-react';
import { WeeklySummary } from '../../types';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useToast } from '../../context/ToastContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidButton } from '../ui/LiquidButton';

export const WeeklySummaryEmailCard: React.FC = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const { showToast } = useToast();

  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailPreviewHtml, setEmailPreviewHtml] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchSummary = async (offset: number) => {
    try {
      setIsLoading(true);
      const res = await api.getWeeklySummary(offset);
      setSummary(res);
    } catch (err: any) {
      console.warn('Failed to load weekly summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(weekOffset);
  }, [weekOffset]);

  const handleSendEmailReport = async () => {
    if (!user) {
      showToast('Please log in to trigger your weekly email report.', 'error');
      return;
    }

    try {
      setIsSending(true);
      const recipient = user.email || 'startup.cheetaiaistudio.com@gmail.com';
      const res = await api.sendWeeklyEmailReport({
        recipientEmail: recipient,
        offset: weekOffset
      });

      if (res?.emailPreview?.html) {
        setEmailPreviewHtml(res.emailPreview.html);
      }

      showToast(`Weekly summary email report generated & dispatched to ${recipient}! 📬`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch email report', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenPreview = async () => {
    if (!emailPreviewHtml) {
      try {
        setIsSending(true);
        const res = await api.sendWeeklyEmailReport({
          offset: weekOffset
        });
        if (res?.emailPreview?.html) {
          setEmailPreviewHtml(res.emailPreview.html);
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to generate email preview', 'error');
        return;
      } finally {
        setIsSending(false);
      }
    }
    setIsPreviewOpen(true);
  };

  const handleCopyEmailHtml = async () => {
    if (!emailPreviewHtml) return;
    try {
      await navigator.clipboard.writeText(emailPreviewHtml);
      setCopied(true);
      showToast('Email HTML template copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy HTML', 'error');
    }
  };

  const recipientEmail = user?.email || 'startup.cheetaiaistudio.com@gmail.com';

  return (
    <LiquidGlassCard variant="primary" className="p-5 sm:p-6 space-y-5 border-blue-500/30 shadow-xl relative overflow-hidden">
      {/* Ambient Top Glow */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-400" />

      {/* Header and Week Stepper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <Mail size={16} />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Weekly Statement & Email Dispatch
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
              v6.4.5
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
            Weekly Spending & Income Summary
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {summary
              ? `${summary.startDate} to ${summary.endDate} (Week ${summary.weekNumber}, ${summary.year})`
              : 'Calculating 7-day flow...'}
          </p>
        </div>

        {/* Controls: Stepper and Trigger Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10">
            <button
              type="button"
              onClick={() => setWeekOffset(w => w + 1)}
              className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Previous Week"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold px-2 text-slate-700 dark:text-slate-200">
              {weekOffset === 0 ? 'Current Week' : `${weekOffset}w ago`}
            </span>
            <button
              type="button"
              onClick={() => setWeekOffset(w => Math.max(0, w - 1))}
              disabled={weekOffset === 0}
              className={`p-1.5 rounded-xl transition-colors ${
                weekOffset === 0
                  ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                  : 'hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 cursor-pointer'
              }`}
              title="Next Week"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <LiquidButton
            variant="secondary"
            size="sm"
            onClick={handleOpenPreview}
            icon={<FileText size={14} className="text-blue-500" />}
            className="text-xs font-bold"
          >
            Preview Email
          </LiquidButton>

          <LiquidButton
            variant="primary"
            size="sm"
            onClick={handleSendEmailReport}
            disabled={isSending || isLoading}
            icon={<Send size={14} />}
            className="text-xs font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 shadow-md shadow-blue-500/20"
          >
            {isSending ? 'Sending...' : 'Trigger Email Report'}
          </LiquidButton>
        </div>
      </div>

      {/* Recipient Notice */}
      <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
        <span className="flex items-center gap-1.5">
          <Mail size={13} className="text-blue-500" />
          <span>Dispatch Target: <strong className="text-slate-900 dark:text-white font-mono">{recipientEmail}</strong></span>
        </span>
        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <CheckCircle2 size={12} />
          <span>Authenticated Account</span>
        </span>
      </div>

      {/* 3 Metric Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. Total Spending (Given + Groceries) */}
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
              <span>Weekly Spending</span>
              <TrendingDown size={14} />
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {formatAmount(summary.totalSpending)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Lent: {formatAmount(summary.totalGiven)} • Groceries: {formatAmount(summary.totalShopping)}
            </div>
          </div>

          {/* 2. Total Income / Recoveries */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              <span>Weekly Income</span>
              <TrendingUp size={14} />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {formatAmount(summary.totalIncome)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Recoveries & returns ({summary.transactionCount} transactions)
            </div>
          </div>

          {/* 3. Net Cash Flow */}
          <div className={`p-4 rounded-2xl border space-y-1 ${
            summary.netBalance >= 0
              ? 'bg-blue-500/10 border-blue-500/20'
              : 'bg-amber-500/10 border-amber-500/20'
          }`}>
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <span>Net Cash Flow</span>
              <Sparkles size={14} className={summary.netBalance >= 0 ? 'text-blue-500' : 'text-amber-500'} />
            </div>
            <div className={`text-xl sm:text-2xl font-black font-mono ${
              summary.netBalance >= 0
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}>
              {summary.netBalance >= 0 ? '+' : ''}{formatAmount(summary.netBalance)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              {summary.netBalance >= 0 ? 'Surplus liquidity retained' : 'Net cash outflow during period'}
            </div>
          </div>
        </div>
      )}

      {/* Top People Counterparties this week */}
      {summary && summary.topPeople && summary.topPeople.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Users size={13} />
            <span>Top Active Counterparties This Week</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {summary.topPeople.map(p => (
              <div
                key={p.id}
                className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                  <div className="text-[10px] text-slate-400">Pending: {formatAmount(p.pending)}</div>
                </div>
                <div className="text-right">
                  {p.given > 0 && <div className="text-rose-500 font-bold font-mono">+{formatAmount(p.given)}</div>}
                  {p.returned > 0 && <div className="text-emerald-500 font-bold font-mono">-{formatAmount(p.returned)}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email Statement Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-white/20 shadow-2xl flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold">
                    <Mail size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Weekly Email Report Preview
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      HTML email template rendered for {recipientEmail}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Rendered HTML Preview */}
              <div className="p-4 overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-950/80">
                {emailPreviewHtml ? (
                  <div
                    className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 text-slate-900 overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: emailPreviewHtml }}
                  />
                ) : (
                  <div className="p-8 text-center text-slate-400">Loading template preview...</div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleCopyEmailHtml}
                  className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied HTML!' : 'Copy HTML Code'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                  >
                    Close
                  </button>
                  <LiquidButton
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setIsPreviewOpen(false);
                      handleSendEmailReport();
                    }}
                    icon={<Send size={13} />}
                    className="text-xs font-bold"
                  >
                    Send to {recipientEmail}
                  </LiquidButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </LiquidGlassCard>
  );
};
