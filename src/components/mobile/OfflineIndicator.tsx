import React, { useEffect, useState, useRef } from 'react';
import { WifiOff, Wifi, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OfflineIndicatorProps {
  onOpen404?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onOpen404 }) => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [showReconnected, setShowReconnected] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startFiveSecondOfflineNotice = () => {
    // Clear any existing timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setCountdown(5);
    setShowOfflineToast(true);

    // Countdown interval every 1 second
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-dismiss after exactly 5 seconds (5000ms)
    timerRef.current = setTimeout(() => {
      setShowOfflineToast(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }, 5000);
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineToast(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);

      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
      startFiveSecondOfflineNotice();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // If initially offline on mount, trigger 5s toast once
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      startFiveSecondOfflineNotice();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {/* 5-Second Offline Notification with Touch to Open 404 */}
      {showOfflineToast && !isOnline && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          onClick={onOpen404}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onOpen404?.();
            }
          }}
          className="fixed bottom-20 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center justify-between gap-2.5 rounded-2xl bg-amber-600/95 text-white px-3.5 py-2.5 text-xs font-bold shadow-2xl backdrop-blur-md border border-amber-400/50 cursor-pointer hover:bg-amber-500 active:scale-98 transition-all"
          title="Click to open 404 Network Recovery screen"
        >
          <div className="flex items-center gap-2 min-w-0">
            <WifiOff size={16} className="animate-pulse text-amber-200 shrink-0" />
            <div className="flex flex-col truncate">
              <span className="truncate">Offline Mode — Vault Active</span>
              <span className="text-[10px] text-amber-100 font-medium">Touch to view 404 status screen</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* 5-Second Countdown Badge */}
            <span className="px-1.5 py-0.5 rounded-md bg-black/25 text-[10px] font-mono text-amber-100">
              {countdown}s
            </span>

            {/* 404 Pill Button */}
            {onOpen404 && (
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] uppercase font-black tracking-wider flex items-center gap-1 hover:bg-white/30">
                <AlertTriangle size={10} />
                404
              </span>
            )}

            {/* Close Button to dismiss notice early */}
            <button
              type="button"
              data-allow-offline="true"
              onClick={(e) => {
                e.stopPropagation();
                setShowOfflineToast(false);
                if (timerRef.current) clearTimeout(timerRef.current);
                if (intervalRef.current) clearInterval(intervalRef.current);
              }}
              className="p-1 rounded-md hover:bg-white/20 text-white/80 hover:text-white"
              title="Dismiss"
            >
              <X size={12} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Online Restored Notification (3.5s auto-dismiss) */}
      {showReconnected && isOnline && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-20 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center gap-2 rounded-2xl bg-emerald-600/95 text-white px-3.5 py-2.5 text-xs font-bold shadow-2xl backdrop-blur-md border border-emerald-400/40"
        >
          <Wifi size={16} className="text-emerald-200 shrink-0" />
          <span>Online — Cloud synchronization restored</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
