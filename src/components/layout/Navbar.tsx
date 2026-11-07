import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSync } from '../../context/SyncContext';
import { useBiometricAuth } from '../../context/BiometricAuthContext';
import { Sparkles, Sun, Moon, Laptop, LogOut, Key, ShieldCheck, Wallet, Settings, Bell, Compass, RefreshCw, CheckCircle2, AlertTriangle, Cloud, Lock, ArrowUpCircle, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppUpdate } from '../../context/AppUpdateContext';
import { LiquidModal } from '../ui/LiquidModal';
import { LiquidButton } from '../ui/LiquidButton';
import { TabType } from './BottomNavigation';
import { AppLogo } from '../common/AppLogo';
import { LiquidThemeToggle } from '../ui/LiquidThemeToggle';
import { useRemindersBadge } from '../../lib/useRemindersBadge';

interface NavbarProps {
  onOpenAiDrawer: () => void;
  onNavigateTab?: (tab: TabType) => void;
  currentTab?: TabType;
  onOpenWalkthrough?: () => void;
  onLogoutRequest?: () => void;
  currentDeviceMode?: 'responsive' | 'iphone' | 'android' | 'tablet';
  onSelectDeviceMode?: (mode: 'responsive' | 'iphone' | 'android' | 'tablet') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAiDrawer,
  onNavigateTab,
  currentTab,
  onOpenWalkthrough,
  onLogoutRequest,
  currentDeviceMode = 'responsive',
  onSelectDeviceMode
}) => {
  const { user, logout, changePassword } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { syncState, lastSavedTime, statusMessage, discrepancyDetails, setIsIntegrityModalOpen } = useSync();
  const { lockApp, settings } = useBiometricAuth();
  const { totalBadgeCount, overdueCount } = useRemindersBadge();
  const { hasUpdateAvailable, isUpdateInstalled, latestVersion, totalSizeFormatted, openUpdateModal } = useAppUpdate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');

    if (newPass.length < 6) {
      setPassError('New password must be at least 6 characters long.');
      return;
    }

    if (newPass !== confirmPass) {
      setPassError('New passwords do not match.');
      return;
    }

    setIsChangingPass(true);
    const success = await changePassword(currentPass, newPass);
    setIsChangingPass(false);
    if (success) {
      setShowPasswordModal(false);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full px-2 sm:px-4 md:px-6 pt-2 sm:pt-3 pb-1.5 sm:pb-2">
      <div className="max-w-7xl mx-auto rounded-3xl liquid-glass-primary border border-white/60 dark:border-white/10 px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between shadow-sm">
        {/* Brand Logo */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('dashboard')}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none"
        >
          <AppLogo size="sm" animate={true} />
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-base md:text-lg font-black tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                FinancialFree
              </h1>

              {/* Dynamic Real-Time Sync & Save Status Indicator */}
              <AnimatePresence mode="wait">
                {syncState === 'syncing' ? (
                  <motion.div
                    key="syncing"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 shadow-xs"
                  >
                    <RefreshCw size={11} className="animate-spin text-blue-500 shrink-0" />
                    <span>Auto-Syncing</span>
                  </motion.div>
                ) : syncState === 'offline' ? (
                  <motion.div
                    key="offline"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20 shadow-xs"
                  >
                    <ShieldCheck size={11} className="text-blue-500 shrink-0" />
                    <span>Phone Vault</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="saved"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 shadow-xs"
                  >
                    <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                    <span>Protected</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden md:block">
              Personal Money Lending & Return Tracker
            </p>
          </div>
        </div>

        {/* Right Actions - Cleaned & De-cluttered for Phone, Tablet & Desktop */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-2.5 shrink-0">
          {/* Quick Reminders & Overdue Badged Icon */}
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('reminders')}
              className={`relative p-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center ${
                currentTab === 'reminders'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-white/10'
                  : 'text-slate-900 dark:text-white'
              }`}
              title={`${totalBadgeCount} Overdue / Pending Follow-ups`}
              aria-label="Reminders and follow-ups"
            >
              <Bell size={18} className={currentTab === 'reminders' ? 'stroke-[2.4]' : 'stroke-[1.9]'} />
              {totalBadgeCount > 0 && (
                <span
                  className={`absolute -top-0.5 -right-0.5 px-1 min-w-[15px] h-[15px] rounded-full text-[9px] font-black text-white flex items-center justify-center border border-white dark:border-slate-900 shadow-sm ${
                    overdueCount > 0 ? 'bg-rose-600 animate-pulse' : 'bg-amber-500'
                  }`}
                >
                  {totalBadgeCount > 99 ? '99+' : totalBadgeCount}
                </span>
              )}
            </button>
          )}

          {/* Shopping 🛍 & Groceries Navigation Shortcut */}
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('shopping')}
              className={`px-2.5 py-1.5 rounded-2xl transition-colors cursor-pointer hidden md:flex items-center gap-1.5 text-xs font-semibold ${
                currentTab === 'shopping'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/30'
                  : 'hover:bg-black/5 dark:hover:bg-white/10 text-slate-900 dark:text-white'
              }`}
              title="Shopping 🛍 & Groceries (Home Spends)"
            >
              <ShoppingBag size={16} className={currentTab === 'shopping' ? 'text-amber-500 stroke-[2.5]' : 'text-amber-500/80 stroke-[1.8]'} />
              <span className="hidden lg:inline font-bold">Shopping</span>
            </button>
          )}

          {/* Quick Settings Shortcut Icon */}
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('settings')}
              className={`p-2 rounded-2xl transition-colors cursor-pointer hidden sm:flex items-center justify-center ${
                currentTab === 'settings'
                  ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 font-bold border border-blue-500/30'
                  : 'hover:bg-black/5 dark:hover:bg-white/10 text-slate-900 dark:text-white'
              }`}
              title="Settings & Currency"
              aria-label="Settings"
            >
              <Settings size={17} className={currentTab === 'settings' ? 'stroke-[2.5]' : 'stroke-[1.9]'} />
            </button>
          )}

          {/* AI Assistant Button - Always Clean & Visible without crowding on top */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenAiDrawer}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-900 dark:text-indigo-200 text-xs font-black cursor-pointer shadow-xs shrink-0 active:scale-95"
            title="Open AI Financial Copilot"
            aria-label="Open AI Financial Copilot"
          >
            <Sparkles size={14} className="animate-pulse text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="text-[11px] sm:text-xs tracking-wide">AI</span>
          </motion.button>

          {/* App Update Button - ONLY shown when update is available and NOT yet installed! */}
          {hasUpdateAvailable && !isUpdateInstalled && (
            <motion.button
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openUpdateModal}
              className="relative flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold cursor-pointer shadow-md shadow-blue-500/20 shrink-0 transition-all active:scale-95"
              title={`New Update ${latestVersion} Launched (${totalSizeFormatted}) - Tap to Install`}
              aria-label="Download and install software update"
            >
              <ArrowUpCircle size={14} className="animate-bounce shrink-0" />
              <span className="hidden sm:inline">Update</span>
              <span className="text-[10px] font-extrabold bg-white/20 px-1.5 py-0.5 rounded-md">
                {totalSizeFormatted}
              </span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white dark:border-slate-900 animate-ping" />
            </motion.button>
          )}

          {/* Animated Liquid Theme Toggle with smooth day/night transitions */}
          <LiquidThemeToggle />

          {/* User Account / Security Controls */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            {/* Quick Lock Vault Button */}
            {settings.enabled && (settings.pinHash || settings.credentialId) && (
              <button
                onClick={lockApp}
                className="p-1.5 sm:p-2 rounded-2xl hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 cursor-pointer transition-colors"
                title="Lock Vault Now (Face ID / Fingerprint / PIN)"
                aria-label="Lock Vault"
              >
                <Lock size={16} />
              </button>
            )}

            <button
              onClick={() => setShowPasswordModal(true)}
              className="p-1.5 sm:p-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 cursor-pointer hidden md:flex items-center justify-center"
              title="Change Password"
              aria-label="Change Password"
            >
              <Key size={16} />
            </button>

            {/* Sign Out Button - Always Visible on Mobile and Desktop */}
            <button
              onClick={() => {
                if (onLogoutRequest) {
                  onLogoutRequest();
                } else {
                  logout();
                }
              }}
              className="p-1.5 sm:p-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 cursor-pointer transition-all active:scale-95 shrink-0"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <LiquidModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Account Password"
        subtitle={`Logged in as ${user?.email || 'financialfree@com'}`}
        maxWidth="sm"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPass}
              onChange={e => setCurrentPass(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm glass-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
              New Password
            </label>
            <input
              type="password"
              required
              placeholder="Minimum 6 characters"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm glass-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm glass-input"
            />
          </div>

          {passError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
              {passError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/5 dark:border-white/10">
            <LiquidButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowPasswordModal(false)}
            >
              Cancel
            </LiquidButton>
            <LiquidButton
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isChangingPass}
            >
              Update Password
            </LiquidButton>
          </div>
        </form>
      </LiquidModal>
    </header>
  );
};
