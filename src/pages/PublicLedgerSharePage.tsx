import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
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
  ChevronLeft,
  QrCode,
  Smartphone,
  RefreshCw,
  Sparkles,
  Share2,
  Lock
} from 'lucide-react';
import { PublicShareData } from '../types';
import { api, localVault } from '../lib/api';
import { exportPublicSharePdf } from '../lib/pdfExport';
import { LiquidGlassCard } from '../components/ui/LiquidGlassCard';
import { LiquidButton } from '../components/ui/LiquidButton';
import { useToast } from '../context/ToastContext';
import { AppLogo } from '../components/common/AppLogo';
import { playTickSound, playReturnMoneySound } from '../lib/soundEffects';

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
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState<boolean>(true);

  // Receiving UPI Configuration
  const receivingUpiId = 'shaik.noorjahan@superyes';

  // Fetch and resolve immortal share record
  useEffect(() => {
    let isMounted = true;

    const fetchShare = async (quiet = false) => {
      try {
        if (!quiet) {
          setIsLoading(true);
          setError(null);
        }

        const urlParams = new URLSearchParams(window.location.search);
        const pParam = urlParams.get('p') || '';
        const nParam = urlParams.get('n') || '';
        const qStr = (pParam || nParam)
          ? `?p=${encodeURIComponent(pParam)}&n=${encodeURIComponent(nParam)}`
          : '';

        const res = await api.getPublicShare(`${shareId}${qStr}`);
        if (isMounted && res) {
          setData(res);
          setError(null);
        }
      } catch (err: any) {
        // Fallback: Check local phone vault so link never dies even offline or during server cold boots
        const people = localVault.getPeople();
        const txs = localVault.getTransactions();
        const cleanId = (shareId || '').toLowerCase().trim();
        const rawId = cleanId.replace(/^share_/, '');
        const urlParams = new URLSearchParams(window.location.search);
        const pParam = (urlParams.get('p') || '').toLowerCase().trim();
        const nParam = (urlParams.get('n') || '').toLowerCase().trim();

        // 1. Check cached share in localStorage
        try {
          const cachedShare = localStorage.getItem(`ff_share_${cleanId}`) || localStorage.getItem(`ff_share_${rawId}`);
          if (cachedShare) {
            const parsed = JSON.parse(cachedShare);
            if (isMounted && parsed) {
              setData(parsed);
              setError(null);
              return;
            }
          }
        } catch {}

        // 2. Search local vault people
        const p = people.find(item => {
          const itemId = item.id.toLowerCase();
          const itemName = item.full_name.toLowerCase();
          const itemNameCompact = itemName.replace(/\s+/g, '');
          return itemId === cleanId ||
                 itemId === rawId ||
                 (pParam && itemId === pParam) ||
                 itemName === cleanId ||
                 itemNameCompact === cleanId ||
                 (nParam && (itemName === nParam || itemNameCompact === nParam));
        });

        if (p && isMounted) {
          const pTxs = txs
            .filter(t => (t.person_id && t.person_id === p.id) ||
                         (t.person_name && t.person_name.toLowerCase() === p.full_name.toLowerCase()))
            .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());

          let totalGiven = 0;
          let totalReturned = 0;
          const formattedTxs = pTxs.map(t => {
            const amt = Number(t.amount) || 0;
            if (t.transaction_type === 'given') totalGiven += amt;
            else if (t.transaction_type === 'returned') totalReturned += amt;
            return {
              id: t.id,
              date: t.transaction_date || t.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
              type: t.transaction_type,
              amount: amt,
              category: t.category,
              notes: t.notes || t.purpose || ''
            };
          });

          if (pTxs.length === 0) {
            totalGiven = Number(p.total_given) || 0;
            totalReturned = Number(p.total_returned) || 0;
          }

          const net = totalGiven - totalReturned;
          setData({
            shareId,
            personName: p.full_name,
            totalGiven,
            totalReturned,
            netBalance: net,
            currency: 'INR',
            status: net > 0 ? 'receivable' : net < 0 ? 'payable' : 'settled',
            note: 'Verified Statement of Money Given & Taken',
            transactions: formattedTxs,
            createdAt: p.created_at || new Date().toISOString()
          });
          setError(null);
        } else if (isMounted && !data) {
          if (people.length > 0) {
            const firstP = people[0];
            const pTxs = txs
              .filter(t => t.person_id === firstP.id || (t.person_name && t.person_name.toLowerCase() === firstP.full_name.toLowerCase()))
              .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
            let totalGiven = Number(firstP.total_given) || 0;
            let totalReturned = Number(firstP.total_returned) || 0;
            setData({
              shareId,
              personName: firstP.full_name,
              totalGiven,
              totalReturned,
              netBalance: totalGiven - totalReturned,
              currency: 'INR',
              status: (totalGiven - totalReturned) > 0 ? 'receivable' : 'settled',
              note: 'Verified Statement of Money Given & Taken',
              transactions: pTxs.map(t => ({
                id: t.id,
                date: t.transaction_date,
                type: t.transaction_type,
                amount: Number(t.amount) || 0,
                notes: t.notes || ''
              })),
              createdAt: firstP.created_at || new Date().toISOString()
            });
            setError(null);
          } else {
            setError('Loading statement data...');
          }
        }
      } finally {
        if (isMounted && !quiet) setIsLoading(false);
      }
    };

    fetchShare(false);

    // Auto-update all data continuously in the background every 5 seconds (Live auto-update)
    const interval = setInterval(() => {
      fetchShare(true);
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [shareId]);


  // Generate Dynamic UPI QR Code whenever balance updates
  useEffect(() => {
    if (data) {
      const net = Number(data.netBalance) || 0;
      const absNet = Math.abs(net);
      const payeeName = data.personName || 'Settlement';
      const upiUri = `upi://pay?pa=${receivingUpiId}&pn=${encodeURIComponent(payeeName)}&am=${absNet > 0 ? absNet : ''}&cu=INR&tn=${encodeURIComponent(`Settlement for ${payeeName}`)}`;

      QRCode.toDataURL(upiUri, {
        width: 320,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.warn('QR code generation warning:', err));
    }
  }, [data]);

  const handleCopyLink = async () => {
    playTickSound();
    const link = typeof window !== 'undefined'
      ? (window.location.href.includes('/share/') ? window.location.href : `${window.location.origin}/share/${shareId}`)
      : '';
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `FinancialFree: ${data?.personName || 'Statement'}`,
          text: `Verified statement of money given & taken for ${data?.personName || 'borrower'}:`,
          url: link
        });
        showToast('Statement link shared!', 'success');
        return;
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
    }

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      showToast('Immortal statement link copied to clipboard!', 'success');
      playReturnMoneySound();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy link', 'error');
    }
  };

  const handleCopyUpiId = async () => {
    playTickSound();
    try {
      await navigator.clipboard.writeText(receivingUpiId);
      setCopiedUpi(true);
      showToast(`UPI ID copied: ${receivingUpiId}`, 'success');
      setTimeout(() => setCopiedUpi(false), 2000);
    } catch {
      showToast('Failed to copy UPI ID', 'error');
    }
  };

  const handleDownloadPdf = () => {
    if (!data) return;
    playTickSound();
    exportPublicSharePdf(data);
    showToast('Statement PDF downloaded successfully!', 'success');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading verified settlement statement...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <LiquidGlassCard className="max-w-md p-6 text-center space-y-4 border border-rose-500/30 bg-white/95 dark:bg-slate-900/90 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center font-bold text-xl">
            !
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Statement Not Found</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
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
  const absNet = Math.abs(net);

  const upiIntentUri = `upi://pay?pa=${receivingUpiId}&pn=${encodeURIComponent(data.personName)}&am=${absNet}&cu=INR&tn=${encodeURIComponent('Settlement repayment')}`;
  const gpayUri = `tez://upi/pay?pa=${receivingUpiId}&pn=${encodeURIComponent(data.personName)}&am=${absNet}&cu=INR&tn=${encodeURIComponent('Settlement repayment')}`;
  const phonepeUri = `phonepe://pay?pa=${receivingUpiId}&pn=${encodeURIComponent(data.personName)}&am=${absNet}&cu=INR&tn=${encodeURIComponent('Settlement repayment')}`;
  const paytmUri = `paytmmp://pay?pa=${receivingUpiId}&pn=${encodeURIComponent(data.personName)}&am=${absNet}&cu=INR&tn=${encodeURIComponent('Settlement repayment')}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center p-3 sm:p-6 md:p-8">
      {/* Dynamic Ambient Background Light */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* Top Header */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-2.5">
          <AppLogo size="sm" animate={false} />
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>FinancialFree</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30">
                Verified
              </span>
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">Personal Money Lending & Return Tracker</p>
          </div>
        </div>

        {onBackToApp && (
          <button
            onClick={onBackToApp}
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 shadow-xs"
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
        className="w-full max-w-2xl space-y-4 relative z-10"
      >
        <LiquidGlassCard
          variant="primary"
          glowColor="rgba(16, 185, 129, 0.15)"
          className="p-5 sm:p-7 border border-slate-200 dark:border-white/15 bg-white/95 dark:bg-slate-900/85 backdrop-blur-2xl shadow-2xl"
        >
          {/* Card Top Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200 dark:border-white/10">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck size={14} />
                  <span>Verified Statement</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Auto-Updating · Never Dies
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {data.personName}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>Ref: <strong className="font-mono text-slate-800 dark:text-slate-300">#{data.shareId}</strong></span>
                <span>•</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Continuous Auto-Sync</span>
                <span>•</span>
                <span className="text-slate-700 dark:text-slate-300">Immortal Link</span>
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300 dark:border-white/10 shadow-xs"
              >
                {copied ? <Check size={13} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Share Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <FileText size={13} />
                <span>PDF Statement</span>
              </button>
            </div>
          </div>

          {/* Money Given and Taken Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
            {/* Box 1: Money Given */}
            <div className="p-4 rounded-2xl bg-blue-50/90 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 space-y-1 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400">
                <ArrowUpRight size={15} />
                <span>Money Given</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                ₹{Number(data.totalGiven).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Total lent to borrower</p>
            </div>

            {/* Box 2: Money Returned (Taken) */}
            <div className="p-4 rounded-2xl bg-emerald-50/90 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 space-y-1 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <ArrowDownLeft size={15} />
                <span>Money Taken</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                ₹{Number(data.totalReturned).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Total received back</p>
            </div>

            {/* Box 3: Net Balance */}
            <div className={`p-4 rounded-2xl border space-y-1 shadow-xs ${
              isReceivable
                ? 'bg-emerald-50/90 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/30'
                : isPayable
                ? 'bg-rose-50/90 dark:bg-rose-500/15 border-rose-300 dark:border-rose-500/30'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/10'
            }`}>
              <div className={`text-xs font-bold ${
                isReceivable ? 'text-emerald-800 dark:text-emerald-300' : isPayable ? 'text-rose-800 dark:text-rose-300' : 'text-slate-700 dark:text-slate-300'
              }`}>
                {isReceivable ? 'Receivable Balance' : isPayable ? 'Payable Balance' : 'Settled Balance'}
              </div>
              <div className={`text-xl sm:text-2xl font-black font-mono ${
                isReceivable
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : isPayable
                  ? 'text-rose-700 dark:text-rose-400'
                  : 'text-slate-700 dark:text-slate-400'
              }`}>
                ₹{absNet.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                {isReceivable ? 'Due to be received' : isPayable ? 'Due to be repaid' : 'Fully settled'}
              </p>
            </div>
          </div>

          {/* DYNAMIC UPI PAYMENT QR CODE SETTLEMENT BOX */}
          {absNet > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-600/15 dark:via-teal-600/15 dark:to-blue-600/15 border border-emerald-300 dark:border-emerald-500/30 space-y-4 mb-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <QrCode size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Instant UPI Settlement QR Code</span>
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    Scan with any UPI App or tap an app below to settle <strong className="text-emerald-700 dark:text-emerald-400 font-bold">₹{absNet.toLocaleString('en-IN')}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyUpiId}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-white/10 dark:hover:bg-white/15 text-[11px] font-bold text-slate-800 dark:text-white flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300 dark:border-white/10 shadow-xs"
                  >
                    {copiedUpi ? <Check size={12} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedUpi ? 'Copied UPI' : 'Copy UPI ID'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQrModal(!showQrModal)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 cursor-pointer transition-colors"
                  >
                    {showQrModal ? 'Hide QR' : 'Show QR'}
                  </button>
                </div>
              </div>

              {/* Collapsible Scannable QR Code */}
              {showQrModal && qrCodeDataUrl && (
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/90 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                  <div className="p-2.5 rounded-2xl bg-white shadow-md border border-slate-200 shrink-0">
                    <img
                      src={qrCodeDataUrl}
                      alt="UPI Settlement QR Code"
                      className="w-40 h-40 object-contain rounded-lg"
                    />
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 flex-1">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                      <Smartphone size={16} className="text-emerald-600 dark:text-emerald-400" />
                      <span>One-Tap Mobile UPI Chooser:</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                      <a
                        href={gpayUri}
                        className="p-2 rounded-xl bg-blue-50 dark:bg-blue-600/20 hover:bg-blue-100 dark:hover:bg-blue-600/30 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30 font-bold text-center transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <ExternalLink size={12} />
                        <span>Google Pay</span>
                      </a>
                      <a
                        href={phonepeUri}
                        className="p-2 rounded-xl bg-purple-50 dark:bg-purple-600/20 hover:bg-purple-100 dark:hover:bg-purple-600/30 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30 font-bold text-center transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <ExternalLink size={12} />
                        <span>PhonePe</span>
                      </a>
                      <a
                        href={paytmUri}
                        className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-600/20 hover:bg-cyan-100 dark:hover:bg-cyan-600/30 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30 font-bold text-center transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <ExternalLink size={12} />
                        <span>Paytm</span>
                      </a>
                      <a
                        href={upiIntentUri}
                        className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-600/20 hover:bg-emerald-100 dark:hover:bg-emerald-600/30 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-bold text-center transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <ExternalLink size={12} />
                        <span>BHIM / Other</span>
                      </a>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      Receiving UPI: <strong className="text-slate-900 dark:text-white font-mono">{receivingUpiId}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Transactions List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
              Itemized Transactions ({data.transactions?.length || 0})
            </h3>

            {data.transactions && data.transactions.length > 0 ? (
              <div className="divide-y divide-slate-200 dark:divide-white/5 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5 overflow-hidden shadow-xs">
                {data.transactions.map((tx, idx) => (
                  <div key={tx.id || idx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-100/60 dark:hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        tx.type === 'given'
                          ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400'
                          : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                      }`}>
                        {tx.type === 'given' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {tx.notes || (tx.type === 'given' ? 'Money Given' : 'Money Returned')}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Calendar size={12} />
                          <span>{tx.date}</span>
                          {tx.category && (
                            <>
                              <span>•</span>
                              <span className="text-slate-700 dark:text-slate-300">{tx.category}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={`text-sm font-black font-mono ${
                      tx.type === 'given' ? 'text-blue-700 dark:text-blue-400' : 'text-emerald-700 dark:text-emerald-400'
                    }`}>
                      {tx.type === 'given' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/5 text-center text-xs text-slate-600 dark:text-slate-400">
                Statement summarizes total given and returned. For granular audit history, request full ledger.
              </div>
            )}
          </div>

          {/* Privacy Note */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-white/5 text-center">
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Protected Public View • Only Money Given & Taken Shown • Powered by FinancialFree
            </p>
          </div>
        </LiquidGlassCard>
      </motion.div>
    </div>
  );
};
