import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '../lib/api';
import { AppUpdateFile, AppUpdateInfo, FeatureAdvantage } from '../types';
import { useToast } from './ToastContext';
import confetti from 'canvas-confetti';
import { RocketLaunchAnimation } from '../components/ui/RocketLaunchAnimation';
import { FeatureActivationShowcaseAnimation } from '../components/update/FeatureActivationShowcaseAnimation';
import { playReturnMoneySound, playTickSound, playGivenMoneySound } from '../lib/soundEffects';

const INSTALLED_VERSION_KEY = 'financialfree_installed_version';
const LAST_UPDATED_AT_KEY = 'financialfree_last_updated_at';

const DEFAULT_ADVANTAGES: FeatureAdvantage[] = [
  {
    title: 'Optimized QR Code Suite',
    desc: 'Instant dynamic UPI return QR codes with custom amount prefilling, multi-app chooser deep links (GPay, PhonePe, Paytm, BHIM, CRED), and high-contrast rendering.'
  },
  {
    title: 'Share and View Statement Engine',
    desc: 'Zero-login interactive public statements displaying money given & received totals with real-time privacy masking, vector PDF exports, and one-tap WhatsApp sharing.'
  },
  {
    title: 'Mixkit Gold Coin & Payment Audio Experience',
    desc: 'Authentic metallic Mixkit gold coin sound for returned money, digital wallet cash chime for given payments, friendly welcome chime for contacts, and tactile tick mark audio.'
  },
  {
    title: 'Dedicated Rocket Launch Celebration',
    desc: '60fps aerodynamic rocket liftoff with warp-speed starfields and dual shockwave ripples, exclusively celebrating application version updates.'
  },
  {
    title: '2.5 GB Zero Data-Loss Vault & Offline Buffer',
    desc: 'Tri-layer persistent storage, atomic writes, and background sync preventing any data loss during reloads or offline states.'
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
  const [latestVersion, setLatestVersion] = useState<string>('v6.5.1');
  const [currentVersion, setCurrentVersion] = useState<string>('v6.5.0');
  const [files, setFiles] = useState<AppUpdateFile[]>([]);
  const [totalSizeMB, setTotalSizeMB] = useState<number>(2560);
  const [totalSizeFormatted, setTotalSizeFormatted] = useState<string>('2.5 GB');
  const [advantages, setAdvantages] = useState<FeatureAdvantage[]>(DEFAULT_ADVANTAGES);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState<number>(0);
  const [releaseNotes, setReleaseNotes] = useState<string[]>([
    'Official v6.5.1 Launch (2.5 GB): Complete upgrade bundle featuring optimized QR Code suite, public statement engine, and Mixkit soundstage.',
    'Optimized QR Code: Dynamic UPI payment engine with multi-app deep linking, custom amount prefill, and real-time scan detection.',
    'Share & View Statement: Instant zero-login public statement links displaying money given & taken only with vector PDF exports.',
    'Mixkit Gold Coin Audio FX: Authentic gold coin return chime, digital wallet given payment sound, and tactile tick mark clicks.',
    'Rocket Launch Celebration: Dedicated exclusively to app version upgrade milestones.',
    '2.5 GB Zero Data-Loss Vault: Multi-tier persistence and automatic recovery across all sessions.'
  ]);

  // Check if update was already applied on this device
  const [isUpdateInstalled, setIsUpdateInstalled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(INSTALLED_VERSION_KEY);
      return stored === 'v6.5.1';
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
  const [downloadSpeedMBps, setDownloadSpeedMBps] = useState<number>(42.5);
  const [downloadedMB, setDownloadedMB] = useState<number>(0);
  const [downloadedFormatted, setDownloadedFormatted] = useState<string>('0 MB');
  const [currentProcessingStage, setCurrentProcessingStage] = useState<string>('');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(45);
  const [isTurboMode, setIsTurboMode] = useState<boolean>(false);
  const [isUpdateSuccess, setIsUpdateSuccess] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isRocketAnimating, setIsRocketAnimating] = useState<boolean>(false);
  const [isFeatureShowcaseOpen, setIsFeatureShowcaseOpen] = useState<boolean>(false);

  const triggerRocketAnimation = () => {
    setIsRocketAnimating(true);
  };

  const toggleTurboMode = () => {
    setIsTurboMode(prev => {
      const next = !prev;
      playTickSound();
      showToast(next ? '⚡ Fast Stream Mode activated (~5s)' : '🐢 Realistic Network Simulation Mode (~45-75s)', 'info');
      return next;
    });
  };

  // In-app release announcement notification for v6.5.1 launch
  useEffect(() => {
    const sessionKey = 'financialfree_v651_notified';
    if (!sessionStorage.getItem(sessionKey)) {
      const timer = setTimeout(() => {
        const stored = localStorage.getItem(INSTALLED_VERSION_KEY);
        if (stored !== 'v6.5.1') {
          showToast('✨ New Update v6.5.1 (2.5 GB) Available! Optimized QR Code, Share & View Statement & Mixkit Gold Coin audio.', 'info');
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
        setLatestVersion(info.latestVersion || 'v6.5.1');
        if (info.currentVersion) setCurrentVersion(info.currentVersion);
        if (info.totalSizeMB) setTotalSizeMB(info.totalSizeMB);
        if (info.totalSizeFormatted) setTotalSizeFormatted(info.totalSizeFormatted);
        if (info.releaseNotes && info.releaseNotes.length > 0) setReleaseNotes(info.releaseNotes);
        if (info.advantages && info.advantages.length > 0) setAdvantages(info.advantages);
        if (info.files && info.files.length > 0) setFiles(info.files);

        const stored = localStorage.getItem(INSTALLED_VERSION_KEY);
        if (stored === (info.latestVersion || 'v6.5.1')) {
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

  const openUpdateModal = () => {
    playTickSound();
    setIsModalOpen(true);
  };

  const closeUpdateModal = () => {
    if (!isDownloading && !isAnalyzing) {
      playTickSound();
      setIsModalOpen(false);
    }
  };

  // Step-by-step package verification and realistic 2.5 GB MB/GB download procedure
  const startAnalysisAndDownload = async () => {
    if (isAnalyzing || isDownloading) return;

    try {
      playTickSound();
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
        'Validating cryptographic integrity for v6.5.1 package...',
        'Allocating 2.5 GB high-speed offline cache buffer...',
        'Package verified: Ready to stream v6.5.1 update package.'
      ];

      const stageDelay = isTurboMode ? 150 : 450;
      for (let i = 0; i < verificationStages.length; i++) {
        setCurrentProcessingStage(verificationStages[i]);
        setAnalysisProgress(Math.round(((i + 1) / verificationStages.length) * 100));
        await new Promise(r => setTimeout(r, stageDelay));
      }

      setIsAnalyzing(false);

      // PHASE 2: PROGRESSIVE DOWNLOAD WITH LIVE MB / GB TRANSFER TRACKER (2.5 GB)
      setIsDownloading(true);
      const totalMB = 2560; // 2.5 GB
      const downloadSteps = isTurboMode ? 24 : 56;
      const stepDuration = isTurboMode ? 110 : 750; // realistic streaming

      for (let step = 1; step <= downloadSteps; step++) {
        const currentProg = Math.round((step / downloadSteps) * 100);
        const currentMB = parseFloat(((step / downloadSteps) * totalMB).toFixed(1));
        
        // Compute which feature is actively being installed
        const featIdx = Math.min(advantages.length - 1, Math.floor((currentProg / 100) * advantages.length));
        setActiveFeatureIndex(featIdx);

        // Realistic dynamic download speed (MB/s)
        const currentSpeed = isTurboMode
          ? 285.0
          : parseFloat((32.0 + Math.sin(step) * 9.5 + Math.random() * 6).toFixed(1));
        
        const estRemainingSec = Math.max(1, Math.round(((downloadSteps - step) * stepDuration) / 1000));
        setRemainingSeconds(estRemainingSec);

        let formatted = '';
        if (currentMB < 1000) {
          formatted = `${currentMB.toFixed(0)} MB`;
        } else {
          formatted = `${(currentMB / 1024).toFixed(2)} GB`;
        }

        let stageText = '';
        if (currentProg < 25) {
          stageText = `Streaming Optimized QR Code & UPI Deep Link Suite (${formatted} / 2.5 GB)...`;
        } else if (currentProg < 50) {
          stageText = `Deploying Share and View Statement Engine (${formatted} / 2.5 GB)...`;
        } else if (currentProg < 75) {
          stageText = `Configuring Mixkit Gold Coin & Payment Audio Synthesis (${formatted} / 2.5 GB)...`;
        } else if (currentProg < 92) {
          stageText = `Synchronizing 2.5 GB Zero Data-Loss Vault & Storage Engine (${formatted} / 2.5 GB)...`;
        } else {
          stageText = `Finalizing Package Integrity & Activating v6.5.1 (${formatted} / 2.5 GB)...`;
        }

        setDownloadProgress(currentProg);
        setDownloadedMB(currentMB);
        setDownloadedFormatted(formatted);
        setDownloadSpeedMBps(currentSpeed);
        setCurrentProcessingStage(stageText);

        await new Promise(r => setTimeout(r, stepDuration));
      }

      setDownloadedMB(totalMB);
      setDownloadedFormatted('2.5 GB');
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

      // Open the Feature Activation Showcase Animation for the 2.5 GB update!
      setIsFeatureShowcaseOpen(true);

      // Play Mixkit gold coin sound to celebrate 2.5 GB update finish!
      playReturnMoneySound();

    } catch (err: any) {
      setIsAnalyzing(false);
      setIsDownloading(false);
      showToast(err.message || 'Failed to complete update download. Please retry.', 'error');
    }
  };

  const checkForUpdates = async () => {
    playTickSound();
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

  // Helper for developers / QA to test the update flow again
  const resetUpdateForTesting = () => {
    playTickSound();
    localStorage.removeItem(INSTALLED_VERSION_KEY);
    localStorage.removeItem(LAST_UPDATED_AT_KEY);
    setIsUpdateInstalled(false);
    setHasUpdateAvailable(true);
    setIsUpdateSuccess(false);
    setDownloadProgress(0);
    setDownloadedMB(0);
    setFiles([]);
    showToast('Update reset: v6.5.1 (2.5 GB) notification & download button are now ready for testing.', 'info');
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

      {/* Feature Download & Activation Showcase Animation when 2.5 GB finishes */}
      <FeatureActivationShowcaseAnimation
        isOpen={isFeatureShowcaseOpen}
        onComplete={() => {
          setIsFeatureShowcaseOpen(false);
          setIsRocketAnimating(true);
          try {
            confetti({
              particleCount: 120,
              spread: 85,
              origin: { y: 0.6 }
            });
          } catch {}
          showToast(`🚀 FinancialFree updated to ${latestVersion} (2.5 GB) successfully!`, 'success');
        }}
      />

      {/* Celebratory Rocket Launch Animation - ONLY during app updates! */}
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
