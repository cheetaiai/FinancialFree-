import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone,
  Tablet,
  Download,
  Share2,
  PlusSquare,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldCheck,
  Zap,
  Layers,
  Sparkles
} from 'lucide-react';
import { usePWAInstall } from '../../lib/usePWAInstall';
import { downloadApkClientSide } from '../../lib/apkData';

interface MobileAppShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDeviceMode?: 'responsive' | 'iphone' | 'android' | 'tablet';
  onSelectDeviceMode?: (mode: 'responsive' | 'iphone' | 'android' | 'tablet') => void;
}

export const MobileAppShowcaseModal: React.FC<MobileAppShowcaseModalProps> = ({
  isOpen,
  onClose,
  currentDeviceMode = 'responsive',
  onSelectDeviceMode
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activePlatformTab, setActivePlatformTab] = useState<'android' | 'ios' | 'tablet'>(
    isIOS ? 'ios' : isAndroid ? 'android' : 'android'
  );
  const [isInstalling, setIsInstalling] = useState(false);
  const [isDownloadingApk, setIsDownloadingApk] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setIsInstalling(true);
    await install();
    setIsInstalling(false);
  };

  const handleDownloadApk = () => {
    setIsDownloadingApk(true);
    const success = downloadApkClientSide();
    if (!success) {
      const link = document.createElement('a');
      link.href = '/api/download-apk';
      link.setAttribute('download', 'FinancialFree.apk');
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    setTimeout(() => setIsDownloadingApk(false), 1200);
  };

  const handleDownloadProjectZip = async () => {
    try {
      const res = await fetch('/api/download-android-project');
      if (!res.ok) throw new Error('Zip download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'financialfree-android-project.zip');
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        link.remove();
      }, 100);
    } catch (err) {
      const link = document.createElement('a');
      link.href = '/api/download-android-project';
      link.setAttribute('download', 'financialfree-android-project.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 20 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative w-full max-w-2xl rounded-3xl liquid-glass-floating border border-white/80 dark:border-white/20 shadow-2xl p-4 sm:p-6 text-slate-900 dark:text-white bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl z-10 my-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="flex items-start gap-3 sm:gap-4 pr-10">
            <div className="relative flex-shrink-0">
              <img
                src="/apple-touch-icon.png"
                alt="FinancialFree App Icon"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shadow-xl border border-white/20 object-cover"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] text-white font-black">
                ✓
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  FinancialFree Mobile App
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Android & iOS Native PWA
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Install directly on your phone or tablet for instant launch, offline vault storage, and high-resolution icons.
              </p>
            </div>
          </div>

          {/* Platform Switcher Tabs */}
          <div className="flex rounded-2xl bg-black/5 dark:bg-white/5 p-1 mt-5">
            <button
              onClick={() => setActivePlatformTab('android')}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activePlatformTab === 'android'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone size={16} />
              <span>Android Phone</span>
            </button>

            <button
              onClick={() => setActivePlatformTab('ios')}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activePlatformTab === 'ios'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone size={16} />
              <span>iPhone (iOS)</span>
            </button>

            <button
              onClick={() => setActivePlatformTab('tablet')}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activePlatformTab === 'tablet'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Tablet size={16} />
              <span>iPad & Tablet</span>
            </button>
          </div>

          {/* Platform-Specific Details & Visual Icon Display */}
          <div className="mt-4 p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/40">
            {activePlatformTab === 'android' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Android Adaptive Icon (192×192 & 512×512 Maskable)
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">
                    Supports Google Pixel, Samsung Galaxy, Xiaomi
                  </span>
                </div>

                <div className="flex items-center gap-4 py-1">
                  {/* Round Android Launcher Icon Preview */}
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg border-2 border-emerald-500/40 mx-auto p-1 bg-slate-900">
                      <img
                        src="/pwa-maskable-512x512.png"
                        alt="Android Round Icon"
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1 block">
                      Pixel / Circle
                    </span>
                  </div>

                  {/* Squircle Android Launcher Icon Preview */}
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-emerald-500/40 mx-auto p-1 bg-slate-900">
                      <img
                        src="/pwa-maskable-512x512.png"
                        alt="Android Squircle Icon"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1 block">
                      OneUI / Squircle
                    </span>
                  </div>

                  {/* Android Instruction Steps */}
                  <div className="flex-1 text-xs space-y-1.5 pl-2 text-slate-600 dark:text-slate-300">
                    <div className="flex items-start gap-1.5 font-medium">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">1.</span>
                      <span>Tap <strong>"Download APK"</strong> below to save <strong>FinancialFree.apk</strong>.</span>
                    </div>
                    <div className="flex items-start gap-1.5 font-medium">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">2.</span>
                      <span>Open the file from your notification or Files app and tap <strong>Install</strong>.</span>
                    </div>
                    <div className="flex items-start gap-1.5 font-medium">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">3.</span>
                      <span>Launch from your home screen with high-resolution adaptive launcher icon!</span>
                    </div>
                  </div>
                </div>

                {/* Direct APK Download Card */}
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                      APK
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>FinancialFree.apk</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-bold">160 KB</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Universal Android package for Samsung, Pixel, OnePlus, Xiaomi
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleDownloadApk}
                      disabled={isDownloadingApk}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      <Download size={14} />
                      <span>{isDownloadingApk ? 'Downloading...' : 'Download APK'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadProjectZip}
                      title="Download Android Studio Project Source (.zip)"
                      className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      Source .ZIP
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activePlatformTab === 'ios' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Apple Touch Icon (180×180 PNG iOS Spec)
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">
                    iPhone 16/15/14 Pro & iOS Safari
                  </span>
                </div>

                <div className="flex items-center gap-4 py-1">
                  {/* Apple Home Screen Icon Preview */}
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-[22%] overflow-hidden shadow-xl border border-white/20 mx-auto">
                      <img
                        src="/apple-touch-icon.png"
                        alt="Apple Touch Icon"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1 block">
                      iOS Springboard
                    </span>
                  </div>

                  {/* iOS Safari Instruction Steps */}
                  <div className="flex-1 text-xs space-y-1.5 pl-2 text-slate-600 dark:text-slate-300">
                    <div className="flex items-start gap-2">
                      <Share2 size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>1. Tap the <strong>Share</strong> button in the Safari toolbar at bottom.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <PlusSquare size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>2. Scroll down and select <strong>"Add to Home Screen"</strong>.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>3. Tap <strong>"Add"</strong> in top right. Launches with zero browser chrome!</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePlatformTab === 'tablet' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      iPad & Android Tablet Multi-Column View
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">
                    768px – 1366px Optimized Layout
                  </span>
                </div>

                <div className="flex items-center gap-4 py-1">
                  {/* Tablet Icon Preview */}
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl border border-purple-500/30 mx-auto">
                      <img
                        src="/pwa-512x512.png"
                        alt="Tablet Icon"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1 block">
                      512×512 HD
                    </span>
                  </div>

                  <div className="flex-1 text-xs space-y-1.5 pl-2 text-slate-600 dark:text-slate-300">
                    <p>
                      On tablets, FinancialFree unlocks wide dashboard cards, side-by-side ledger audits, interactive trend charts, and dual-pane summaries.
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                      <Layers size={13} />
                      <span>Adaptive 8-tab bottom floating glass navigation</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Device View Mode Switcher */}
          {onSelectDeviceMode && (
            <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-blue-500" />
                  Live In-Browser Device Frame Simulator
                </span>
                <span className="text-[10px] text-slate-400">
                  Preview exact mobile frames
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                <button
                  onClick={() => {
                    onSelectDeviceMode('responsive');
                    onClose();
                  }}
                  className={`py-2 px-1 rounded-xl text-center border text-xs font-semibold transition-all cursor-pointer ${
                    currentDeviceMode === 'responsive'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'border-slate-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="block text-[11px]">Desktop</span>
                  <span className="text-[9px] opacity-75">Full Screen</span>
                </button>

                <button
                  onClick={() => {
                    onSelectDeviceMode('iphone');
                    onClose();
                  }}
                  className={`py-2 px-1 rounded-xl text-center border text-xs font-semibold transition-all cursor-pointer ${
                    currentDeviceMode === 'iphone'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'border-slate-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="block text-[11px]">iPhone Pro</span>
                  <span className="text-[9px] opacity-75">390 × 844</span>
                </button>

                <button
                  onClick={() => {
                    onSelectDeviceMode('android');
                    onClose();
                  }}
                  className={`py-2 px-1 rounded-xl text-center border text-xs font-semibold transition-all cursor-pointer ${
                    currentDeviceMode === 'android'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'border-slate-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="block text-[11px]">Android</span>
                  <span className="text-[9px] opacity-75">412 × 915</span>
                </button>

                <button
                  onClick={() => {
                    onSelectDeviceMode('tablet');
                    onClose();
                  }}
                  className={`py-2 px-1 rounded-xl text-center border text-xs font-semibold transition-all cursor-pointer ${
                    currentDeviceMode === 'tablet'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'border-slate-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="block text-[11px]">Tablet</span>
                  <span className="text-[9px] opacity-75">768 × 1024</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-5 flex items-center justify-end gap-2.5 flex-wrap">
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleDownloadApk}
              disabled={isDownloadingApk}
              className="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download size={15} />
              <span>{isDownloadingApk ? 'Downloading...' : 'Download APK (.apk)'}</span>
            </button>

            {isInstalled ? (
              <div className="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>Installed as Standalone App</span>
              </div>
            ) : (
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="py-2.5 px-5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Download size={16} />
                <span>{isInstalling ? 'Opening Installer...' : 'Install PWA'}</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
