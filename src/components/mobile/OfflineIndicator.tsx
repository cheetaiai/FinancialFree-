import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OfflineIndicatorProps {
  onOpen404?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onOpen404 }) => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          onClick={onOpen404}
          role={onOpen404 ? 'button' : undefined}
          tabIndex={onOpen404 ? 0 : undefined}
          className={`fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-2xl bg-amber-600/95 text-white px-3.5 py-2 text-xs font-bold shadow-2xl backdrop-blur-md border border-amber-400/40 ${
            onOpen404 ? 'cursor-pointer hover:bg-amber-500 hover:scale-105 active:scale-95 transition-transform' : ''
          }`}
          title={onOpen404 ? 'Click to view connection status screen' : undefined}
        >
          <WifiOff size={15} className="animate-pulse text-amber-200" />
          <span>Offline Mode — Vault Active</span>
          {onOpen404 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] uppercase font-black tracking-wider flex items-center gap-1">
              <AlertTriangle size={10} />
              404
            </span>
          )}
        </motion.div>
      )}

      {showReconnected && isOnline && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-2xl bg-emerald-600/95 text-white px-3.5 py-2 text-xs font-bold shadow-2xl backdrop-blur-md border border-emerald-400/40"
        >
          <Wifi size={15} className="text-emerald-200" />
          <span>Online — Cloud synchronization restored</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
