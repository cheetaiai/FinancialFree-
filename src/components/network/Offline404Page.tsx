import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, X, ShieldCheck, Sun, Moon, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { playReturnMoneySound, playTickSound } from '../../lib/soundEffects';

interface Offline404PageProps {
  onRetrySuccess?: () => void;
  onCloseOrBack?: () => void;
  standalone?: boolean;
}

export const Offline404Page: React.FC<Offline404PageProps> = ({
  onRetrySuccess,
  onCloseOrBack,
  standalone = false
}) => {
  const { theme, toggleTheme } = useTheme();
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<string>('');

  const updateNetworkStatus = () => {
    const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setIsOnline(online);
  };

  useEffect(() => {
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  const handleRetry = async () => {
    playTickSound();
    setIsChecking(true);
    setFeedback('Checking connection…');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`/api/health?t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok || res.status < 500) {
        setIsOnline(true);
        setFeedback('Connection available. Restoring app…');
        playReturnMoneySound();
        setTimeout(() => {
          if (onRetrySuccess) {
            onRetrySuccess();
          } else {
            window.location.reload();
          }
        }, 600);
        return;
      }
    } catch {
      if (navigator.onLine) {
        setIsOnline(true);
        setFeedback('Internet detected. Reloading…');
        playReturnMoneySound();
        setTimeout(() => {
          if (onRetrySuccess) {
            onRetrySuccess();
          } else {
            window.location.reload();
          }
        }, 600);
        return;
      }
    }

    setIsOnline(false);
    setFeedback('Still offline. Reconnect and try again.');
    setIsChecking(false);
  };

  const handleBackOrClose = () => {
    playTickSound();
    // 1. Try closing window (works in PWA / app shortcuts / standalone webviews)
    try {
      window.close();
    } catch {}

    // 2. If provided callback or history exists, navigate back
    if (onCloseOrBack) {
      onCloseOrBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-[radial-gradient(ellipse_at_50%_10%,#1b5139_0%,#0b2b20_43%,#061810_100%)] text-slate-100'
          : 'bg-[radial-gradient(ellipse_at_50%_10%,#e6f9f0_0%,#d4f3e4_45%,#f1f8f5_100%)] text-slate-900'
      }`}
    >
      {/* Background Animated Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className={`absolute rounded-full filter blur-3xl opacity-30 animate-pulse ${
            theme === 'dark' ? 'bg-emerald-400' : 'bg-emerald-300'
          }`}
          style={{ width: '280px', height: '280px', left: '-80px', top: '10%' }}
        />
        <div
          className={`absolute rounded-full filter blur-3xl opacity-25 animate-pulse ${
            theme === 'dark' ? 'bg-teal-500' : 'bg-teal-400'
          }`}
          style={{ width: '340px', height: '340px', right: '-100px', bottom: '-80px', animationDelay: '2s' }}
        />
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(${theme === 'dark' ? '#c6ffe0' : '#059669'} 1px, transparent 1px), linear-gradient(90deg, ${theme === 'dark' ? '#c6ffe0' : '#059669'} 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }}
        />
      </div>

      {/* Main Glass 404 Card */}
      <motion.main
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`relative z-10 w-full max-w-lg p-6 sm:p-9 text-center rounded-[30px] border shadow-2xl backdrop-blur-2xl ${
          theme === 'dark'
            ? 'bg-gradient-to-b from-white/[0.12] to-white/[0.04] border-white/20 shadow-[0_28px_80px_rgba(0,0,0,0.7)]'
            : 'bg-gradient-to-b from-white/95 to-white/90 border-emerald-500/30 shadow-[0_20px_50px_rgba(16,185,129,0.15)]'
        }`}
      >
        {/* Top Floating Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            type="button"
            data-allow-offline="true"
            onClick={toggleTheme}
            className={`p-2 rounded-full border transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-white/10 hover:bg-white/15 border-white/15 text-yellow-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
            }`}
            title="Toggle Light / Dark Mode"
            aria-label="Toggle display theme"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {onCloseOrBack && !standalone && (
            <button
              type="button"
              data-allow-offline="true"
              onClick={handleBackOrClose}
              className={`p-2 rounded-full border transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              }`}
              title="Close 404 View"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2.5 font-black text-lg tracking-tight mb-2">
          <div className="w-10 h-10 rounded-2xl bg-white p-1 shadow-md flex items-center justify-center">
            <img
              src="/icon-192.png"
              onError={e => {
                (e.target as HTMLElement).style.display = 'none';
              }}
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className={theme === 'dark' ? 'text-white' : 'text-slate-950 font-black'}>
            FinancialFree
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            Protected
          </span>
        </div>

        {/* Animated Rings & Flowing Wire SVG Illustration */}
        <div className="h-44 flex items-center justify-center relative my-2">
          {/* Triple Pulsing Concentric Rings */}
          <div className="absolute w-36 h-36 rounded-full border border-emerald-400/40 animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute w-28 h-28 rounded-full border border-emerald-400/30 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
          <div className="absolute w-20 h-20 rounded-full border border-emerald-400/20 animate-ping" style={{ animationDuration: '3s', animationDelay: '2s' }} />

          {/* Connected Network Server and Data Highway SVG */}
          <svg viewBox="0 0 190 145" className="w-48 h-36 relative z-10 overflow-visible" role="img" aria-label="Network cable connection diagram">
            {/* Dim Wire */}
            <path
              d="M26 34H74L98 58H151V94"
              fill="none"
              stroke="#55d99b"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray="5 8"
              opacity="0.45"
            />
            {/* Animated Flow Wire */}
            <path
              d="M26 34H74L98 58H151V94"
              fill="none"
              stroke={theme === 'dark' ? '#9cf4c8' : '#059669'}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray="5 8"
              className="animate-[pulse_1.5s_linear_infinite]"
              style={{ filter: 'drop-shadow(0 0 5px #55d99b)' }}
            />
            {/* Bottom Wire */}
            <path
              d="M26 110H65L87 88H125L151 94"
              fill="none"
              stroke="#55d99b"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray="5 8"
            />
            {/* Server Rack Box */}
            <rect
              x="128"
              y="92"
              width="46"
              height="38"
              rx="7"
              fill={theme === 'dark' ? '#123e2b' : '#d1fae5'}
              stroke="#55d99b"
              strokeWidth="2"
            />
            <path d="M137 103H164M137 112H164" stroke="#55d99b" strokeWidth="2" strokeLinecap="round" />
            <circle cx="165" cy="103" r="2.5" fill="#10b981" className="animate-ping" style={{ animationDuration: '1s' }} />
            <circle cx="165" cy="112" r="2.5" fill="#10b981" className="animate-ping" style={{ animationDuration: '1.4s' }} />

            {/* Network Nodes */}
            <circle cx="26" cy="34" r="7" fill={theme === 'dark' ? '#a8f5ce' : '#059669'} stroke="#ffffff" strokeWidth="2" />
            <circle cx="74" cy="34" r="6" fill={theme === 'dark' ? '#a8f5ce' : '#059669'} stroke="#ffffff" strokeWidth="2" />
            <circle cx="98" cy="58" r="6" fill={theme === 'dark' ? '#a8f5ce' : '#059669'} stroke="#ffffff" strokeWidth="2" />
            <circle cx="26" cy="110" r="7" fill={theme === 'dark' ? '#a8f5ce' : '#059669'} stroke="#ffffff" strokeWidth="2" />
            <circle cx="87" cy="88" r="6" fill={theme === 'dark' ? '#a8f5ce' : '#059669'} stroke="#ffffff" strokeWidth="2" />
            <circle cx="125" cy="88" r="6" fill={theme === 'dark' ? '#a8f5ce' : '#059669'} stroke="#ffffff" strokeWidth="2" />
          </svg>
        </div>

        {/* 404 Bold Gradient Text */}
        <div
          className={`font-black tracking-tight leading-none mb-1 text-6xl sm:text-7xl font-mono ${
            theme === 'dark'
              ? 'bg-gradient-to-r from-emerald-200 via-teal-300 to-emerald-400 bg-clip-text text-transparent'
              : 'bg-gradient-to-r from-emerald-700 via-teal-800 to-emerald-900 bg-clip-text text-transparent'
          }`}
        >
          404
        </div>

        {/* Header and Explanation */}
        <h1
          className={`text-xl sm:text-2xl font-black tracking-tight mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-slate-950 font-black'
          }`}
        >
          Connection interrupted
        </h1>

        <p
          className={`max-w-md mx-auto text-xs sm:text-sm leading-relaxed mb-4 ${
            theme === 'dark' ? 'text-slate-200 font-medium' : 'text-slate-800 font-semibold'
          }`}
        >
          We couldn’t reach FinancialFree right now. Check your internet connection and try again. Your saved financial information is not changed by this error page.
        </p>

        {/* Live Status Badge */}
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold mb-5 border ${
            theme === 'dark'
              ? 'bg-black/30 border-white/15 text-slate-200'
              : 'bg-emerald-500/10 border-emerald-500/25 text-slate-900'
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isOnline
                ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]'
                : 'bg-amber-400 shadow-[0_0_12px_#fbbf24]'
            }`}
          />
          <span>
            {isOnline ? 'Internet available · Server check ready' : 'You appear to be offline'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            data-allow-offline="true"
            onClick={handleRetry}
            disabled={isChecking}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={isChecking ? 'animate-spin' : ''} />
            <span>{isChecking ? 'Checking…' : '↻ Try again'}</span>
          </button>

          <button
            type="button"
            data-allow-offline="true"
            onClick={handleBackOrClose}
            className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer active:scale-95 ${
              theme === 'dark'
                ? 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900 font-bold'
            }`}
          >
            <ArrowLeft size={16} />
            <span>Back / Close App</span>
          </button>
        </div>

        {/* Dynamic Feedback Message */}
        {feedback && (
          <p
            className={`text-xs font-bold mt-3 animate-fade-in ${
              isOnline
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {feedback}
          </p>
        )}

        {/* Footer */}
        <div
          className={`mt-6 pt-4 border-t text-[11px] font-bold tracking-wider flex items-center justify-center gap-1.5 ${
            theme === 'dark'
              ? 'border-white/10 text-slate-400'
              : 'border-slate-200 text-slate-600'
          }`}
        >
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>FINANCIALFREE • SECURE LEDGER OFFLINE VAULT</span>
        </div>
      </motion.main>
    </div>
  );
};
