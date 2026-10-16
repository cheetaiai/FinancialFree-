import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Download,
  ArrowUpCircle,
  HardDrive,
  CheckCircle2,
  X,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  ShoppingBag,
  Home,
  Sparkle,
  Zap,
  Check,
  Info,
  Layers,
  Clock
} from 'lucide-react';
import { useAppUpdate } from '../../context/AppUpdateContext';
import { LiquidButton } from '../ui/LiquidButton';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';

import { playTickSound } from '../../lib/soundEffects';

export const AppUpdateModal: React.FC = () => {
  const {
    currentVersion,
    latestVersion,
    isUpdateInstalled,
    installedAt,
    totalSizeFormatted,
    releaseNotes,
    advantages,
    isAnalyzing,
    analysisProgress,
    isDownloading,
    downloadProgress,
    downloadSpeedMBps,
    downloadedFormatted,
    currentProcessingStage,
    remainingSeconds,
    activeFeatureIndex,
    isTurboMode,
    toggleTurboMode,
    isUpdateSuccess,
    isModalOpen,
    closeUpdateModal,
    startAnalysisAndDownload
  } = useAppUpdate();

  const [activeTab, setActiveTab] = useState<'advantages' | 'notes'>('advantages');

  if (!isModalOpen) return null;

  const handleTabChange = (tab: 'advantages' | 'notes') => {
    playTickSound();
    setActiveTab(tab);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl my-auto"
      >
        <LiquidGlassCard
          variant="primary"
          glowColor="rgba(59, 130, 246, 0.25)"
          className="p-5 sm:p-6 space-y-5 border-blue-500/30 shadow-2xl relative overflow-hidden"
        >
          {/* Top Header */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-200/50 dark:border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-500 p-0.5 shadow-lg flex items-center justify-center shrink-0">
                <ArrowUpCircle className="text-white w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Update {latestVersion} Launched
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                    Official Release
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    {totalSizeFormatted} Package
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Current: <span className="font-semibold">{currentVersion}</span> → Target:{' '}
                  <span className="font-bold text-blue-600 dark:text-blue-400">{latestVersion}</span>
                  <span className="mx-1.5 opacity-40">|</span>
                  <span>{totalSizeFormatted} Total Size</span>
                </p>
              </div>
            </div>

            <button
              onClick={closeUpdateModal}
              disabled={isAnalyzing || isDownloading}
              className="p-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
              title="Close update dialog"
            >
              <X size={18} />
            </button>
          </div>

          {/* Mode Navigation Tabs */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
            <button
              onClick={() => handleTabChange('advantages')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'advantages'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles size={14} className="text-amber-500" />
              <span>Advantages of Features</span>
            </button>
            <button
              onClick={() => handleTabChange('notes')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'notes'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Zap size={14} className="text-blue-500" />
              <span>Release Notes</span>
            </button>
          </div>

          {/* ACTIVE DOWNLOAD / ANALYSIS PROGRESS BANNER (MB / GB Streaming) */}
          {(isAnalyzing || isDownloading) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-3"
            >
              <div className="flex items-center justify-between text-xs font-bold flex-wrap gap-2">
                <span className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <RefreshCw size={14} className="animate-spin text-blue-500" />
                  <span>
                    {isAnalyzing
                      ? `Verifying package modules (${analysisProgress}%)`
                      : `Streaming Update Package (${downloadProgress}%)`}
                  </span>
                </span>
                <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 flex-wrap">
                  {isDownloading && (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      <Clock size={11} />
                      <span>~{remainingSeconds}s remaining</span>
                    </span>
                  )}
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {isAnalyzing
                      ? 'Package Verified'
                      : `${downloadedFormatted} / ${totalSizeFormatted} • ${downloadSpeedMBps} MB/s`}
                  </span>
                  <button
                    type="button"
                    onClick={toggleTurboMode}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                      isTurboMode
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                        : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
                    }`}
                    title="Toggle download simulation speed"
                  >
                    {isTurboMode ? '⚡ Fast' : '⏱ ~45s/GB'}
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-400 rounded-full"
                  style={{ width: `${isAnalyzing ? analysisProgress : downloadProgress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>

              {/* Active Feature Being Installed Showcase Animation */}
              {advantages[activeFeatureIndex] && (
                <motion.div
                  key={activeFeatureIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-blue-500/25 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      {activeFeatureIndex + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        Initializing Feature Module ({activeFeatureIndex + 1}/{advantages.length})
                      </div>
                      <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {advantages[activeFeatureIndex].title}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shrink-0">
                    Installing
                  </span>
                </motion.div>
              )}

              <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping shrink-0" />
                <span>{currentProcessingStage || `Streaming high-speed ${totalSizeFormatted} update package...`}</span>
              </div>
            </motion.div>
          )}

          {/* UPDATE SUCCESS STATE */}
          {isUpdateSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 size={28} />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Update {latestVersion} Successfully Applied!
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                FinancialFree is now operating on <span className="font-bold text-emerald-600 dark:text-emerald-400">{latestVersion}</span> ({totalSizeFormatted}).
                The Optimized QR Code Engine, Share & View Statement, and Mixkit Audio Suite are active.
              </p>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 italic">
                ✓ You are on the newest release. The update prompt is permanently completed.
              </p>
            </motion.div>
          )}

          {/* TAB 1: ADVANTAGES OF FEATURES */}
          {activeTab === 'advantages' && (
            <div className="space-y-3">
              {/* Summary Metrics Bar */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 text-center">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Size</div>
                  <div className="text-sm sm:text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">
                    {totalSizeFormatted}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">New Category</div>
                  <div className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
                    <ShoppingBag size={14} />
                    <span>Shopping 🛍</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Offline Engine</div>
                  <div className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center justify-center gap-1">
                    <ShieldCheck size={14} />
                    <span>Active</span>
                  </div>
                </div>
              </div>

              {/* Advantages List */}
              <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800/40">
                {advantages.map((adv, idx) => (
                  <div
                    key={adv.title + idx}
                    className="pt-2 first:pt-0 flex items-start gap-3 text-xs"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500/15 via-indigo-500/15 to-teal-500/15 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      {idx === 0 ? (
                        <ShoppingBag size={15} className="text-amber-500" />
                      ) : idx === 1 ? (
                        <Home size={15} className="text-teal-500" />
                      ) : idx === 2 ? (
                        <Layers size={15} className="text-purple-500" />
                      ) : idx === 3 ? (
                        <HardDrive size={15} className="text-blue-500" />
                      ) : (
                        <ShieldCheck size={15} className="text-emerald-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{adv.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                        {adv.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: RELEASE NOTES TEXT */}
          {activeTab === 'notes' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/15">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-500" />
                  <span>Release Notes — FinancialFree Ultimate {latestVersion} ({totalSizeFormatted})</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Engineered for maximum reliability, speed, optimized UPI QR codes, public statements, and audio feedback.
                </p>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {releaseNotes.map((note, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-900/30 border border-slate-200/40 dark:border-slate-800/40 leading-relaxed"
                  >
                    <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BOTTOM ACTIONS */}
          <div className="border-t border-slate-200/50 dark:border-slate-800/80 pt-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Info size={13} />
              <span>
                {isUpdateInstalled
                  ? `Installed on this device${installedAt ? ` (${new Date(installedAt).toLocaleDateString()})` : ''}`
                  : `${totalSizeFormatted} download • High-speed offline cache`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isUpdateSuccess || isUpdateInstalled ? (
                <LiquidButton
                  variant="primary"
                  size="sm"
                  onClick={closeUpdateModal}
                  icon={<CheckCircle2 size={15} />}
                >
                  Done (Up to Date)
                </LiquidButton>
              ) : (
                <LiquidButton
                  variant="primary"
                  size="md"
                  onClick={startAnalysisAndDownload}
                  disabled={isAnalyzing || isDownloading}
                  icon={<Download size={16} />}
                  className="font-bold shadow-lg shadow-blue-500/25 bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  {isDownloading
                    ? `Streaming (${downloadProgress}%)...`
                    : isAnalyzing
                    ? 'Verifying package...'
                    : `Download & Apply Update (${totalSizeFormatted})`}
                </LiquidButton>
              )}
            </div>
          </div>
        </LiquidGlassCard>
      </motion.div>
    </div>
  );
};
