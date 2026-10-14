import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  QrCode,
  Share2,
  Smartphone,
  Check,
  Sparkles,
  Layers
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export type NativeMobileStyle = 'auto' | 'android' | 'iphone';

interface NativeMobileButtonsBarProps {
  onOpenGiveModal: () => void;
  onOpenReturnModal: () => void;
  onOpenScanQrModal: () => void;
  onOpenShareApp?: () => void;
}

export const NativeMobileButtonsBar: React.FC<NativeMobileButtonsBarProps> = ({
  onOpenGiveModal,
  onOpenReturnModal,
  onOpenScanQrModal,
  onOpenShareApp
}) => {
  const { showToast } = useToast();
  const [platformStyle, setPlatformStyle] = useState<NativeMobileStyle>(() => {
    try {
      const stored = localStorage.getItem('financialfree_native_button_style');
      if (stored === 'android' || stored === 'iphone') return stored;
    } catch {}
    // Auto-detect based on userAgent
    if (typeof navigator !== 'undefined') {
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) return 'iphone';
      if (/Android/i.test(navigator.userAgent)) return 'android';
    }
    return 'android';
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleStyleChange = (style: NativeMobileStyle) => {
    setPlatformStyle(style);
    try {
      localStorage.setItem('financialfree_native_button_style', style);
    } catch {}
    triggerHaptic(20);
    showToast(`Switched button style to ${style === 'android' ? 'Android (Material 3)' : 'iPhone (iOS Cupertino)'}`, 'info');
  };

  const triggerHaptic = (ms = 15) => {
    try {
      if ('vibrate' in navigator) navigator.vibrate(ms);
    } catch {}
  };

  const handleShare = async () => {
    triggerHaptic(15);
    const origin =
      typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
        ? window.location.origin
        : 'https://ais-pre-nvir464n3thla4mwmmyeep-536589344627.asia-southeast1.run.app';
    const shareData = {
      title: 'FinancialFree — Personal Ledger & Loan Tracker',
      text: 'Track money given and received with real-time phone storage, QR codes & PDF statements: ',
      url: origin
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        showToast('App link copied to clipboard!', 'success');
      }
    } catch {
      // ignore cancel
    }
  };

  return (
    <div className="md:hidden fixed bottom-20 inset-x-0 z-30 px-3 flex flex-col items-center pointer-events-none">
      {/* Style Switcher Toggle (Pill) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="mb-2 p-1.5 rounded-2xl bg-slate-900/90 dark:bg-slate-950/90 text-white backdrop-blur-xl border border-white/20 shadow-2xl flex items-center gap-1 pointer-events-auto"
          >
            <span className="text-[10px] font-bold px-2 text-slate-400 uppercase tracking-wider">
              Style:
            </span>
            <button
              type="button"
              onClick={() => handleStyleChange('android')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                platformStyle === 'android'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>Android (M3)</span>
              {platformStyle === 'android' && <Check size={12} />}
            </button>
            <button
              type="button"
              onClick={() => handleStyleChange('iphone')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                platformStyle === 'iphone'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>iPhone (iOS)</span>
              {platformStyle === 'iphone' && <Check size={12} />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Native Action Buttons Bar */}
      <div className="w-full max-w-sm pointer-events-auto">
        {platformStyle === 'android' ? (
          /* ================= ANDROID MATERIAL 3 DESIGN BUTTONS ================= */
          <div className="flex items-center justify-between p-1.5 rounded-3xl bg-slate-900/90 dark:bg-slate-950/90 border border-emerald-500/30 backdrop-blur-xl shadow-2xl">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(15);
                onOpenGiveModal();
              }}
              className="flex-1 py-2 px-1.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-bold text-[11px] flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer border border-emerald-500/20"
            >
              <ArrowUpRight size={14} className="stroke-[2.5]" />
              <span>Give</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(15);
                onOpenReturnModal();
              }}
              className="flex-1 mx-1 py-2 px-1.5 rounded-2xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 font-bold text-[11px] flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer border border-teal-500/20"
            >
              <ArrowDownLeft size={14} className="stroke-[2.5]" />
              <span>Return</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(20);
                onOpenScanQrModal();
              }}
              className="flex-1 py-2 px-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-[11px] flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-md shadow-emerald-600/30"
            >
              <QrCode size={14} />
              <span>Scan QR</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="ml-1 p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              title="Share Link"
            >
              <Share2 size={14} />
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-1 p-2 rounded-2xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Toggle Android / iPhone Button Style"
            >
              <Smartphone size={13} />
            </button>
          </div>
        ) : (
          /* ================= iPHONE iOS CUPERTINO FROSTED GLASS BUTTONS ================= */
          <div className="flex items-center justify-between p-1 rounded-full bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/15 backdrop-blur-2xl shadow-2xl">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(12);
                onOpenGiveModal();
              }}
              className="flex-1 py-2 px-2 rounded-full text-blue-600 dark:text-blue-400 font-semibold text-[11px] flex items-center justify-center gap-1 hover:bg-blue-500/10 active:scale-92 transition-all cursor-pointer"
            >
              <ArrowUpRight size={13} className="stroke-[2.5]" />
              <span>Give</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(12);
                onOpenReturnModal();
              }}
              className="flex-1 py-2 px-2 rounded-full text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] flex items-center justify-center gap-1 hover:bg-emerald-500/10 active:scale-92 transition-all cursor-pointer"
            >
              <ArrowDownLeft size={13} className="stroke-[2.5]" />
              <span>Return</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(20);
                onOpenScanQrModal();
              }}
              className="flex-1 py-2 px-2.5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center gap-1 active:scale-92 transition-all cursor-pointer shadow-md shadow-blue-500/30"
            >
              <QrCode size={13} />
              <span>Scan QR</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
              title="Share Link"
            >
              <Share2 size={13} />
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Toggle iPhone / Android Button Style"
            >
              <Smartphone size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
