import React, { createContext, useContext, useEffect, useState } from 'react';

export type PerformanceMode = 'auto' | 'high' | 'battery-saver';

interface PerformanceContextType {
  mode: PerformanceMode;
  setMode: (mode: PerformanceMode) => void;
  isBatterySaverActive: boolean;
  isLowEndDevice: boolean;
  batteryLevel: number | null;
  isCharging: boolean | null;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<PerformanceMode>(() => {
    const saved = localStorage.getItem('financialfree_perf_mode');
    return (saved as PerformanceMode) || 'auto';
  });

  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean | null>(null);
  const [isLowEndDevice, setIsLowEndDevice] = useState<boolean>(false);
  const [isBatterySaverActive, setIsBatterySaverActive] = useState<boolean>(false);

  // Detect low-end hardware capabilities
  useEffect(() => {
    try {
      const concurrency = navigator.hardwareConcurrency || 4;
      const deviceMemory = (navigator as any).deviceMemory || 4;
      // If <= 4 cores or <= 4GB RAM, classify as power-sensitive / lower-tier mobile device
      const isLowTier = concurrency <= 4 || deviceMemory <= 3;
      setIsLowEndDevice(isLowTier);
    } catch {
      setIsLowEndDevice(false);
    }
  }, []);

  // Monitor Battery Status API (standard on Chrome, Android Chromium, Edge)
  useEffect(() => {
    let batteryInstance: any = null;

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        batteryInstance = battery;

        const updateBattery = () => {
          setBatteryLevel(battery.level);
          setIsCharging(battery.charging);
        };

        updateBattery();
        battery.addEventListener('chargingchange', updateBattery);
        battery.addEventListener('levelchange', updateBattery);
      }).catch(() => {
        // Battery API blocked or not supported
      });
    }

    return () => {
      if (batteryInstance) {
        try {
          batteryInstance.removeEventListener('chargingchange', () => {});
          batteryInstance.removeEventListener('levelchange', () => {});
        } catch {}
      }
    };
  }, []);

  // Compute whether battery-saver liquid glass mode should be active
  useEffect(() => {
    let shouldThrottle = false;

    if (mode === 'battery-saver') {
      shouldThrottle = true;
    } else if (mode === 'high') {
      shouldThrottle = false;
    } else {
      // Auto mode: Throttle if battery is below 25% and not charging, OR if low-end device
      const lowBattery = batteryLevel !== null && isCharging === false && batteryLevel <= 0.25;
      shouldThrottle = lowBattery || isLowEndDevice;
    }

    setIsBatterySaverActive(shouldThrottle);

    const root = document.documentElement;
    if (shouldThrottle) {
      root.classList.add('perf-battery-saver');
      // Set lighter backdrop-filter CSS variables for smooth 60/120fps scrolling on budget devices
      root.style.setProperty('--glass-blur-val', '4px');
      root.style.setProperty('--glass-saturate-val', '110%');
      root.style.setProperty('--glass-shadow-blur', '8px');
    } else {
      root.classList.remove('perf-battery-saver');
      root.style.setProperty('--glass-blur-val', '24px');
      root.style.setProperty('--glass-saturate-val', '180%');
      root.style.setProperty('--glass-shadow-blur', '20px');
    }
  }, [mode, batteryLevel, isCharging, isLowEndDevice]);

  const setMode = (newMode: PerformanceMode) => {
    setModeState(newMode);
    localStorage.setItem('financialfree_perf_mode', newMode);
  };

  return (
    <PerformanceContext.Provider
      value={{
        mode,
        setMode,
        isBatterySaverActive,
        isLowEndDevice,
        batteryLevel,
        isCharging
      }}
    >
      {children}
    </PerformanceContext.Provider>
  );
};

export const usePerformance = (): PerformanceContextType => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
};
