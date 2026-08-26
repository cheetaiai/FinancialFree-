import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Users,
  ReceiptText,
  CalendarDays,
  FileBarChart2,
  Bell,
  Settings,
  MoreHorizontal,
  CalendarRange,
  Sparkles,
  ChevronUp
} from 'lucide-react';
import { QuickAddRadialMenu } from '../ui/QuickAddRadialMenu';

export type TabType =
  | 'dashboard'
  | 'people'
  | 'transactions'
  | 'monthly'
  | 'yearly'
  | 'reports'
  | 'reminders'
  | 'settings';

interface BottomNavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenGiveModal: () => void;
  onOpenReturnModal: () => void;
  onOpenAddPersonModal: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenGiveModal,
  onOpenReturnModal,
  onOpenAddPersonModal
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Desktop / Tablet full view tabs
  const allDesktopTabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'people' as TabType, label: 'People', icon: Users },
    { id: 'transactions' as TabType, label: 'Ledger', icon: ReceiptText },
    { id: 'monthly' as TabType, label: 'Monthly', icon: CalendarDays },
    { id: 'yearly' as TabType, label: 'Yearly', icon: CalendarRange },
    { id: 'reports' as TabType, label: 'Reports', icon: FileBarChart2 },
    { id: 'reminders' as TabType, label: 'Reminders', icon: Bell },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings }
  ];

  // Mobile dedicated 4 tabs + 1 More menu + Center Action
  const mobilePrimaryTabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'people' as TabType, label: 'People', icon: Users },
    { id: 'transactions' as TabType, label: 'Ledger', icon: ReceiptText },
    { id: 'reminders' as TabType, label: 'Reminders', icon: Bell }
  ];

  const mobileMoreTabs = [
    { id: 'monthly' as TabType, label: 'Monthly Summary', description: 'Breakdown by calendar month', icon: CalendarDays },
    { id: 'yearly' as TabType, label: 'Yearly & Financial Year', description: 'Annual records & FY periods', icon: CalendarRange },
    { id: 'reports' as TabType, label: 'Financial Reports', description: 'Audit trails & CSV / PDF export', icon: FileBarChart2 },
    { id: 'settings' as TabType, label: 'Settings & Security', description: 'Currency, database sync & theme', icon: Settings }
  ];

  const isMoreTabActive = ['monthly', 'yearly', 'reports', 'settings'].includes(currentTab);

  return (
    <nav aria-label="Bottom Navigation" className="fixed bottom-2 sm:bottom-4 md:bottom-5 inset-x-0 z-40 px-2 sm:px-4 flex justify-center pointer-events-none">
      {/* 
        =========================================================
        1. MOBILE DEDICATED NAVIGATION BAR (< md screens)
        Optimized for 320px - 767px mobile screens
        Includes Reminders, People, Ledger, Dashboard, Plus, and 'More' (Settings, Monthly, Yearly, Reports)
        =========================================================
      */}
      <div className="md:hidden pointer-events-auto rounded-3xl liquid-glass-floating border border-white/70 dark:border-white/15 px-2 py-1.5 shadow-2xl flex items-center justify-between w-full max-w-md relative">
        {/* Left Mobile Tabs: Dashboard & People */}
        <div className="flex items-center justify-around flex-1">
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className={`relative flex-1 py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center transition-colors cursor-pointer ${
              currentTab === 'dashboard'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {currentTab === 'dashboard' && (
              <motion.div
                layoutId="active-tab-indicator-mobile"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                className="absolute inset-0 rounded-2xl bg-blue-500/10 dark:bg-white/10 -z-10"
              />
            )}
            <LayoutDashboard size={19} className={currentTab === 'dashboard' ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
            <span className="text-[10px] mt-0.5 font-medium leading-tight">Home</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('people')}
            className={`relative flex-1 py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center transition-colors cursor-pointer ${
              currentTab === 'people'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {currentTab === 'people' && (
              <motion.div
                layoutId="active-tab-indicator-mobile"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                className="absolute inset-0 rounded-2xl bg-blue-500/10 dark:bg-white/10 -z-10"
              />
            )}
            <Users size={19} className={currentTab === 'people' ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
            <span className="text-[10px] mt-0.5 font-medium leading-tight">People</span>
          </button>
        </div>

        {/* Center Quick Action Floating Button */}
        <div className="relative -top-3.5 mx-1 flex-shrink-0">
          <QuickAddRadialMenu
            onOpenGiveModal={onOpenGiveModal}
            onOpenReturnModal={onOpenReturnModal}
            onOpenAddPersonModal={onOpenAddPersonModal}
          />
        </div>

        {/* Right Mobile Tabs: Ledger, Reminders, and More Menu */}
        <div className="flex items-center justify-around flex-1" ref={moreMenuRef}>
          <button
            type="button"
            onClick={() => onSelectTab('transactions')}
            className={`relative flex-1 py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center transition-colors cursor-pointer ${
              currentTab === 'transactions'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {currentTab === 'transactions' && (
              <motion.div
                layoutId="active-tab-indicator-mobile"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                className="absolute inset-0 rounded-2xl bg-blue-500/10 dark:bg-white/10 -z-10"
              />
            )}
            <ReceiptText size={19} className={currentTab === 'transactions' ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
            <span className="text-[10px] mt-0.5 font-medium leading-tight">Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('reminders')}
            className={`relative flex-1 py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center transition-colors cursor-pointer ${
              currentTab === 'reminders'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {currentTab === 'reminders' && (
              <motion.div
                layoutId="active-tab-indicator-mobile"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                className="absolute inset-0 rounded-2xl bg-blue-500/10 dark:bg-white/10 -z-10"
              />
            )}
            <Bell size={19} className={currentTab === 'reminders' ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
            <span className="text-[10px] mt-0.5 font-medium leading-tight">Reminders</span>
          </button>

          {/* More Action Button (Opening Mobile Drawer/Popup for Settings, Reports, Monthly, Yearly) */}
          <div className="relative flex-1">
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={`relative w-full py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center transition-colors cursor-pointer ${
                isMoreTabActive || isMoreMenuOpen
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {(isMoreTabActive || isMoreMenuOpen) && (
                <motion.div
                  layoutId="active-tab-indicator-mobile-more"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  className="absolute inset-0 rounded-2xl bg-blue-500/10 dark:bg-white/10 -z-10"
                />
              )}
              {isMoreTabActive && currentTab === 'settings' ? (
                <Settings size={19} className="stroke-[2.4] text-blue-600 dark:text-blue-400" />
              ) : isMoreTabActive && currentTab === 'reports' ? (
                <FileBarChart2 size={19} className="stroke-[2.4] text-blue-600 dark:text-blue-400" />
              ) : isMoreTabActive && currentTab === 'monthly' ? (
                <CalendarDays size={19} className="stroke-[2.4] text-blue-600 dark:text-blue-400" />
              ) : isMoreTabActive && currentTab === 'yearly' ? (
                <CalendarRange size={19} className="stroke-[2.4] text-blue-600 dark:text-blue-400" />
              ) : (
                <MoreHorizontal size={19} className="stroke-[1.8]" />
              )}
              <span className="text-[10px] mt-0.5 font-medium leading-tight">
                {isMoreTabActive
                  ? currentTab === 'settings'
                    ? 'Settings'
                    : currentTab === 'reports'
                    ? 'Reports'
                    : currentTab === 'monthly'
                    ? 'Monthly'
                    : 'Yearly'
                  : 'More'}
              </span>
            </button>

            {/* Mobile More Popover Menu */}
            <AnimatePresence>
              {isMoreMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  className="absolute bottom-16 right-0 w-64 p-2 rounded-3xl liquid-glass-floating border border-white/80 dark:border-white/20 shadow-2xl z-50 space-y-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl"
                >
                  <div className="px-3 py-2 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      More Navigation
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      Settings & Tools
                    </span>
                  </div>

                  {mobileMoreTabs.map(tab => {
                    const Icon = tab.icon;
                    const isSelected = currentTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          onSelectTab(tab.id);
                          setIsMoreMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold truncate">{tab.label}</div>
                          <div className={`text-[10px] truncate ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                            {tab.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 
        =========================================================
        2. TABLET & DESKTOP FULL NAVIGATION BAR (>= md screens)
        Optimized for 768px (iPads, Surface, Tablets) up to 4K Displays
        Displays all 8 tabs with icons and smooth spring indicators
        =========================================================
      */}
      <div className="hidden md:flex pointer-events-auto rounded-3xl liquid-glass-floating border border-white/70 dark:border-white/15 px-3 py-2 shadow-2xl items-center gap-1 max-w-4xl w-full justify-between">
        {/* Left 4 Desktop/Tablet tabs */}
        <div className="flex items-center gap-1">
          {allDesktopTabs.slice(0, 4).map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative px-3 py-1.5 rounded-2xl flex flex-col items-center justify-center transition-colors cursor-pointer ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-tab-indicator-desktop"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    className="absolute inset-0 rounded-2xl bg-blue-500/10 dark:bg-white/10 -z-10"
                  />
                )}
                <Icon size={18} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
                <span className="text-[10px] mt-0.5 whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center Quick Action Floating Button */}
        <div className="relative -top-4 flex-shrink-0 mx-2">
          <QuickAddRadialMenu
            onOpenGiveModal={onOpenGiveModal}
            onOpenReturnModal={onOpenReturnModal}
            onOpenAddPersonModal={onOpenAddPersonModal}
          />
        </div>

        {/* Right 4 Desktop/Tablet tabs */}
        <div className="flex items-center gap-1">
          {allDesktopTabs.slice(4).map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative px-3 py-1.5 rounded-2xl flex flex-col items-center justify-center transition-colors cursor-pointer ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-tab-indicator-desktop"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    className="absolute inset-0 rounded-2xl bg-blue-500/10 dark:bg-white/10 -z-10"
                  />
                )}
                <Icon size={18} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
                <span className="text-[10px] mt-0.5 whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
