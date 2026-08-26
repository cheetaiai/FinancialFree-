import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Sparkles, Sun, Moon, Laptop, LogOut, Key, ShieldCheck, Wallet, Settings, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LiquidModal } from '../ui/LiquidModal';
import { LiquidButton } from '../ui/LiquidButton';
import { TabType } from './BottomNavigation';

interface NavbarProps {
  onOpenAiDrawer: () => void;
  onNavigateTab?: (tab: TabType) => void;
  currentTab?: TabType;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAiDrawer, onNavigateTab, currentTab }) => {
  const { user, logout, changePassword } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
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
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 flex-shrink-0">
            <Wallet size={18} className="stroke-[2.2] sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-base md:text-lg font-black tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                FinancialFree
              </h1>
              <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="hidden xs:inline">Cloud Saved</span>
                <span className="xs:hidden">Cloud</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden md:block">
              Personal Money Lending & Return Tracker
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
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
              onClick={logout}
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
