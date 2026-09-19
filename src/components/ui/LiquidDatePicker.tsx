import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTH_NAMES, formatIndianDate } from '../../lib/formatters';

interface LiquidDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  className?: string;
}

export const LiquidDatePicker: React.FC<LiquidDatePickerProps> = ({
  value,
  onChange,
  label,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialDate = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear() || 2026);
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth() || 7); // 0-indexed

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mStr = String(viewMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    onChange(`${viewYear}-${mStr}-${dStr}`);
    setIsOpen(false);
  };

  const setQuickDate = (type: 'today' | 'yesterday' | 'first') => {
    const now = new Date();
    if (type === 'today') {
      onChange(now.toISOString().split('T')[0]);
    } else if (type === 'yesterday') {
      const yest = new Date(now.setDate(now.getDate() - 1));
      onChange(yest.toISOString().split('T')[0]);
    } else if (type === 'first') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      onChange(first.toISOString().split('T')[0]);
    }
    setIsOpen(false);
  };

  const selectedDateObj = value ? new Date(value) : null;
  const isSelected = (day: number) => {
    if (!selectedDateObj) return false;
    return (
      selectedDateObj.getDate() === day &&
      selectedDateObj.getMonth() === viewMonth &&
      selectedDateObj.getFullYear() === viewYear
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === viewMonth &&
      today.getFullYear() === viewYear
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl text-left text-sm font-medium transition-all duration-200 cursor-pointer liquid-glass-secondary border border-slate-200/70 dark:border-white/10 hover:border-blue-400/50"
      >
        <div className="flex items-center gap-2.5">
          <CalendarIcon size={16} className="text-blue-500 flex-shrink-0" />
          <span className="text-slate-900 dark:text-white font-medium">
            {value ? formatIndianDate(value) : 'Select date'}
          </span>
        </div>
        <span className="text-xs text-slate-400 font-normal">
          {value ? value : ''}
        </span>
      </button>

      {/* Glass Calendar Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 6, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="absolute z-50 left-0 sm:left-auto right-0 sm:w-72 p-4 rounded-3xl liquid-glass-floating shadow-2xl border border-white/70 dark:border-white/15"
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Quick shortcuts */}
            <div className="flex items-center justify-between gap-1 mb-3 pb-2 border-b border-black/5 dark:border-white/10">
              <button
                type="button"
                onClick={() => setQuickDate('today')}
                className="text-[11px] font-medium px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setQuickDate('yesterday')}
                className="text-[11px] font-medium px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => setQuickDate('first')}
                className="text-[11px] font-medium px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400"
              >
                1st of Month
              </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400 mb-1">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const active = isSelected(day);
                const current = isToday(day);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`h-8 w-8 mx-auto flex items-center justify-center text-xs font-medium rounded-full transition-all duration-150 cursor-pointer ${
                      active
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 font-bold scale-105'
                        : current
                        ? 'border border-blue-500 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
