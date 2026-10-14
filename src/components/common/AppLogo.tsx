import React from 'react';
import { motion } from 'motion/react';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  animate?: boolean;
  showText?: boolean;
}

const sizeMap = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
  '2xl': 'w-28 h-28'
};

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  className = '',
  animate = false,
  showText = false
}) => {
  const content = (
    <div className={`relative inline-flex items-center gap-3 ${className}`}>
      <div className={`relative flex-shrink-0 ${sizeMap[size]}`}>
        <svg
          viewBox="0 0 500 500"
          className="w-full h-full drop-shadow-md select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="greenBgGrad" cx="45%" cy="38%" r="65%">
              <stop offset="0%" stopColor="#5d9832" />
              <stop offset="65%" stopColor="#487a26" />
              <stop offset="100%" stopColor="#355e1b" />
            </radialGradient>
            <linearGradient id="billGradGreen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2c5515" />
              <stop offset="100%" stopColor="#1a3809" />
            </linearGradient>
            <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#274b12" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Main Circular Green Shield */}
          <circle cx="250" cy="250" r="230" fill="url(#greenBgGrad)" filter="url(#logoGlow)" />

          {/* Top Crescent Arc */}
          <path
            d="M 115 195 C 160 85, 340 85, 385 195 C 348 115, 152 115, 115 195 Z"
            fill="#ffffff"
            opacity="0.95"
          />

          {/* Fan of Banknotes with Dollar Sign */}
          <g transform="translate(10, -5)">
            {/* Back Bill */}
            <path
              d="M 215 160 L 262 128 L 292 152 L 245 184 Z"
              fill="url(#billGradGreen)"
              stroke="#ffffff"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            {/* Middle Bill */}
            <path
              d="M 226 150 L 288 135 L 308 206 L 246 221 Z"
              fill="url(#billGradGreen)"
              stroke="#ffffff"
              strokeWidth="5.5"
              strokeLinejoin="round"
            />
            {/* Front Bill */}
            <path
              d="M 240 156 L 304 162 L 301 238 L 237 232 Z"
              fill="#2e5a16"
              stroke="#ffffff"
              strokeWidth="6"
              strokeLinejoin="round"
            />
            <text
              x="270"
              y="212"
              fill="#ffffff"
              fontSize="36"
              fontWeight="900"
              fontFamily="Arial, sans-serif"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              $
            </text>
          </g>

          {/* Stylized White Hand Cupped Upward */}
          {/* Wrist / Arm base */}
          <rect x="154" y="222" width="14" height="66" rx="4" fill="#ffffff" />
          {/* Palm and fingers cradling money */}
          <path
            d="M 172 250 C 172 233, 236 216, 262 227 C 298 243, 338 251, 362 253 C 378 255, 388 266, 374 280 C 344 308, 272 302, 240 277 C 206 274, 186 277, 172 286 Z"
            fill="#ffffff"
          />

          {/* Bold Centered Brand Name: FINANCE */}
          <text
            x="250"
            y="368"
            fill="#ffffff"
            fontSize="52"
            fontWeight="900"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="5"
            textAnchor="middle"
          >
            FINANCE
          </text>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            FinancialFree
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
            Lending & Return Tracker
          </span>
        </div>
      )}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        whileHover={{ scale: 1.05, rotate: 1 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
};
