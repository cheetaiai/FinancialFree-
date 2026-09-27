import React from 'react';
import { motion } from 'motion/react';

export interface SegmentOption<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface LiquidSegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  layoutId?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LiquidSegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  layoutId = 'liquid-segment-capsule',
  className = '',
  size = 'md'
}: LiquidSegmentedControlProps<T>) {
  const sizeClasses = {
    sm: 'p-1 text-xs gap-1',
    md: 'p-1.5 text-sm gap-1.5',
    lg: 'p-2 text-base gap-2'
  }[size];

  const itemPadding = {
    sm: 'px-2.5 py-1',
    md: 'px-3.5 py-1.5',
    lg: 'px-5 py-2.5'
  }[size];

  return (
    <div
      className={`inline-flex items-center rounded-2xl bg-black/5 dark:bg-white/5 backdrop-blur-md border border-black/5 dark:border-white/10 ${sizeClasses} ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.id === value;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`relative z-10 flex items-center justify-center gap-1.5 font-medium rounded-xl whitespace-nowrap transition-colors duration-200 cursor-pointer ${itemPadding} ${
              isSelected
                ? 'text-slate-900 dark:text-white font-semibold'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId={layoutId}
                transition={{
                  type: 'spring',
                  stiffness: 450,
                  damping: 35,
                  mass: 0.8
                }}
                className="absolute inset-0 rounded-xl bg-white dark:bg-white/15 shadow-sm border border-black/5 dark:border-white/10 -z-10"
              />
            )}
            {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
            <span>{option.label}</span>
            {option.badge !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected
                    ? 'bg-blue-500/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
