import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

interface LiquidGlassCardProps extends HTMLMotionProps<'div'> {
  variant?: 'primary' | 'secondary' | 'floating';
  hoverEffect?: boolean;
  glowColor?: string;
  className?: string;
  children: React.ReactNode;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  variant = 'primary',
  hoverEffect = false,
  glowColor,
  className = '',
  children,
  style,
  ...props
}) => {
  const variantClass = {
    primary: 'liquid-glass-primary',
    secondary: 'liquid-glass-secondary',
    floating: 'liquid-glass-floating'
  }[variant];

  const glowStyle = glowColor ? { boxShadow: `0 8px 32px 0 ${glowColor}` } : {};

  return (
    <motion.div
      whileHover={hoverEffect ? { y: -2, transition: { duration: 0.2 } } : undefined}
      style={{ ...glowStyle, ...(typeof style === 'object' ? style : {}) }}
      className={`relative rounded-3xl p-4 sm:p-5 md:p-6 transition-all duration-300 liquid-glass-specular ${variantClass} ${className}`}
      {...props}
    >
      {/* Subtle top inner glass reflection line */}
      <div className="absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 dark:via-white/20 to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
};
