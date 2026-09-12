import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCurrency, SUPPORTED_CURRENCIES, CurrencyCode } from '../context/CurrencyContext';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Key,
  Sun,
  Moon,
  Laptop,
  Download,
  Upload,
  Coins,
  CheckCircle2,
  Lock,
  Database,
  RefreshCw,
  Cloud,
  Server,
  Trash2,
  AlertTriangle,
  Globe2,
  DollarSign,
  UserX,
  CloudDownload,
  CloudUpload,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react';
import { LiquidGlassCard } from '../components/ui/LiquidGlassCard';
import { LiquidButton } from '../components/ui/LiquidButton';
import { LiquidSegmentedControl } from '../components/ui/LiquidSegmentedControl';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { useSync } from '../context/SyncContext';
import { usePWAInstall } from '../lib/usePWAInstall';
import { MobileAppShowcaseModal } from '../components/mobile/MobileAppShowcaseModal';
import { BiometricSecuritySection } from '../components/settings/BiometricSecuritySection';
import { BackupData } from '../types';
import { Compass, Sparkles } from 'lucide-react';

interface SettingsPageProps {
  onOpenWalkthrough?: () => void;
  currentDeviceMode?: 'responsive' | 'iphone' | 'android' | 'tablet';
  onSelectDeviceMode?: (mode: 'responsive' | 'iphone' | 'android' | 'tablet') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onOpenWalkthrough,
  currentDeviceMode = 'responsive',
  onSelectDeviceMode
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [isShowcaseModalOpen, setIsShowcaseModalOpen] = useState(false);
  const { user, changePassword } = useAuth();
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency, formatAmount, currencyConfig, currencies } = useCurrency();
  const { showToast } = useToast();
  const {
    runIntegrityCheck,
    setIsIntegrityModalOpen,
    backupStatus,
    isBackingUp,
    isRestoring,
    triggerCloudBackup,
    restoreFromCloud,
    fetchBackupStatus
  } = useSync();

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isClearingPeople, setIsClearingPeople] = useState(false);
  const [isClearPeopleModalOpen, setIsClearPeopleModalOpen] = useState(false);
  const [isConfirmRestoreOpen, setIsConfirmRestoreOpen] = useState(false);

  const [dbStatus, setDbStatus] = useState<{
    status: string;
    provider: string;
    projectId: string;
    databaseId: string;
    peopleCount?: number;
    txCount?: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDbStatus = async () => {
    try {
      const res = await api.getDatabaseStatus();
      setDbStatus(res);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDbStatus();
  }, []);

  const handleSyncCloud = async () => {
    try {
      setIsSyncing(true);
      const res = await api.syncDatabase();
      showToast('Cloud database synchronized successfully! All records up to date.', 'success');
      await fetchDbStatus();
    } catch (err: any) {
      showToast(err.message || 'Failed to sync with cloud database', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearAllPeople = async () => {
    try {
      setIsClearingPeople(true);
      const res = await api.clearAllPeople();
      showToast(`Removed all ${res.deletedPeople} members and ${res.deletedTransactions} transactions from Cloud Firestore database. Ready for fresh entries!`, 'success');
      setIsClearPeopleModalOpen(false);
      await fetchDbStatus();
    } catch (err: any) {
      showToast(err.message || 'Failed to clear records from database', 'error');
    } finally {
      setIsClearingPeople(false);
    }
  };

  const handleManualCloudBackup = async () => {
    const result = await triggerCloudBackup();
    if (result.success) {
      showToast(result.message, 'success');
      await fetchDbStatus();
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleConfirmRestore = async () => {
    setIsConfirmRestoreOpen(false);
    const result = await restoreFromCloud();
    if (result.success) {
      showToast(result.message, 'success');
      await fetchDbStatus();
    } else {
      showToast(result.message, 'error');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }
    if (newPass !== confirmPass) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    setIsChangingPass(true);
    const success = await changePassword(currentPass, newPass);
    setIsChangingPass(false);
    if (success) {
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    }
  };

  const handleExportJSON = async () => {
    try {
      setIsExporting(true);
      const backup = await api.exportBackup();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backup, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `financialfree_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Database backup downloaded.', 'success');
    } catch (err: any) {
      showToast('Failed to export backup', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.readAsText(files[0], 'UTF-8');
    fileReader.onload = async event => {
      try {
        setIsImporting(true);
        const parsed = JSON.parse(event.target?.result as string) as BackupData;
        if (!parsed.people || !parsed.transactions) {
          throw new Error('Invalid FinancialFree backup file format');
        }

        const res = await api.importBackup(parsed);
        showToast(`Backup restored! ${res.peopleCount} people and ${res.txCount} transactions synchronized to Cloud.`, 'success');
        await fetchDbStatus();
      } catch (err: any) {
        showToast(err.message || 'Failed to restore backup file', 'error');
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <div className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
          Preferences & Configuration
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Settings & Security
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Manage currency formatting, authorized master account, cloud database synchronization, and themes.
        </p>
      </div>

      {/* CURRENCY SWITCHER CARD */}
      <LiquidGlassCard variant="primary" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Globe2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Global Currency & Formatting
              </h3>
              <p className="text-xs text-slate-500">
                Choose your default currency. All amounts, summaries, ledger transactions, and PDF reports update automatically.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200">
            <span>Preview:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-black">{formatAmount(125000)}</span>
          </div>
        </div>

        {/* Interactive Currency Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2">
          {currencies.map(c => {
            const isSelected = currency === c.code;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  setCurrency(c.code);
                  showToast(`Currency updated to ${c.name} (${c.symbol})`, 'success');
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-500/15 border-blue-500 text-slate-900 dark:text-white shadow-sm ring-2 ring-blue-500/20'
                    : 'liquid-glass-secondary border-slate-200/70 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{c.flag}</span>
                  <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-md ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-black/5 dark:bg-white/10 text-slate-500'
                  }`}>
                    {c.symbol}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-xs font-bold truncate">{c.code}</div>
                  <div className="text-[11px] text-slate-400 truncate">{c.name}</div>
                </div>
              </button>
            );
          })}
        </div>
      </LiquidGlassCard>

      {/* Cloud Database & LocalStorage Dual Persistence Card */}
      <LiquidGlassCard variant="primary" className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Cloud size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Dual Cloud & LocalStorage Persistence
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Cloud + LocalStorage Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All records, lending receipts, and balances are mirrored across Google Cloud Firestore and browser LocalStorage.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenWalkthrough && (
              <LiquidButton
                variant="secondary"
                size="sm"
                onClick={onOpenWalkthrough}
                icon={<Compass size={14} className="text-emerald-500" />}
              >
                Replay 3-Page Tour
              </LiquidButton>
            )}

            <LiquidButton
              variant="secondary"
              size="sm"
              onClick={() => {
                runIntegrityCheck(false);
                setIsIntegrityModalOpen(true);
              }}
              icon={<ShieldCheck size={14} className="text-blue-500" />}
            >
              Data Integrity Check
            </LiquidButton>

            <LiquidButton
              variant="secondary"
              size="sm"
              onClick={handleSyncCloud}
              isLoading={isSyncing}
              icon={<RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />}
            >
              Sync Database
            </LiquidButton>

            <LiquidButton
              variant="destructive"
              size="sm"
              onClick={() => setIsClearPeopleModalOpen(true)}
              icon={<UserX size={14} />}
            >
              Clear All Members
            </LiquidButton>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10">
            <div className="text-[11px] text-slate-400 font-medium">Provider</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
              Google Cloud Firestore
            </div>
          </div>
          <div className="p-3 rounded-xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10">
            <div className="text-[11px] text-slate-400 font-medium">Active Contacts Stored</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {dbStatus?.peopleCount !== undefined ? `${dbStatus.peopleCount} Members` : 'Live Synced'}
            </div>
          </div>
          <div className="p-3 rounded-xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10">
            <div className="text-[11px] text-slate-400 font-medium">Transactions Stored</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {dbStatus?.txCount !== undefined ? `${dbStatus.txCount} Records` : 'Live Synced'}
            </div>
          </div>
        </div>
      </LiquidGlassCard>

      {/* Automated Cloud Backup & Manual Restore Routine Card */}
      <LiquidGlassCard variant="primary" className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <CloudUpload size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Automated Cloud Backup & Manual Restore
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  Routine Active (Every 5m + On Save)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Continuous background routine pushes snapshots to Google Cloud Firestore (<span className="font-mono text-[11px]">backups/latest_backup</span>).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <LiquidButton
              variant="secondary"
              size="sm"
              onClick={handleManualCloudBackup}
              isLoading={isBackingUp}
              icon={<CloudUpload size={14} className="text-blue-500" />}
            >
              {isBackingUp ? 'Pushing Snapshot...' : 'Backup to Cloud Now'}
            </LiquidButton>

            <LiquidButton
              variant="primary"
              size="sm"
              onClick={() => setIsConfirmRestoreOpen(true)}
              isLoading={isRestoring}
              icon={<CloudDownload size={14} />}
            >
              {isRestoring ? 'Restoring Records...' : 'Restore from Cloud'}
            </LiquidButton>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10">
            <div className="text-[11px] text-slate-400 font-medium">Last Cloud Backup</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5" title={backupStatus?.timestamp}>
              {backupStatus?.timestamp ? new Date(backupStatus.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', month: 'short', day: 'numeric' }) : 'Ready'}
            </div>
          </div>
          <div className="p-3 rounded-xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10">
            <div className="text-[11px] text-slate-400 font-medium">Snapshot Members</div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {backupStatus?.peopleCount !== undefined ? `${backupStatus.peopleCount} Contacts` : `${dbStatus?.peopleCount || 0} Contacts`}
            </div>
          </div>
          <div className="p-3 rounded-xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10">
            <div className="text-[11px] text-slate-400 font-medium">Snapshot Transactions</div>
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              {backupStatus?.txCount !== undefined ? `${backupStatus.txCount} Records` : `${dbStatus?.txCount || 0} Records`}
            </div>
          </div>
          <div className="p-3 rounded-xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10">
            <div className="text-[11px] text-slate-400 font-medium">Storage Target</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
              {backupStatus?.provider || 'Google Cloud Firestore'}
            </div>
          </div>
        </div>
      </LiquidGlassCard>

      {/* Mobile App (Android, iPhone & Tablet) Card */}
      <LiquidGlassCard variant="primary" className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-md flex items-center justify-center flex-shrink-0">
              <img
                src="/apple-touch-icon.png"
                alt="FinancialFree Icon"
                className="w-full h-full object-cover rounded-[14px]"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Mobile App (Android, iPhone & Tablet)
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  PWA Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Install as a native home-screen app with custom high-resolution icons for Android, iOS Safari, and Tablets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <LiquidButton
              variant="secondary"
              size="sm"
              onClick={() => setIsShowcaseModalOpen(true)}
              icon={<Smartphone size={14} className="text-blue-500" />}
            >
              Inspect Icons & Guide
            </LiquidButton>

            {isInstalled ? (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                <span>Installed on Device</span>
              </span>
            ) : (
              <LiquidButton
                variant="primary"
                size="sm"
                onClick={() => install()}
                icon={<Download size={14} />}
              >
                Install App
              </LiquidButton>
            )}
          </div>
        </div>

        {/* Live Icons Preview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Android Icon Preview */}
          <div className="p-3.5 rounded-2xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden p-0.5 bg-slate-900 shadow-md border border-emerald-500/30 flex-shrink-0">
              <img
                src="/pwa-maskable-512x512.png"
                alt="Android Maskable Icon"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                <span>Android Icon</span>
                <span className="text-[10px] text-emerald-500 font-mono">192/512px</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Adaptive maskable safe-zone for Pixel & Galaxy
              </p>
            </div>
          </div>

          {/* iOS / iPhone Icon Preview */}
          <div className="p-3.5 rounded-2xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-[22%] overflow-hidden shadow-md border border-white/20 flex-shrink-0">
              <img
                src="/apple-touch-icon.png"
                alt="Apple Touch Icon"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                <span>iPhone Icon</span>
                <span className="text-[10px] text-blue-500 font-mono">180px PNG</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Apple Touch Icon for iOS Springboard
              </p>
            </div>
          </div>

          {/* iPad / Tablet Icon Preview */}
          <div className="p-3.5 rounded-2xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md border border-purple-500/30 flex-shrink-0">
              <img
                src="/pwa-512x512.png"
                alt="Tablet High-Res Icon"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                <span>Tablet / iPad</span>
                <span className="text-[10px] text-purple-500 font-mono">512px HD</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                High-DPI splash and store resolution
              </p>
            </div>
          </div>
        </div>

        {/* Live In-Browser Device Frame Simulator Controls */}
        {onSelectDeviceMode && (
          <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
              <Sparkles size={14} className="text-blue-500" />
              <span>Simulate hardware on screen:</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => onSelectDeviceMode('iphone')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  currentDeviceMode === 'iphone'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Smartphone size={13} />
                <span>iPhone 16 Pro</span>
              </button>

              <button
                onClick={() => onSelectDeviceMode('android')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  currentDeviceMode === 'android'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Smartphone size={13} />
                <span>Android Pixel</span>
              </button>

              <button
                onClick={() => onSelectDeviceMode('tablet')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  currentDeviceMode === 'tablet'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Tablet size={13} />
                <span>iPad / Tablet</span>
              </button>

              <button
                onClick={() => onSelectDeviceMode('responsive')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  currentDeviceMode === 'responsive'
                    ? 'bg-slate-700 text-white'
                    : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Monitor size={13} />
                <span>Full Screen</span>
              </button>
            </div>
          </div>
        )}
      </LiquidGlassCard>

      {/* Biometric (WebAuthn) & Quick PIN Privacy Lock Section */}
      <BiometricSecuritySection />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Details & Password Card */}
        <LiquidGlassCard variant="primary" className="space-y-6">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-blue-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Single-User Account
            </h3>
          </div>

          <div className="p-4 rounded-2xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10 space-y-2">
            <div className="text-xs text-slate-500">Authorized Master Email</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
              {user?.email || 'Financial@free.com'}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 pt-1">
              <CheckCircle2 size={13} />
              <span>PBKDF2 encrypted session active</span>
            </div>
          </div>

          {/* Change Password Form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-3.5 pt-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Update Password
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPass}
                onChange={e => setCurrentPass(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm glass-input"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">New Password (min 6 chars)</label>
              <input
                type="password"
                required
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm glass-input"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm glass-input"
              />
            </div>

            <LiquidButton
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isChangingPass}
              className="w-full"
            >
              Update Password
            </LiquidButton>
          </form>
        </LiquidGlassCard>

        {/* Right Side: Theme & Financial Rules */}
        <div className="space-y-6">
          {/* Appearance */}
          <LiquidGlassCard variant="primary" className="space-y-4">
            <div className="flex items-center gap-2">
              <Sun size={20} className="text-amber-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Appearance & Liquid Glass Theme
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Select your preferred interface display mode.
            </p>

            <LiquidSegmentedControl
              layoutId="settings-theme-capsule"
              size="md"
              options={[
                { id: 'light', label: 'Light', icon: <Sun size={15} /> },
                { id: 'dark', label: 'Dark', icon: <Moon size={15} /> },
                { id: 'system', label: 'System', icon: <Laptop size={15} /> }
              ]}
              value={theme}
              onChange={t => setTheme(t as any)}
            />
          </LiquidGlassCard>

          {/* Core Calculation Rules */}
          <LiquidGlassCard variant="primary" className="space-y-4">
            <div className="flex items-center gap-2">
              <Coins size={20} className="text-emerald-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Financial Calculation Rules
              </h3>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <span><strong>Source of Truth:</strong> Balances are dynamically computed on every query (Sum of Money Given - Sum of Money Returned).</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <span><strong>Over-payment Guard:</strong> Return payments cannot exceed the contact's outstanding balance.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <span><strong>Cloud Database:</strong> Every newly added person and transaction is permanently stored in Cloud Firestore.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <span><strong>Multi-Currency:</strong> Full support for INR, USD, EUR, GBP, AED, CAD, AUD, SGD, and JPY with accurate locale grouping.</span>
              </div>
            </div>
          </LiquidGlassCard>

          {/* Backup Action */}
          <LiquidGlassCard variant="secondary" className="p-5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                JSON Database Backup
              </div>
              <div className="text-xs text-slate-500">Download complete ledger snapshot for offline storage</div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
              <LiquidButton
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                icon={<Upload size={14} />}
                isLoading={isImporting}
              >
                Import JSON
              </LiquidButton>
              <LiquidButton
                variant="secondary"
                size="sm"
                onClick={handleExportJSON}
                icon={<Download size={14} />}
                isLoading={isExporting}
              >
                Download
              </LiquidButton>
            </div>
          </LiquidGlassCard>
        </div>
      </div>

      {/* Confirmation Dialog for Clearing All Members */}
      <ConfirmDialog
        isOpen={isClearPeopleModalOpen}
        onClose={() => setIsClearPeopleModalOpen(false)}
        onConfirm={handleClearAllPeople}
        title="Remove All Members from Database?"
        message="This will permanently delete all existing members/people and their associated transaction records from the Cloud Firestore database. You can then add new people fresh, and their information will be permanently saved to the database."
        confirmText="Remove All Members"
        isLoading={isClearingPeople}
      />

      {/* Confirmation Dialog for Restoring from Cloud Backup */}
      <ConfirmDialog
        isOpen={isConfirmRestoreOpen}
        onClose={() => setIsConfirmRestoreOpen(false)}
        onConfirm={handleConfirmRestore}
        title="Restore Financial Records from Cloud Firestore?"
        message={`This will pull the latest verified backup snapshot from Google Cloud Firestore (${backupStatus?.timestamp ? new Date(backupStatus.timestamp).toLocaleString() : 'latest snapshot'}) and restore all ${backupStatus?.peopleCount !== undefined ? backupStatus.peopleCount : 'verified'} members and ${backupStatus?.txCount !== undefined ? backupStatus.txCount : 'all'} financial transactions into your local database and browser vault.`}
        confirmText="Yes, Restore from Cloud"
        isDestructive={false}
        isLoading={isRestoring}
      />
      {/* Mobile App & Icons Showcase Modal */}
      <MobileAppShowcaseModal
        isOpen={isShowcaseModalOpen}
        onClose={() => setIsShowcaseModalOpen(false)}
        currentDeviceMode={currentDeviceMode}
        onSelectDeviceMode={onSelectDeviceMode}
      />
    </div>
  );
};
