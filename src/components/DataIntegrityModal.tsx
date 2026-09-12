import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Cloud,
  HardDrive,
  CheckCircle2,
  ArrowRight,
  Database,
  Info
} from 'lucide-react';
import { LiquidModal } from './ui/LiquidModal';
import { useSync } from '../context/SyncContext';

export const DataIntegrityModal: React.FC = () => {
  const {
    isIntegrityModalOpen,
    setIsIntegrityModalOpen,
    syncState,
    statusMessage,
    integrityReport,
    discrepancyDetails,
    isReconciling,
    backupStatus,
    isBackingUp,
    isRestoring,
    nextBackupDueTime,
    isAutoBackupActive,
    autoBackupIntervalHours,
    triggerCloudBackup,
    restoreFromCloud,
    resolveDiscrepancy,
    runIntegrityCheck,
    forceCloudSync
  } = useSync();

  const handleResolve = async (action: 'merge' | 'push_local' | 'pull_remote') => {
    const success = await resolveDiscrepancy(action);
    if (success) {
      // Trigger a page data refresh event so lists update
      window.dispatchEvent(new CustomEvent('financialfree_data_reconciled'));
    }
  };

  const handleManualCheck = async () => {
    await runIntegrityCheck(false);
  };

  return (
    <LiquidModal
      isOpen={isIntegrityModalOpen}
      onClose={() => !isReconciling && setIsIntegrityModalOpen(false)}
      title="Data Integrity & Cloud Protection"
      subtitle="Ensuring permanent persistence between your device and cloud storage"
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Status banner */}
        {discrepancyDetails?.hasDiscrepancy ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
            <div className="flex-1 text-sm">
              <h4 className="font-semibold text-amber-900 dark:text-amber-200">
                Discrepancy Detected — Uncommitted Records
              </h4>
              <p className="text-amber-800/90 dark:text-amber-300/90 text-xs mt-1 leading-relaxed">
                {discrepancyDetails.summaryMessage ||
                  'Your local browser vault holds records that are not yet fully mirrored on the remote cloud database.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 flex items-start gap-3">
            <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={20} />
            <div className="flex-1 text-sm">
              <h4 className="font-semibold text-emerald-900 dark:text-emerald-200">
                All Records 100% Synchronized & Protected
              </h4>
              <p className="text-emerald-800/90 dark:text-emerald-300/90 text-xs mt-1 leading-relaxed">
                Your borrowers, transaction entries, and running balances are identically matched between your device's indelible local vault and the remote cloud database.
              </p>
            </div>
          </div>
        )}

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Local Vault Card */}
          <div className="p-4 rounded-2xl liquid-glass-secondary border border-slate-200/80 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 dark:text-white font-medium text-sm">
                <div className="w-7 h-7 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <HardDrive size={15} />
                </div>
                <span>Local Browser Vault</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                Always Safe
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-white/5 text-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">People</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {discrepancyDetails ? discrepancyDetails.localPeopleCount : (integrityReport?.serverPeopleCount ?? 0)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-white/5 text-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Transactions</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {discrepancyDetails ? discrepancyDetails.localTxCount : (integrityReport?.serverTxCount ?? 0)}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Indelible local storage safeguards your inputs against temporary server restarts or connection drops.
            </p>
          </div>

          {/* Remote Cloud Database Card */}
          <div className="p-4 rounded-2xl liquid-glass-secondary border border-slate-200/80 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 dark:text-white font-medium text-sm">
                <div className="w-7 h-7 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Cloud size={15} />
                </div>
                <span>Remote Cloud State</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                integrityReport?.isCloudSynced
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
              }`}>
                {integrityReport?.isCloudSynced ? 'Firestore Active' : 'Live Mirror'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-white/5 text-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">People</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {integrityReport?.serverPeopleCount ?? 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-white/5 text-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Transactions</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {integrityReport?.serverTxCount ?? 0}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              Cloud persistence ensures multi-device access and cross-session durability.
            </p>
          </div>
        </div>

        {/* Automated 24-Hour Backup Routine Status */}
        <div className="p-4 rounded-2xl liquid-glass-secondary border border-blue-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Cloud size={15} />
              </div>
              <span className="text-sm font-semibold text-slate-800 dark:text-white">
                Automated 24-Hour Cloud Snapshot
              </span>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
              Active ({autoBackupIntervalHours || 24}h Interval)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-white/5 space-y-0.5">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Last Backup Recorded</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {backupStatus?.timestamp ? new Date(backupStatus.timestamp).toLocaleString() : 'Secured on initialization'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-white/5 space-y-0.5">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Next Automatic Cycle</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {nextBackupDueTime ? nextBackupDueTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Within 24 hours'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Provider: Google Cloud Firestore • Lifetime Safe
            </span>
            <button
              type="button"
              onClick={() => triggerCloudBackup()}
              disabled={isBackingUp || isReconciling}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCw size={12} className={isBackingUp ? 'animate-spin' : ''} />
              <span>{isBackingUp ? 'Securing...' : 'Backup Now'}</span>
            </button>
          </div>
        </div>

        {/* Detailed lists of items if discrepancy exists */}
        {discrepancyDetails?.hasDiscrepancy && (
          <div className="p-4 rounded-2xl liquid-glass-secondary border border-amber-500/20 space-y-3">
            <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Info size={14} className="text-amber-500" />
              Items to be Synchronized
            </h5>

            {discrepancyDetails.missingOnServerPeople.length > 0 && (
              <div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Local Borrower Records Pending Cloud Push:
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {discrepancyDetails.missingOnServerPeople.map(p => (
                    <span
                      key={p.id}
                      className="text-xs px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 font-medium"
                    >
                      {p.full_name} {p.phone ? `(${p.phone})` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {discrepancyDetails.missingOnServerTxs.length > 0 && (
              <div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Transactions Pending Cloud Push ({discrepancyDetails.missingOnServerTxs.length} items):
                </span>
                <div className="max-h-24 overflow-y-auto space-y-1 mt-1.5 pr-1">
                  {discrepancyDetails.missingOnServerTxs.slice(0, 5).map(t => (
                    <div
                      key={t.id}
                      className="text-xs px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-between text-slate-700 dark:text-slate-300"
                    >
                      <span className="capitalize font-medium">{t.transaction_type}: ₹{t.amount?.toLocaleString()}</span>
                      <span className="text-[11px] text-slate-400">{t.transaction_date}</span>
                    </div>
                  ))}
                  {discrepancyDetails.missingOnServerTxs.length > 5 && (
                    <span className="text-[11px] text-slate-400 italic block">
                      + {discrepancyDetails.missingOnServerTxs.length - 5} more transactions
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {discrepancyDetails?.hasDiscrepancy ? (
          <div className="space-y-2 pt-2">
            <button
              onClick={() => handleResolve('merge')}
              disabled={isReconciling}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isReconciling ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Reconciling & Securing Records...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Safe Merge & Sync to Cloud (Recommended)</span>
                </>
              )}
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => handleResolve('push_local')}
                disabled={isReconciling}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Push Local Vault Only
              </button>
              <button
                onClick={() => handleResolve('pull_remote')}
                disabled={isReconciling}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Pull Cloud State Only
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleManualCheck}
              disabled={isReconciling}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw size={14} className={isReconciling ? 'animate-spin' : ''} />
              <span>Run Deep Integrity Scan</span>
            </button>
            <button
              onClick={() => forceCloudSync()}
              disabled={isReconciling}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Cloud size={14} />
              <span>Push All to Firestore</span>
            </button>
          </div>
        )}
      </div>
    </LiquidModal>
  );
};
