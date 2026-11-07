import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface RocketLaunchAnimationProps {
  isActive: boolean;
  onComplete?: () => void;
  speed?: 'normal' | 'fast';
}

export const RocketLaunchAnimation: React.FC<RocketLaunchAnimationProps> = ({
  isActive,
  onComplete,
  speed = 'normal'
}) => {
  const duration = speed === 'fast' ? 1.3 : 1.7;

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete, duration]);

  // Generate deterministic stars and sparks for warp-speed starfield
  const starfield = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: (i * 17) % 100, // distributed %
      delay: (i % 6) * 0.08,
      duration: 0.5 + (i % 4) * 0.15,
      size: (i % 3 === 0 ? 3 : 2),
      opacity: 0.3 + (i % 5) * 0.14
    }));
  }, []);

  const smokeClouds = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      xOffset: (i % 2 === 0 ? 1 : -1) * (18 + (i * 9)),
      delay: i * 0.04,
      scale: 0.8 + (i % 3) * 0.3
    }));
  }, []);

  const fireSparks = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      xDir: (i % 2 === 0 ? 1 : -1) * (i * 5 + 4),
      delay: (i % 5) * 0.06,
      size: (i % 3 === 0 ? 3.5 : 2.5)
    }));
  }, []);

  return (
    <AnimatePresence>
      {isActive && (
        <div className="fixed inset-0 z-[120] pointer-events-none flex items-center justify-center overflow-hidden select-none">
          {/* Atmospheric Flash & Vignette Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0.3, 0] }}
            transition={{ duration, ease: 'easeOut' }}
            className="absolute inset-0 bg-radial from-blue-600/35 via-slate-950/40 to-black/60 backdrop-blur-[3px]"
          />

          {/* Warp-Speed Starfield Streaming Downward */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {starfield.map((star) => (
              <motion.div
                key={star.id}
                initial={{ y: '-10vh', opacity: 0 }}
                animate={{
                  y: ['-10vh', '110vh'],
                  opacity: [0, star.opacity, star.opacity * 1.5, 0]
                }}
                transition={{
                  duration: star.duration,
                  repeat: Infinity,
                  delay: star.delay,
                  ease: 'linear'
                }}
                style={{ left: `${star.x}%`, width: `${star.size}px`, height: `${star.size * 5}px` }}
                className="absolute rounded-full bg-gradient-to-b from-transparent via-cyan-200 to-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              />
            ))}
          </div>

          {/* Primary Expansion Sonic Shockwave Ring */}
          <motion.div
            initial={{ scale: 0.1, opacity: 1, borderWidth: 3 }}
            animate={{
              scale: [0.1, 2.5, 4.5],
              opacity: [1, 0.6, 0],
              borderWidth: [3, 1.5, 0]
            }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute w-48 h-48 rounded-full border-cyan-400 shadow-[0_0_60px_rgba(56,189,248,0.7)]"
          />

          {/* Secondary Emerald Refraction Ring */}
          <motion.div
            initial={{ scale: 0.1, opacity: 0.8 }}
            animate={{
              scale: [0.1, 1.8, 3.2],
              opacity: [0.8, 0.4, 0]
            }}
            transition={{ duration: 0.9, delay: 0.1, ease: 'easeOut' }}
            className="absolute w-44 h-44 rounded-full border-2 border-emerald-400/70 shadow-[0_0_40px_rgba(16,185,129,0.5)]"
          />

          {/* Billowing Smoke Puffs at Launch Pad Base */}
          <div className="absolute bottom-1/3 flex justify-center items-center pointer-events-none">
            {smokeClouds.map((cloud) => (
              <motion.div
                key={cloud.id}
                initial={{ opacity: 0, scale: 0.2, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 0.7, 0],
                  scale: [0.2, cloud.scale * 1.8, cloud.scale * 2.4],
                  x: [0, cloud.xOffset * 1.8],
                  y: [0, 30]
                }}
                transition={{
                  duration: 0.85,
                  delay: cloud.delay,
                  ease: 'easeOut'
                }}
                className="absolute w-20 h-20 rounded-full bg-gradient-to-tr from-slate-200/40 via-white/50 to-cyan-300/20 blur-md shadow-inner"
              />
            ))}
          </div>

          {/* Main Rocket Vessel with Atmospheric Rumble & Blast Velocity */}
          <motion.div
            initial={{ y: 240, scale: 0.82, rotate: 0 }}
            animate={{
              y: [240, 220, 180, -750],
              scale: [0.82, 1.05, 1.15, 1.3],
              rotate: [0, -1, 1.5, -0.5, 0], // Aerodynamic vibration
              opacity: [0, 1, 1, 0]
            }}
            transition={{
              duration: duration - 0.2,
              times: [0, 0.15, 0.35, 1],
              ease: [0.22, 1, 0.36, 1]
            }}
            className="relative flex flex-col items-center"
          >
            {/* Advanced Specular Vector Rocket (100% Text-Free Razorpay-Grade Design) */}
            <div className="relative filter drop-shadow-[0_0_40px_rgba(59,130,246,0.85)]">
              <svg
                width="84"
                height="114"
                viewBox="0 0 84 114"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="transform"
              >
                {/* Left Aerodynamic Stabilizer Wing */}
                <path
                  d="M20 74L4 94C2.5 96.5 4.5 100 7.8 100H20V74Z"
                  fill="url(#wingGradLeft)"
                  filter="url(#glowFilter)"
                />
                {/* Left Fin Specular Rim */}
                <path
                  d="M20 76L6 94"
                  stroke="#93c5fd"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.8"
                />

                {/* Right Aerodynamic Stabilizer Wing */}
                <path
                  d="M64 74L80 94C81.5 96.5 79.5 100 76.2 100H64V74Z"
                  fill="url(#wingGradRight)"
                  filter="url(#glowFilter)"
                />
                {/* Right Fin Specular Rim */}
                <path
                  d="M64 76L78 94"
                  stroke="#93c5fd"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.8"
                />

                {/* Center Rocket Fuselage / Nosecone */}
                <path
                  d="M42 2C42 2 20 28 20 76C20 86 28 92 42 92C56 92 64 86 64 76C64 28 42 2 42 2Z"
                  fill="url(#fuselageGrad)"
                />

                {/* Longitudinal Specular Body Highlight */}
                <path
                  d="M38 8C38 8 26 30 26 72"
                  stroke="url(#specularGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.75"
                />

                {/* Red Rocket Nosecone Tip Accent */}
                <path
                  d="M42 2C42 2 35 12 33 18C39 19 45 19 51 18C49 12 42 2 42 2Z"
                  fill="url(#noseconeAccent)"
                />

                {/* Sapphire Cockpit Viewport (Outer Bezel) */}
                <circle cx="42" cy="44" r="10.5" fill="#090d16" stroke="#38bdf8" strokeWidth="2.5" />
                {/* Viewport Core Lens */}
                <circle cx="42" cy="44" r="6.5" fill="url(#lensGrad)" />
                {/* Viewport Specular Glint */}
                <circle cx="39.5" cy="41.5" r="2.2" fill="#ffffff" opacity="0.95" />
                <circle cx="44" cy="46" r="1" fill="#ffffff" opacity="0.6" />

                {/* Heavy Titanium Exhaust Nozzle */}
                <path
                  d="M33 92L30 102H54L51 92H33Z"
                  fill="url(#nozzleGrad)"
                  stroke="#1e293b"
                  strokeWidth="1"
                />
                <ellipse cx="42" cy="102" rx="12" ry="2.5" fill="#f97316" opacity="0.8" />

                {/* SVG Definitions */}
                <defs>
                  <linearGradient id="fuselageGrad" x1="20" y1="2" x2="64" y2="92" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ffffff" />
                    <stop offset="0.3" stopColor="#f8fafc" />
                    <stop offset="0.7" stopColor="#e2e8f0" />
                    <stop offset="1" stopColor="#94a3b8" />
                  </linearGradient>

                  <linearGradient id="specularGrad" x1="38" y1="8" x2="26" y2="72" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ffffff" stopOpacity="0.9" />
                    <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
                  </linearGradient>

                  <linearGradient id="noseconeAccent" x1="33" y1="2" x2="51" y2="18" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ef4444" />
                    <stop offset="1" stopColor="#b91c1c" />
                  </linearGradient>

                  <linearGradient id="wingGradLeft" x1="4" y1="74" x2="20" y2="100" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3b82f6" />
                    <stop offset="0.5" stopColor="#2563eb" />
                    <stop offset="1" stopColor="#1d4ed8" />
                  </linearGradient>

                  <linearGradient id="wingGradRight" x1="80" y1="74" x2="64" y2="100" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3b82f6" />
                    <stop offset="0.5" stopColor="#2563eb" />
                    <stop offset="1" stopColor="#1d4ed8" />
                  </linearGradient>

                  <linearGradient id="lensGrad" x1="35.5" y1="37.5" x2="48.5" y2="50.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#38bdf8" />
                    <stop offset="0.7" stopColor="#0284c7" />
                    <stop offset="1" stopColor="#0369a1" />
                  </linearGradient>

                  <linearGradient id="nozzleGrad" x1="30" y1="92" x2="54" y2="102" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#475569" />
                    <stop offset="0.5" stopColor="#334155" />
                    <stop offset="1" stopColor="#1e293b" />
                  </linearGradient>

                  <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#3b82f6" floodOpacity="0.5" />
                  </filter>
                </defs>
              </svg>
            </div>

            {/* High-Energy Multi-Layer Plasma Thrust Jet */}
            <div className="relative flex flex-col items-center -mt-2">
              {/* Outer Hyper-Corona Glow */}
              <motion.div
                initial={{ scaleY: 0.5, opacity: 0.8 }}
                animate={{
                  scaleY: [0.8, 1.8, 1.2, 2.1, 1.5],
                  scaleX: [0.9, 1.25, 0.95, 1.35, 1.05],
                  opacity: [0.85, 1, 0.9, 1, 0.85]
                }}
                transition={{
                  duration: 0.28,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="w-10 h-28 origin-top rounded-b-full bg-gradient-to-b from-amber-400 via-orange-500 to-transparent blur-[1.5px] shadow-[0_20px_50px_rgba(249,115,22,0.9)]"
              />

              {/* Shock Diamonds Throat / Violet Corona */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0.9 }}
                animate={{
                  scale: [0.8, 1.2, 0.9, 1.3, 0.95],
                  opacity: [0.9, 1, 0.8, 1, 0.9]
                }}
                transition={{ duration: 0.2, repeat: Infinity }}
                className="absolute top-0 w-6 h-10 rounded-full bg-gradient-to-b from-indigo-500 via-cyan-400 to-transparent blur-[1px]"
              />

              {/* Inner White-Hot Plasma Core */}
              <motion.div
                initial={{ scaleY: 0.6 }}
                animate={{
                  scaleY: [0.7, 1.4, 0.9, 1.6, 1.1],
                  scaleX: [0.8, 1.1, 0.9, 1.15, 0.85]
                }}
                transition={{
                  duration: 0.22,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="absolute top-0 w-4 h-16 origin-top rounded-b-full bg-gradient-to-b from-white via-cyan-100 to-transparent shadow-[0_0_15px_#ffffff]"
              />
            </div>

            {/* Trailing Fire Spark Particles with High Velocity */}
            <div className="absolute top-28 flex justify-center pointer-events-none">
              {fireSparks.map((spark) => (
                <motion.div
                  key={spark.id}
                  initial={{ y: 0, x: 0, opacity: 1, scale: 1 }}
                  animate={{
                    y: [0, 45 + (spark.id * 18)],
                    x: [0, spark.xDir * (1 + (spark.id % 2) * 0.4)],
                    opacity: [1, 0.85, 0],
                    scale: [1, 0.45, 0]
                  }}
                  transition={{
                    duration: 0.45 + (spark.id % 4) * 0.08,
                    repeat: Infinity,
                    delay: spark.delay,
                    ease: 'easeOut'
                  }}
                  style={{ width: `${spark.size}px`, height: `${spark.size}px` }}
                  className="rounded-full bg-gradient-to-tr from-amber-400 via-yellow-200 to-white blur-[0.4px] shadow-[0_0_6px_rgba(250,204,21,0.9)] absolute"
                />
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
