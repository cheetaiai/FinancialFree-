import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, formatTransactionRef } from '../../lib/formatters';
import { ArrowUpRight, ArrowDownLeft, X, AlertCircle, Sparkles, Check, Copy } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export interface PaymentAnimationData {
  status: 'success' | 'failed';
  type: 'given' | 'returned';
  amount: number;
  personName: string;
  transactionRef?: string;
  category?: string;
  notes?: string;
  errorMessage?: string;
}

interface PaymentAnimationModalProps {
  data: PaymentAnimationData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentAnimationModal: React.FC<PaymentAnimationModalProps> = ({
  data,
  isOpen,
  onClose
}) => {
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && data) {
      if (data.status === 'success') {
        if (navigator.vibrate) navigator.vibrate([40, 30, 80]);
      } else {
        if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
      }
    }
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  const isSuccess = data.status === 'success';
  const isGiven = data.type === 'given';
  const formattedRef = data.transactionRef || formatTransactionRef();

  const handleCopyRef = () => {
    navigator.clipboard?.writeText(formattedRef);
    showToast(`Transaction Ref ${formattedRef} copied to clipboard`, 'info');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 400 }}
          className="relative w-full max-w-sm overflow-hidden rounded-3xl liquid-glass-card liquid-glass-specular border border-white/20 dark:border-white/10 shadow-2xl p-6 sm:p-7 z-10 text-center"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {isSuccess ? (
            <div className="flex flex-col items-center space-y-4">
              {/* Animated Tick Icon Circle */}
              <div className="relative w-24 h-24 flex items-center justify-center">
                {/* Expanding background shockwaves */}
                <motion.div
                  initial={{ scale: 0.6, opacity: 0.8 }}
                  animate={{ scale: 1.3, opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full bg-emerald-500/30"
                />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.6 }}
                  animate={{ scale: 1.15, opacity: 0 }}
                  transition={{ duration: 1.2, delay: 0.2, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full bg-teal-500/25"
                />

                {/* Main Glowing Circle */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/40 text-white"
                >
                  {/* Drawing SVG Checkmark Tick */}
                  <svg className="w-10 h-10" viewBox="0 0 52 52">
                    <motion.circle
                      cx="26"
                      cy="26"
                      r="24"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="3"
                      strokeOpacity="0.4"
                    />
                    <motion.path
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14 27l8 8 16-16"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.45, delay: 0.2, ease: 'easeOut' }}
                    />
                  </svg>
                </motion.div>
              </div>

              {/* Status Header */}
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-1"
                >
                  {isGiven ? (
                    <>
                      <ArrowUpRight size={13} />
                      <span>Money Given Recorded</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownLeft size={13} />
                      <span>Payment Received & Cleared</span>
                    </>
                  )}
                </motion.div>

                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Transaction Successful
                </h3>
              </div>

              {/* Amount Display */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.35, type: 'spring' }}
                className="py-2.5 px-5 rounded-2xl liquid-glass-secondary border border-slate-200/80 dark:border-white/10 w-full"
              >
                <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  {formatCurrency(data.amount)}
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-center gap-1">
                  <span>To/From:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{data.personName}</span>
                </div>
              </motion.div>

              {/* Transaction Ref Number Card */}
              <div className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Transaction No</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{formattedRef}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                  title="Copy Reference"
                >
                  <Copy size={14} />
                </button>
              </div>

              {/* Action */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 min-h-[44px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            /* FAILED PAYMENT / TRANSACTION STATE */
            <motion.div
              animate={{ x: [-8, 8, -6, 6, -3, 3, 0] }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center space-y-4"
            >
              {/* Animated Cross Icon Circle */}
              <div className="relative w-24 h-24 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0.8 }}
                  animate={{ scale: 1.25, opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full bg-rose-500/30"
                />

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center shadow-xl shadow-rose-500/40 text-white"
                >
                  {/* Drawing SVG Cross X */}
                  <svg className="w-10 h-10" viewBox="0 0 52 52">
                    <motion.circle
                      cx="26"
                      cy="26"
                      r="24"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="3"
                      strokeOpacity="0.4"
                    />
                    <motion.path
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                      d="M17 17l18 18M35 17L17 35"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.45, delay: 0.2, ease: 'easeOut' }}
                    />
                  </svg>
                </motion.div>
              </div>

              {/* Status Header */}
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-bold mb-1">
                  <AlertCircle size={13} />
                  <span>Transaction Rejected</span>
                </div>

                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Payment Entry Failed
                </h3>
              </div>

              {/* Error reason */}
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 w-full text-left">
                <span className="font-semibold block mb-0.5">Validation Error:</span>
                <span>{data.errorMessage || 'Please check the entered amount and person balance.'}</span>
              </div>

              {/* Action Buttons */}
              <div className="w-full flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 min-h-[44px] rounded-2xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 min-h-[44px] rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-colors cursor-pointer"
                >
                  Review & Retry
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
