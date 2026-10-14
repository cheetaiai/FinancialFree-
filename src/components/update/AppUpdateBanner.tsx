import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Download,
  CheckCircle2,
  X,
  ArrowUpCircle,
  ShoppingBag,
  Zap,
  Layers,
  FileText
} from 'lucide-react';
import { useAppUpdate } from '../../context/AppUpdateContext';
import { LiquidButton } from '../ui/LiquidButton';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';

interface AppUpdateBannerProps {
  className?: string;
}

export const AppUpdateBanner: React.FC<AppUpdateBannerProps> = ({ className = '' }) => {
  const {
    hasUpdateAvailable,
    isUpdateInstalled,
    latestVersion,
    totalSizeFormatted,
    openUpdateModal,
    isDownloading,
    isAnalyzing,
    downloadProgress,
    downloadedFormatted,
    downloadSpeedMBps,
    remainingSeconds,
    activeFeatureIndex,
    advantages,
    isUpdateSuccess,
    triggerRocketAnimation
  } = useAppUpdate();

  const [isDismissedTemporarily, setIsDismissedTemporarily] = useState(false);

  // If update has completed, show celebratory done animation banner!
  if (isUpdateSuccess && !isDismissedTemporarily) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          className={`w-full ${className}`}
        >
          <LiquidGlassCard
            variant="secondary"
            glowColor="rgba(16, 185, 129, 0.25)"
            className="p-4 sm:p-5 border-emerald-500/40 bg-gradient-to-r from-emerald-600/15 via-teal-600/10 to-blue-500/15 shadow-xl flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                <CheckCircle2 size={24} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    Update {latestVersion} Successfully Done!
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    Active System Release
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Ultra-Clarity PDF Engine, Shopping & Groceries Hub, and Liquid Glass animations are now active.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDismissedTemporarily(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md cursor-pointer transition-colors shrink-0"
            >
              Done ✓
            </button>
          </LiquidGlassCard>
        </motion.div>
      </AnimatePresence>
    );
  }

  // If update is already installed or no update is available, do not render
  if (!hasUpdateAvailable || isUpdateInstalled) {
    return null;
  }

  if (isDismissedTemporarily) {
    return (
      <div className={`flex justify-end ${className}`}>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setIsDismissedTemporarily(false)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-600/15 hover:bg-blue-600/25 text-blue-600 dark:text-blue-400 border border-blue-500/30 transition-all cursor-pointer shadow-sm"
        >
          <ArrowUpCircle size={15} className="animate-bounce" />
          <span>Major Update {latestVersion} Available ({totalSizeFormatted})</span>
        </motion.button>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className={`w-full ${className}`}
      >
        <LiquidGlassCard
          variant="primary"
          glowColor="rgba(59, 130, 246, 0.2)"
          className="relative overflow-hidden border-blue-500/40 dark:border-blue-400/30 bg-gradient-to-r from-blue-600/15 via-indigo-600/10 to-teal-500/15 shadow-xl p-4 sm:p-5"
        >
          {/* Subtle animated top gradient highlight */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 animate-pulse" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Icon, Header, Version, and Feature highlights */}
            <div className="flex items-start gap-3.5">
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-500 p-0.5 shadow-lg flex items-center justify-center shrink-0">
                <ArrowUpCircle className="text-white w-6 h-6 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>Major System Update Launched</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                      {latestVersion}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      1.9 GB Package
                    </span>
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={13} />
                    <span>Ready to Install</span>
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium">
                  FinancialFree Pro: Shopping 🛍 & Groceries Tracker, Real-Time UPI Return QR, Public Share Links & Liquid-Glass UI.
                </p>

                {/* Feature highlight badges */}
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-500/20">
                    <ShoppingBag size={12} />
                    <span>Shopping & Groceries Hub</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300 text-[11px] font-bold border border-blue-500/20">
                    <Zap size={12} />
                    <span>UPI Return Money QR</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold border border-indigo-500/20">
                    <Layers size={12} />
                    <span>Zero Data Loss Server Sync</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-bold border border-amber-500/20">
                    <FileText size={12} />
                    <span>Spends PDF Statement</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Progress tracker or Action buttons */}
            <div className="flex items-center gap-2.5 self-end lg:self-center shrink-0 flex-wrap">
              {isDownloading || isAnalyzing ? (
                <div className="flex flex-col gap-1.5 bg-blue-500/10 p-3 rounded-2xl border border-blue-500/25 min-w-[240px]">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>{isAnalyzing ? 'Verifying...' : `Streaming ${downloadProgress}%`}</span>
                    </span>
                    <span className="font-mono">{downloadedFormatted} / 1.9 GB</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-400 rounded-full transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                  {advantages[activeFeatureIndex] && (
                    <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                      <Sparkles size={11} className="text-amber-500 shrink-0" />
                      <span className="truncate">{advantages[activeFeatureIndex].title}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>{downloadSpeedMBps} MB/s</span>
                    <span>~{remainingSeconds}s remaining</span>
                  </div>
                </div>
              ) : (
                <>
                  <LiquidButton
                    variant="secondary"
                    size="sm"
                    onClick={openUpdateModal}
                    icon={<Sparkles size={14} className="text-amber-500" />}
                    className="text-xs font-bold"
                  >
                    What's New
                  </LiquidButton>

                  <LiquidButton
                    variant="primary"
                    size="md"
                    onClick={() => {
                      triggerRocketAnimation();
                      openUpdateModal();
                    }}
                    icon={<Download size={15} />}
                    className="text-xs font-black shadow-lg shadow-blue-500/25 bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500"
                  >
                    Update Now ({totalSizeFormatted})
                  </LiquidButton>
                </>
              )}

              {/* Dismiss temporarily button */}
              <button
                type="button"
                onClick={() => setIsDismissedTemporarily(true)}
                className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Dismiss update banner for now"
                aria-label="Dismiss banner"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </LiquidGlassCard>
      </motion.div>
    </AnimatePresence>
  );
};
