import React, { useState, useRef, useEffect } from 'react';
import { useSync } from '../../context/SyncContext';
import { Cloud, CloudOff, RefreshCw, ShieldCheck, ArrowUpRight, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TabType } from './BottomNavigation';

interface CloudSyncIndicatorProps {
  onNavigateTab?: (tab: TabType) => void;
}

export const CloudSyncIndicator: React.FC<CloudSyncIndicatorProps> = ({ onNavigateTab }) => {
  const {
    syncState,
    lastSavedTime,
    statusMessage,
    isReconciling,
    isBackingUp,
    forceCloudSync,
    setIsIntegrityModalOpen
  } = useSync();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine appearance based on syncState
  const isSyncing = syncState === 'syncing' || isReconciling || isBackingUp;
  const isOffline = syncState === 'offline';
  const isDiscrepancy = syncState === 'discrepancy';

  // Styling configs
  const statusConfig = isSyncing
    ? {
        color: 'text-blue-500 dark:text-blue-400',
        bg: 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30',
        dot: 'bg-blue-500 animate-ping',
        label: 'Syncing...',
        title: 'Syncing with Cloud Firestore...'
      }
    : isOffline
    ? {
        color: 'text-amber-500 dark:text-amber-400',
        bg: 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30',
        dot: 'bg-amber-500',
        label: 'Offline',
        title: 'Working offline • Records saved in browser vault'
      }
    : isDiscrepancy
    ? {
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-500/20 border-amber-500/40',
        dot: 'bg-amber-500 animate-pulse',
        label: 'Review Sync',
        title: 'Discrepancy detected • Click to reconcile'
      }
    : {
        color: 'text-emerald-500 dark:text-emerald-400',
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30',
        dot: 'bg-emerald-500',
        label: 'Synced',
        title: `Cloud Synced • Last saved ${lastSavedTime ? lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'}`
      };

  const formattedTime = lastSavedTime
    ? lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Recently';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Visual Indicator Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-2xl border transition-all cursor-pointer select-none ${statusConfig.bg} ${statusConfig.color}`}
        title={statusConfig.title}
        aria-label="Cloud Synchronization Status"
      >
        <div className="relative flex items-center justify-center">
          {isOffline ? (
            <CloudOff size={16} className={statusConfig.color} />
          ) : isSyncing ? (
            <div className="relative">
              <Cloud size={16} className={statusConfig.color} />
              <RefreshCw size={9} className="absolute -bottom-1 -right-1 text-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="relative">
              <Cloud size={16} className={statusConfig.color} />
              <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
            </div>
          )}
        </div>

        <span className="text-[11px] font-semibold hidden sm:inline">
          {statusConfig.label}
        </span>
      </button>

      {/* Popover Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-72 p-4 rounded-2xl liquid-glass-primary border border-white/60 dark:border-white/10 shadow-xl z-50 text-slate-900 dark:text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-xl ${statusConfig.bg} ${statusConfig.color}`}>
                  {isOffline ? <CloudOff size={16} /> : <Cloud size={16} />}
                </div>
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span>Cloud Sync</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                    {statusConfig.label}
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-400">
                {formattedTime}
              </span>
            </div>

            {/* Status Details */}
            <div className="py-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-[11px] text-slate-400">Database</span>
                <span className="font-semibold text-[11px] flex items-center gap-1">
                  <Database size={12} className="text-emerald-500" />
                  Google Cloud Firestore
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-[11px] text-slate-400">Vault Mirror</span>
                <span className="font-semibold text-[11px] text-emerald-600 dark:text-emerald-400">
                  Active (Local + Cloud)
                </span>
              </div>
              {statusMessage && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 leading-snug bg-black/5 dark:bg-white/5 p-2 rounded-xl">
                  {statusMessage}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-2">
              <button
                onClick={async () => {
                  await forceCloudSync();
                }}
                disabled={isSyncing}
                className="w-full py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Cloud Now'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsIntegrityModalOpen(true);
                  }}
                  className="flex-1 py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <ShieldCheck size={12} className="text-blue-500" />
                  <span>Integrity Scan</span>
                </button>

                {onNavigateTab && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onNavigateTab('settings');
                    }}
                    className="flex-1 py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Restore / Backups</span>
                    <ArrowUpRight size={12} className="text-slate-400" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
