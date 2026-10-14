import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  FileText,
  CreditCard,
  Copy,
  Check,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { PublicShareData } from '../types';
import { api } from '../lib/api';
import { exportPublicSharePdf } from '../lib/pdfExport';
import { LiquidGlassCard } from '../components/ui/LiquidGlassCard';
import { LiquidButton } from '../components/ui/LiquidButton';
import { useToast } from '../context/ToastContext';
import { AppLogo } from '../components/common/AppLogo';

interface PublicLedgerSharePageProps {
  shareId: string;
  onBackToApp?: () => void;
}

export const PublicLedgerSharePage: React.FC<PublicLedgerSharePageProps> = ({
  shareId,
  onBackToApp
}) => {
  const { showToast } = useToast();
  const [data, setData] = useState<PublicShareData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchShare = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await api.getPublicShare(shareId);
        if (isMounted) {
          setData(res);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Unable to load public statement or link expired.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchShare();
    return () => {
      isMounted = false;
    };
  }, [shareId]);

  const handleCopyLink = async () => {
    const link = typeof window !== 'undefined' ? (window.location.href.includes('/share/') ? window.location.href : `${window.location.origin}/share/${shareId}`) : '';
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      showToast('Public link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy link', 'error');
    }
  };

  const handleDownloadPdf = () => {
    if (!data) return;
    exportPublicSharePdf(data);
    showToast('Statement PDF downloaded', 'success');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-400">Loading verified settlement statement...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white">
        <LiquidGlassCard className="max-w-md p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center font-bold text-xl">
            !
          </div>
          <h2 className="text-lg font-bold">Statement Not Found</h2>
          <p className="text-xs text-slate-400">
            {error || 'This statement link may have expired or is invalid.'}
          </p>
          {onBackToApp && (
            <LiquidButton variant="primary" onClick={onBackToApp} className="w-full">
              Open FinancialFree
            </LiquidButton>
          )}
        </LiquidGlassCard>
      </div>
    );
  }

  const net = data.netBalance;
  const isReceivable = net > 0;
  const isPayable = net < 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 sm:p-6 md:p-8">
      {/* Top Header */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <AppLogo size="sm" animate={false} />
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>FinancialFree</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Verified
              </span>
            </h1>
            <p className="text-xs text-slate-400">Personal Money Lending & Return Tracker</p>
          </div>
        </div>

        {onBackToApp && (
          <button
            onClick={onBackToApp}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer px-3 py-1.5 rounded-xl bg-white/5 border border-white/10"
          >
            <ChevronLeft size={14} />
            <span>Open App</span>
          </button>
        )}
      </div>

      {/* Main Statement Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl space-y-4"
      >
        <LiquidGlassCard
          variant="primary"
          glowColor="rgba(16, 185, 129, 0.15)"
          className="p-5 sm:p-7 border border-white/15 bg-slate-900/80 backdrop-blur-2xl"
        >
          {/* Card Top Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/10">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <ShieldCheck size={14} />
                <span>Verified Public Ledger Statement</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {data.personName}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ref ID: <span className="font-mono text-slate-300">#{data.shareId}</span> • Generated: {new Date(data.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Share Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <FileText size={13} />
                <span>PDF</span>
              </button>
            </div>
          </div>

          {/* Money Given and Taken Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
            {/* Box 1: Money Given */}
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                <ArrowUpRight size={15} />
                <span>Money Given</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                ₹{Number(data.totalGiven).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-400">Total lent to borrower</p>
            </div>

            {/* Box 2: Money Returned (Taken) */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <ArrowDownLeft size={15} />
                <span>Money Taken</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                ₹{Number(data.totalReturned).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-400">Total received back</p>
            </div>

            {/* Box 3: Net Balance */}
            <div className={`p-4 rounded-2xl border space-y-1 ${
              isReceivable
                ? 'bg-emerald-500/15 border-emerald-500/30'
                : isPayable
                ? 'bg-rose-500/15 border-rose-500/30'
                : 'bg-slate-800/50 border-white/10'
            }`}>
              <div className="text-xs font-bold text-slate-300">
                {isReceivable ? 'Receivable Balance' : isPayable ? 'Payable Balance' : 'Settled Balance'}
              </div>
              <div className={`text-xl sm:text-2xl font-black ${
                isReceivable
                  ? 'text-emerald-400'
                  : isPayable
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }`}>
                ₹{Math.abs(net).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-400">
                {isReceivable ? 'Due to be received' : isPayable ? 'Due to be repaid' : 'Fully settled'}
              </p>
            </div>
          </div>

          {/* UPI Quick Settlement Box */}
          {Math.abs(net) > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-blue-600/20 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <CreditCard size={15} className="text-emerald-400" />
                  <span>Settle Remaining Balance Instantly</span>
                </h4>
                <p className="text-xs text-slate-300">
                  Pay via any UPI App (Google Pay, PhonePe, Paytm, BHIM)
                </p>
              </div>

              <a
                href={`upi://pay?pa=shaik.noorjahan@superyes&pn=${encodeURIComponent(data.personName)}&am=${Math.abs(net)}&cu=INR&tn=${encodeURIComponent('Settlement repayment')}`}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-600/30 text-center shrink-0"
              >
                <ExternalLink size={14} />
                <span>Pay ₹{Math.abs(net).toLocaleString('en-IN')} via UPI</span>
              </a>
            </div>
          )}

          {/* Transactions List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Transaction Details ({data.transactions?.length || 0})
            </h3>

            {data.transactions && data.transactions.length > 0 ? (
              <div className="divide-y divide-white/5 rounded-2xl bg-black/30 border border-white/5 overflow-hidden">
                {data.transactions.map((tx, idx) => (
                  <div key={tx.id || idx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        tx.type === 'given'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {tx.type === 'given' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          {tx.notes || (tx.type === 'given' ? 'Money Given' : 'Money Returned')}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Calendar size={12} />
                          <span>{tx.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className={`text-sm font-black ${
                      tx.type === 'given' ? 'text-blue-400' : 'text-emerald-400'
                    }`}>
                      {tx.type === 'given' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-black/20 border border-white/5 text-center text-xs text-slate-400">
                Statement summarizes total given and returned. For granular audit history, request full ledger.
              </div>
            )}
          </div>

          {/* Privacy Note */}
          <div className="mt-5 pt-4 border-t border-white/5 text-center">
            <p className="text-[11px] text-slate-400">
              Protected Public View • Only Money Given & Taken Shown • Powered by FinancialFree
            </p>
          </div>
        </LiquidGlassCard>
      </motion.div>
    </div>
  );
};
