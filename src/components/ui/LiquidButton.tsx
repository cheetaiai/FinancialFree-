import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface LiquidButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'emerald' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const LiquidButton: React.FC<LiquidButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-4.5 py-2 text-sm rounded-2xl gap-2',
    lg: 'px-6 py-3 text-base rounded-2xl gap-2.5'
  }[size];

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 border border-white/20',
    emerald:
      'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/35 border border-white/20',
    secondary:
      'bg-white/70 dark:bg-white/10 text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-white/10 hover:bg-white dark:hover:bg-white/15 backdrop-blur-md',
    destructive:
      'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 dark:hover:bg-rose-500/30',
    ghost:
      'text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10'
  }[variant];

  return (
    <motion.button
      whileHover={!disabled && !isLoading ? { scale: 1.02, y: -1 } : undefined}
      whileTap={!disabled && !isLoading ? { scale: 0.97 } : undefined}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 18} />
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      {children}
    </motion.button>
  );
};
