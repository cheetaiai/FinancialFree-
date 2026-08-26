import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption<T extends string | number = string> {
  value: T;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

interface LiquidDropdownProps<T extends string | number = string> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function LiquidDropdown<T extends string | number = string>({
  options,
  value,
  onChange,
  placeholder = 'Select option',
  label,
  className = '',
  disabled = false
}: LiquidDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl text-left text-sm font-medium transition-all duration-200 cursor-pointer liquid-glass-secondary border border-slate-200/70 dark:border-white/10 hover:border-blue-400/50 dark:hover:border-blue-400/40 ${
          isOpen ? 'ring-2 ring-blue-500/20 border-blue-500/50' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && <span>{selectedOption.icon}</span>}
          <span className={selectedOption ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-400 flex-shrink-0"
        >
          <ChevronDown size={16} />
        </motion.div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="absolute z-50 left-0 right-0 max-h-60 overflow-y-auto p-1.5 rounded-2xl liquid-glass-floating shadow-2xl border border-white/70 dark:border-white/15"
          >
            {options.map(option => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value.toString()}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 text-sm rounded-xl transition-all duration-150 text-left ${
                    isSelected
                      ? 'bg-blue-500/15 text-blue-600 dark:bg-blue-500/25 dark:text-blue-300 font-semibold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {option.icon && <span>{option.icon}</span>}
                    <div>
                      <div>{option.label}</div>
                      {option.sublabel && (
                        <div className="text-xs text-slate-400 font-normal">{option.sublabel}</div>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check size={16} className="flex-shrink-0 text-blue-500" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
