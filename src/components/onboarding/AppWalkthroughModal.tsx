import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppLogo } from '../common/AppLogo';
import {
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Camera,
  Database,
  Smartphone,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Lock,
  Wallet,
  Calendar,
  Zap,
  X
} from 'lucide-react';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';

interface AppWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToLogin: () => void;
}

// Word-by-word animation component
const AnimatedWords: React.FC<{
  text: string;
  className?: string;
  wordClassName?: string;
  delayOffset?: number;
}> = ({ text, className = '', wordClassName = '', delayOffset = 0 }) => {
  const words = text.split(' ');

  return (
    <span className={`inline-block ${className}`}>
      {words.map((word, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{
            duration: 0.35,
            delay: delayOffset + index * 0.045,
            ease: "easeOut"
          }}
          className={`inline-block mr-1.5 ${wordClassName}`}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};

export const AppWalkthroughModal: React.FC<AppWalkthroughModalProps> = ({
  isOpen,
  onClose,
  onProceedToLogin
}) => {
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3>(1);
  const [direction, setDirection] = useState<1 | -1>(1);

  if (!isOpen) return null;

  const goToNextPage = () => {
    if (currentPage < 3) {
      setDirection(1);
      setCurrentPage((p) => (p + 1) as 1 | 2 | 3);
    } else {
      onProceedToLogin();
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setDirection(-1);
      setCurrentPage((p) => (p - 1) as 1 | 2 | 3);
    }
  };

  // 3D Page flip variants
  const pageFlipVariants = {
    enter: (dir: number) => ({
      rotateY: dir > 0 ? 55 : -55,
      opacity: 0,
      scale: 0.94,
      transformPerspective: 1200,
      transition: { duration: 0.4, ease: "easeOut" as const }
    }),
    center: {
      rotateY: 0,
      opacity: 1,
      scale: 1,
      transformPerspective: 1200,
      transition: { duration: 0.45, ease: "easeOut" as const }
    },
    exit: (dir: number) => ({
      rotateY: dir > 0 ? -55 : 55,
      opacity: 0,
      scale: 0.94,
      transformPerspective: 1200,
      transition: { duration: 0.35, ease: "easeInOut" as const }
    })
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xl overflow-hidden">
      {/* Ambient background glow orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-500/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl relative">
        {/* Top Header & Close button */}
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2">
            <AppLogo size="xs" />
            <span className="text-xs font-bold text-slate-300">FinancialFree Tour</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Step Indicators */}
            <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-full border border-white/10">
              {[1, 2, 3].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => {
                    setDirection(step > currentPage ? 1 : -1);
                    setCurrentPage(step as 1 | 2 | 3);
                  }}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    currentPage === step
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Page {step}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Skip Tour"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 3D Animated Page Turn Container */}
        <div className="perspective-[1400px]">
          <AnimatePresence mode="wait" custom={direction}>
            {currentPage === 1 && (
              <motion.div
                key="page1"
                custom={direction}
                variants={pageFlipVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <LiquidGlassCard
                  variant="floating"
                  className="p-6 sm:p-9 border border-white/20 shadow-2xl relative overflow-hidden"
                >
                  <div className="flex flex-col items-center text-center">
                    {/* Glowing App Logo */}
                    <div className="relative mb-5">
                      <div className="absolute inset-0 bg-emerald-500/25 blur-2xl rounded-full scale-150 animate-pulse" />
                      <AppLogo size="2xl" animate={true} />
                    </div>

                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
                      <Sparkles size={13} />
                      <span>Page 1 of 3: Start & Overview</span>
                    </div>

                    {/* Animated Headline Words */}
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                      <AnimatedWords
                        text="Welcome to FinancialFree System"
                        wordClassName="text-white"
                      />
                    </h2>

                    {/* Animated Subtitle Words */}
                    <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed mb-6">
                      <AnimatedWords
                        text="Your ultimate personal lending & return tracker. Never forget money given to friends, colleagues, or vendors."
                        delayOffset={0.2}
                        wordClassName="text-slate-300"
                      />
                    </p>

                    {/* 3 Value Pillars */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left mb-6">
                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-all">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                          <Wallet size={18} />
                        </div>
                        <div className="text-xs font-bold text-white mb-0.5">Lend & Return Tracking</div>
                        <div className="text-[11px] text-slate-400 leading-snug">
                          Record every transaction with payment modes, notes, and dates.
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-all">
                        <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-2">
                          <TrendingUp size={18} />
                        </div>
                        <div className="text-xs font-bold text-white mb-0.5">Running Net Balance</div>
                        <div className="text-[11px] text-slate-400 leading-snug">
                          Instant calculation of who owes you and zero-debt milestones.
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-all">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2">
                          <Calendar size={18} />
                        </div>
                        <div className="text-xs font-bold text-white mb-0.5">Due Date Reminders</div>
                        <div className="text-[11px] text-slate-400 leading-snug">
                          Automated WhatsApp and SMS reminder templates.
                        </div>
                      </div>
                    </div>

                    {/* Next Action */}
                    <div className="w-full flex items-center justify-between pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={onClose}
                        className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Skip to Login
                      </button>

                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={goToNextPage}
                        className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/30 cursor-pointer"
                      >
                        <span>Next: Working App Overview</span>
                        <ArrowRight size={15} />
                      </motion.button>
                    </div>
                  </div>
                </LiquidGlassCard>
              </motion.div>
            )}

            {currentPage === 2 && (
              <motion.div
                key="page2"
                custom={direction}
                variants={pageFlipVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <LiquidGlassCard
                  variant="floating"
                  className="p-6 sm:p-9 border border-white/20 shadow-2xl relative overflow-hidden"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-400 text-xs font-bold mb-3">
                      <Zap size={13} />
                      <span>Page 2 of 3: Working App Features</span>
                    </div>

                    {/* Animated Headline Words */}
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                      <AnimatedWords
                        text="Live Analytics & Working App Engine"
                        wordClassName="text-white"
                      />
                    </h2>

                    {/* Animated Subtitle Words */}
                    <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed mb-6">
                      <AnimatedWords
                        text="Experience real-time ledger updates, multi-currency switching, PDF audit exports, and an AI copilot assistant."
                        delayOffset={0.15}
                        wordClassName="text-slate-300"
                      />
                    </p>

                    {/* Interactive Mockup Card */}
                    <div className="w-full p-4 rounded-3xl bg-slate-900/90 border border-teal-500/30 shadow-inner mb-6 text-left">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                          <span className="text-xs font-bold text-white">Live Ledger Simulation</span>
                        </div>
                        <div className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Active State
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="p-2.5 rounded-xl bg-white/5">
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Given</div>
                          <div className="text-sm font-black text-emerald-400">₹1,50,000</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/5">
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Returned</div>
                          <div className="text-sm font-black text-blue-400">₹95,000</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/5">
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">Net Pending</div>
                          <div className="text-sm font-black text-amber-400">₹55,000</div>
                        </div>
                      </div>

                      {/* Sample ledger item */}
                      <div className="p-2.5 rounded-xl bg-white/5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                            R
                          </div>
                          <div>
                            <div className="font-semibold text-white">Rahul Sharma</div>
                            <div className="text-[10px] text-slate-400">UPI Repayment • Partial Return</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-400">+₹20,000</div>
                          <div className="text-[10px] text-slate-400">Cleared today</div>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="w-full flex items-center justify-between pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={goToPrevPage}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                      >
                        <ArrowLeft size={15} />
                        <span>Previous</span>
                      </button>

                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={goToNextPage}
                        className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-teal-500/30 cursor-pointer"
                      >
                        <span>Next: Storage & Camera</span>
                        <ArrowRight size={15} />
                      </motion.button>
                    </div>
                  </div>
                </LiquidGlassCard>
              </motion.div>
            )}

            {currentPage === 3 && (
              <motion.div
                key="page3"
                custom={direction}
                variants={pageFlipVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <LiquidGlassCard
                  variant="floating"
                  className="p-6 sm:p-9 border border-white/20 shadow-2xl relative overflow-hidden"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-bold mb-3">
                      <ShieldCheck size={13} />
                      <span>Page 3 of 3: Cloud & Camera Security</span>
                    </div>

                    {/* Animated Headline Words */}
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                      <AnimatedWords
                        text="Dual Cloud Storage & Camera Scanner"
                        wordClassName="text-white"
                      />
                    </h2>

                    {/* Animated Subtitle Words */}
                    <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed mb-6">
                      <AnimatedWords
                        text="All your lending data is mirrored across Cloud Firestore/SQL and browser LocalStorage. Snap physical receipts with your camera in one click."
                        delayOffset={0.15}
                        wordClassName="text-slate-300"
                      />
                    </p>

                    {/* Visual Security & Feature Highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full text-left mb-6">
                      <div className="p-4 rounded-2xl bg-white/5 border border-blue-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                            <Database size={18} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">Dual Storage Engine</div>
                            <div className="text-[10px] text-emerald-400 font-semibold">
                              Cloud + LocalStorage Active
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Your records survive device reboots, network drops, and browser cache clears with automatic two-way replication.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/5 border border-emerald-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                            <Camera size={18} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">Camera Receipt Capture</div>
                            <div className="text-[10px] text-teal-400 font-semibold">
                              Hardware Verified Access
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Attach photos of signed promissory notes, checks, and UPI payment slips directly to every loan record.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 w-full flex items-center justify-center gap-2 text-xs text-slate-300 mb-6">
                      <Lock size={14} className="text-emerald-400" />
                      <span>Confidential Admin Access — Never displays passwords in UI</span>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="w-full flex items-center justify-between pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={goToPrevPage}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                      >
                        <ArrowLeft size={15} />
                        <span>Previous</span>
                      </button>

                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={onProceedToLogin}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-emerald-500/35 cursor-pointer"
                      >
                        <span>Proceed to Login</span>
                        <ArrowRight size={16} />
                      </motion.button>
                    </div>
                  </div>
                </LiquidGlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
