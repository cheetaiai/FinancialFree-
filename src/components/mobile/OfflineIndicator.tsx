import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const OfflineIndicator: React.FC = () => {
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
          className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-2xl bg-amber-600/90 text-white px-3.5 py-2 text-xs font-semibold shadow-2xl backdrop-blur-md border border-amber-400/30"
        >
          <WifiOff size={15} className="animate-pulse" />
          <span>Offline Mode — Records buffered locally in secure vault</span>
        </motion.div>
      )}

      {showReconnected && isOnline && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-2xl bg-emerald-600/90 text-white px-3.5 py-2 text-xs font-semibold shadow-2xl backdrop-blur-md border border-emerald-400/30"
        >
          <Wifi size={15} />
          <span>Online — Cloud synchronization restored</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
