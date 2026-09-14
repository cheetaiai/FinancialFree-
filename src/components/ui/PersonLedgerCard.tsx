import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Person } from '../../types';
import { formatCurrency, formatLedgerAccountNumber } from '../../lib/formatters';
import { Cpu, Wifi, Copy, Check, ShieldCheck, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface PersonLedgerCardProps {
  person: Partial<Person>;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  showBalance?: boolean;
  className?: string;
  onCardClick?: () => void;
}

export const PersonLedgerCard: React.FC<PersonLedgerCardProps> = ({
  person,
  size = 'md',
  interactive = true,
  showBalance = true,
  className = '',
  onCardClick
}) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const accountNumber = formatLedgerAccountNumber(person.id || person.full_name || '1029');
  const avatarBg = person.avatar_color || '#3b82f6';
  const fullName = person.full_name || 'New Ledger Contact';
  const category = person.category || 'Personal';

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(accountNumber);
    setCopied(true);
    if (navigator.vibrate) navigator.vibrate(15);
    showToast(`Card Number ${accountNumber} copied!`, 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setRotateX(-y / 14);
    setRotateY(x / 14);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const isSmall = size === 'sm';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 350 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onCardClick}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: 'transform 0.15s ease-out'
      }}
      className={`relative group overflow-hidden rounded-3xl liquid-glass-card liquid-glass-specular border border-white/30 dark:border-white/15 p-5 sm:p-6 shadow-xl shadow-slate-900/10 dark:shadow-black/40 select-none ${
        onCardClick ? 'cursor-pointer hover:border-blue-500/40 transition-colors' : ''
      } ${className}`}
    >
      {/* Dynamic Background Holographic Glow based on avatar color */}
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-25 dark:opacity-20 transition-all group-hover:scale-110"
        style={{ backgroundColor: avatarBg }}
      />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header: Chip, Contactless Symbol & Brand */}
      <div className="flex items-center justify-between relative z-10 mb-4 sm:mb-5">
        <div className="flex items-center gap-2">
          {/* Smart Chip Graphic */}
          <div className="w-10 h-7 rounded-lg bg-gradient-to-tr from-amber-300 via-amber-200 to-yellow-400 border border-amber-400/50 shadow-sm flex items-center justify-center relative overflow-hidden">
            <Cpu size={18} className="text-amber-900/60" />
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {/* Contactless symbol */}
          <Wifi size={16} className="text-slate-400 rotate-90" />
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-600 dark:text-slate-300">
          <ShieldCheck size={12} className="text-emerald-500" />
          <span>FinancialFree Ledger</span>
        </div>
      </div>

      {/* Embossed Card Account Number */}
      <div className="relative z-10 mb-4">
        <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-0.5">
          Ledger Account No
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-base sm:text-lg md:text-xl font-bold tracking-widest text-slate-800 dark:text-slate-100 drop-shadow-xs">
            {accountNumber}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
            title="Copy Account Number"
          >
            {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
          </button>
        </div>
      </div>

      {/* Card Holder Name & Category */}
      <div className="flex items-end justify-between relative z-10 pt-2 border-t border-black/5 dark:border-white/10">
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Account Holder
          </div>
          <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate max-w-[180px] sm:max-w-[220px]">
            {fullName}
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            {category}
          </span>
        </div>
      </div>

      {/* Optional Balance Details */}
      {showBalance && (person.remaining_balance !== undefined || person.total_given !== undefined) && (
        <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs relative z-10">
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <span>Given:</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {formatCurrency(person.total_given || 0)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400">Balance:</span>
            <span
              className={`font-black ${
                (person.remaining_balance || 0) > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {formatCurrency(person.remaining_balance || 0)}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};
