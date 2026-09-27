import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isTablet: boolean;
  install: () => Promise<boolean>;
  showInstallGuide: boolean;
  setShowInstallGuide: (show: boolean) => void;
}

export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    // 1. Detect Standalone mode (already installed & running as PWA)
    const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const isAppRunningInstalled = isStandaloneMedia || isIOSStandalone;
    setIsInstalled(isAppRunningInstalled);

    // 2. Detect iOS / iPadOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIPad = /ipad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isIPhone = /iphone|ipod/.test(ua);
    setIsIOS(isIPad || isIPhone);

    // 3. Detect Android
    const isAndroidDevice = /android/.test(ua);
    setIsAndroid(isAndroidDevice);

    // 4. Detect Tablet form factor (screen width between 600px and 1200px and touch-capable)
    const isTabletDevice = isIPad || (navigator.maxTouchPoints > 0 && window.innerWidth >= 600 && window.innerWidth <= 1280);
    setIsTablet(isTabletDevice);

    // 5. Listen for Chromium/Android install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          return true;
        }
      } catch (err) {
        console.warn('Install prompt failed:', err);
      }
      return false;
    }

    // If no direct prompt (e.g. iOS or browser doesn't support direct trigger), open guided instructions
    setShowInstallGuide(true);
    return false;
  };

  return {
    isInstallable: !!deferredPrompt || isIOS,
    isInstalled,
    isIOS,
    isAndroid,
    isTablet,
    install,
    showInstallGuide,
    setShowInstallGuide,
  };
}
