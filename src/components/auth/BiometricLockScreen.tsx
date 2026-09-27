import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Fingerprint,
  ScanFace,
  Lock,
  ShieldCheck,
  Delete,
  RotateCcw,
  Sparkles,
  KeyRound,
  LogOut,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useBiometricAuth } from '../../context/BiometricAuthContext';
import { useAuth } from '../../context/AuthContext';
import { AppLogo } from '../common/AppLogo';

export const BiometricLockScreen: React.FC = () => {
  const {
    settings,
    verifyPin,
    authenticateWithBiometrics,
    isLockedOut,
    lockoutRemainingSeconds,
    failedPinAttempts,
    isPlatformAuthAvailable,
    isIframe
  } = useBiometricAuth();

  const { user, logout } = useAuth();

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [shake, setShake] = useState(false);
  const [activeTab, setActiveTab] = useState<'pin' | 'biometric'>(() => {
    // If biometrics is configured and available, start on biometric or PIN based on config
    return settings.useBiometrics && settings.credentialId ? 'biometric' : 'pin';
  });

  const pinTargetLength = settings.pinLength || 4;

  // Keypad order (optionally scrambled for banking-level security)
  const keypadNumbers = useMemo(() => {
    const base = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    if (settings.scrambleKeypad) {
      return [...base].sort(() => Math.random() - 0.5);
    }
    return base;
  }, [settings.scrambleKeypad]);

  // Attempt biometrics on initial mount if biometric tab is active
  useEffect(() => {
    if (activeTab === 'biometric' && settings.useBiometrics && settings.credentialId) {
      // Small timeout to allow render completion
      const timer = setTimeout(() => {
        handleBiometricAuth();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const handleBiometricAuth = async () => {
    setErrorMsg(null);
    setIsVerifying(true);
    try {
      const res = await authenticateWithBiometrics();
      if (!res.success) {
        if (res.error) {
          setErrorMsg(res.error);
        }
        // Fall back automatically to PIN view if biometrics cancelled or failed
        if (settings.pinHash) {
          setActiveTab('pin');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Biometric scan was canceled.');
      if (settings.pinHash) {
        setActiveTab('pin');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyPress = async (num: number) => {
    if (isLockedOut || isVerifying) return;
    setErrorMsg(null);

    const nextPin = enteredPin + num;
    if (nextPin.length <= pinTargetLength) {
      setEnteredPin(nextPin);

      // Auto-submit once full PIN length reached
      if (nextPin.length === pinTargetLength) {
        setIsVerifying(true);
        const result = await verifyPin(nextPin);
        setIsVerifying(false);

        if (!result.success) {
          setShake(true);
          setErrorMsg(result.error || 'Incorrect PIN code');
          setEnteredPin('');
          setTimeout(() => setShake(false), 500);
        }
      }
    }
  };

  const handleBackspace = () => {
    if (isLockedOut || isVerifying) return;
    setErrorMsg(null);
    setEnteredPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (isLockedOut || isVerifying) return;
    setErrorMsg(null);
    setEnteredPin('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl px-4 py-6 overflow-y-auto selection:bg-blue-500 selection:text-white">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-sm relative z-10 flex flex-col items-center text-center space-y-6 liquid-glass-card liquid-glass-specular p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-2xl"
      >
        {/* Top Vault Brand & Lock Icon */}
        <div className="flex flex-col items-center space-y-2">
          <div className="relative">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-slate-900 to-slate-800 border border-emerald-500/30 shadow-2xl flex items-center justify-center p-3 relative overflow-hidden group">
              <AppLogo size="md" />
              <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 border-2 border-slate-950 flex items-center justify-center text-white shadow-md">
              <Lock size={11} />
            </div>
          </div>

          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
              <span>FinancialFree Vault</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {user?.email ? user.email : 'Personal Ledger Protected'}
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Hardware Biometric & PIN Security</span>
          </div>
        </div>

        {/* Tab Toggle if both Biometrics and PIN are enabled */}
        {settings.useBiometrics && settings.credentialId && settings.pinHash && (
          <div className="flex items-center p-1 rounded-2xl bg-white/5 border border-white/10 w-full max-w-xs">
            <button
              onClick={() => {
                setActiveTab('biometric');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-target ${
                activeTab === 'biometric'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Fingerprint size={15} />
              <span>Biometric</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('pin');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-target ${
                activeTab === 'pin'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound size={15} />
              <span>Quick PIN</span>
            </button>
          </div>
        )}

        {/* Biometric View */}
        {activeTab === 'biometric' && settings.useBiometrics && settings.credentialId ? (
          <div className="w-full space-y-6 flex flex-col items-center">
            <div className="relative">
              <button
                onClick={handleBiometricAuth}
                disabled={isVerifying}
                className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600/25 via-emerald-600/25 to-teal-500/25 border-2 border-emerald-500/50 hover:border-emerald-400 flex items-center justify-center text-emerald-400 shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer group touch-target"
                title="Tap to verify Face ID / Fingerprint"
              >
                <div className="relative">
                  <Fingerprint
                    size={48}
                    className={`transition-transform group-hover:scale-110 ${
                      isVerifying ? 'animate-pulse text-blue-400' : 'text-emerald-400'
                    }`}
                  />
                  {isVerifying && (
                    <motion.div
                      className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 rounded-full shadow-lg shadow-emerald-400/50"
                      animate={{ y: [0, 48, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                </div>
              </button>

              <div className="absolute -inset-3 rounded-full border border-emerald-500/30 animate-ping pointer-events-none opacity-50" />
            </div>

            <div className="space-y-1">
              <div className="text-sm font-bold text-white">
                {isVerifying ? 'Scanning Biometrics...' : 'Touch sensor or glance at screen'}
              </div>
              <p className="text-xs text-slate-400 max-w-xs">
                {settings.credentialName || 'Apple Face ID / Android Fingerprint'}
              </p>
            </div>

            <button
              onClick={handleBiometricAuth}
              disabled={isVerifying}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-2 min-h-[44px] touch-target"
            >
              <ScanFace size={16} />
              <span>Tap to Scan Biometrics</span>
            </button>

            {settings.pinHash && (
              <button
                onClick={() => setActiveTab('pin')}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4 cursor-pointer min-h-[44px] inline-flex items-center"
              >
                Or unlock using your 4-digit PIN
              </button>
            )}
          </div>
        ) : (
          /* Numeric Keypad PIN View */
          <div className="w-full space-y-5 flex flex-col items-center">
            {/* PIN Dots Indicator */}
            <motion.div
              animate={shake ? { x: [-14, 14, -10, 10, -6, 6, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-center gap-3.5 py-1"
            >
              {Array.from({ length: pinTargetLength }).map((_, index) => {
                const isFilled = index < enteredPin.length;
                return (
                  <motion.div
                    key={index}
                    initial={false}
                    animate={{
                      scale: isFilled ? 1.3 : 1,
                      backgroundColor: isFilled ? '#10b981' : 'transparent',
                    }}
                    transition={{ type: 'spring', stiffness: 600, damping: 28 }}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                      isFilled
                        ? 'border-emerald-400 bg-emerald-500 shadow-lg shadow-emerald-500/60 ring-2 ring-emerald-500/30'
                        : 'border-slate-600 bg-slate-900/40'
                    }`}
                  />
                );
              })}
            </motion.div>

            {/* Lockout status or instructions */}
            {isLockedOut ? (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5">
                <AlertCircle size={14} />
                <span>Locked out. Retry in {lockoutRemainingSeconds} seconds</span>
              </div>
            ) : (
              <div className="text-xs text-slate-400">
                {errorMsg ? (
                  <span className="text-red-400 font-medium">{errorMsg}</span>
                ) : (
                  <span>Enter your {pinTargetLength}-digit Quick Vault PIN</span>
                )}
              </div>
            )}

            {/* Responsive Numeric Keypad with Liquid Glass Styling */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
              {keypadNumbers.map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(15);
                    handleKeyPress(num);
                  }}
                  disabled={isLockedOut || isVerifying || enteredPin.length >= pinTargetLength}
                  className="h-14 rounded-2xl liquid-glass-secondary border border-white/10 hover:border-emerald-400/40 active:scale-95 active:bg-emerald-500/20 text-white font-bold text-xl flex items-center justify-center transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:pointer-events-none touch-target"
                >
                  {num}
                </button>
              ))}

              {/* Bottom Row: Clear / Biometric, 0, Backspace */}
              {settings.useBiometrics && settings.credentialId ? (
                <button
                  onClick={() => {
                    setActiveTab('biometric');
                    handleBiometricAuth();
                  }}
                  className="h-14 rounded-2xl liquid-glass-secondary border border-blue-500/25 hover:border-blue-400/50 active:scale-95 text-blue-400 font-semibold text-xs flex flex-col items-center justify-center transition-all cursor-pointer touch-target"
                  title="Switch to Biometric Scan"
                >
                  <Fingerprint size={20} />
                  <span className="text-[10px] mt-0.5">Scan</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(10);
                    handleClear();
                  }}
                  disabled={isLockedOut || enteredPin.length === 0}
                  className="h-14 rounded-2xl liquid-glass-secondary border border-white/10 hover:border-white/20 active:scale-95 text-slate-400 hover:text-white font-medium text-xs flex flex-col items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none touch-target"
                >
                  <RotateCcw size={16} />
                  <span className="text-[10px] mt-0.5">Clear</span>
                </button>
              )}

              <button
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(15);
                  handleKeyPress(0);
                }}
                disabled={isLockedOut || isVerifying || enteredPin.length >= pinTargetLength}
                className="h-14 rounded-2xl liquid-glass-secondary border border-white/10 hover:border-emerald-400/40 active:scale-95 active:bg-emerald-500/20 text-white font-bold text-xl flex items-center justify-center transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:pointer-events-none touch-target"
              >
                0
              </button>

              <button
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(15);
                  handleBackspace();
                }}
                disabled={isLockedOut || enteredPin.length === 0}
                className="h-14 rounded-2xl liquid-glass-secondary border border-white/10 hover:border-white/20 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none touch-target"
                title="Delete"
              >
                <Delete size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Emergency Escape Fallback */}
        <div className="pt-2 border-t border-white/10 w-full flex items-center justify-between text-xs text-slate-400">
          <button
            onClick={() => {
              if (window.confirm('Sign out of your account on this device?')) {
                logout();
              }
            }}
            className="text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <LogOut size={13} />
            <span>Sign Out / Switch Account</span>
          </button>

          {isIframe && (
            <span className="text-[10px] text-slate-500 font-mono" title="Preview Sandbox">
              In-Iframe Preview
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
};
