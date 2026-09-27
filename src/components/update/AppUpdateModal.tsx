import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Download,
  ArrowUpCircle,
  FileCode,
  HardDrive,
  CheckCircle2,
  X,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Cpu,
  Layers,
  Check,
  Zap,
  Info
} from 'lucide-react';
import { useAppUpdate } from '../../context/AppUpdateContext';
import { LiquidButton } from '../ui/LiquidButton';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';

export const AppUpdateModal: React.FC = () => {
  const {
    currentVersion,
    latestVersion,
    hasUpdateAvailable,
    isUpdateInstalled,
    installedAt,
    totalSizeMB,
    totalSizeFormatted,
    files,
    releaseNotes,
    isAnalyzing,
    analysisProgress,
    isDownloading,
    downloadProgress,
    downloadSpeedMBps,
    downloadedMB,
    currentProcessingFile,
    isUpdateSuccess,
    isModalOpen,
    closeUpdateModal,
    startAnalysisAndDownload,
    resetUpdateForTesting
  } = useAppUpdate();

  const [activeTab, setActiveTab] = useState<'analysis' | 'notes'>('analysis');

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
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
                    Software Update & Analysis
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                    {latestVersion}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Current: <span className="font-semibold">{currentVersion}</span> → Target:{' '}
                  <span className="font-bold text-blue-600 dark:text-blue-400">{latestVersion}</span>
                </p>
              </div>
            </div>

            <button
              onClick={closeUpdateModal}
              disabled={isAnalyzing || isDownloading}
              className="p-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'analysis'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HardDrive size={13} />
              <span>Update Files Analysis ({totalSizeFormatted})</span>
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'notes'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles size={13} />
              <span>Release Notes</span>
            </button>
          </div>

          {/* ACTIVE DOWNLOAD / ANALYSIS PROGRESS BANNER */}
          {(isAnalyzing || isDownloading) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-3"
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <RefreshCw size={14} className="animate-spin text-blue-500" />
                  <span>
                    {isAnalyzing
                      ? `Analyzing update files (${analysisProgress}%)`
                      : `Downloading & Caching modules (${downloadProgress}%)`}
                  </span>
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {isAnalyzing
                    ? 'Verifying hashes & payload weights'
                    : `${downloadedMB} MB / ${totalSizeMB} MB • ${downloadSpeedMBps} MB/s`}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-400 rounded-full"
                  style={{ width: `${isAnalyzing ? analysisProgress : downloadProgress}%` }}
                  transition={{ duration: 0.15 }}
                />
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                {currentProcessingFile || 'Preparing package verification...'}
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
                Update Successfully Applied!
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                FinancialFree is now operating on <span className="font-bold text-emerald-600 dark:text-emerald-400">{latestVersion}</span>.
                All 9 asset bundles have been pre-cached for instant 120 FPS response and offline support.
              </p>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 italic">
                ✓ The update button is now permanently hidden. You are on the newest release.
              </p>
            </motion.div>
          )}

          {/* TAB 1: FILES ANALYSIS & MB BREAKDOWN */}
          {activeTab === 'analysis' && (
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
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Files Analyzed</div>
                  <div className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-200 mt-0.5">
                    {files.length} modules
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PWA Offline Cache</div>
                  <div className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
                    <ShieldCheck size={14} />
                    <span>Included</span>
                  </div>
                </div>
              </div>

              {/* Scrollable Files List with Real MB/KB analysis */}
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800/50">
                {files.map((file, idx) => (
                  <div
                    key={file.name + idx}
                    className="pt-1.5 first:pt-0 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                        {file.category === 'styles' ? (
                          <Layers size={13} className="text-teal-500" />
                        ) : file.category === 'vendor' ? (
                          <Cpu size={13} className="text-indigo-500" />
                        ) : file.category === 'pwa' ? (
                          <ShieldCheck size={13} className="text-amber-500" />
                        ) : (
                          <FileCode size={13} className="text-blue-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {file.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {file.description}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                        {file.sizeFormatted}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          file.status === 'verified'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : file.status === 'downloading'
                            ? 'bg-blue-500/20 text-blue-600 animate-pulse'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {file.status === 'verified'
                          ? 'Installed'
                          : file.status === 'downloading'
                          ? 'Fetching...'
                          : 'Analyzed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: RELEASE NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/15">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-500" />
                  <span>What's new in {latestVersion}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Engineered for maximum reliability, speed, and privacy.
                </p>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {releaseNotes.map((note, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 p-2 rounded-xl bg-slate-50/60 dark:bg-slate-900/30"
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
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Info size={13} />
              <span>
                {isUpdateInstalled
                  ? `Installed on this device${installedAt ? ` (${new Date(installedAt).toLocaleDateString()})` : ''}`
                  : `Analyzed download: ${totalSizeFormatted}`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Once update is completed or already installed, DO NOT SHOW the update button! */}
              {isUpdateSuccess || isUpdateInstalled ? (
                <>
                  <LiquidButton
                    variant="primary"
                    size="sm"
                    onClick={closeUpdateModal}
                    icon={<CheckCircle2 size={15} />}
                  >
                    Done (Up to Date)
                  </LiquidButton>
                </>
              ) : (
                /* THE UPDATE BUTTON - ANALYSIS DISPLAYED IN MB */
                <LiquidButton
                  variant="primary"
                  size="md"
                  onClick={startAnalysisAndDownload}
                  disabled={isAnalyzing || isDownloading}
                  icon={<Download size={16} />}
                  className="font-bold shadow-lg shadow-blue-500/25"
                >
                  {isDownloading
                    ? `Downloading (${downloadProgress}%)...`
                    : isAnalyzing
                    ? 'Analyzing files...'
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
