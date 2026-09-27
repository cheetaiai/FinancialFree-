import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppLogo } from '../common/AppLogo';
import { Lock, ShieldCheck, Database, Check } from 'lucide-react';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';

interface LogoutAnimationModalProps {
  isOpen: boolean;
  onFinished: () => void;
}

export const LogoutAnimationModal: React.FC<LogoutAnimationModalProps> = ({
  isOpen,
  onFinished
}) => {
  const [step, setStep] = useState<number>(1);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      return;
    }

    // Progression sequence
    const t1 = setTimeout(() => setStep(2), 600);
    const t2 = setTimeout(() => setStep(3), 1300);
    const t3 = setTimeout(() => {
      onFinished();
    }, 2100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen, onFinished]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-2xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="w-full max-w-sm"
      >
        <LiquidGlassCard
          variant="floating"
          className="p-8 border border-white/20 shadow-2xl text-center relative overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Animated Vault / Lock Icon */}
          <div className="relative mx-auto mb-5 w-20 h-20 flex items-center justify-center">
            <motion.div
              animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              className="absolute inset-0 bg-emerald-500/20 rounded-3xl blur-xl"
            />

            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 border border-emerald-500/30 flex items-center justify-center shadow-lg">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="s1"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    className="text-emerald-400"
                  >
                    <Database size={30} />
                  </motion.div>
                )}
                {step === 2 && (
                  <motion.div
                    key="s2"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    className="text-blue-400"
                  >
                    <Lock size={30} />
                  </motion.div>
                )}
                {step === 3 && (
                  <motion.div
                    key="s3"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    className="text-emerald-400"
                  >
                    <ShieldCheck size={32} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <h3 className="text-xl font-bold text-white tracking-tight mb-2">
            {step === 1 && 'Syncing Storage...'}
            {step === 2 && 'Securing Session...'}
            {step === 3 && 'Safely Logged Out'}
          </h3>

          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            {step === 1 && 'Preserving all changes in Cloud database and local browser cache.'}
            {step === 2 && 'Terminating credentials and clearing memory tokens safely.'}
            {step === 3 && 'Your financial records are encrypted and protected. See you soon!'}
          </p>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden relative">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500 rounded-full"
              initial={{ width: '15%' }}
              animate={{ width: step === 1 ? '40%' : step === 2 ? '75%' : '100%' }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>FinancialFree Protection Active</span>
          </div>
        </LiquidGlassCard>
      </motion.div>
    </div>
  );
};
