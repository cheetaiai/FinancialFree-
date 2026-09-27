import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Download,
  HardDrive,
  CheckCircle2,
  X,
  ChevronRight,
  ArrowUpCircle,
  FileCode,
  ShieldCheck
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
    files,
    openUpdateModal,
    startAnalysisAndDownload,
    isDownloading,
    isAnalyzing,
    downloadProgress,
    downloadedMB,
    totalSizeMB
  } = useAppUpdate();

  const [isDismissedTemporarily, setIsDismissedTemporarily] = useState(false);

  // USER REQUIREMENT: "once time update the update button not showing in app"
  // If update is already installed or no update is available, NEVER render this banner or update button!
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
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-all cursor-pointer shadow-xs"
        >
          <ArrowUpCircle size={14} className="animate-bounce" />
          <span>Update {latestVersion} Available ({totalSizeFormatted})</span>
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
          glowColor="rgba(59, 130, 246, 0.15)"
          className="relative overflow-hidden border-blue-500/30 dark:border-blue-400/25 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-teal-500/10"
        >
          {/* Subtle animated top gradient highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-400 animate-pulse" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-1">
            {/* Left: Icon and notification message */}
            <div className="flex items-start sm:items-center gap-3">
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-md flex items-center justify-center shrink-0">
                <ArrowUpCircle className="text-white w-5 h-5 animate-bounce" />
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>New Version Available</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                      {latestVersion}
                    </span>
                  </h4>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={12} />
                    <span>Analyzed & Verified</span>
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                  120 FPS UI, real-time Firestore sync & biometric camera security.
                  <span className="ml-1.5 font-bold text-blue-600 dark:text-blue-400">
                    Download size: ~{totalSizeFormatted} ({files.length} files analyzed)
                  </span>
                </p>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2 self-end md:self-auto shrink-0 flex-wrap">
              {/* If actively downloading or analyzing, display live progress */}
              {isDownloading || isAnalyzing ? (
                <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    {isAnalyzing
                      ? 'Analyzing files...'
                      : `Downloading: ${downloadedMB} / ${totalSizeMB} MB (${downloadProgress}%)`}
                  </div>
                </div>
              ) : (
                <>
                  <LiquidButton
                    variant="secondary"
                    size="sm"
                    onClick={openUpdateModal}
                    icon={<FileCode size={13} className="text-blue-500" />}
                    className="text-xs"
                  >
                    View File Analysis
                  </LiquidButton>

                  {/* PROMINENT UPDATE BUTTON WITH DOWNLOAD SIZE ANALYSIS */}
                  <LiquidButton
                    variant="primary"
                    size="sm"
                    onClick={openUpdateModal}
                    icon={<Download size={14} />}
                    className="text-xs font-bold shadow-md shadow-blue-500/20"
                  >
                    Download Update ({totalSizeFormatted})
                  </LiquidButton>
                </>
              )}

              {/* Dismiss temporarily */}
              <button
                type="button"
                onClick={() => setIsDismissedTemporarily(true)}
                className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Dismiss update banner for now"
                aria-label="Dismiss banner"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </LiquidGlassCard>
      </motion.div>
    </AnimatePresence>
  );
};
