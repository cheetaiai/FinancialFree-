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
  Zap,
  Check,
  Info,
  Layers,
  Clock,
  Radio,
  Volume2,
  Database,
  Lock,
  Cpu
} from 'lucide-react';
import { useAppUpdate } from '../../context/AppUpdateContext';
import { playTickSound, playGivenMoneySound, playReturnMoneySound } from '../../lib/soundEffects';

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

  const [activeTab, setActiveTab] = useState<'advantages' | 'notes' | 'system'>('advantages');

  if (!isModalOpen) return null;

  const handleTabChange = (tab: 'advantages' | 'notes' | 'system') => {
    playTickSound();
    setActiveTab(tab);
  };

  const formattedUpdateDate = installedAt
    ? new Date(installedAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-2xl overflow-y-auto">
      {/* Dynamic Liquid Glow Orbs in Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute -bottom-24 left-1/3 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 18 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-2xl my-auto relative z-10"
      >
        {/* Apple Liquid-Glass Container */}
        <div className="relative rounded-3xl border border-white/20 dark:border-white/15 bg-gradient-to-b from-white/90 via-white/80 to-slate-100/90 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-slate-950/90 backdrop-blur-3xl shadow-[0_30px_90px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Prismatic Specular Highlight Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-400 opacity-90 shadow-sm" />

          <div className="p-5 sm:p-7 space-y-6">
            {/* Top Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-200/60 dark:border-white/10 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 p-[1px] shadow-xl shadow-blue-500/25 flex items-center justify-center">
                    <div className="w-full h-full rounded-2xl bg-slate-950/40 backdrop-blur-sm flex items-center justify-center">
                      <ArrowUpCircle className="text-white w-7 h-7 drop-shadow-md animate-pulse" />
                    </div>
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-teal-500 border-2 border-white dark:border-slate-900" />
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      Software Update {latestVersion}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                      Liquid Glass Release
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      {totalSizeFormatted}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                    <span>
                      Active: <strong className="font-semibold text-slate-700 dark:text-slate-300">{currentVersion}</strong> → Target:{' '}
                      <strong className="font-bold text-blue-600 dark:text-blue-400">{latestVersion}</strong>
                    </span>
                    <span className="opacity-40">•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Lock size={12} /> Permanent Release
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={closeUpdateModal}
                disabled={isAnalyzing || isDownloading}
                className="p-2 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all disabled:opacity-40 cursor-pointer border border-transparent hover:border-white/10"
                title="Close update dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Permanent Installation Pill (Displays when already installed) */}
            {isUpdateInstalled && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-blue-500/15 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <div className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Installed & Permanent Release</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono">
                        {latestVersion}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Updated Date: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formattedUpdateDate}</span> • Stored in Phone Vault
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                  <ShieldCheck size={14} />
                  <span>Permanent</span>
                </div>
              </motion.div>
            )}

            {/* Interactive Liquid Navigation Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-200/50 dark:bg-slate-950/60 rounded-2xl border border-slate-300/40 dark:border-white/10">
              <button
                onClick={() => handleTabChange('advantages')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'advantages'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md border border-white/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles size={14} className="text-amber-500" />
                <span>Feature Advantages</span>
              </button>
              <button
                onClick={() => handleTabChange('notes')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'notes'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md border border-white/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Zap size={14} className="text-blue-500" />
                <span>Release Notes</span>
              </button>
              <button
                onClick={() => handleTabChange('system')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'system'
                    ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-md border border-white/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Cpu size={14} className="text-teal-500" />
                <span>System Specs</span>
              </button>
            </div>

            {/* ACTIVE DOWNLOAD / ANALYSIS LIQUID GLASS PROGRESS BAR */}
            {(isAnalyzing || isDownloading) && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-gradient-to-r from-blue-600/15 via-indigo-600/10 to-teal-500/15 border border-blue-500/30 space-y-3.5 backdrop-blur-md"
              >
                <div className="flex items-center justify-between text-xs font-bold flex-wrap gap-2">
                  <span className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <RefreshCw size={15} className="animate-spin text-blue-500" />
                    <span className="font-black">
                      {isAnalyzing
                        ? `Verifying Package Integrity (${analysisProgress}%)`
                        : `Streaming Package Modules (${downloadProgress}%)`}
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
                        ? 'Verification Complete'
                        : `${downloadedFormatted} / ${totalSizeFormatted} • ${downloadSpeedMBps} MB/s`}
                    </span>
                    <button
                      type="button"
                      onClick={toggleTurboMode}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                        isTurboMode
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40 shadow-sm'
                          : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
                      }`}
                      title="Toggle download simulation speed"
                    >
                      {isTurboMode ? '⚡ Fast Mode' : '⏱ Standard'}
                    </button>
                  </div>
                </div>

                {/* High-Fidelity Liquid Progress Bar */}
                <div className="relative w-full bg-slate-300/40 dark:bg-slate-950/70 h-3 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-400 rounded-full shadow-lg shadow-teal-500/50"
                    style={{ width: `${isAnalyzing ? analysisProgress : downloadProgress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>

                {/* Active Feature Being Installed */}
                {advantages[activeFeatureIndex] && (
                  <motion.div
                    key={activeFeatureIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/20 dark:border-white/10 flex items-center justify-between gap-3 shadow-md backdrop-blur-md"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                        {activeFeatureIndex + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          Activating Feature ({activeFeatureIndex + 1}/{advantages.length})
                        </div>
                        <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {advantages[activeFeatureIndex].title}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                      Active
                    </span>
                  </motion.div>
                )}

                <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping shrink-0" />
                  <span>{currentProcessingStage || `Streaming high-speed ${totalSizeFormatted} update package...`}</span>
                </div>
              </motion.div>
            )}

            {/* TAB 1: ADVANTAGES OF FEATURES */}
            {activeTab === 'advantages' && (
              <div className="space-y-4">
                {/* Highlights Grid */}
                <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/10 text-center">
                  <div className="p-1">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Size</div>
                    <div className="text-sm sm:text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">
                      {totalSizeFormatted}
                    </div>
                  </div>
                  <div className="p-1 border-x border-slate-200/60 dark:border-white/10">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Architecture</div>
                    <div className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
                      <ShieldCheck size={14} />
                      <span>Zero-Loss</span>
                    </div>
                  </div>
                  <div className="p-1">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Audio Stage</div>
                    <div className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center justify-center gap-1">
                      <Volume2 size={14} />
                      <span>HD Chimes</span>
                    </div>
                  </div>
                </div>

                {/* Advantages Cards List */}
                <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-100 dark:divide-white/5">
                  {advantages.map((adv, idx) => (
                    <div
                      key={adv.title + idx}
                      className="pt-2.5 first:pt-0 flex items-start gap-3 text-xs"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500/20 via-indigo-500/15 to-teal-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        {idx === 0 ? (
                          <ShoppingBag size={16} className="text-amber-500" />
                        ) : idx === 1 ? (
                          <Home size={16} className="text-teal-500" />
                        ) : idx === 2 ? (
                          <Layers size={16} className="text-purple-500" />
                        ) : idx === 3 ? (
                          <HardDrive size={16} className="text-blue-500" />
                        ) : (
                          <ShieldCheck size={16} className="text-emerald-500" />
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

            {/* TAB 2: RELEASE NOTES */}
            {activeTab === 'notes' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                  <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Zap size={14} className="text-amber-500" />
                    <span>FinancialFree Release {latestVersion} ({totalSizeFormatted})</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Optimized QR Code Payment Engine, Zero-Login Statement Sharing, Paytm & Mixkit Audio Soundstage, and Zero-Loss Local Phone Vault.
                  </p>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {releaseNotes.map((note, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 p-2.5 rounded-xl bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-white/5 leading-relaxed"
                    >
                      <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: SYSTEM SPECS & AUDIO PREVIEWS */}
            {activeTab === 'system' && (
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database size={16} className="text-blue-500" />
                      <span className="font-bold text-slate-900 dark:text-white">Primary Storage: Phone Local Vault</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      Zero Data Loss
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    All financial entries, people, transactions, and reminders are committed directly to your device storage instantly, with quiet background sync to Google Cloud Firestore (financialfreestudio).
                  </p>
                </div>

                {/* Audio Previews Card */}
                <div className="p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 size={16} className="text-indigo-500" />
                      <span className="font-bold text-slate-900 dark:text-white">Payment Audio Soundstage</span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Click to preview</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => playGivenMoneySound()}
                      className="p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/25 flex items-center justify-center gap-2 font-bold cursor-pointer transition-colors"
                    >
                      <Volume2 size={14} />
                      <span>Paytm Given Sound</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => playReturnMoneySound()}
                      className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/25 flex items-center justify-center gap-2 font-bold cursor-pointer transition-colors"
                    >
                      <Sparkles size={14} />
                      <span>Mixkit Coin Chime</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* BOTTOM ACTIONS */}
            <div className="border-t border-slate-200/60 dark:border-white/10 pt-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Info size={14} className="text-blue-500" />
                <span>
                  {isUpdateInstalled
                    ? `Permanent update active • ${formattedUpdateDate}`
                    : `${totalSizeFormatted} download • Offline Cache`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isUpdateSuccess || isUpdateInstalled ? (
                  <button
                    onClick={closeUpdateModal}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-black shadow-lg shadow-emerald-500/25 cursor-pointer transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 size={15} />
                    <span>Done (Up to Date)</span>
                  </button>
                ) : (
                  <button
                    onClick={startAnalysisAndDownload}
                    disabled={isAnalyzing || isDownloading}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 hover:opacity-95 text-white text-xs font-black shadow-xl shadow-blue-500/30 cursor-pointer transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Download size={15} />
                    <span>
                      {isDownloading
                        ? `Streaming (${downloadProgress}%)...`
                        : isAnalyzing
                        ? 'Verifying Package...'
                        : `Download & Apply Update (${totalSizeFormatted})`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
