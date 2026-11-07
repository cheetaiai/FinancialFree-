import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, Sparkles, ArrowRight } from 'lucide-react';
import { playTickSound } from '../lib/soundEffects';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export interface ToastOptions {
  title?: string;
  action?: ToastAction;
  durationMs?: number;
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
  action?: ToastAction;
  durationMs: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, options?: ToastOptions) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success', options?: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    const durationMs = options?.durationMs || (options?.action ? 6500 : 4500);

    // Play subtle audio cue for notification arrival
    try {
      playTickSound();
    } catch {}

    const newToast: Toast = {
      id,
      message,
      type,
      title: options?.title,
      action: options?.action,
      durationMs
    };

    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, durationMs);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div
        id="toast-container"
        className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-50 flex flex-col gap-3 max-w-sm w-[calc(100vw-1.5rem)] sm:w-auto pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => {
            const isSuccess = toast.type === 'success';
            const isError = toast.type === 'error';
            const isWarning = toast.type === 'warning';
            const isInfo = toast.type === 'info';

            // Liquid glass color accents & glows
            const glowColor = isSuccess
              ? 'rgba(16, 185, 129, 0.25)'
              : isError
              ? 'rgba(244, 63, 94, 0.25)'
              : isWarning
              ? 'rgba(245, 158, 11, 0.25)'
              : 'rgba(59, 130, 246, 0.25)';

            const borderColor = isSuccess
              ? 'border-emerald-500/35'
              : isError
              ? 'border-rose-500/35'
              : isWarning
              ? 'border-amber-500/35'
              : 'border-blue-500/35';

            const badgeBg = isSuccess
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              : isError
              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
              : isWarning
              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
              : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30';

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.92, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, scale: 0.92, filter: 'blur(4px)' }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className={`pointer-events-auto relative overflow-hidden rounded-2xl p-4 shadow-[0_16px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl bg-white/95 dark:bg-slate-950/90 text-slate-900 dark:text-white border border-slate-200 dark:${borderColor} transition-all duration-300`}
                style={{
                  boxShadow: `0 20px 45px -10px ${glowColor}, inset 0 1px 1px 0 rgba(255, 255, 255, 0.4)`
                }}
              >
                {/* Specular prismatic highlight line */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-500/40 dark:via-white/50 to-transparent pointer-events-none" />

                {/* Subtle ambient colored orb in background */}
                <div
                  className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-40 dark:opacity-100"
                  style={{ background: glowColor }}
                />

                <div className="relative z-10 flex items-start gap-3">
                  {/* Glassy icon container */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner border ${badgeBg}`}
                  >
                    {isSuccess && <CheckCircle2 size={19} className="text-emerald-600 dark:text-emerald-400" />}
                    {isError && <AlertCircle size={19} className="text-rose-600 dark:text-rose-400" />}
                    {isWarning && <AlertTriangle size={19} className="text-amber-600 dark:text-amber-400" />}
                    {isInfo && <Info size={19} className="text-blue-600 dark:text-blue-400" />}
                  </div>

                  {/* Message body */}
                  <div className="flex-1 min-w-0 pr-1">
                    {toast.title && (
                      <div className="text-xs font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 mb-0.5">
                        <Sparkles size={12} className="text-amber-500 animate-pulse" />
                        <span>{toast.title}</span>
                      </div>
                    )}
                    <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug break-words">
                      {toast.message}
                    </div>

                    {/* Optional interactive action button */}
                    {toast.action && (
                      <div className="mt-2.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              playTickSound();
                            } catch {}
                            toast.action?.onClick();
                            dismissToast(toast.id);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/25 border border-white/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                        >
                          <span>{toast.action.label}</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Dismiss close button */}
                  <button
                    type="button"
                    onClick={() => dismissToast(toast.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                    aria-label="Dismiss notification"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Liquid Glass auto-dismiss progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: toast.durationMs / 1000, ease: 'linear' }}
                    className={`h-full ${
                      isSuccess
                        ? 'bg-emerald-400'
                        : isError
                        ? 'bg-rose-400'
                        : isWarning
                        ? 'bg-amber-400'
                        : 'bg-blue-400'
                    }`}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
