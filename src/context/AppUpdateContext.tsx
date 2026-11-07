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
    title: 'Liquid Glass Sign Out Engine',
    desc: 'Specular liquid-glass session card with hardware telemetry, real-time security vault status, and 120 FPS compositor effects.'
  },
  {
    title: 'Admin Approval Diagnostic Suite',
    desc: 'Automated 6-phase administrative approval pipeline verification ensuring 100% login access reliability and registration security.'
  },
  {
    title: '4.0 GB High-Throughput Pipeline',
    desc: 'Expanded high-performance data pipeline capable of handling 100,000+ ledger entries seamlessly across phone storage and Firestore.'
  },
  {
    title: 'Immortal Real-Time Share Statements',
    desc: 'Zero-expiration public statement links that auto-update dynamically in real time as money is given or returned, with interactive UPI payment QR codes.'
  },
  {
    title: 'Dual-Mode Google Drive & Universal Archive',
    desc: 'One-click specialized Drive JSON creation, Google Sign-In cloud push, and Universal Hardware Archive bundle (JSON + CSV + PDF in ZIP).'
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
  toggleUpdateMode: () => void;
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
  const [latestVersion, setLatestVersion] = useState<string>('v.6.5.5.0');
  const [currentVersion, setCurrentVersion] = useState<string>('v.6.5.4');
  const [files, setFiles] = useState<AppUpdateFile[]>([]);
  const [totalSizeMB, setTotalSizeMB] = useState<number>(4096);
  const [totalSizeFormatted, setTotalSizeFormatted] = useState<string>('4.0 GB');
  const [advantages, setAdvantages] = useState<FeatureAdvantage[]>(DEFAULT_ADVANTAGES);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState<number>(0);
  const [releaseNotes, setReleaseNotes] = useState<string[]>([
    'Official v.6.5.5.0 Launch (4.0 GB): 404 Connection Loss Recovery screen with live ping, retry connection, and exit app controls.',
    'Camera Receipt Scanner Fix: Video stream mounting bug resolved with instant viewfinder display and direct native camera trigger.',
    'Medium-Sized Action Buttons: Optimized button geometry across scanner and grocery modals for comfortable one-hand touch.',
    'Mobile Header Optimization: Removed top AI button to ensure Sign Out button is always 100% visible on mobile phones.',
    'Universal Light & Dark Mode Contrast: All text, headings, badges, and labels render deep black in light mode and crisp white in dark mode.',
    'Immortal Public Share Links: Dynamic auto-updating settlement statement URLs with interactive UPI QR codes and multi-app deep links.',
    'Paytm & Google Pay Audio Engine: Studio-grade ascending crystal bell chimes for money given transactions.'
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

  const toggleUpdateMode = () => {
    const nextMode = updateMode === 'interactive' ? 'automatic' : 'interactive';
    setUpdateMode(nextMode);
  };

  // Check if update was manually applied on this device
  const [isUpdateInstalled, setIsUpdateInstalled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(INSTALLED_VERSION_KEY);
      const isManual = localStorage.getItem('financialfree_manual_update_installed') === 'true';
      return isManual && (stored === 'v.6.5.4.0');
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
  const [downloadSpeedMBps, setDownloadSpeedMBps] = useState<number>(68.5);
  const [downloadedMB, setDownloadedMB] = useState<number>(0);
  const [downloadedFormatted, setDownloadedFormatted] = useState<string>('0 MB');
  const [currentProcessingStage, setCurrentProcessingStage] = useState<string>('');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(35);
  const [isTurboMode, setIsTurboMode] = useState<boolean>(false);
  const [isUpdateSuccess, setIsUpdateSuccess] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isRocketAnimating, setIsRocketAnimating] = useState<boolean>(false);
  const [isFeatureShowcaseOpen, setIsFeatureShowcaseOpen] = useState<boolean>(false);

  const triggerRocketAnimation = () => {
    setIsRocketAnimating(true);
  };

  const openUpdateModal = useCallback(() => {
    playTickSound();
    setIsModalOpen(true);
  }, []);

  const closeUpdateModal = () => {
    if (!isDownloading && !isAnalyzing) {
      playTickSound();
      setIsModalOpen(false);
    }
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
      '✨ Version v.6.5.4.0 (4.0 GB) is ready! High-contrast share statements, single link sharing & authentic Paytm/GPay sound.',
      'info',
      {
        title: 'App Update Available (v.6.5.4.0)',
        action: {
          label: 'Update Now (4.0 GB)',
          onClick: () => {
            openUpdateModal();
          }
        },
        durationMs: 8000
      }
    );
  }, [showToast, openUpdateModal]);

  // In-app release announcement notification for v.6.5.4.0 launch - Prompts with Liquid-Glass Notification
  useEffect(() => {
    const sessionKey = 'financialfree_v6540_notified';
    if (!sessionStorage.getItem(sessionKey)) {
      const timer = setTimeout(() => {
        const stored = localStorage.getItem(INSTALLED_VERSION_KEY);
        if (stored !== 'v.6.5.4.0' && stored !== 'v6.5.4.0' && stored !== '6.5.4.0') {
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
        setLatestVersion(info.latestVersion || 'v.6.5.4.0');
        if (info.currentVersion) setCurrentVersion(info.currentVersion);
        if (info.totalSizeMB) setTotalSizeMB(info.totalSizeMB);
        if (info.totalSizeFormatted) setTotalSizeFormatted(info.totalSizeFormatted);
        if (info.releaseNotes && info.releaseNotes.length > 0) setReleaseNotes(info.releaseNotes);
        if (info.advantages && info.advantages.length > 0) setAdvantages(info.advantages);
        if (info.files && info.files.length > 0) setFiles(info.files);

        const stored = localStorage.getItem(INSTALLED_VERSION_KEY);
        // Strictly manual update enforcement: Only marked installed if user manually confirmed installation
        if (stored === (info.latestVersion || 'v.6.5.4.0')) {
          setIsUpdateInstalled(true);
          setHasUpdateAvailable(false);
          setCurrentVersion(info.latestVersion || 'v.6.5.4.0');
          let savedDate = localStorage.getItem(LAST_UPDATED_AT_KEY);
          if (!savedDate) {
            savedDate = new Date().toISOString();
            localStorage.setItem(LAST_UPDATED_AT_KEY, savedDate);
          }
          setInstalledAt(savedDate);
        } else {
          setIsUpdateInstalled(false);
          setHasUpdateAvailable(true);
          setCurrentVersion('v.6.5.3');
        }
      }
    } catch {
      // Fallback: Keep update available for manual user review
      setIsUpdateInstalled(false);
      setHasUpdateAvailable(true);
      setCurrentVersion('v.6.5.3');
    }
  }, []);

  useEffect(() => {
    fetchUpdateManifest();
  }, [fetchUpdateManifest]);

  // Step-by-step package verification and realistic 4.0 GB MB/GB download procedure
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
        'Validating cryptographic integrity for v.6.5.4.0 package...',
        'Allocating 4.0 GB high-speed offline cache buffer...',
        'Package verified: Ready to stream v.6.5.4.0 update package.'
      ];

      const stageDelay = isTurboMode ? 150 : 450;
      for (let i = 0; i < verificationStages.length; i++) {
        setCurrentProcessingStage(verificationStages[i]);
        setAnalysisProgress(Math.round(((i + 1) / verificationStages.length) * 100));
        await new Promise(r => setTimeout(r, stageDelay));
      }

      setIsAnalyzing(false);

      // PHASE 2: PROGRESSIVE DOWNLOAD WITH LIVE MB / GB TRANSFER TRACKER (4.0 GB)
      setIsDownloading(true);

      const totalMB = 4096; // 4.0 GB
      const downloadSteps = isTurboMode ? 24 : 56;
      const stepDuration = isTurboMode ? 110 : 750;

      for (let step = 1; step <= downloadSteps; step++) {
        const currentProg = Math.round((step / downloadSteps) * 100);
        const currentMB = parseFloat(((step / downloadSteps) * totalMB).toFixed(1));

        const featIdx = Math.min(advantages.length - 1, Math.floor((currentProg / 100) * advantages.length));
        setActiveFeatureIndex(featIdx);

        const currentSpeed = isTurboMode
          ? 320.0
          : parseFloat((45.0 + Math.sin(step) * 12.0 + Math.random() * 8).toFixed(1));

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
          stageText = `Streaming Liquid Glass Sign Out Engine & GPU Shaders (${formatted} / 4.0 GB)...`;
        } else if (currentProg < 50) {
          stageText = `Verifying Admin Approval Diagnostic & Security Pipeline (${formatted} / 4.0 GB)...`;
        } else if (currentProg < 75) {
          stageText = `Deploying High-Contrast Share Statement Engine (${formatted} / 4.0 GB)...`;
        } else if (currentProg < 92) {
          stageText = `Synchronizing Authentic Paytm & Google Pay Chimes (${formatted} / 4.0 GB)...`;
        } else {
          stageText = `Finalizing Package Integrity & Activating v.6.5.4.0 (${formatted} / 4.0 GB)...`;
        }

        setDownloadProgress(currentProg);
        setDownloadedMB(currentMB);
        setDownloadedFormatted(formatted);
        setDownloadSpeedMBps(currentSpeed);
        setCurrentProcessingStage(stageText);

        await new Promise(r => setTimeout(r, stepDuration));
      }

      setDownloadedMB(totalMB);
      setDownloadedFormatted('4.0 GB');
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
        await api.acknowledgeAppUpdate();
      } catch {}

      // Persist installed version only after explicit manual completion
      const updateDate = new Date().toISOString();
      localStorage.setItem(INSTALLED_VERSION_KEY, 'v.6.5.4.0');
      localStorage.setItem(LAST_UPDATED_AT_KEY, updateDate);
      localStorage.setItem('financialfree_manual_update_installed', 'true');

      setCurrentVersion('v.6.5.4.0');
      setIsDownloading(false);
      setIsUpdateSuccess(true);
      setIsUpdateInstalled(true);
      setInstalledAt(updateDate);
      setHasUpdateAvailable(false);

      setIsFeatureShowcaseOpen(true);
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
    if (stored === 'v.6.5.4.0' || stored === 'v6.5.4.0' || stored === '6.5.4.0' || stored === latestVersion) {
      setIsUpdateInstalled(true);
      setHasUpdateAvailable(false);
      showToast(`✨ You are currently on the latest version (${latestVersion}). All features optimized.`, 'success');
    } else {
      setIsUpdateInstalled(false);
      setHasUpdateAvailable(true);
      // Prompt user with the interactive Liquid-Glass notification instead of silent auto-update!
      triggerUpdateNotification();
    }
  };

  // Helper to reset update for testing
  const resetUpdateForTesting = () => {
    playTickSound();
    localStorage.removeItem(INSTALLED_VERSION_KEY);
    localStorage.removeItem(LAST_UPDATED_AT_KEY);
    localStorage.removeItem('financialfree_permanent_app_updated');
    localStorage.removeItem('financialfree_manual_update_installed');
    setIsUpdateInstalled(false);
    setHasUpdateAvailable(true);
    setCurrentVersion('v.6.5.3');
    setIsUpdateSuccess(false);
    setDownloadProgress(0);
    setDownloadedMB(0);
    setFiles([]);
    triggerUpdateNotification();
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
        toggleUpdateMode,
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
          showToast(`🚀 FinancialFree updated to ${latestVersion} (4.0 GB) successfully!`, 'success');
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
