import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ArrowUpRight, ArrowDownLeft, X, UserPlus } from 'lucide-react';

interface QuickAddRadialMenuProps {
  onOpenGiveModal: () => void;
  onOpenReturnModal: () => void;
  onOpenAddPersonModal: () => void;
}

export const QuickAddRadialMenu: React.FC<QuickAddRadialMenuProps> = ({
  onOpenGiveModal,
  onOpenReturnModal,
  onOpenAddPersonModal
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative z-40">
      {/* Floating Action Menu Options */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Blur on active */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-30 pointer-events-auto"
            />

            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5 z-40 min-w-[200px] pointer-events-auto">
              {/* Option: Add Person */}
              <motion.button
                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0.08 }}
                onClick={() => {
                  setIsOpen(false);
                  onOpenAddPersonModal();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl liquid-glass-floating hover:scale-[1.03] transition-transform text-left cursor-pointer border border-white/60 dark:border-white/10 shadow-xl"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                  <UserPlus size={16} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">Add New Person</div>
                  <div className="text-[10px] text-slate-500">Record a borrower contact</div>
                </div>
              </motion.button>

              {/* Option: Money Returned */}
              <motion.button
                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0.04 }}
                onClick={() => {
                  setIsOpen(false);
                  onOpenReturnModal();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl liquid-glass-floating hover:scale-[1.03] transition-transform text-left cursor-pointer border border-white/60 dark:border-white/10 shadow-xl"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <ArrowDownLeft size={16} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">Record Return</div>
                  <div className="text-[10px] text-slate-500">Money returned to you</div>
                </div>
              </motion.button>

              {/* Option: Give Money */}
              <motion.button
                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                onClick={() => {
                  setIsOpen(false);
                  onOpenGiveModal();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl liquid-glass-floating hover:scale-[1.03] transition-transform text-left cursor-pointer border border-white/60 dark:border-white/10 shadow-xl"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                  <ArrowUpRight size={16} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">Give Money</div>
                  <div className="text-[10px] text-slate-500">Lend or advance funds</div>
                </div>
              </motion.button>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Main Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-13 h-13 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 border border-white/30 cursor-pointer relative z-40"
        aria-label="Quick Add"
      >
        <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
          <Plus size={24} strokeWidth={2.5} />
        </motion.div>
      </motion.button>
    </div>
  );
};
