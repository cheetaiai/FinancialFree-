import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone,
  Tablet,
  Monitor,
  Wifi,
  Battery,
  Signal,
  RotateCcw,
  Sparkles,
  Home,
  Check
} from 'lucide-react';

export type DeviceMode = 'responsive' | 'iphone' | 'android' | 'tablet';

interface DeviceFrameSimulatorProps {
  deviceMode: DeviceMode;
  onChangeDeviceMode: (mode: DeviceMode) => void;
  children: React.ReactNode;
}

export const DeviceFrameSimulator: React.FC<DeviceFrameSimulatorProps> = ({
  deviceMode,
  onChangeDeviceMode,
  children
}) => {
  const [showHomeScreenPreview, setShowHomeScreenPreview] = useState(false);
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const [isMobileScreen, setIsMobileScreen] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  });

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // On real mobile screens or responsive mode, display the native UI without hardware bezels
  if (deviceMode === 'responsive' || isMobileScreen) {
    return <>{children}</>;
  }

  // Dimension presets
  const frameStyles: Record<Exclude<DeviceMode, 'responsive'>, { width: string; height: string; radius: string; label: string; platform: string }> = {
    iphone: {
      width: '400px',
      height: '844px',
      radius: '52px',
      label: 'iPhone 16 Pro',
      platform: 'iOS 18'
    },
    android: {
      width: '412px',
      height: '860px',
      radius: '40px',
      label: 'Android Pixel 9 Pro',
      platform: 'Android 15'
    },
    tablet: {
      width: '780px',
      height: '880px',
      radius: '36px',
      label: 'iPad / Android Tablet',
      platform: 'Tablet OS'
    }
  };

  const currentFrame = frameStyles[deviceMode];

  return (
    <div className="min-h-screen bg-slate-950/95 py-4 px-2 sm:px-4 flex flex-col items-center justify-center overflow-x-hidden">
      {/* Top Device Simulator Controller Bar */}
      <div className="w-full max-w-2xl mb-4 px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-white/15 backdrop-blur-xl shadow-xl flex items-center justify-between flex-wrap gap-2 text-white text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-slate-200">Device Simulator:</span>
          <span className="px-2 py-0.5 rounded-lg bg-white/10 text-emerald-300 font-semibold font-mono text-[11px]">
            {currentFrame.label} ({currentFrame.platform})
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setShowHomeScreenPreview(!showHomeScreenPreview)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
              showHomeScreenPreview
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white/10 hover:bg-white/20 text-slate-300'
            }`}
            title="Toggle simulated mobile launcher screen to test icon and tap to open"
          >
            <Home size={13} />
            <span>{showHomeScreenPreview ? 'Exit Launcher' : 'View App Icon on Phone'}</span>
          </button>

          <button
            onClick={() => onChangeDeviceMode('iphone')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              deviceMode === 'iphone'
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 hover:bg-white/20 text-slate-300'
            }`}
          >
            <Smartphone size={13} />
            <span>iPhone</span>
          </button>

          <button
            onClick={() => onChangeDeviceMode('android')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              deviceMode === 'android'
                ? 'bg-emerald-600 text-white'
                : 'bg-white/10 hover:bg-white/20 text-slate-300'
            }`}
          >
            <Smartphone size={13} />
            <span>Android</span>
          </button>

          <button
            onClick={() => onChangeDeviceMode('tablet')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              deviceMode === 'tablet'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 hover:bg-white/20 text-slate-300'
            }`}
          >
            <Tablet size={13} />
            <span>Tablet</span>
          </button>

          <button
            onClick={() => onChangeDeviceMode('responsive')}
            className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-slate-300 flex items-center gap-1 transition-all cursor-pointer"
            title="Switch back to full-width responsive mode"
          >
            <Monitor size={13} />
            <span>Desktop</span>
          </button>
        </div>
      </div>

      {/* Realistic Hardware Outer Frame */}
      <div
        className="relative bg-slate-900 border-[10px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] shadow-black/80 flex flex-col overflow-hidden transition-all duration-300"
        style={{
          width: currentFrame.width,
          maxWidth: '100%',
          height: currentFrame.height,
          borderRadius: currentFrame.radius,
          boxShadow: '0 0 0 2px rgba(255,255,255,0.15), 0 30px 80px rgba(0,0,0,0.9)'
        }}
      >
        {/* Hardware Elements: iPhone Dynamic Island / Android Punch Hole */}
        {deviceMode === 'iphone' && (
          <div className="absolute top-2.5 inset-x-0 z-50 flex justify-center pointer-events-none">
            <div className="h-7 w-28 bg-black rounded-full flex items-center justify-between px-2.5 shadow-md border border-white/5">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700/50" />
              <div className="w-2 h-2 rounded-full bg-blue-950 border border-blue-800/40" />
            </div>
          </div>
        )}

        {deviceMode === 'android' && (
          <div className="absolute top-3 inset-x-0 z-50 flex justify-center pointer-events-none">
            <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-800 shadow-inner" />
          </div>
        )}

        {/* Mobile Status Bar (Realistic Time, Wi-Fi, Battery) */}
        <div className="h-10 bg-slate-900/90 text-slate-300 px-7 flex items-center justify-between text-[11px] font-semibold z-40 select-none border-b border-white/5 flex-shrink-0">
          <span className="tracking-tight">{currentTime}</span>
          <div className="flex items-center gap-1.5">
            <Signal size={12} />
            <Wifi size={12} />
            <Battery size={14} className="text-emerald-400" />
          </div>
        </div>

        {/* Inner Screen Area */}
        <div className="relative flex-1 overflow-y-auto bg-slate-950 overflow-x-hidden">
          {showHomeScreenPreview ? (
            /* Simulated Mobile Home Screen with App Icon */
            <div className="h-full min-h-[600px] p-6 flex flex-col justify-between bg-gradient-to-b from-indigo-950/70 via-slate-900 to-black text-white">
              {/* Home Screen Widgets */}
              <div className="pt-6 space-y-4 text-center">
                <div className="text-4xl font-light tracking-tight">{currentTime}</div>
                <div className="text-xs text-slate-400 font-medium">
                  {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </div>

                <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-left max-w-xs mx-auto">
                  <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">FinancialFree Active</div>
                  <div className="text-xs text-slate-200 mt-0.5">PWA Ready for 1-Tap Offline Launch</div>
                </div>
              </div>

              {/* Launcher App Grid */}
              <div className="grid grid-cols-4 gap-4 py-8 max-w-xs mx-auto">
                {/* 1. Our FinancialFree App Icon */}
                <button
                  onClick={() => setShowHomeScreenPreview(false)}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="relative">
                    <img
                      src={deviceMode === 'iphone' ? '/apple-touch-icon.png' : '/pwa-maskable-512x512.png'}
                      alt="FinancialFree"
                      className={`w-14 h-14 shadow-2xl transition-transform group-hover:scale-105 group-active:scale-95 ${
                        deviceMode === 'iphone' ? 'rounded-[22%]' : 'rounded-full border-2 border-emerald-500/40 p-0.5 bg-slate-900'
                      }`}
                    />
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border border-white text-[9px] font-black flex items-center justify-center text-white">
                      1
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-200 mt-1.5 truncate max-w-[60px] drop-shadow">
                    FinancialFree
                  </span>
                </button>

                {/* Generic System Icons */}
                <div className="flex flex-col items-center opacity-60">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-white/10 flex items-center justify-center text-lg">
                    📱
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1.5">Phone</span>
                </div>

                <div className="flex flex-col items-center opacity-60">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-white/10 flex items-center justify-center text-lg">
                    💬
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1.5">Messages</span>
                </div>

                <div className="flex flex-col items-center opacity-60">
                  <div className="w-14 h-14 rounded-2xl bg-slate-500/20 border border-white/10 flex items-center justify-center text-lg">
                    ⚙️
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1.5">Settings</span>
                </div>
              </div>

              {/* Tap to open banner */}
              <div className="text-center pb-4">
                <button
                  onClick={() => setShowHomeScreenPreview(false)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/30 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Sparkles size={14} />
                  <span>Tap FinancialFree Icon to Launch App</span>
                </button>
              </div>
            </div>
          ) : (
            /* Actual App Content Running in Device */
            <div className="h-full">{children}</div>
          )}
        </div>

        {/* Hardware Bottom Home Indicator */}
        {deviceMode === 'iphone' ? (
          <div className="h-5 bg-slate-900 flex items-center justify-center flex-shrink-0">
            <div className="w-32 h-1 bg-white/40 rounded-full" />
          </div>
        ) : (
          <div className="h-4 bg-slate-900 flex items-center justify-center flex-shrink-0">
            <div className="w-20 h-1 bg-white/30 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};
