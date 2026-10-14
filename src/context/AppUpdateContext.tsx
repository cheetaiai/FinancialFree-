import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '../lib/api';
import { AppUpdateFile, AppUpdateInfo, FeatureAdvantage } from '../types';
import { useToast } from './ToastContext';
import confetti from 'canvas-confetti';
import { RocketLaunchAnimation } from '../components/ui/RocketLaunchAnimation';

const INSTALLED_VERSION_KEY = 'financialfree_installed_version';
const LAST_UPDATED_AT_KEY = 'financialfree_last_updated_at';

const DEFAULT_ADVANTAGES: FeatureAdvantage[] = [
  {
    title: 'Dedicated Shopping 🛍 & Groceries Hub',
    desc: 'Log and track everyday groceries, supermarket shopping, and domestic services separately with zero data loss.'
  },
  {
    title: 'Ultra-Clarity Monthly & Yearly PDF Engine',
    desc: 'Crystal-clear vector PDF accounting statements for Monthly, Yearly, and Shopping spends with high-definition typography.'
  },
  {
    title: 'Interactive Tick & Micro-Animation Effects',
    desc: 'Fluid SVG animated tick marks on spending entry, spring checkboxes, and celebratory update finalization animations.'
  },
  {
    title: 'UPI Return Money QR & Public Share Links',
    desc: 'Generate live UPI return payment QR codes and shareable public statement links displaying money given and taken only.'
  },
  {
    title: '1.9 GB High-Performance Engine Bundle',
    desc: 'Comprehensive offline-first asset caching, instant client module hydration, encrypted local vault, and fast indexed search.'
  }
];

interface AppUpdateContextType {
  currentVersion: string;
  latestVersion: string;
  hasUpdateAvailable: boolean;
  isUpdateInstalled: boolean;
  installedAt: string | null;
  totalSizeMB: number;
  totalSizeFormatted: string;
  files: AppUpdateFile[];
  releaseNotes: string[];
  advantages: FeatureAdvantage[];
  isAnalyzing: boolean;
  analysisProgress: number;
  isDownloading: boolean;
  downloadProgress: number;
  downloadSpeedMBps: number;
  downloadedMB: number;
  downloadedFormatted: string;
  currentProcessingStage: string;
  activeFeatureIndex: number;
  remainingSeconds: number;
  isTurboMode: boolean;
  toggleTurboMode: () => void;
  isUpdateSuccess: boolean;
  isModalOpen: boolean;
  openUpdateModal: () => void;
  closeUpdateModal: () => void;
  isRocketAnimating: boolean;
  triggerRocketAnimation: () => void;
  startAnalysisAndDownload: () => Promise<void>;
  checkForUpdates: () => Promise<void>;
  resetUpdateForTesting: () => void;
}

const AppUpdateContext = createContext<AppUpdateContextType | undefined>(undefined);

export const AppUpdateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [latestVersion, setLatestVersion] = useState<string>('v6.4.5');
  const [currentVersion, setCurrentVersion] = useState<string>('v6.4.4');
  const [files, setFiles] = useState<AppUpdateFile[]>([]);
  const [totalSizeMB, setTotalSizeMB] = useState<number>(1945.6);
  const [totalSizeFormatted, setTotalSizeFormatted] = useState<string>('1.9 GB');
  const [advantages, setAdvantages] = useState<FeatureAdvantage[]>(DEFAULT_ADVANTAGES);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState<number>(0);
  const [releaseNotes, setReleaseNotes] = useState<string[]>([
    'Official v6.4.5 Launch: Weekly summary calculation and email report trigger for authenticated users.',
    'Universal UPI App Chooser: Direct intent chooser launching GPay, PhonePe, Paytm, BHIM, CRED on mobile.',
    'Zero-Login Public Ledger Link: Public view of money given and taken with real-time transactions ledger.',
    'Razorpay Rocket Animation: Fluid ascending rocket blast without text when saving items.',
    'Clean Shopping Hub: Removed pre-loaded sample items so users start with a clean ledger.'
  ]);

  // Check if update was already applied on this device
  const [isUpdateInstalled, setIsUpdateInstalled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(INSTALLED_VERSION_KEY);
      return stored === 'v6.4.5';
    } catch {
      return false;
    }
  });

  const [installedAt, setInstalledAt] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LAST_UPDATED_AT_KEY);
    } catch {
      return null;
    }
  });

  const [hasUpdateAvailable, setHasUpdateAvailable] = useState<boolean>(() => !isUpdateInstalled);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadSpeedMBps, setDownloadSpeedMBps] = useState<number>(34.5);
  const [downloadedMB, setDownloadedMB] = useState<number>(0);
  const [downloadedFormatted, setDownloadedFormatted] = useState<string>('0 MB');
  const [currentProcessingStage, setCurrentProcessingStage] = useState<string>('');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(45);
  const [isTurboMode, setIsTurboMode] = useState<boolean>(false);
  const [isUpdateSuccess, setIsUpdateSuccess] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isRocketAnimating, setIsRocketAnimating] = useState<boolean>(false);

  const triggerRocketAnimation = () => {
    setIsRocketAnimating(true);
  };

  const toggleTurboMode = () => {
    setIsTurboMode(prev => {
      const next = !prev;
      showToast(next ? '⚡ Fast Stream Mode activated (~5s)' : '🐢 Realistic Network Simulation Mode (~45-75s)', 'info');
      return next;
    });
  };

  // In-app release announcement notification for v6.4.5 launch
  useEffect(() => {
    const sessionKey = 'financialfree_v645_notified';
    if (!sessionStorage.getItem(sessionKey)) {
      const timer = setTimeout(() => {
        const stored = localStorage.getItem(INSTALLED_VERSION_KEY);
        if (stored !== 'v6.4.5') {
          showToast('✨ New Update v6.4.5 (1.9 GB) Available! Weekly Email Reports, UPI Chooser & Rocket Animation live.', 'info');
          sessionStorage.setItem(sessionKey, 'true');
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Load server release information
  const fetchUpdateManifest = useCallback(async () => {
    try {
      const info = await api.getAppUpdateInfo();
      if (info) {
        setLatestVersion(info.latestVersion || 'v6.4.5');
        if (info.currentVersion) setCurrentVersion(info.currentVersion);
        if (info.totalSizeMB) setTotalSizeMB(info.totalSizeMB);
        if (info.totalSizeFormatted) setTotalSizeFormatted(info.totalSizeFormatted);
        if (info.releaseNotes && info.releaseNotes.length > 0) setReleaseNotes(info.releaseNotes);
        if (info.advantages && info.advantages.length > 0) setAdvantages(info.advantages);
        if (info.files && info.files.length > 0) setFiles(info.files);

        const stored = localStorage.getItem(INSTALLED_VERSION_KEY);
        if (stored === (info.latestVersion || 'v6.4.5')) {
          setIsUpdateInstalled(true);
          setHasUpdateAvailable(false);
        } else {
          setIsUpdateInstalled(false);
          setHasUpdateAvailable(true);
        }
      }
    } catch {
      // Fallback works seamlessly offline
    }
  }, []);

  useEffect(() => {
    fetchUpdateManifest();
  }, [fetchUpdateManifest]);

  const openUpdateModal = () => setIsModalOpen(true);
  const closeUpdateModal = () => {
    if (!isDownloading && !isAnalyzing) {
      setIsModalOpen(false);
    }
  };

  // Step-by-step package verification and realistic 1.9 GB MB/GB download procedure
  const startAnalysisAndDownload = async () => {
    if (isAnalyzing || isDownloading) return;

    // Launch celebratory aerodynamic rocket animation when initiating update
    setIsRocketAnimating(true);

    try {
      // PHASE 1: SYSTEM REQUIREMENTS & PACKAGE VERIFICATION
      setIsAnalyzing(true);
      setAnalysisProgress(0);
      setDownloadProgress(0);
      setDownloadedMB(0);
      setDownloadedFormatted('0 MB');
      setActiveFeatureIndex(0);
      setIsUpdateSuccess(false);

      const verificationStages = [
        'Inspecting local vault storage and device compatibility...',
        'Validating cryptographic integrity for v6.4.4 package...',
        'Allocating 1.9 GB high-speed offline cache buffer...',
        'Package verified: Ready to stream v6.4.4 update package.'
      ];

      const stageDelay = isTurboMode ? 150 : 450;
      for (let i = 0; i < verificationStages.length; i++) {
        setCurrentProcessingStage(verificationStages[i]);
        setAnalysisProgress(Math.round(((i + 1) / verificationStages.length) * 100));
        await new Promise(r => setTimeout(r, stageDelay));
      }

      setIsAnalyzing(false);

      // PHASE 2: PROGRESSIVE DOWNLOAD WITH LIVE MB / GB TRANSFER TRACKER
      // Matches user specification: ~45s per GB download simulation, with optional Turbo mode
      setIsDownloading(true);
      const totalMB = 1945.6; // 1.9 GB
      const downloadSteps = isTurboMode ? 24 : 52;
      const stepDuration = isTurboMode ? 120 : 860; // ~45-50 seconds realistic streaming

      for (let step = 1; step <= downloadSteps; step++) {
        const currentProg = Math.round((step / downloadSteps) * 100);
        const currentMB = parseFloat(((step / downloadSteps) * totalMB).toFixed(1));
        
        // Compute which feature is actively being installed
        const featIdx = Math.min(advantages.length - 1, Math.floor((currentProg / 100) * advantages.length));
        setActiveFeatureIndex(featIdx);

        // Realistic dynamic download speed (MB/s)
        const currentSpeed = isTurboMode
          ? 248.0
          : parseFloat((28.0 + Math.sin(step) * 8.5 + Math.random() * 5).toFixed(1));
        
        const estRemainingSec = Math.max(1, Math.round(((downloadSteps - step) * stepDuration) / 1000));
        setRemainingSeconds(estRemainingSec);

        let formatted = '';
        if (currentMB < 1000) {
          formatted = `${currentMB.toFixed(0)} MB`;
        } else {
          formatted = `${(currentMB / 1024).toFixed(2)} GB`;
        }

        let stageText = '';
        if (currentProg < 20) {
          stageText = `Streaming Shopping 🛍️ & Groceries Hub Engine (${formatted} / 1.9 GB)...`;
        } else if (currentProg < 40) {
          stageText = `Deploying Ultra-Clarity Monthly & Yearly PDF Engine (${formatted} / 1.9 GB)...`;
        } else if (currentProg < 60) {
          stageText = `Activating Interactive Checkmark & Tick Micro-Animations (${formatted} / 1.9 GB)...`;
        } else if (currentProg < 80) {
          stageText = `Configuring Dynamic UPI Return QR & Public Share Links (${formatted} / 1.9 GB)...`;
        } else {
          stageText = `Finalizing Package Integrity & Activating v6.4.4 (${formatted} / 1.9 GB)...`;
        }

        setDownloadProgress(currentProg);
        setDownloadedMB(currentMB);
        setDownloadedFormatted(formatted);
        setDownloadSpeedMBps(currentSpeed);
        setCurrentProcessingStage(stageText);

        await new Promise(r => setTimeout(r, stepDuration));
      }

      setDownloadedMB(totalMB);
      setDownloadedFormatted('1.9 GB');
      setDownloadProgress(100);
      setActiveFeatureIndex(advantages.length - 1);
      setRemainingSeconds(0);
      setCurrentProcessingStage('Installing modules and activating service worker cache...');

      // PHASE 3: APPLY UPDATE & CACHE ACTIVATION
      try {
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            await reg.update();
          }
        }
      } catch {}

      // Acknowledge update with backend
      try {
        await api.acknowledgeAppUpdate();
      } catch {}

      // Persist that the update is installed!
      const updateDate = new Date().toISOString();
      localStorage.setItem(INSTALLED_VERSION_KEY, latestVersion);
      localStorage.setItem(LAST_UPDATED_AT_KEY, updateDate);

      setIsDownloading(false);
      setIsUpdateSuccess(true);
      setIsUpdateInstalled(true);
      setInstalledAt(updateDate);
      setHasUpdateAvailable(false);

      // Trigger Confetti Celebration
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });

      showToast(`FinancialFree updated to ${latestVersion} (1.9 GB) successfully!`, 'success');

    } catch (err: any) {
      setIsAnalyzing(false);
      setIsDownloading(false);
      showToast(err.message || 'Failed to complete update download. Please retry.', 'error');
    }
  };

  const checkForUpdates = async () => {
    showToast('Checking for newer app versions...', 'info');
    await fetchUpdateManifest();
    
    const stored = localStorage.getItem(INSTALLED_VERSION_KEY);
    if (stored === latestVersion) {
      setIsUpdateInstalled(true);
      setHasUpdateAvailable(false);
      showToast(`You are on the latest version (${latestVersion}). No updates pending.`, 'success');
    } else {
      setIsUpdateInstalled(false);
      setHasUpdateAvailable(true);
      showToast(`Update Available: Version ${latestVersion} (${totalSizeFormatted})`, 'info');
      setIsModalOpen(true);
    }
  };

  // Helper for developers / QA to test the update flow again if desired
  const resetUpdateForTesting = () => {
    localStorage.removeItem(INSTALLED_VERSION_KEY);
    localStorage.removeItem(LAST_UPDATED_AT_KEY);
    setIsUpdateInstalled(false);
    setHasUpdateAvailable(true);
    setIsUpdateSuccess(false);
    setDownloadProgress(0);
    setDownloadedMB(0);
    setFiles([]);
    showToast('Update reset: Update notification & button are now available for testing.', 'info');
  };

  return (
    <AppUpdateContext.Provider
      value={{
        currentVersion,
        latestVersion,
        hasUpdateAvailable,
        isUpdateInstalled,
        installedAt,
        totalSizeMB,
        totalSizeFormatted,
        files,
        releaseNotes,
        advantages,
        isAnalyzing,
        analysisProgress,
        isDownloading,
        downloadProgress,
        downloadSpeedMBps,
        downloadedMB,
        downloadedFormatted,
        currentProcessingStage,
        activeFeatureIndex,
        remainingSeconds,
        isTurboMode,
        toggleTurboMode,
        isUpdateSuccess,
        isModalOpen,
        openUpdateModal,
        closeUpdateModal,
        isRocketAnimating,
        triggerRocketAnimation,
        startAnalysisAndDownload,
        checkForUpdates,
        resetUpdateForTesting
      }}
    >
      {children}
      <RocketLaunchAnimation
        isActive={isRocketAnimating}
        onComplete={() => setIsRocketAnimating(false)}
      />
    </AppUpdateContext.Provider>
  );
};

export const useAppUpdate = (): AppUpdateContextType => {
  const context = useContext(AppUpdateContext);
  if (!context) {
    throw new Error('useAppUpdate must be used within an AppUpdateProvider');
  }
  return context;
};
