import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Users,
  ReceiptText,
  CalendarDays,
  CalendarRange,
  FileBarChart2,
  Bell,
  Settings,
  Sparkles
} from 'lucide-react';
import { TabType } from './BottomNavigation';

interface MobileTopSectionBarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

interface SectionItem {
  id: TabType;
  label: string;
  icon: React.ElementType;
}

const SECTIONS: SectionItem[] = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'people', label: 'People', icon: Users },
  { id: 'transactions', label: 'Ledger', icon: ReceiptText },
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'monthly', label: 'Monthly', icon: CalendarDays },
  { id: 'yearly', label: 'Yearly', icon: CalendarRange },
  { id: 'reports', label: 'Reports', icon: FileBarChart2 },
  { id: 'settings', label: 'Profile & Settings', icon: Settings }
];

export const MobileTopSectionBar: React.FC<MobileTopSectionBarProps> = ({
  currentTab,
  onSelectTab
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll active section into view smoothly on mobile
  useEffect(() => {
    if (activeTabRef.current && containerRef.current) {
      const container = containerRef.current;
      const tab = activeTabRef.current;
      const left = tab.offsetLeft - (container.clientWidth / 2) + (tab.clientWidth / 2);
      container.scrollTo({ left, behavior: 'smooth' });
    }
  }, [currentTab]);

  return (
    <div className="md:hidden sticky top-[58px] z-20 w-full px-2 pt-1 pb-2 pointer-events-auto">
      <div
        ref={containerRef}
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1.5 px-2 rounded-2xl liquid-glass-primary border border-white/60 dark:border-white/10 shadow-sm backdrop-blur-xl"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = currentTab === section.id;

          return (
            <button
              key={section.id}
              ref={isActive ? activeTabRef : null}
              type="button"
              onClick={() => onSelectTab(section.id)}
              className={`relative flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none whitespace-nowrap min-h-[34px] ${
                isActive
                  ? 'text-blue-600 dark:text-blue-300 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {/* Liquid-glass animated indicator moving on section */}
              {isActive && (
                <motion.div
                  layoutId="mobile-top-liquid-indicator"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-blue-500/15 dark:bg-white/15 border border-blue-500/30 dark:border-white/20 shadow-xs -z-10"
                />
              )}

              <Icon
                size={14}
                className={isActive ? 'text-blue-600 dark:text-blue-400 stroke-[2.4]' : 'text-slate-400 dark:text-slate-500'}
              />
              <span>{section.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
