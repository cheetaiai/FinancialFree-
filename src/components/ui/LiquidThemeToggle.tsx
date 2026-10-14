import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface LiquidThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const LiquidThemeToggle: React.FC<LiquidThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={() => {
        if (navigator.vibrate) navigator.vibrate(12);
        toggleTheme();
      }}
      className={`relative inline-flex items-center gap-2 p-1.5 sm:p-2 min-h-[44px] min-w-[44px] justify-center rounded-2xl liquid-glass-secondary border border-white/20 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-90 select-none ${className}`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="sun-icon"
              initial={{ rotate: -90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className="text-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
            >
              <Sun size={18} className="stroke-[2.2]" />
            </motion.div>
          ) : (
            <motion.div
              key="moon-icon"
              initial={{ rotate: 90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className="text-indigo-600 filter drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]"
            >
              <Moon size={18} className="stroke-[2.2]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showLabel && (
        <span className="text-xs font-semibold pr-1">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
};
