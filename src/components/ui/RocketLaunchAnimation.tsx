import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface RocketLaunchAnimationProps {
  isActive: boolean;
  onComplete?: () => void;
}

export const RocketLaunchAnimation: React.FC<RocketLaunchAnimationProps> = ({
  isActive,
  onComplete
}) => {
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  return (
    <AnimatePresence>
      {isActive && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center overflow-hidden">
          {/* Ambient flash backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.45, 0] }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute inset-0 bg-radial from-blue-500/25 via-emerald-500/10 to-transparent backdrop-blur-[2px]"
          />

          {/* Launch Pad Shockwave Ring */}
          <motion.div
            initial={{ scale: 0.2, opacity: 0.9 }}
            animate={{ scale: [0.2, 2.2, 3.5], opacity: [0.9, 0.4, 0] }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="absolute w-44 h-44 rounded-full border-2 border-emerald-400/80 shadow-[0_0_50px_rgba(16,185,129,0.5)]"
          />

          {/* Rocket Vessel Container */}
          <motion.div
            initial={{ y: 220, scale: 0.85, opacity: 0 }}
            animate={{
              y: [220, 200, -600],
              scale: [0.85, 1.15, 1.25],
              opacity: [0, 1, 1, 0]
            }}
            transition={{
              duration: 1.3,
              times: [0, 0.25, 1],
              ease: [0.22, 1, 0.36, 1]
            }}
            className="relative flex flex-col items-center"
          >
            {/* Aerodynamic Modern Rocket SVG (Zero text, pure Razorpay style motion) */}
            <div className="relative drop-shadow-[0_0_35px_rgba(59,130,246,0.65)] filter">
              <svg
                width="76"
                height="100"
                viewBox="0 0 76 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="transform -rotate-0"
              >
                {/* Left Fin */}
                <path
                  d="M18 64L4 82C3 84 5 87 8 87H18V64Z"
                  fill="url(#finGradLeft)"
                />
                {/* Right Fin */}
                <path
                  d="M58 64L72 82C73 84 71 87 68 87H58V64Z"
                  fill="url(#finGradRight)"
                />
                {/* Main Fuselage Body */}
                <path
                  d="M38 2C38 2 18 24 18 66C18 74 24 80 38 80C52 80 58 74 58 66C58 24 38 2 38 2Z"
                  fill="url(#rocketBody)"
                />
                {/* Center Porthole / Viewport */}
                <circle cx="38" cy="38" r="9" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
                <circle cx="38" cy="38" r="5.5" fill="#38bdf8" opacity="0.8" />
                <circle cx="36" cy="36" r="2" fill="#ffffff" opacity="0.9" />

                {/* Booster Engine Nozzle */}
                <path
                  d="M30 80L28 88H48L46 80H30Z"
                  fill="#334155"
                />

                {/* Gradients */}
                <defs>
                  <linearGradient id="rocketBody" x1="18" y1="2" x2="58" y2="80" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ffffff" />
                    <stop offset="0.5" stopColor="#f1f5f9" />
                    <stop offset="1" stopColor="#cbd5e1" />
                  </linearGradient>
                  <linearGradient id="finGradLeft" x1="4" y1="64" x2="18" y2="87" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3b82f6" />
                    <stop offset="1" stopColor="#1d4ed8" />
                  </linearGradient>
                  <linearGradient id="finGradRight" x1="72" y1="64" x2="58" y2="87" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3b82f6" />
                    <stop offset="1" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Powerful Rocket Flame Jet */}
            <motion.div
              initial={{ scaleY: 0.4, opacity: 0.6 }}
              animate={{
                scaleY: [0.6, 1.4, 0.9, 1.6, 1.2],
                scaleX: [0.8, 1.1, 0.9, 1.2, 0.8],
                opacity: [0.7, 1, 0.85, 1, 0.9]
              }}
              transition={{
                duration: 0.35,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="w-8 h-20 origin-top rounded-b-full bg-gradient-to-b from-amber-300 via-orange-500 to-transparent blur-[1px] shadow-[0_15px_35px_rgba(249,115,22,0.8)] -mt-2"
            >
              {/* Inner White-Hot Core */}
              <div className="w-4 h-12 mx-auto rounded-b-full bg-gradient-to-b from-white via-cyan-200 to-transparent" />
            </motion.div>

            {/* Trailing Fire Spark Particles */}
            <div className="absolute top-24 flex justify-center">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 0, x: 0, opacity: 1, scale: 1 }}
                  animate={{
                    y: [0, 40 + i * 25],
                    x: [(i % 2 === 0 ? 1 : -1) * (i * 6), (i % 2 === 0 ? 1 : -1) * (i * 14 + 10)],
                    opacity: [1, 0.8, 0],
                    scale: [1, 0.4, 0]
                  }}
                  transition={{
                    duration: 0.5 + i * 0.08,
                    repeat: Infinity,
                    delay: i * 0.04
                  }}
                  className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 blur-[0.5px] shadow-sm absolute"
                />
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
