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
  UserX
} from 'lucide-react';
import { LiquidGlassCard } from '../components/ui/LiquidGlassCard';
import { LiquidButton } from '../components/ui/LiquidButton';
import { LiquidSegmentedControl } from '../components/ui/LiquidSegmentedControl';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { BackupData } from '../types';

export const SettingsPage: React.FC = () => {
  const { user, changePassword } = useAuth();
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency, formatAmount, currencyConfig, currencies } = useCurrency();
  const { showToast } = useToast();

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isClearingPeople, setIsClearingPeople] = useState(false);
  const [isClearPeopleModalOpen, setIsClearPeopleModalOpen] = useState(false);

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

      {/* Cloud Database Storage & Data Reset Card */}
      <LiquidGlassCard variant="primary" className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Cloud size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Persistent Cloud Database (Firestore)
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active & Synced
                </span>
              </div>
              <p className="text-xs text-slate-500">
                All newly added contacts, transaction ledgers, and reminders are permanently saved to Google Cloud Firestore.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
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
    </div>
  );
};
