import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, X, ShieldCheck, Sun, Moon, ArrowLeft, Radio, Heart } from 'lucide-react';
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

  // Dual-Design 2-Second Auto-Transition Engine
  // 1st: Advanced Network Highway & Server Nodes
  // 2nd (after 2s): Cute Cat Unplugged Cable Helper
  // Cycles continuously every 2 seconds with manual override
  const [activeDesign, setActiveDesign] = useState<'advanced' | 'cat'>('advanced');
  const [isAutoCycling, setIsAutoCycling] = useState<boolean>(true);

  useEffect(() => {
    if (!isAutoCycling) return;
    const interval = setInterval(() => {
      setActiveDesign(curr => (curr === 'advanced' ? 'cat' : 'advanced'));
    }, 2000);
    return () => clearInterval(interval);
  }, [isAutoCycling]);

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
        setFeedback('Connection available. Restoring FinancialFree…');
        playReturnMoneySound();
        setTimeout(() => {
          if (onRetrySuccess) {
            onRetrySuccess();
          } else {
            window.location.reload();
          }
        }, 500);
        return;
      }
    } catch {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        setIsOnline(true);
        setFeedback('Internet detected. Reloading…');
        playReturnMoneySound();
        setTimeout(() => {
          if (onRetrySuccess) {
            onRetrySuccess();
          } else {
            window.location.reload();
          }
        }, 500);
        return;
      }
    }

    setIsOnline(false);
    setFeedback('Still offline. Check connection and try again.');
    setIsChecking(false);
  };

  const handleBackOrClose = () => {
    playTickSound();
    try {
      window.close();
    } catch {}

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
      className={`min-h-screen w-full flex items-center justify-center p-3 sm:p-5 relative overflow-hidden transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-[radial-gradient(ellipse_at_50%_10%,#1b5139_0%,#0b2b20_43%,#061810_100%)] text-slate-100'
          : 'bg-[radial-gradient(ellipse_at_50%_10%,#e6f9f0_0%,#d4f3e4_45%,#f1f8f5_100%)] text-slate-900'
      }`}
    >
      {/* Background Ambient Glow & Grid Lines */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className={`absolute rounded-full filter blur-3xl opacity-30 animate-pulse ${
            theme === 'dark' ? 'bg-emerald-400' : 'bg-emerald-300'
          }`}
          style={{ width: '320px', height: '320px', left: '-90px', top: '8%' }}
        />
        <div
          className={`absolute rounded-full filter blur-3xl opacity-25 animate-pulse ${
            theme === 'dark' ? 'bg-teal-500' : 'bg-teal-400'
          }`}
          style={{ width: '380px', height: '380px', right: '-110px', bottom: '-90px', animationDelay: '2.5s' }}
        />
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(${theme === 'dark' ? '#c6ffe0' : '#059669'} 1px, transparent 1px), linear-gradient(90deg, ${theme === 'dark' ? '#c6ffe0' : '#059669'} 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }}
        />
      </div>

      {/* Main Glass 404 Card with Dynamic Dual-Design Transition */}
      <motion.main
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`relative z-10 w-full max-w-lg p-5 sm:p-8 text-center rounded-[32px] border shadow-2xl backdrop-blur-2xl transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-gradient-to-b from-white/[0.13] to-white/[0.04] border-white/20 shadow-[0_28px_85px_rgba(0,0,0,0.75)]'
            : 'bg-gradient-to-b from-white/95 to-white/90 border-emerald-500/30 shadow-[0_20px_50px_rgba(16,185,129,0.18)]'
        }`}
      >
        {/* Top Controls: Design Selector Switch, Theme Toggle & Close */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* 2-Second Dual-Design Switcher Pill */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/20 dark:bg-black/30 border border-white/10 text-[11px] font-bold">
            <button
              type="button"
              data-allow-offline="true"
              onClick={() => {
                setActiveDesign('advanced');
                setIsAutoCycling(false);
              }}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                activeDesign === 'advanced'
                  ? 'bg-emerald-500 text-white shadow-xs font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio size={12} />
              <span>Advanced</span>
            </button>
            <button
              type="button"
              data-allow-offline="true"
              onClick={() => {
                setActiveDesign('cat');
                setIsAutoCycling(false);
              }}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                activeDesign === 'cat'
                  ? 'bg-emerald-500 text-white shadow-xs font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Heart size={12} />
              <span>Cat Helper 🐱</span>
            </button>
            {isAutoCycling && (
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 animate-pulse">
                2s Auto
              </span>
            )}
          </div>

          {/* Theme & Close Buttons */}
          <div className="flex items-center gap-1.5">
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
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
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
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2.5 font-black text-base sm:text-lg tracking-tight mb-2">
          {activeDesign === 'advanced' ? (
            <div className="w-9 h-9 rounded-2xl bg-white p-1 shadow-md flex items-center justify-center">
              <img
                src="/icon-192.png"
                onError={e => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#c5ffe0] to-[#58d99d] text-[#12432e] font-black text-base flex items-center justify-center shadow-md shadow-emerald-500/30">
              F
            </span>
          )}
          <span className={theme === 'dark' ? 'text-white' : 'text-slate-950 font-black'}>
            FinancialFree
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            {activeDesign === 'advanced' ? 'Protected' : 'Auto-Sync Active'}
          </span>
        </div>

        {/* Dynamic Animated Content Container with AnimatePresence */}
        <AnimatePresence mode="wait">
          {activeDesign === 'advanced' ? (
            <motion.div
              key="design-advanced"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35 }}
              className="space-y-2"
            >
              {/* Animated Halo Rings & Data Highway Server SVG */}
              <div className="h-44 flex items-center justify-center relative my-2">
                <div className="absolute w-36 h-36 rounded-full border border-emerald-400/40 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute w-28 h-28 rounded-full border border-emerald-400/30 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                <div className="absolute w-20 h-20 rounded-full border border-emerald-400/20 animate-ping" style={{ animationDuration: '3s', animationDelay: '2s' }} />

                <svg viewBox="0 0 220 160" className="w-52 h-40 relative z-10 overflow-visible" role="img" aria-label="Network route server diagram">
                  <path d="M25 34H78L104 57H164V95" fill="none" stroke="#55d99b" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="5 9" opacity="0.45" />
                  <path d="M25 34H78L104 57H164V95" fill="none" stroke={theme === 'dark' ? '#9af4c5' : '#059669'} strokeWidth="2.4" strokeLinecap="round" strokeDasharray="5 9" className="animate-[pulse_1.2s_linear_infinite]" style={{ filter: 'drop-shadow(0 0 6px #55d99b)' }} />
                  <path d="M25 119H68L91 91H132L164 95" fill="none" stroke="#55d99b" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="5 9" />
                  <path d="M78 34L91 91" fill="none" stroke="#55d99b" strokeWidth="2" strokeDasharray="4 6" opacity="0.5" />

                  <circle cx="25" cy="34" r="7" fill={theme === 'dark' ? '#b4ffda' : '#059669'} stroke="#f2fff8" strokeWidth="1.8" />
                  <circle cx="78" cy="34" r="6" fill={theme === 'dark' ? '#b4ffda' : '#059669'} stroke="#f2fff8" strokeWidth="1.8" />
                  <circle cx="104" cy="57" r="6" fill={theme === 'dark' ? '#b4ffda' : '#059669'} stroke="#f2fff8" strokeWidth="1.8" />
                  <circle cx="25" cy="119" r="7" fill={theme === 'dark' ? '#b4ffda' : '#059669'} stroke="#f2fff8" strokeWidth="1.8" />
                  <circle cx="91" cy="91" r="6" fill={theme === 'dark' ? '#b4ffda' : '#059669'} stroke="#f2fff8" strokeWidth="1.8" />
                  <circle cx="132" cy="91" r="6" fill={theme === 'dark' ? '#b4ffda' : '#059669'} stroke="#f2fff8" strokeWidth="1.8" />

                  <rect x="143" y="94" width="52" height="46" rx="9" fill={theme === 'dark' ? '#093625e6' : '#d1fae5'} stroke="#a9f5ce" strokeWidth="2" />
                  <path d="M154 107H181M154 117H181M154 127H174" stroke="#b4ffda" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="183" cy="107" r="2.7" fill="#68e9a9" className="animate-ping" style={{ animationDuration: '1s' }} />
                  <circle cx="183" cy="117" r="2.7" fill="#68e9a9" className="animate-ping" style={{ animationDuration: '1.4s' }} />
                </svg>
              </div>

              {/* 404 Bold Code */}
              <div
                className={`font-black tracking-tight leading-none text-6xl sm:text-7xl font-mono ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-emerald-200 via-teal-300 to-emerald-400 bg-clip-text text-transparent'
                    : 'bg-gradient-to-r from-emerald-700 via-teal-800 to-emerald-900 bg-clip-text text-transparent'
                }`}
              >
                404
              </div>

              <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                We lost the connection
              </h1>

              <p className={`max-w-md mx-auto text-xs sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-200 font-medium' : 'text-slate-800 font-semibold'}`}>
                This page couldn’t be found or FinancialFree is temporarily unavailable. Check your connection and try again.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="design-cat"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35 }}
              className="space-y-2"
            >
              {/* Cute Cat Unplugged Cable & Wall Socket SVG */}
              <div className="h-44 flex items-center justify-center relative my-2">
                <svg viewBox="0 0 340 240" className="w-56 h-44 overflow-visible relative z-10" role="img" aria-label="Cute cat unplugged cable illustration">
                  {/* Sparks */}
                  <path fill="#d7ffe9" d="M45 40l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" className="animate-pulse" />
                  <path fill="#d7ffe9" d="M286 34l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" className="animate-pulse" style={{ animationDelay: '0.7s' }} />
                  <path fill="#d7ffe9" d="M302 157l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" className="animate-pulse" style={{ animationDelay: '1.3s' }} />

                  {/* Disconnected Cable & Socket */}
                  <path d="M24 174 C65 174 66 208 110 208 C137 208 140 184 164 184" fill="none" stroke="#d6f9e5" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M24 174 C65 174 66 208 110 208 C137 208 140 184 164 184" fill="none" stroke="#6fdfa8" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 9" className="animate-[pulse_1.3s_linear_infinite]" />

                  {/* Wall Socket */}
                  <rect x="222" y="151" width="62" height="68" rx="14" fill="#183c2c" stroke="#b9f5d1" strokeWidth="3" />
                  <rect x="237" y="170" width="7" height="20" rx="3.5" fill="#c5ffe0" />
                  <rect x="261" y="170" width="7" height="20" rx="3.5" fill="#c5ffe0" />
                  <path d="M245 203h16" stroke="#74dca8" strokeWidth="3" strokeLinecap="round" />

                  {/* Unplugged Plug */}
                  <g transform="translate(155 165) rotate(-13)">
                    <rect x="0" y="0" width="38" height="30" rx="9" fill="#e9fff2" stroke="#b8f6d3" strokeWidth="2" />
                    <path d="M10 1V-13M28 1V-13" stroke="#e9fff2" strokeWidth="6" strokeLinecap="round" />
                    <path d="M13 15H25" stroke="#6bbf91" strokeWidth="2.5" strokeLinecap="round" />
                  </g>

                  {/* Sitting Cat with Wagging Tail */}
                  <path d="M111 164 C79 159 82 125 104 124" fill="none" stroke="#f3eee1" strokeWidth="13" strokeLinecap="round" className="animate-[wiggle_2.4s_ease-in-out_infinite]" />
                  <ellipse cx="143" cy="164" rx="49" ry="49" fill="#f3eee1" stroke="#d4d7c9" strokeWidth="2" />
                  <path d="M119 139c-9 8-12 25-6 38 7 15 21 22 35 18 9-3 13-11 13-19-15 5-25-7-24-21-1-9-7-16-18-16z" fill="#6f806f" opacity="0.75" />

                  {/* Ears */}
                  <path d="M105 91L108 48Q110 39 118 47L145 76Z" fill="#f3eee1" stroke="#d4d7c9" strokeWidth="2" />
                  <path d="M157 75L183 47Q191 40 193 51L194 98Z" fill="#f3eee1" stroke="#d4d7c9" strokeWidth="2" />
                  <path d="M114 61l3 23 16-10zM174 76l14-16 1 26z" fill="#efa9a1" />

                  {/* Head */}
                  <ellipse cx="151" cy="103" rx="48" ry="43" fill="#f3eee1" stroke="#d4d7c9" strokeWidth="2" />
                  <path d="M113 81Q125 58 143 65Q132 80 137 99Q122 105 113 81Z" fill="#6f806f" />
                  <path d="M169 65Q190 68 195 87Q184 98 171 92Q179 80 169 65Z" fill="#6f806f" />

                  {/* Eyes (Blinking Animation) */}
                  <ellipse cx="135" cy="104" rx="4" ry="6" fill="#294d39" className="animate-[pulse_4.5s_infinite]" />
                  <ellipse cx="168" cy="104" rx="4" ry="6" fill="#294d39" className="animate-[pulse_4.5s_infinite]" />

                  {/* Nose, Mouth, Cheeks */}
                  <path d="M147 115q4-5 8 0l-4 5z" fill="#df8e91" />
                  <path d="M151 120q-7 8-13 1M151 120q7 8 13 1" fill="none" stroke="#718274" strokeWidth="2" strokeLinecap="round" />
                  <ellipse cx="124" cy="116" rx="8" ry="4" fill="#f3a8a0" opacity="0.8" />
                  <ellipse cx="179" cy="116" rx="8" ry="4" fill="#f3a8a0" opacity="0.8" />
                  <ellipse cx="119" cy="199" rx="19" ry="9" fill="#f3eee1" stroke="#d4d7c9" strokeWidth="1.5" />
                  <ellipse cx="164" cy="200" rx="19" ry="9" fill="#f3eee1" stroke="#d4d7c9" strokeWidth="1.5" />

                  {/* Floating Glass Speech Bubble */}
                  <rect x="206" y="30" width="72" height="42" rx="15" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <path d="M221 72l-4 10 14-10" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <path d="M225 51h34" stroke="#d8ffea" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="216" cy="51" r="3" fill="#d8ffea" />
                </svg>
              </div>

              {/* 404 Bold Code */}
              <div
                className={`font-black tracking-tight leading-none text-6xl sm:text-7xl font-mono ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-white via-[#a8f0c5] to-emerald-300 bg-clip-text text-transparent'
                    : 'bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-950 bg-clip-text text-transparent'
                }`}
              >
                404
              </div>

              <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                Oops! The internet cable got unplugged.
              </h1>

              <p className={`max-w-md mx-auto text-xs sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-200 font-medium' : 'text-slate-800 font-semibold'}`}>
                Our little connection helper found a loose link. Check your internet connection and try again to get FinancialFree back online.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Network Status Indicator Badge */}
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold my-4 border ${
            theme === 'dark'
              ? 'bg-black/35 border-white/15 text-slate-200'
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
            {isChecking
              ? 'Checking network status…'
              : isOnline
              ? 'Internet available · Server check ready'
              : 'You appear to be offline'}
          </span>
        </div>

        {/* Action Buttons: Primary Reconnect / Try Again & Secondary Back / Close */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            data-allow-offline="true"
            onClick={handleRetry}
            disabled={isChecking}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={isChecking ? 'animate-spin' : ''} />
            <span>{isChecking ? 'Connecting…' : activeDesign === 'cat' ? '↻  Reconnect' : '↻  Try again'}</span>
          </button>

          <button
            type="button"
            data-allow-offline="true"
            onClick={handleBackOrClose}
            className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer active:scale-95 ${
              theme === 'dark'
                ? 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-950 font-black'
            }`}
          >
            <ArrowLeft size={16} />
            <span>{activeDesign === 'cat' ? '←  Back to app' : '←  Go back to app'}</span>
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

        {/* Dynamic Footer matching Active Design */}
        <div
          className={`mt-5 pt-3 border-t text-[11px] font-bold tracking-wider flex items-center justify-center gap-1.5 ${
            theme === 'dark' ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'
          }`}
        >
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>
            {activeDesign === 'cat'
              ? 'FINANCIALFREE · CONNECTION SUPPORT'
              : 'FINANCIALFREE · SECURE DIGITAL EXPERIENCE'}
          </span>
        </div>
      </motion.main>
    </div>
  );
};
