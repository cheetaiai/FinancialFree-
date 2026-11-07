import React, { useState, useEffect } from 'react';
import {
  Camera,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Video,
  X,
  ExternalLink,
  Smartphone,
  Database
} from 'lucide-react';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidButton } from '../ui/LiquidButton';
import { useToast } from '../../context/ToastContext';

export const DeviceAccessSettingsCard: React.FC = () => {
  const { showToast } = useToast();

  // Camera permission state
  const [cameraStatus, setCameraStatus] = useState<'granted' | 'prompt' | 'denied' | 'checking'>('checking');
  const [isTestingCamera, setIsTestingCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Storage persistence state
  const [isPersisted, setIsPersisted] = useState<boolean | null>(null);
  const [storageUsage, setStorageUsage] = useState<{ usedMB: string; quotaMB: string } | null>(null);
  const [isRequestingPersistence, setIsRequestingPersistence] = useState(false);

  // Check camera permission
  const checkCameraPermission = async () => {
    try {
      if (navigator.permissions && (navigator.permissions as any).query) {
        const result = await navigator.permissions.query({ name: 'camera' as any });
        setCameraStatus(result.state as any);
        result.onchange = () => {
          setCameraStatus(result.state as any);
        };
      } else {
        setCameraStatus('prompt');
      }
    } catch {
      setCameraStatus('prompt');
    }
  };

  // Check storage persistence and quota
  const checkStorage = async () => {
    try {
      if (navigator.storage) {
        if (navigator.storage.persisted) {
          const persisted = await navigator.storage.persisted();
          setIsPersisted(persisted);
        }
        if (navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          const usedMB = ((estimate.usage || 0) / (1024 * 1024)).toFixed(2);
          const quotaMB = ((estimate.quota || 0) / (1024 * 1024)).toFixed(0);
          setStorageUsage({ usedMB, quotaMB });
        }
      }
    } catch (e) {
      console.warn('Storage check notice:', e);
    }
  };

  useEffect(() => {
    checkCameraPermission();
    checkStorage();

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleRequestCamera = async () => {
    try {
      setIsTestingCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      setCameraStream(stream);
      setCameraStatus('granted');
      showToast('Camera access granted! Receipt scanning and camera features active.', 'success');
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraStatus('denied');
      showToast('Camera access was denied or unavailable. Check browser site permissions.', 'error');
    } finally {
      setIsTestingCamera(false);
    }
  };

  const handleStopCameraTest = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
      showToast('Camera test completed', 'info');
    }
  };

  const handleRequestStoragePersistence = async () => {
    try {
      setIsRequestingPersistence(true);
      if (navigator.storage && navigator.storage.persist) {
        const granted = await navigator.storage.persist();
        setIsPersisted(granted);
        if (granted) {
          showToast('Local Storage Persistence granted! Browser will preserve your offline vault permanently.', 'success');
        } else {
          showToast('Storage persistence could not be locked. Normal local storage remains fully active.', 'info');
        }
      } else {
        showToast('Storage persistence API not supported by this browser. Standard local storage is active.', 'info');
      }
      await checkStorage();
    } catch (err: any) {
      showToast('Failed to request persistence: ' + err.message, 'error');
    } finally {
      setIsRequestingPersistence(false);
    }
  };

  return (
    <LiquidGlassCard variant="primary" className="p-5 sm:p-6 space-y-5 border border-slate-200/80 dark:border-white/10 shadow-lg">
      <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20 flex-shrink-0">
            <Smartphone size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hardware & Vault Storage Access
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                Device Permissions
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage camera access for scanning paper receipts and persistent offline vault storage.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Camera Permission Panel */}
        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-blue-500" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Camera Access
                </span>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  cameraStatus === 'granted'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : cameraStatus === 'denied'
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}
              >
                {cameraStatus === 'granted' ? (
                  <>
                    <CheckCircle2 size={12} />
                    <span>Granted</span>
                  </>
                ) : cameraStatus === 'denied' ? (
                  <>
                    <AlertCircle size={12} />
                    <span>Blocked</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={12} />
                    <span>Prompt on Use</span>
                  </>
                )}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Used for receipt camera OCR scanning, barcode reading, and profile photos. Camera frames are processed strictly client-side.
            </p>

            {/* Live Camera Stream Preview if active */}
            {cameraStream && (
              <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 bg-black aspect-video mt-2">
                <video
                  autoPlay
                  playsInline
                  ref={videoEl => {
                    if (videoEl && cameraStream) {
                      videoEl.srcObject = cameraStream;
                    }
                  }}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleStopCameraTest}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black cursor-pointer"
                  title="Close preview"
                >
                  <X size={14} />
                </button>
                <div className="absolute bottom-2 left-2 text-[10px] bg-emerald-500/80 text-white font-mono px-2 py-0.5 rounded-md">
                  Camera Feed Active
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            {cameraStream ? (
              <LiquidButton
                variant="destructive"
                size="sm"
                onClick={handleStopCameraTest}
                className="w-full"
              >
                Stop Camera Test
              </LiquidButton>
            ) : (
              <LiquidButton
                variant="secondary"
                size="sm"
                onClick={handleRequestCamera}
                isLoading={isTestingCamera}
                icon={<Camera size={14} />}
                className="w-full"
              >
                {cameraStatus === 'granted' ? 'Test Camera Feed' : 'Request Camera Permission'}
              </LiquidButton>
            )}
          </div>
        </div>

        {/* Local Storage & Vault Persistence Panel */}
        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive size={18} className="text-purple-500" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Local Vault Storage
                </span>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isPersisted
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                }`}
              >
                <ShieldCheck size={12} />
                <span>{isPersisted ? 'Persistent' : 'Best-Effort'}</span>
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Guarantees all offline loan records, encryption keys, and preferences survive browser cache clears.
            </p>

            {storageUsage && (
              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1">
                <div className="flex justify-between font-medium text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>Vault Storage Allocated:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{storageUsage.usedMB} MB</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full w-[2%]" />
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <LiquidButton
              variant="secondary"
              size="sm"
              onClick={handleRequestStoragePersistence}
              isLoading={isRequestingPersistence}
              icon={<ShieldCheck size={14} className="text-purple-500" />}
              className="w-full"
            >
              {isPersisted ? 'Storage Persistence Active' : 'Lock Persistent Storage'}
            </LiquidButton>
          </div>
        </div>
      </div>
    </LiquidGlassCard>
  );
};
