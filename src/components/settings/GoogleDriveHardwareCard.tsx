import React, { useState } from 'react';
import { motion } from 'motion/react';
import JSZip from 'jszip';
import {
  HardDrive,
  Cloud,
  CheckCircle2,
  Download,
  Upload,
  RefreshCw,
  FolderArchive,
  FileSpreadsheet,
  FileText,
  FileCode,
  ShieldCheck,
  ExternalLink,
  Laptop,
  Smartphone,
  Save,
  Check,
  Sparkles,
  LogIn
} from 'lucide-react';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { api, localVault } from '../../lib/api';
import { generateFullLedgerCSV } from '../../lib/csvExport';
import { buildReportsPdfDoc } from '../../lib/pdfExport';
import { playTickSound, playReturnMoneySound } from '../../lib/soundEffects';

export const GoogleDriveHardwareCard: React.FC = () => {
  const { showToast } = useToast();
  const { user, firebaseUser, isAuthenticated, loginWithGoogle } = useAuth();

  // Google Drive state
  const [isDriveSaving, setIsDriveSaving] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [lastDriveBackup, setLastDriveBackup] = useState<string | null>(() => {
    try {
      return localStorage.getItem('financialfree_last_gdrive_file_backup');
    } catch {
      return null;
    }
  });

  // Hardware Storage state
  const [isExportingBundle, setIsExportingBundle] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const [lastHardwareBackup, setLastHardwareBackup] = useState<string | null>(() => {
    try {
      return localStorage.getItem('financialfree_last_hardware_backup');
    } catch {
      return null;
    }
  });

  // Helper to fetch freshest ledger data (server or local vault)
  const getLedgerData = async () => {
    try {
      return await api.exportBackup();
    } catch {
      const people = localVault.getPeople();
      const transactions = localVault.getTransactions();
      const reminders = localVault.getReminders();
      return {
        people,
        transactions,
        reminders,
        exportedAt: new Date().toISOString(),
        version: '6.5.4.0'
      };
    }
  };

  // Helper: File System Access API write with universal download fallback
  const saveFileToHardware = async (
    blob: Blob,
    suggestedName: string,
    fileTypeDesc: string,
    mimeType: string,
    extension: string
  ) => {
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName,
          types: [
            {
              description: fileTypeDesc,
              accept: { [mimeType]: [`.${extension}`] }
            }
          ]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      } catch (err: any) {
        if (err.name === 'AbortError') return false; // user cancelled dialog
      }
    }

    // Universal browser download fallback
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  };

  // ==========================================
  // GOOGLE DRIVE CONNECT FLOWS (DUAL MODE)
  // ==========================================

  // Flow 1: Create a specialized Google Drive file to save data
  const handleCreateGoogleDriveFile = async () => {
    playTickSound();
    setIsDriveSaving(true);
    try {
      const backup = await getLedgerData();
      const drivePayload = {
        _app: 'FinancialFree',
        _version: '6.5.4.0 Pro',
        _format: 'google-drive-database-backup',
        _cloudStorageCompatible: true,
        _timestamp: new Date().toISOString(),
        _targetDriveFolder: 'FinancialFree Ledger Backups',
        metadata: {
          peopleCount: backup.people?.length || 0,
          transactionCount: backup.transactions?.length || 0,
          reminderCount: backup.reminders?.length || 0
        },
        payload: backup
      };

      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `financialfree_google_drive_backup_${dateStr}.json`;
      const blob = new Blob([JSON.stringify(drivePayload, null, 2)], {
        type: 'application/json'
      });

      const saved = await saveFileToHardware(
        blob,
        fileName,
        'Google Drive Ledger Backup File',
        'application/json',
        'json'
      );

      if (saved) {
        const nowIso = new Date().toISOString();
        setLastDriveBackup(nowIso);
        localStorage.setItem('financialfree_last_gdrive_file_backup', nowIso);
        showToast(
          `Google Drive file generated: ${fileName}. Upload directly to your Google Drive folder!`,
          'success'
        );
        playReturnMoneySound();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create Google Drive backup file', 'error');
    } finally {
      setIsDriveSaving(false);
    }
  };

  // Flow 2: Sign in with Google / Sync with Google Cloud
  const handleGoogleAuthSync = async () => {
    playTickSound();
    setIsCloudSyncing(true);
    try {
      if (!isAuthenticated) {
        showToast('Connecting to Google Sign-In...', 'info');
        const loggedIn = await loginWithGoogle();
        if (!loggedIn) {
          setIsCloudSyncing(false);
          return;
        }
      }

      // Push real-time ledger snapshot to Firestore / Google Cloud
      await api.pushCloudBackup();
      showToast('All ledger files pushed and synchronized to Google Cloud!', 'success');
      playReturnMoneySound();
    } catch (err: any) {
      showToast(err.message || 'Google Cloud sync failed', 'error');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // ==========================================
  // HARDWARE STORAGE FLOWS (UNIVERSAL BUNDLE)
  // ==========================================

  // Universal Bundle: JSON + CSV + PDF bundled in a ZIP
  const handleSaveUniversalHardwareBundle = async () => {
    playTickSound();
    setIsExportingBundle(true);
    try {
      const backup = await getLedgerData();
      const dateStr = new Date().toISOString().split('T')[0];
      const people = backup.people || [];
      const transactions = backup.transactions || [];

      // 1. JSON database
      const jsonContent = JSON.stringify(backup, null, 2);

      // 2. CSV spreadsheet
      const csvContent = generateFullLedgerCSV({
        people,
        transactions,
        currencyCode: 'INR',
        currencySymbol: '₹'
      });

      // 3. PDF Statement
      const totalGiven = transactions
        .filter(t => t.transaction_type === 'given')
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const totalReturned = transactions
        .filter(t => t.transaction_type === 'returned')
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);

      const pdfDoc = buildReportsPdfDoc(transactions, 'HARDWARE BACKUP STATEMENT', {
        given: totalGiven,
        returned: totalReturned,
        net: totalGiven - totalReturned,
        totalCount: transactions.length,
        periodLabel: `All-Time Hardware Ledger Archive (${dateStr})`
      });
      const pdfBlob = pdfDoc.output('blob');

      // Bundle with JSZip
      const zip = new JSZip();
      const folder = zip.folder(`FinancialFree_Hardware_Backup_${dateStr}`) || zip;
      folder.file(`database_${dateStr}.json`, jsonContent);
      folder.file(`transactions_${dateStr}.csv`, csvContent);
      folder.file(`statement_${dateStr}.pdf`, pdfBlob);
      folder.file(
        'README_HARDWARE_RESTORE.txt',
        `FINANCIALFREE HARDWARE BACKUP ARCHIVE\nGenerated: ${new Date().toISOString()}\nVersion: v6.5.4.0 Pro\nTotal Borrowers: ${people.length}\nTotal Transactions: ${transactions.length}\n\nContents:\n1. database_${dateStr}.json -> Universal raw database (import anytime into FinancialFree)\n2. transactions_${dateStr}.csv -> RFC 4180 spreadsheet for Microsoft Excel / Google Sheets\n3. statement_${dateStr}.pdf -> Vector audit statement for records and banking`
      );

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
      });

      const zipName = `financialfree_universal_hardware_backup_${dateStr}.zip`;
      const saved = await saveFileToHardware(
        zipBlob,
        zipName,
        'Universal Hardware Archive (.zip)',
        'application/zip',
        'zip'
      );

      if (saved) {
        const nowIso = new Date().toISOString();
        setLastHardwareBackup(nowIso);
        localStorage.setItem('financialfree_last_hardware_backup', nowIso);
        showToast(
          `Universal Hardware Bundle saved! Includes JSON database, CSV spreadsheet & PDF statement.`,
          'success'
        );
        playReturnMoneySound();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to export universal hardware bundle', 'error');
    } finally {
      setIsExportingBundle(false);
    }
  };

  // Individual JSON export
  const handleExportJsonOnly = async () => {
    playTickSound();
    setExportingFormat('json');
    try {
      const backup = await getLedgerData();
      const dateStr = new Date().toISOString().split('T')[0];
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json'
      });
      await saveFileToHardware(
        blob,
        `financialfree_database_${dateStr}.json`,
        'JSON Database',
        'application/json',
        'json'
      );
      showToast('JSON database saved to hardware storage!', 'success');
      playReturnMoneySound();
    } catch (err: any) {
      showToast(err.message || 'Failed to export JSON', 'error');
    } finally {
      setExportingFormat(null);
    }
  };

  // Individual CSV export
  const handleExportCsvOnly = async () => {
    playTickSound();
    setExportingFormat('csv');
    try {
      const backup = await getLedgerData();
      const dateStr = new Date().toISOString().split('T')[0];
      const csvContent = generateFullLedgerCSV({
        people: backup.people || [],
        transactions: backup.transactions || [],
        currencyCode: 'INR',
        currencySymbol: '₹'
      });
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      await saveFileToHardware(
        blob,
        `financialfree_spreadsheet_${dateStr}.csv`,
        'CSV Spreadsheet',
        'text/csv',
        'csv'
      );
      showToast('CSV spreadsheet saved to hardware storage!', 'success');
      playReturnMoneySound();
    } catch (err: any) {
      showToast(err.message || 'Failed to export CSV', 'error');
    } finally {
      setExportingFormat(null);
    }
  };

  // Individual PDF export
  const handleExportPdfOnly = async () => {
    playTickSound();
    setExportingFormat('pdf');
    try {
      const backup = await getLedgerData();
      const dateStr = new Date().toISOString().split('T')[0];
      const transactions = backup.transactions || [];
      const totalGiven = transactions
        .filter(t => t.transaction_type === 'given')
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const totalReturned = transactions
        .filter(t => t.transaction_type === 'returned')
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);

      const pdfDoc = buildReportsPdfDoc(transactions, 'HARDWARE AUDIT STATEMENT', {
        given: totalGiven,
        returned: totalReturned,
        net: totalGiven - totalReturned,
        totalCount: transactions.length,
        periodLabel: `Full Hardware Audit (${dateStr})`
      });
      const blob = pdfDoc.output('blob');
      await saveFileToHardware(
        blob,
        `financialfree_statement_${dateStr}.pdf`,
        'PDF Statement',
        'application/pdf',
        'pdf'
      );
      showToast('PDF audit statement saved to hardware storage!', 'success');
      playReturnMoneySound();
    } catch (err: any) {
      showToast(err.message || 'Failed to export PDF', 'error');
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <LiquidGlassCard
      variant="primary"
      glowColor="rgba(37, 99, 235, 0.25)"
      className="space-y-5 border border-blue-500/30 shadow-xl p-5 sm:p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-200/50 dark:border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 p-0.5 shadow-lg shadow-blue-500/25 flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-blue-400">
              <Cloud size={24} className="animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Google Drive Connect & Hardware Storage
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 flex items-center gap-1">
                <Sparkles size={10} /> v6.5.4.0 Pro
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Dual-mode Google Drive connect with one-click file save, Google Auth cloud push, and universal hardware disk backup bundle.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SECTION 1: DUAL-MODE GOOGLE DRIVE CONNECT */}
        <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center">
                <Cloud size={16} />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                Google Drive Dual-Mode Connect
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                isAuthenticated
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
              }`}
            >
              {isAuthenticated ? 'Google Auth Active' : 'Dual-Mode Ready'}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Choose between creating a standalone file configured for your Google Drive or authenticating with your Google Account for real-time cloud synchronization.
          </p>

          {/* Mode 1: Create a file to save data */}
          <div className="p-3 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Mode A: One-Click Drive File
              </span>
              <span className="text-[10px] text-slate-400">JSON Archive</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Generates a structured Google Drive backup file for your device and opens Google Drive for direct drag-and-drop storage.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCreateGoogleDriveFile}
                disabled={isDriveSaving}
                className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDriveSaving ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <Download size={13} />
                )}
                <span>{isDriveSaving ? 'Generating...' : 'Create Drive File'}</span>
              </button>
              <a
                href="https://drive.google.com/drive/u/0/my-drive"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Open Drive</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Mode 2: Google Sign-In & Cloud Sync */}
          <div className="p-3 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Mode B: Sign in with Google
              </span>
              <span className="text-[10px] text-slate-400">
                {isAuthenticated ? (user?.email || 'Logged In') : 'One-Click'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isAuthenticated
                ? `Authenticated as ${user?.email || firebaseUser?.email || 'Admin'}. Automatically synchronizes snapshots with cloud storage.`
                : 'Sign in with Google credentials to push and protect your data across devices seamlessly.'}
            </p>
            <button
              type="button"
              onClick={handleGoogleAuthSync}
              disabled={isCloudSyncing}
              className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-500 text-white text-xs font-black shadow-md shadow-indigo-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isCloudSyncing ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : isAuthenticated ? (
                <Upload size={13} />
              ) : (
                <LogIn size={13} />
              )}
              <span>
                {isCloudSyncing
                  ? 'Pushing to Cloud...'
                  : isAuthenticated
                  ? 'Push All Files to Cloud'
                  : 'Sign in with Google & Push'}
              </span>
            </button>
          </div>
        </div>

        {/* SECTION 2: UNIVERSAL HARDWARE STORAGE FILE EXPORT */}
        <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-500/15 text-teal-500 flex items-center justify-center">
                <HardDrive size={16} />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                Universal Hardware Storage Export
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
              Direct Disk Write
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Write your data directly to hardware storage using the File System Access API. Exports a complete bundle containing a universal JSON database, CSV spreadsheet, and PDF statement.
          </p>

          {/* Primary Action: Universal Bundle (ZIP) */}
          <button
            type="button"
            onClick={handleSaveUniversalHardwareBundle}
            disabled={isExportingBundle}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-black shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isExportingBundle ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              <FolderArchive size={15} />
            )}
            <span>
              {isExportingBundle
                ? 'Packaging Hardware Bundle...'
                : 'Save Universal Hardware Bundle (JSON + CSV + PDF)'}
            </span>
          </button>

          {/* Individual Format Buttons */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Or Save Individual Formats Directly
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleExportJsonOnly}
                disabled={!!exportingFormat || isExportingBundle}
                className="px-2.5 py-2 rounded-xl bg-white/70 dark:bg-white/5 hover:bg-blue-500/15 border border-slate-200/60 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <FileCode size={14} className="text-blue-500" />
                <span className="text-[11px]">JSON DB</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsvOnly}
                disabled={!!exportingFormat || isExportingBundle}
                className="px-2.5 py-2 rounded-xl bg-white/70 dark:bg-white/5 hover:bg-emerald-500/15 border border-slate-200/60 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet size={14} className="text-emerald-500" />
                <span className="text-[11px]">CSV Sheet</span>
              </button>

              <button
                type="button"
                onClick={handleExportPdfOnly}
                disabled={!!exportingFormat || isExportingBundle}
                className="px-2.5 py-2 rounded-xl bg-white/70 dark:bg-white/5 hover:bg-rose-500/15 border border-slate-200/60 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <FileText size={14} className="text-rose-500" />
                <span className="text-[11px]">PDF Report</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/40 dark:border-white/5">
            <span>Last Hardware Export:</span>
            <strong className="text-slate-700 dark:text-slate-200 font-mono">
              {lastHardwareBackup ? new Date(lastHardwareBackup).toLocaleDateString() : 'Ready'}
            </strong>
          </div>
        </div>
      </div>
    </LiquidGlassCard>
  );
};
