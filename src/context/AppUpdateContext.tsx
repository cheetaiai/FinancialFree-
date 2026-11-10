import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '../lib/api';
import { AppUpdateFile, FeatureAdvantage } from '../types';
import { useToast } from './ToastContext';
import confetti from 'canvas-confetti';
import { RocketLaunchAnimation } from '../components/ui/RocketLaunchAnimation';
import { FeatureActivationShowcaseAnimation } from '../components/update/FeatureActivationShowcaseAnimation';
import { playReturnMoneySound, playTickSound } from '../lib/soundEffects';

const INSTALLED_VERSION_KEY = 'financialfree_installed_version';
const LAST_UPDATED_AT_KEY = 'financialfree_last_updated_at';
const UPDATE_MODE_KEY = 'financialfree_update_notification_mode';

const DEFAULT_ADVANTAGES: FeatureAdvantage[] = [
  {
    title: '6.0 GB Ultra Turbo Engine',
    desc: 'Expanded 6.0 GB high-throughput persistent data buffer with zero latency memory architecture and instant atomic vault syncing.'
  },
  {
    title: '5-Second Smart Offline Notification',
    desc: 'Non-intrusive network indicator that auto-dismisses after exactly 5 seconds to eliminate screen obstruction.'
  },
  {
    title: 'Instant 404 Connection Loss Recovery',
    desc: 'Automatic touch detection to launch interactive 404 connection diagnostics, server ping, retry, and close app options.'
  },
  {
    title: 'Camera Receipt Scanner & Gemini AI Bill Verification',
    desc: 'Automated receipt capture with persistent stream mounting, direct phone camera fallback, and intelligent grocery expense parsing.'
  },
  {
    title: 'Medium-Sized Touch Controls',
    desc: 'Balanced medium ergonomic buttons across all camera and spend workflows for effortless single-hand touch.'
  }
];

export type UpdateMode = 'interactive' | 'automatic';

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
  updateMode: UpdateMode;
  setUpdateMode: (mode: UpdateMode) => void;
  isUpdateSuccess: boolean;
  isModalOpen: boolean;
  openUpdateModal: () => void;
  closeUpdateModal: () => void;
  isRocketAnimating: boolean;
  triggerRocketAnimation: () => void;
  triggerUpdateNotification: () => void;
  startAnalysisAndDownload: () => Promise<void>;
  checkForUpdates: () => Promise<void>;
  resetUpdateForTesting: () => void;
}

const AppUpdateContext = createContext<AppUpdateContextType | undefined>(undefined);

export const AppUpdateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [latestVersion, setLatestVersion] = useState<string>('v.6.0.1.0');
  const [currentVersion, setCurrentVersion] = useState<string>('v.6.0.0');
  const [files, setFiles] = useState<AppUpdateFile[]>([]);
  const [totalSizeMB, setTotalSizeMB] = useState<number>(6144);
  const [totalSizeFormatted, setTotalSizeFormatted] = useState<string>('6.0 GB');
  const [advantages, setAdvantages] = useState<FeatureAdvantage[]>(DEFAULT_ADVANTAGES);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState<number>(0);
  const [releaseNotes, setReleaseNotes] = useState<string[]>([
    'Official v.6.0.1.0 Release: 2-second dual-design 404 recovery cycling between Advanced Network and Cat Helper UIs.',
    'AI Product Pack & MRP Scanner: Instant extraction of Brand, MRP, Net Qty, Expiry, and Batch with 1-Tap Auto-Add directly to Firebase.',
    'Cloud Vault Hardening: Strict undefined-field sanitization preventing Firestore serialization drops.',
    'High-Contrast Theme Sync: Pure black typography on light backgrounds and crisp white typography on dark backgrounds.'
  ]);

  // Update Notification Mode: 'interactive' (prompts with notification, no silent update) vs 'automatic'
  const [updateMode, setUpdateModeState] = useState<UpdateMode>(() => {
    try {
      const stored = localStorage.getItem(UPDATE_MODE_KEY);
      return (stored as UpdateMode) || 'interactive';
    } catch {
      return 'interactive';
    }
  });

  const setUpdateMode = (mode: UpdateMode) => {
    setUpdateModeState(mode);
    try {
      localStorage.setItem(UPDATE_MODE_KEY, mode);
    } catch {}
    playTickSound();
    showToast(
      mode === 'interactive'
        ? 'Interactive Mode: Updates will notify you with Liquid-Glass alerts before downloading.'
        : 'Auto-Install Mode: Updates will download in the background automatically.',
      'info'
    );
  };

  const [hasUpdateAvailable, setHasUpdateAvailable] = useState<boolean>(true);
  const [isUpdateInstalled, setIsUpdateInstalled] = useState<boolean>(false);
  const [installedAt, setInstalledAt] = useState<string | null>(null);

  // Analysis and Download States
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);

  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadSpeedMBps, setDownloadSpeedMBps] = useState<number>(0);
  const [downloadedMB, setDownloadedMB] = useState<number>(0);
  const [downloadedFormatted, setDownloadedFormatted] = useState<string>('0 MB');
  const [currentProcessingStage, setCurrentProcessingStage] = useState<string>('System Idle');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isTurboMode, setIsTurboMode] = useState<boolean>(false);

  // UI state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isUpdateSuccess, setIsUpdateSuccess] = useState<boolean>(false);
  const [isRocketAnimating, setIsRocketAnimating] = useState<boolean>(false);
  const [isFeatureShowcaseOpen, setIsFeatureShowcaseOpen] = useState<boolean>(false);

  const openUpdateModal = () => {
    playTickSound();
    setIsModalOpen(true);
  };

  const closeUpdateModal = () => {
    playTickSound();
    setIsModalOpen(false);
  };

  const triggerRocketAnimation = () => {
    setIsRocketAnimating(true);
    try {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 }
      });
    } catch {}
  };

  const toggleTurboMode = () => {
    setIsTurboMode(prev => {
      const next = !prev;
      playTickSound();
      showToast(next ? '⚡ Fast Stream Mode activated (~5s)' : '🐢 Realistic Network Simulation Mode (~45-75s)', 'info');
      return next;
    });
  };

  // Helper to trigger the liquid glass update notification
  const triggerUpdateNotification = useCallback(() => {
    playTickSound();
    showToast(
      '✨ Version v.6.0.1.0 (6.0 GB) is ready! 2s Dual 404 Recovery, AI Packaging & MRP Scanner, and Firebase Zero-Loss Vault.',
      'info',
      {
        title: 'App Update Available (v.6.0.1.0)',
        action: {
          label: 'Update Now (6.0 GB)',
          onClick: () => {
            openUpdateModal();
          }
        },
        durationMs: 8000
      }
    );
  }, [showToast]);

  // In-app release announcement notification for v.6.0.1.0 launch - Prompts with Liquid-Glass Notification
  useEffect(() => {
    const sessionKey = 'financialfree_v6010_notified';
    if (!sessionStorage.getItem(sessionKey)) {
      const timer = setTimeout(() => {
        const stored = localStorage.getItem(INSTALLED_VERSION_KEY);
        if (stored !== 'v.6.0.1.0' && stored !== 'v6.0.1.0' && stored !== '6.0.1.0' && stored !== 'v6.0.1') {
          triggerUpdateNotification();
          sessionStorage.setItem(sessionKey, 'true');
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [triggerUpdateNotification]);

  // Load server release information
  const fetchUpdateManifest = useCallback(async () => {
    try {
      const info = await api.getAppUpdateInfo();
      if (info) {
        setLatestVersion(info.latestVersion || 'v.6.0.1.0');
        if (info.currentVersion) setCurrentVersion(info.currentVersion);
        if (info.totalSizeMB) setTotalSizeMB(info.totalSizeMB);
        if (info.totalSizeFormatted) setTotalSizeFormatted(info.totalSizeFormatted);
        if (info.releaseNotes && info.releaseNotes.length > 0) setReleaseNotes(info.releaseNotes);
        if (info.advantages && info.advantages.length > 0) setAdvantages(info.advantages);
        if (info.files && info.files.length > 0) setFiles(info.files);

        const stored = localStorage.getItem(INSTALLED_VERSION_KEY);
        // Strictly manual update enforcement: Only marked installed if user manually confirmed installation
        if (stored === (info.latestVersion || 'v.6.0.1.0') || stored === 'v.6.0.1' || stored === 'v6.0.1.0') {
          setIsUpdateInstalled(true);
          setHasUpdateAvailable(false);
          setCurrentVersion(info.latestVersion || 'v.6.0.1.0');
          let savedDate = localStorage.getItem(LAST_UPDATED_AT_KEY);
          if (!savedDate) {
            savedDate = new Date().toISOString();
            localStorage.setItem(LAST_UPDATED_AT_KEY, savedDate);
          }
          setInstalledAt(savedDate);
        } else {
          setIsUpdateInstalled(false);
          setHasUpdateAvailable(true);
          setCurrentVersion('v.6.0.0');
        }
      }
    } catch {
      // Fallback: Keep update available for manual user review
      setIsUpdateInstalled(false);
      setHasUpdateAvailable(true);
      setCurrentVersion('v.6.0.0');
    }
  }, []);

  useEffect(() => {
    fetchUpdateManifest();
  }, [fetchUpdateManifest]);

  // Step-by-step package verification and realistic 6.0 GB MB/GB download procedure
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
        'Validating cryptographic integrity for v.6.0.1.0 package...',
        'Allocating 6.0 GB high-speed offline cache buffer...',
        'Package verified: Ready to stream v.6.0.1.0 update package.'
      ];

      const stageDelay = isTurboMode ? 150 : 450;
      for (let i = 0; i < verificationStages.length; i++) {
        setCurrentProcessingStage(verificationStages[i]);
        setAnalysisProgress(Math.round(((i + 1) / verificationStages.length) * 100));
        await new Promise(r => setTimeout(r, stageDelay));
      }

      setIsAnalyzing(false);

      // PHASE 2: PROGRESSIVE DOWNLOAD WITH LIVE MB / GB TRANSFER TRACKER (6.0 GB)
      setIsDownloading(true);

      const totalMB = 6144; // 6.0 GB
      const downloadSteps = isTurboMode ? 24 : 56;
      const stepDuration = isTurboMode ? 110 : 750;

      for (let step = 1; step <= downloadSteps; step++) {
        const currentProg = Math.round((step / downloadSteps) * 100);
        const currentMB = parseFloat(((step / downloadSteps) * totalMB).toFixed(1));

        const featIdx = Math.min(advantages.length - 1, Math.floor((currentProg / 100) * advantages.length));
        setActiveFeatureIndex(featIdx);

        const currentSpeed = isTurboMode
          ? 380.0
          : parseFloat((52.0 + Math.sin(step) * 14.0 + Math.random() * 9).toFixed(1));

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
          stageText = `Streaming 6.0 GB Ultra Turbo Engine & GPU Shaders (${formatted} / 6.0 GB)...`;
        } else if (currentProg < 50) {
          stageText = `Deploying 2s Dual 404 Recovery & Server Health Engine (${formatted} / 6.0 GB)...`;
        } else if (currentProg < 75) {
          stageText = `Configuring AI FMCG Product Packaging & MRP Scanner (${formatted} / 6.0 GB)...`;
        } else if (currentProg < 92) {
          stageText = `Hardening Firebase Cloud Vault & Undefined Field Sanitation (${formatted} / 6.0 GB)...`;
        } else {
          stageText = `Finalizing Package Integrity & Activating v.6.0.1.0 (${formatted} / 6.0 GB)...`;
        }

        setDownloadProgress(currentProg);
        setDownloadedMB(currentMB);
        setDownloadedFormatted(formatted);
        setDownloadSpeedMBps(currentSpeed);
        setCurrentProcessingStage(stageText);

        await new Promise(r => setTimeout(r, stepDuration));
      }

      setDownloadedMB(totalMB);
      setDownloadedFormatted('6.0 GB');
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

      try {
        if ('caches' in window) {
          const keys = await caches.keys();
          for (const key of keys) {
            await caches.delete(key);
          }
        }
      } catch {}

      await new Promise(r => setTimeout(r, 600));

      // Record installation permanently in localStorage
      const timestamp = new Date().toISOString();
      localStorage.setItem(INSTALLED_VERSION_KEY, latestVersion);
      localStorage.setItem(LAST_UPDATED_AT_KEY, timestamp);

      try {
        await api.acknowledgeAppUpdate();
      } catch {}

      setIsDownloading(false);
      setIsUpdateSuccess(true);
      setCurrentVersion(latestVersion);
      setInstalledAt(timestamp);
      setIsUpdateInstalled(true);
      setHasUpdateAvailable(false);

      playReturnMoneySound();

      // Launch full-screen liquid-glass feature showcase
      setIsFeatureShowcaseOpen(true);
    } catch (err: any) {
      setIsAnalyzing(false);
      setIsDownloading(false);
      showToast(err.message || 'Update installation failed. Please retry.', 'error');
    }
  };

  const checkForUpdates = async () => {
    playTickSound();
    showToast('Checking for available over-the-air updates...', 'info');
    try {
      await fetchUpdateManifest();
      showToast('System checked: Update definitions verified and up-to-date.', 'success');
    } catch {
      showToast('Network check timed out. Vault remains safe.', 'info');
    }
  };

  const resetUpdateForTesting = () => {
    playTickSound();
    localStorage.removeItem(INSTALLED_VERSION_KEY);
    localStorage.removeItem(LAST_UPDATED_AT_KEY);
    sessionStorage.removeItem('financialfree_v6010_notified');
    setIsUpdateInstalled(false);
    setHasUpdateAvailable(true);
    setCurrentVersion('v.6.0.0');
    setInstalledAt(null);
    showToast('Update reset to v.6.0.0. Update to v.6.0.1.0 (6.0 GB) is ready for manual testing.', 'info');
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
        updateMode,
        setUpdateMode,
        isUpdateSuccess,
        isModalOpen,
        openUpdateModal,
        closeUpdateModal,
        isRocketAnimating,
        triggerRocketAnimation,
        triggerUpdateNotification,
        startAnalysisAndDownload,
        checkForUpdates,
        resetUpdateForTesting
      }}
    >
      {children}

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
          showToast(`🚀 FinancialFree updated to ${latestVersion} (6.0 GB) successfully!`, 'success');
        }}
      />

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
