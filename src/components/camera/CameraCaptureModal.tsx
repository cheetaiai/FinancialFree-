import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RefreshCw, X, Check, ShieldCheck, Upload, AlertCircle } from 'lucide-react';
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
  title = 'AI Camera: Product Pack, MRP & Bill Capture'
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileFallbackRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isShutterActive, setIsShutterActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Bind video element to active media stream
  const attachStreamToVideo = useCallback((mediaStream: MediaStream) => {
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        videoRef.current.muted = true;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsVideoPlaying(true))
            .catch(() => setIsVideoPlaying(false));
        }
      } catch (e) {
        console.warn('Error attaching media stream to video element:', e);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      try {
        stream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
      } catch {}
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsVideoPlaying(false);
  }, [stream]);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    setIsStreamLoading(true);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionStatus('unsupported');
      setCameraError('Web camera API is restricted in this browser mode. Use the Phone Camera button below.');
      setIsStreamLoading(false);
      return;
    }

    // Try environment (back) camera first
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setStream(mediaStream);
      setPermissionStatus('granted');
      setIsStreamLoading(false);
      attachStreamToVideo(mediaStream);
      return;
    } catch (err1: any) {
      console.warn('FacingMode camera failed, trying simple video constraint:', err1);
    }

    // Fallback: simple video constraint
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      setStream(mediaStream);
      setPermissionStatus('granted');
      setIsStreamLoading(false);
      attachStreamToVideo(mediaStream);
    } catch (err2: any) {
      console.warn('Fallback camera access denied or unsupported:', err2);
      setIsStreamLoading(false);
      if (err2.name === 'NotAllowedError' || err2.name === 'PermissionDeniedError' || err2.name === 'SecurityError') {
        setPermissionStatus('denied');
        setCameraError('Live browser webcam permission is blocked. Tap "Open Phone Camera Directly" below to photograph your bill.');
      } else {
        setPermissionStatus('unsupported');
        setCameraError(err2.message || 'Unable to start camera stream. Use native phone camera or file upload.');
      }
    }
  }, [facingMode, stopCamera, attachStreamToVideo]);

  // Synchronize on open/close
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

  // Synchronize stream attachment when video element mounts
  const setVideoElementRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && stream) {
      attachStreamToVideo(stream);
    }
  }, [stream, attachStreamToVideo]);

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
      <div className="space-y-3.5">
        {/* Subtle Camera Notice */}
        <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-[11px] sm:text-xs font-semibold">
              Point camera at product packaging (back MRP tag & details) or store receipt for AI analysis.
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">
            Secure
          </span>
        </div>

        {/* Viewfinder Window */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border border-slate-700/60 shadow-xl aspect-[4/3] flex items-center justify-center">
          {/* Shutter flash animation */}
          {isShutterActive && (
            <motion.div
              initial={{ opacity: 0.95 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-white z-30 pointer-events-none"
            />
          )}

          {/* Captured Image Preview */}
          {capturedPhoto ? (
            <div className="relative w-full h-full">
              <img
                src={capturedPhoto}
                alt="Captured receipt"
                className="w-full h-full object-contain bg-black/70"
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-emerald-600/90 text-white text-[11px] font-bold backdrop-blur-md flex items-center gap-1 shadow-md">
                <Check size={13} />
                <span>Image Captured</span>
              </div>
            </div>
          ) : (
            /* Live Camera Feed Container */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={setVideoElementRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    videoRef.current.play().then(() => setIsVideoPlaying(true)).catch(() => {});
                  }
                }}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  stream && isVideoPlaying ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Viewfinder Guide Overlay */}
              {stream && isVideoPlaying && (
                <>
                  <div className="absolute inset-4 sm:inset-6 pointer-events-none border border-emerald-400/40 rounded-2xl">
                    <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-emerald-400"></div>
                    <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-emerald-400"></div>
                    <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-emerald-400"></div>
                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-emerald-400"></div>
                  </div>

                  <div className="absolute top-3 right-3 z-20">
                    <button
                      type="button"
                      onClick={toggleFacingMode}
                      className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all shadow-md cursor-pointer"
                      title="Switch Camera (Front/Back)"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>

                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/60 text-white/90 text-[10px] backdrop-blur-md font-mono flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Live Scanner Ready</span>
                  </div>
                </>
              )}

              {/* Loading or Permission / Fallback State */}
              {(!stream || !isVideoPlaying) && (
                <div className="absolute inset-0 p-5 text-center text-slate-300 flex flex-col items-center justify-center bg-slate-900/90 z-10">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3">
                    <Camera size={24} className={isStreamLoading ? 'animate-pulse' : ''} />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    {isStreamLoading ? 'Starting Camera Scanner…' : 'Device Camera Access'}
                  </h4>
                  <p className="text-xs text-slate-400 mb-4 max-w-xs leading-relaxed">
                    {cameraError || 'Point camera at receipt or use native phone camera directly.'}
                  </p>

                  <div className="flex flex-col gap-2 w-full max-w-xs">
                    <button
                      type="button"
                      onClick={() => nativeCameraInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      <Camera size={14} />
                      <span>Open Phone Camera Directly</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileFallbackRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer border border-white/10 active:scale-95 transition-all"
                    >
                      <Upload size={14} />
                      <span>Choose from Gallery / Files</span>
                    </button>

                    <button
                      type="button"
                      onClick={startCamera}
                      className="text-[11px] text-emerald-400 hover:underline font-semibold py-1 cursor-pointer transition-colors"
                    >
                      ↻ Reconnect Live Stream
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={nativeCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
          />
          <input
            ref={fileFallbackRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Medium-Sized Bottom Action Controls */}
        <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => nativeCameraInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Camera size={13} className="text-emerald-500" />
              <span>Camera</span>
            </button>
            <button
              type="button"
              onClick={() => fileFallbackRef.current?.click()}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Upload size={13} className="text-blue-500" />
              <span>Gallery</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {capturedPhoto ? (
              <>
                <button
                  type="button"
                  onClick={retakePhoto}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer border border-slate-300 dark:border-white/10"
                >
                  Retake
                </button>
                <button
                  type="button"
                  onClick={confirmPhoto}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer transition-all active:scale-95"
                >
                  <Check size={14} />
                  <span>Use Photo</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={takePhoto}
                disabled={!stream || !isVideoPlaying}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera size={14} />
                <span>Capture Snapshot</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </LiquidModal>
  );
};
