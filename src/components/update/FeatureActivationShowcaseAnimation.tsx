import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  QrCode,
  Share2,
  FileText,
  Volume2,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Rocket,
  Sparkles,
  Zap,
  ArrowRight
} from 'lucide-react';
import { playTickSound, playReturnMoneySound, playGivenMoneySound, playNewPersonSound } from '../../lib/soundEffects';
import confetti from 'canvas-confetti';

interface FeatureActivationShowcaseAnimationProps {
  isOpen: boolean;
  onComplete: () => void;
}

interface FeatureItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ReactNode;
  accentColor: string;
  glow: string;
}

const UPDATE_FEATURES: FeatureItem[] = [
  {
    id: 'qr_code',
    title: 'Optimized QR Code Suite',
    subtitle: 'Dynamic UPI return QR codes with custom amount prefill, scan detection & multi-app chooser (GPay, PhonePe, Paytm, BHIM, CRED).',
    badge: 'Activated',
    icon: <QrCode className="w-5 h-5 text-cyan-400" />,
    accentColor: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-400',
    glow: 'rgba(6, 182, 212, 0.4)'
  },
  {
    id: 'statements',
    title: 'Share and View Statement Engine',
    subtitle: 'Zero-login interactive public statements displaying money given and received totals with real-time privacy masking & vector PDF export.',
    badge: 'Activated',
    icon: <Share2 className="w-5 h-5 text-indigo-400" />,
    accentColor: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/40 text-indigo-400',
    glow: 'rgba(99, 102, 241, 0.4)'
  },
  {
    id: 'audio_fx',
    title: 'Mixkit Gold Coin & Payment Audio FX',
    subtitle: 'Authentic Mixkit gold coin sound for return money, cash register payment chime, contact welcome chime & tactile tick mark clicks.',
    badge: 'Activated',
    icon: <Coins className="w-5 h-5 text-amber-400" />,
    accentColor: 'from-amber-500/20 to-yellow-500/20 border-amber-500/40 text-amber-400',
    glow: 'rgba(245, 158, 11, 0.4)'
  },
  {
    id: 'vault',
    title: '2.5 GB Zero Data-Loss Vault & Ledger',
    subtitle: 'Triple-layer storage resilience, offline cache buffer, automated backup sync, and dedicated Shopping & Groceries spending hub.',
    badge: 'Activated',
    icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    accentColor: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-400',
    glow: 'rgba(16, 185, 129, 0.4)'
  }
];

export const FeatureActivationShowcaseAnimation: React.FC<FeatureActivationShowcaseAnimationProps> = ({
  isOpen,
  onComplete
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [allActivated, setAllActivated] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setActiveStep(0);
      setAllActivated(false);
      return;
    }

    // Play tick sound on start
    playTickSound();

    // Step-by-step feature activation animation with authentic sound effects
    const timers: NodeJS.Timeout[] = [];

    // Step 0: Initial sound
    timers.push(setTimeout(() => {
      setActiveStep(1);
      playTickSound();
    }, 400));

    // Step 1: Optimized QR Code
    timers.push(setTimeout(() => {
      setActiveStep(2);
      playGivenMoneySound();
    }, 1100));

    // Step 2: Share and View Statement
    timers.push(setTimeout(() => {
      setActiveStep(3);
      playTickSound();
    }, 1800));

    // Step 3: Mixkit Gold Coin Audio FX
    timers.push(setTimeout(() => {
      setActiveStep(4);
      playReturnMoneySound(); // Real Mixkit gold coin sound!
    }, 2500));

    // Step 4: All features completed!
    timers.push(setTimeout(() => {
      setAllActivated(true);
      playNewPersonSound();
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.55 }
        });
      } catch {}
    }, 3200));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-xl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg my-auto rounded-3xl bg-slate-900/90 border border-blue-500/30 p-5 sm:p-7 shadow-[0_0_60px_rgba(59,130,246,0.3)] text-white overflow-hidden"
        >
          {/* Ambient Background Glows */}
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-emerald-600/25 rounded-full blur-3xl pointer-events-none" />

          {/* Header Badge */}
          <div className="text-center space-y-2 mb-5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black shadow-inner"
            >
              <CheckCircle2 size={15} className="text-emerald-400" />
              <span>2.5 GB Update Download Finished!</span>
            </motion.div>

            <motion.h3
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-blue-100 to-teal-200 bg-clip-text text-transparent"
            >
              Activating v6.5.1 Features
            </motion.h3>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-xs text-slate-400 max-w-sm mx-auto"
            >
              The 2.5 GB bundle has been verified and unpacked into your offline cache. Initializing modern modules:
            </motion.p>
          </div>

          {/* Feature Showcase Animated Cards */}
          <div className="space-y-2.5 mb-6">
            {UPDATE_FEATURES.map((feat, idx) => {
              const isUnlocked = activeStep > idx;
              const isCurrentlyActivating = activeStep === idx + 1;

              return (
                <motion.div
                  key={feat.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{
                    opacity: isUnlocked ? 1 : 0.4,
                    x: 0,
                    scale: isCurrentlyActivating ? 1.02 : 1
                  }}
                  transition={{ duration: 0.3 }}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 flex items-start gap-3.5 ${
                    isUnlocked
                      ? `bg-gradient-to-r ${feat.accentColor} shadow-lg shadow-black/40`
                      : 'bg-slate-800/40 border-slate-700/50 opacity-40'
                  }`}
                  style={{
                    boxShadow: isCurrentlyActivating ? `0 0 20px ${feat.glow}` : undefined
                  }}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                      isUnlocked
                        ? 'bg-slate-900/80 border-white/20'
                        : 'bg-slate-800 border-slate-700'
                    }`}
                  >
                    {isUnlocked ? feat.icon : <Sparkles size={16} className="text-slate-500" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                        {feat.title}
                      </h4>
                      {isUnlocked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          <CheckCircle2 size={10} />
                          <span>{feat.badge}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-500">
                          Pending...
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed line-clamp-2">
                      {feat.subtitle}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom Action: Rocket Launch Trigger */}
          <div className="pt-2 text-center">
            <motion.button
              type="button"
              onClick={() => {
                playReturnMoneySound();
                onComplete();
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`w-full py-3 px-5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xl ${
                allActivated
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white shadow-blue-500/30 ring-2 ring-cyan-400/50'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Rocket size={17} className={allActivated ? 'animate-bounce text-cyan-300' : 'text-slate-400'} />
              <span>
                {allActivated
                  ? 'Launch App Celebration (Rocket Animation)'
                  : `Activating Modules (${Math.min(activeStep, 4)}/4)...`}
              </span>
              <ArrowRight size={15} />
            </motion.button>
            <p className="text-[10px] text-slate-400 mt-2">
              FinancialFree Ultimate v6.5.1 is now active on your device.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
