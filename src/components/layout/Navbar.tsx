import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSync } from '../../context/SyncContext';
import { Sparkles, Sun, Moon, Laptop, LogOut, Key, ShieldCheck, Wallet, Settings, Bell, Compass, RefreshCw, CheckCircle2, AlertTriangle, Cloud } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LiquidModal } from '../ui/LiquidModal';
import { LiquidButton } from '../ui/LiquidButton';
import { TabType } from './BottomNavigation';
import { AppLogo } from '../common/AppLogo';

interface NavbarProps {
  onOpenAiDrawer: () => void;
  onNavigateTab?: (tab: TabType) => void;
  currentTab?: TabType;
  onOpenWalkthrough?: () => void;
  onLogoutRequest?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAiDrawer,
  onNavigateTab,
  currentTab,
  onOpenWalkthrough,
  onLogoutRequest
}) => {
  const { user, logout, changePassword } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { syncState, lastSavedTime, statusMessage, discrepancyDetails, setIsIntegrityModalOpen } = useSync();
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
                    className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold tracking-wide px-2 sm:px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 shadow-xs"
                    title={statusMessage || 'Committing transaction to database in real-time...'}
                  >
                    <RefreshCw size={11} className="animate-spin text-blue-500 shrink-0" />
                    <span>Syncing...</span>
                  </motion.div>
                ) : syncState === 'discrepancy' ? (
                  <motion.button
                    key="discrepancy"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsIntegrityModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/40 hover:bg-amber-500/30 cursor-pointer transition-all shadow-xs animate-pulse"
                    title="Discrepancy detected between browser vault and cloud. Click to reconcile."
                  >
                    <AlertTriangle size={11} className="text-amber-500 shrink-0" />
                    <span>Review Sync</span>
                    <span className="hidden sm:inline opacity-75 font-normal">· Action needed</span>
                  </motion.button>
                ) : syncState === 'offline' ? (
                  <motion.button
                    key="offline"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsIntegrityModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20 hover:bg-slate-500/20 cursor-pointer transition-all shadow-xs"
                    title="Working offline. Records protected in local browser vault. Click for details."
                  >
                    <ShieldCheck size={11} className="text-blue-500 shrink-0" />
                    <span>Saved Locally</span>
                  </motion.button>
                ) : (
                  <motion.button
                    key="saved"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsIntegrityModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 cursor-pointer transition-all shadow-xs"
                    title="All records synchronized and secured. Click to run Data Integrity Check."
                  >
                    <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                    <span>Saved</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden md:block">
              Personal Money Lending & Return Tracker
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          {/* Quick 3-Step Walkthrough Tour Shortcut */}
          {onOpenWalkthrough && (
            <button
              onClick={onOpenWalkthrough}
              className="p-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer hidden sm:flex items-center gap-1"
              title="3-Step App Overview & Features"
            >
              <Compass size={17} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 hidden lg:inline">Tour</span>
            </button>
          )}

          {/* Data Integrity & Cloud Protection Shield Shortcut */}
          <button
            onClick={() => setIsIntegrityModalOpen(true)}
            className="p-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Data Integrity & Cloud Protection Scan"
          >
            <ShieldCheck size={17} className={
              syncState === 'saved' ? 'text-emerald-500' :
              syncState === 'syncing' ? 'text-blue-500 animate-spin' :
              syncState === 'discrepancy' ? 'text-amber-500 animate-pulse' :
              'text-slate-400'
            } />
          </button>

          {/* Quick Settings Shortcut Icon (especially handy on mobile and tablet) */}
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('settings')}
              className={`p-2 rounded-2xl transition-colors cursor-pointer ${
                currentTab === 'settings'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/30'
                  : 'hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
              }`}
              title="Settings & Currency"
            >
              <Settings size={17} className={currentTab === 'settings' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            </button>
          )}

          {/* AI Assistant Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenAiDrawer}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl liquid-glass-secondary border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-semibold cursor-pointer shadow-sm shadow-blue-500/10"
            title="Open AI Financial Copilot"
          >
            <Sparkles size={14} className="animate-pulse text-indigo-500" />
            <span className="hidden sm:inline">AI Advisor</span>
          </motion.button>

          {/* Theme Toggle */}
          <div className="flex items-center p-0.5 sm:p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {resolvedTheme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>

          {/* User Account / Security */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="p-1.5 sm:p-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 cursor-pointer"
              title="Change Password"
            >
              <Key size={16} />
            </button>

            <button
              onClick={() => {
                if (onLogoutRequest) {
                  onLogoutRequest();
                } else {
                  logout();
                }
              }}
              className="p-1.5 sm:p-2 rounded-2xl hover:bg-rose-500/10 text-rose-500 dark:text-rose-400 cursor-pointer transition-colors"
              title="Logout"
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
