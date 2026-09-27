import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowUpCircle,
  Download,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  FileCode,
  Layers,
  Check,
  Info
} from 'lucide-react';
import { useAppUpdate } from '../../context/AppUpdateContext';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidButton } from '../ui/LiquidButton';

export const AppUpdateSettingsCard: React.FC = () => {
  const {
    currentVersion,
    latestVersion,
    hasUpdateAvailable,
    isUpdateInstalled,
    installedAt,
    totalSizeFormatted,
    files,
    openUpdateModal,
    checkForUpdates,
    resetUpdateForTesting,
    isDownloading,
    isAnalyzing
  } = useAppUpdate();

  return (
    <LiquidGlassCard variant="primary" glowColor="rgba(59, 130, 246, 0.15)" className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <ArrowUpCircle className="text-white w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Software Updates & Version
              </h3>
              {isUpdateInstalled || !hasUpdateAvailable ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 size={11} />
                  <span>Up to Date</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 animate-pulse">
                  <Sparkles size={11} />
                  <span>Update Available</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Over-the-air PWA updates, module cache verification, and download analysis.
            </p>
          </div>
        </div>

        {/* Action button in card header */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* USER REQUIREMENT: "once time update the update button not showing in app" */}
          {/* When update is NOT installed and an update is available: SHOW update button */}
          {hasUpdateAvailable && !isUpdateInstalled ? (
            <LiquidButton
              variant="primary"
              size="sm"
              onClick={openUpdateModal}
              icon={<Download size={14} />}
              className="font-bold shadow-md shadow-blue-500/20"
            >
              Download Update ({totalSizeFormatted})
            </LiquidButton>
          ) : (
            /* When updated: The update button is NOT showing! Instead a Check for Updates button */
            <LiquidButton
              variant="secondary"
              size="sm"
              onClick={checkForUpdates}
              icon={<RefreshCw size={13} />}
            >
              Check for Updates
            </LiquidButton>
          )}
        </div>
      </div>

      {/* Version Status Box */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Installed Version</div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
            {isUpdateInstalled ? latestVersion : currentVersion}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Available Release</div>
          <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">
            {latestVersion}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Analyzed Size</div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
            {totalSizeFormatted}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</div>
          <div className={`text-xs font-bold mt-0.5 flex items-center gap-1 ${
            isUpdateInstalled || !hasUpdateAvailable
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-blue-600 dark:text-blue-400'
          }`}>
            {isUpdateInstalled || !hasUpdateAvailable ? (
              <>
                <CheckCircle2 size={12} />
                <span>Installed</span>
              </>
            ) : (
              <>
                <Download size={12} />
                <span>Ready to Download</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom informational note & analysis toggle */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
          <span>
            {isUpdateInstalled || !hasUpdateAvailable
              ? `Running newest build (${latestVersion}). Update button suppressed.`
              : `Download payload includes ${files.length} modules analyzed with SHA-256 integrity.`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openUpdateModal}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            <FileCode size={13} />
            <span>Inspect File Analysis</span>
          </button>

          {/* Test reset helper for developer testing */}
          <button
            onClick={resetUpdateForTesting}
            className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
            title="Reset update state to test the update flow and button again"
          >
            (Reset to test)
          </button>
        </div>
      </div>
    </LiquidGlassCard>
  );
};
