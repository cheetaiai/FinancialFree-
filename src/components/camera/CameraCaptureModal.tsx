import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RefreshCw, X, Check, AlertTriangle, ShieldCheck, Zap, Upload } from 'lucide-react';
import { LiquidModal } from '../ui/LiquidModal';
import { LiquidButton } from '../ui/LiquidButton';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
  title?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Camera Receipt & Document Capture'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileFallbackRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isShutterActive, setIsShutterActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);

  // Initialize camera when opened
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPhoto(null);
      setCameraError(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionStatus('unsupported');
      setCameraError('Camera is not supported in this browser window. You can upload an image instead.');
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setStream(mediaStream);
      setPermissionStatus('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionStatus('denied');
        setCameraError('Camera permission was denied. Please allow camera permissions or upload an image.');
      } else {
        setPermissionStatus('unsupported');
        setCameraError(err.message || 'Unable to access device camera.');
      }
    }
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const takePhoto = () => {
    if (!videoRef.current) return;

    setIsShutterActive(true);
    setTimeout(() => setIsShutterActive(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCapturedPhoto(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <LiquidModal isOpen={isOpen} onClose={onClose} title={title} maxWidth="lg">
      <div className="space-y-4">
        {/* Camera Permission Notification Banner */}
        <AnimatePresence>
          {showNotificationBanner && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-blue-500/10 border border-emerald-500/25 text-emerald-950 dark:text-emerald-200 text-xs flex items-start gap-2.5 relative overflow-hidden"
            >
              <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0">
                <ShieldCheck size={16} />
              </div>
              <div className="flex-1 pr-6">
                <div className="font-bold flex items-center gap-1 text-[13px]">
                  Camera Access Notification
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <p className="mt-0.5 text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  FinancialFree uses your device camera locally in your browser to photograph payment receipts, notes, and vouchers for instant transaction verification.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNotificationBanner(false)}
                className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Viewfinder & Capture Window */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-700/50 shadow-2xl aspect-[4/3] flex items-center justify-center">
          {/* Shutter flash animation */}
          {isShutterActive && (
            <motion.div
              initial={{ opacity: 0.95 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-white z-30 pointer-events-none"
            />
          )}

          {capturedPhoto ? (
            /* Captured Image Preview */
            <div className="relative w-full h-full">
              <img
                src={capturedPhoto}
                alt="Captured receipt"
                className="w-full h-full object-contain bg-black/60"
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-emerald-600/90 text-white text-[11px] font-bold backdrop-blur-md flex items-center gap-1 shadow-md">
                <Check size={13} />
                <span>Image Captured</span>
              </div>
            </div>
          ) : stream ? (
            /* Live Camera View */
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder crosshairs / guide */}
              <div className="absolute inset-6 pointer-events-none border border-white/30 rounded-2xl">
                <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-emerald-400"></div>
                <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-emerald-400"></div>
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-emerald-400"></div>
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-emerald-400"></div>
              </div>

              {/* Top controls */}
              <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-all shadow-md cursor-pointer"
                  title="Switch Camera (Front/Back)"
                >
                  <RefreshCw size={15} />
                </button>
              </div>

              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/60 text-white/90 text-[10px] backdrop-blur-md font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live Viewfinder</span>
              </div>
            </div>
          ) : (
            /* Camera Denied / Error / Unsupported State */
            <div className="p-6 text-center text-slate-400 flex flex-col items-center max-w-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-300 mb-3">
                <Camera size={24} />
              </div>
              <div className="text-sm font-semibold text-white mb-1">
                {permissionStatus === 'denied' ? 'Camera Access Required' : 'Live Camera Standby'}
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                {cameraError || 'Allow camera permission to scan receipts or pick an image file.'}
              </p>

              <div className="flex flex-col gap-2 w-full">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Zap size={14} />
                  <span>Request Camera Access</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileFallbackRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload size={14} />
                  <span>Upload Image File</span>
                </button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileFallbackRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Bottom Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => fileFallbackRef.current?.click()}
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 flex items-center gap-1.5 cursor-pointer"
          >
            <Upload size={14} />
            <span>Choose from device storage</span>
          </button>

          <div className="flex items-center gap-2">
            {capturedPhoto ? (
              <>
                <LiquidButton variant="secondary" size="sm" onClick={retakePhoto}>
                  Retake Photo
                </LiquidButton>
                <LiquidButton
                  variant="primary"
                  size="sm"
                  onClick={confirmPhoto}
                  icon={<Check size={16} />}
                >
                  Use This Image
                </LiquidButton>
              </>
            ) : stream ? (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={takePhoto}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Camera size={16} />
                <span>Capture Snapshot</span>
              </motion.button>
            ) : null}
          </div>
        </div>
      </div>
    </LiquidModal>
  );
};
