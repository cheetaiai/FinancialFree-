import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

interface LiquidGlassCardProps extends HTMLMotionProps<'div'> {
  variant?: 'primary' | 'secondary' | 'floating';
  hoverEffect?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  variant = 'primary',
  hoverEffect = false,
  className = '',
  children,
  ...props
}) => {
  const variantClass = {
    primary: 'liquid-glass-primary',
    secondary: 'liquid-glass-secondary',
    floating: 'liquid-glass-floating'
  }[variant];

  return (
    <motion.div
      whileHover={hoverEffect ? { y: -2, transition: { duration: 0.2 } } : undefined}
      className={`relative rounded-3xl p-5 md:p-6 transition-all duration-300 ${variantClass} ${className}`}
      {...props}
    >
      {/* Subtle top inner glass reflection line */}
      <div className="absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
};
