import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import {
  X,
  Camera,
  Upload,
  Flashlight,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowDownLeft,
  Copy,
  CreditCard,
  UserPlus,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useCurrency } from '../../context/CurrencyContext';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScannedReturnLink?: (personId: string, amount?: string, notes?: string, personName?: string) => void;
  onScannedContact?: (name: string, phone?: string) => void;
}

export interface DecodedResult {
  raw: string;
  type: 'financialfree_return' | 'upi' | 'vcard' | 'url' | 'text';
  title: string;
  details: {
    personId?: string;
    personName?: string;
    amount?: string;
    notes?: string;
    upiId?: string;
    url?: string;
    phone?: string;
  };
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScannedReturnLink,
  onScannedContact
}) => {
  const { showToast } = useToast();
  const { formatAmount } = useCurrency();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [decodedResult, setDecodedResult] = useState<DecodedResult | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Play subtle success sound
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
    try {
      if ('vibrate' in navigator) navigator.vibrate([30, 40, 30]);
    } catch {}
  };

  // Start Live Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your current browser.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      // Check flashlight/torch support
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = (track as any).getCapabilities?.();
      if (capabilities && capabilities.torch) {
        setHasTorch(true);
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission denied. Please allow camera access in browser settings, or upload a QR image below.'
          : err.message || 'Unable to access camera.'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setTorchOn(false);
  };

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const nextState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setTorchOn(nextState);
      } catch (e) {
        console.warn('Torch failed:', e);
      }
    }
  };

  // Parse QR string into structured result
  const parseQrData = (data: string): DecodedResult => {
    const trimmed = data.trim();

    // 1. Check for FinancialFree Return Deep Link (?action=return&personId=...)
    if (trimmed.includes('action=return') || trimmed.includes('personId=')) {
      try {
        const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://dummy.com/${trimmed}`);
        const params = urlObj.searchParams;
        const personId = params.get('personId') || '';
        const personName = params.get('name') || '';
        const amount = params.get('amount') || '';
        const notes = params.get('notes') || '';

        return {
          raw: trimmed,
          type: 'financialfree_return',
          title: 'FinancialFree Return Request',
          details: {
            personId,
            personName: personName || 'Borrower Contact',
            amount,
            notes,
            url: trimmed
          }
        };
      } catch {}
    }

    // 2. Check for UPI Payment code (upi://pay?pa=...)
    if (trimmed.startsWith('upi://pay')) {
      try {
        const urlObj = new URL(trimmed);
        const upiId = urlObj.searchParams.get('pa') || '';
        const personName = urlObj.searchParams.get('pn') || '';
        const amount = urlObj.searchParams.get('am') || '';

        return {
          raw: trimmed,
          type: 'upi',
          title: 'UPI Payment Link',
          details: {
            upiId,
            personName,
            amount,
            url: trimmed
          }
        };
      } catch {}
    }

    // 3. Check for vCard
    if (trimmed.startsWith('BEGIN:VCARD')) {
      const fnMatch = trimmed.match(/FN:(.*?)(\r|\n)/);
      const telMatch = trimmed.match(/TEL.*?:(.*?)(\r|\n)/);
      return {
        raw: trimmed,
        type: 'vcard',
        title: 'Contact vCard',
        details: {
          personName: fnMatch ? fnMatch[1].trim() : 'Scanned Contact',
          phone: telMatch ? telMatch[1].trim() : ''
        }
      };
    }

    // 4. Check for general URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return {
        raw: trimmed,
        type: 'url',
        title: 'Web Link',
        details: {
          url: trimmed
        }
      };
    }

    // 5. Default text
    return {
      raw: trimmed,
      type: 'text',
      title: 'Scanned QR Code',
      details: {}
    };
  };

  // Continuous frame analysis
  useEffect(() => {
    if (!isOpen || !stream || decodedResult) return;

    let animId: number;
    const canvas = canvasRef.current;
    const video = videoRef.current;

    const scanFrame = () => {
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });

          if (code && code.data) {
            playBeep();
            const parsed = parseQrData(code.data);
            setDecodedResult(parsed);
            stopCamera();
            return;
          }
        }
      }
      animId = requestAnimationFrame(scanFrame);
    };

    animId = requestAnimationFrame(scanFrame);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen, stream, decodedResult]);

  // Handle Image File Upload Decode
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth'
          });

          setIsProcessingFile(false);
          if (code && code.data) {
            playBeep();
            const parsed = parseQrData(code.data);
            setDecodedResult(parsed);
            stopCamera();
          } else {
            showToast('No QR code detected in the selected image. Please try another image.', 'warning');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Manage open / close state
  useEffect(() => {
    if (isOpen) {
      setDecodedResult(null);
      startCamera();
    } else {
      stopCamera();
      setDecodedResult(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-slate-900 border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Camera size={19} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Scan QR Code</span>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Live
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Aim camera at Return deep link or UPI QR code
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewfinder or Result Area */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col items-center justify-center overflow-y-auto">
          {decodedResult ? (
            /* Result Card */
            <div className="w-full p-4 rounded-2xl bg-slate-800/90 border border-white/10 space-y-3.5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{decodedResult.title}</h4>
                  <span className="text-[11px] text-slate-400">Successfully scanned and decoded</span>
                </div>
              </div>

              {/* Return Deep Link Result Details */}
              {decodedResult.type === 'financialfree_return' && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Borrower:</span>
                    <span className="font-bold text-white">
                      {decodedResult.details.personName || 'Contact'}
                    </span>
                  </div>
                  {decodedResult.details.amount && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Pre-filled Amount:</span>
                      <span className="font-black text-emerald-400 text-sm">
                        {formatAmount(Number(decodedResult.details.amount))}
                      </span>
                    </div>
                  )}
                  {decodedResult.details.notes && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Note:</span>
                      <span className="text-slate-300">{decodedResult.details.notes}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onScannedReturnLink && decodedResult.details.personId) {
                        onScannedReturnLink(
                          decodedResult.details.personId,
                          decodedResult.details.amount,
                          decodedResult.details.notes,
                          decodedResult.details.personName
                        );
                      } else if (decodedResult.details.url) {
                        window.location.href = decodedResult.details.url;
                      }
                    }}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-600/30"
                  >
                    <ArrowDownLeft size={16} />
                    <span>Open Pre-Filled Return Transaction</span>
                  </button>
                </div>
              )}

              {/* UPI Result Details */}
              {decodedResult.type === 'upi' && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">UPI ID:</span>
                    <span className="font-bold text-blue-300 font-mono">
                      {decodedResult.details.upiId}
                    </span>
                  </div>
                  {decodedResult.details.personName && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Payee:</span>
                      <span className="font-bold text-white">{decodedResult.details.personName}</span>
                    </div>
                  )}
                  {decodedResult.details.amount && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Amount:</span>
                      <span className="font-black text-blue-400 text-sm">
                        {formatAmount(Number(decodedResult.details.amount))}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <a
                      href={decodedResult.raw}
                      className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors text-center"
                    >
                      <CreditCard size={14} />
                      <span>Pay via UPI App</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onScannedReturnLink) {
                          onScannedReturnLink(
                            '',
                            decodedResult.details.amount,
                            `UPI to ${decodedResult.details.upiId}`,
                            decodedResult.details.personName
                          );
                        }
                      }}
                      className="py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <ArrowDownLeft size={14} />
                      <span>Record Return</span>
                    </button>
                  </div>
                </div>
              )}

              {/* vCard Result Details */}
              {decodedResult.type === 'vcard' && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Name:</span>
                    <span className="font-bold text-white">{decodedResult.details.personName}</span>
                  </div>
                  {decodedResult.details.phone && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Phone:</span>
                      <span className="text-purple-300 font-mono">{decodedResult.details.phone}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onScannedContact && decodedResult.details.personName) {
                        onScannedContact(decodedResult.details.personName, decodedResult.details.phone);
                      }
                    }}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <UserPlus size={14} />
                    <span>Add to Contacts Directory</span>
                  </button>
                </div>
              )}

              {/* Generic URL / Text */}
              {(decodedResult.type === 'url' || decodedResult.type === 'text') && (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono break-all max-h-36 overflow-y-auto text-slate-300 select-all">
                    {decodedResult.raw}
                  </div>
                  <div className="flex items-center gap-2">
                    {decodedResult.type === 'url' && (
                      <a
                        href={decodedResult.raw}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors text-center"
                      >
                        <ExternalLink size={14} />
                        <span>Open Link</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(decodedResult.raw);
                        showToast('Scanned text copied to clipboard', 'success');
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Copy size={14} />
                      <span>Copy Text</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Scan Another Button */}
              <button
                type="button"
                onClick={() => {
                  setDecodedResult(null);
                  startCamera();
                }}
                className="w-full py-2 px-4 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Scan Another QR Code</span>
              </button>
            </div>
          ) : (
            /* Live Camera Viewfinder */
            <div className="relative w-full aspect-square max-w-[320px] rounded-3xl overflow-hidden bg-black border border-white/20 shadow-2xl flex items-center justify-center">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewfinder Target Overlays */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Dark Vignette Frame */}
                <div className="w-56 h-56 relative rounded-2xl border-2 border-emerald-400/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                  {/* Glowing Laser Scan Bar */}
                  <div className="absolute inset-x-1 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#10b981] animate-bounce" />

                  {/* Corner Target Markers */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-0.5 -ml-0.5 rounded-tl-sm" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-0.5 -mr-0.5 rounded-tr-sm" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 -mb-0.5 -ml-0.5 rounded-bl-sm" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 -mb-0.5 -mr-0.5 rounded-br-sm" />
                </div>
              </div>

              {/* Torch button overlay */}
              {hasTorch && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`absolute top-3 right-3 p-2.5 rounded-full border transition-all cursor-pointer ${
                    torchOn
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/30'
                      : 'bg-black/60 text-white/80 border-white/20 hover:bg-black/80'
                  }`}
                  title="Toggle Flashlight"
                >
                  <Flashlight size={18} />
                </button>
              )}

              {/* Loading or Permission Error fallback */}
              {cameraError && (
                <div className="absolute inset-0 p-5 bg-slate-900/95 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <AlertCircle size={24} />
                  </div>
                  <div className="text-xs text-rose-300 max-w-xs">{cameraError}</div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload size={14} />
                    <span>Upload QR Image Instead</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-slate-800/80 flex items-center justify-between gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingFile}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-white/5"
          >
            <Upload size={14} />
            <span>{isProcessingFile ? 'Decoding Image...' : 'Upload QR Image'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
