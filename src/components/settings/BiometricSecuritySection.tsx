import React, { useState } from 'react';
import {
  Fingerprint,
  ScanFace,
  Lock,
  KeyRound,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Eye,
  Trash2,
  Clock,
  Shuffle
} from 'lucide-react';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidButton } from '../ui/LiquidButton';
import { useBiometricAuth } from '../../context/BiometricAuthContext';
import { useToast } from '../../context/ToastContext';

export const BiometricSecuritySection: React.FC = () => {
  const {
    settings,
    isPlatformAuthAvailable,
    isWebAuthnAvailable,
    isIframe,
    togglePrivacyLock,
    updateSettings,
    setPin,
    removePin,
    registerBiometric,
    removeBiometric,
    authenticateWithBiometrics,
    lockApp,
  } = useBiometricAuth();

  const { showToast } = useToast();

  // PIN modal / form state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinLength, setPinLength] = useState<4 | 6>(settings.pinLength || 4);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Biometric register loading state
  const [isRegisteringBio, setIsRegisteringBio] = useState(false);
  const [isTestingBio, setIsTestingBio] = useState(false);

  const handleOpenPinModal = () => {
    setNewPin('');
    setConfirmPin('');
    setPinError(null);
    setPinLength(settings.pinLength || 4);
    setIsPinModalOpen(true);
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    if (newPin.length !== pinLength) {
      setPinError(`PIN must be exactly ${pinLength} digits.`);
      return;
    }
    if (!/^\d+$/.test(newPin)) {
      setPinError('PIN must contain numbers only.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match. Please re-enter carefully.');
      return;
    }

    const success = await setPin(newPin, pinLength);
    if (success) {
      setIsPinModalOpen(false);
      setNewPin('');
      setConfirmPin('');
    }
  };

  const handleRegisterBiometrics = async () => {
    setIsRegisteringBio(true);
    try {
      const res = await registerBiometric();
      if (!res.success && res.error) {
        showToast(res.error, 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Biometric registration failed.', 'error');
    } finally {
      setIsRegisteringBio(false);
    }
  };

  const handleTestBiometrics = async () => {
    setIsTestingBio(true);
    try {
      const res = await authenticateWithBiometrics();
      if (res.success) {
        showToast('Biometric test passed! Your sensor is fully linked.', 'success');
      } else {
        showToast(res.error || 'Biometric test was not completed.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Biometric test failed.', 'error');
    } finally {
      setIsTestingBio(false);
    }
  };

  return (
    <LiquidGlassCard variant="primary" className="space-y-6">
      {/* Header with status badge */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-500 p-0.5 shadow-md flex items-center justify-center flex-shrink-0">
            <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-emerald-400">
              <Fingerprint size={22} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Biometric & Privacy Lock (WebAuthn)
              </h3>
              {settings.enabled && (settings.pinHash || settings.credentialId) ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active & Armed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">
                  Not Armed
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Secure your financial balances, borrower histories, and lending data with Face ID, Fingerprint, or Quick PIN on mobile and desktop.
            </p>
          </div>
        </div>

        {/* Master Switch and Test Lock button */}
        <div className="flex items-center gap-2">
          {settings.enabled && (settings.pinHash || settings.credentialId) && (
            <LiquidButton
              variant="secondary"
              size="sm"
              onClick={lockApp}
              icon={<Lock size={13} />}
              title="Lock screen right now to test PIN or Biometrics"
            >
              Lock Vault Now
            </LiquidButton>
          )}

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.enabled}
              onChange={(e) => togglePrivacyLock(e.target.checked)}
            />
            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </div>

      {/* Hardware & Sandbox Diagnostic Banner */}
      <div className="p-3.5 rounded-2xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isPlatformAuthAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
          <span className="font-semibold text-slate-800 dark:text-slate-200">Hardware Sensor:</span>
          <span className="text-slate-600 dark:text-slate-400">
            {isPlatformAuthAvailable
              ? 'Face ID / Fingerprint Sensor Detected & Ready'
              : isWebAuthnAvailable
              ? 'WebAuthn Passkey Supported'
              : 'WebAuthn Not Available (Quick PIN Always Ready)'}
          </span>
        </div>

        {isIframe && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
            <Smartphone size={12} />
            <span>Works natively on phones & new tabs</span>
          </div>
        )}
      </div>

      {/* Two Columns: Biometric WebAuthn Card & Quick PIN Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Biometric Passkey (Face ID / Fingerprint) */}
        <div className="p-4 rounded-2xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Fingerprint size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Face ID / Fingerprint
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Web Authentication API (FIDO2)
                  </span>
                </div>
              </div>

              {settings.credentialId ? (
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Linked
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-500/10 text-slate-500 dark:text-slate-400">
                  Not Linked
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Authenticate instantly using the biometric sensor inside your iPhone, Android phone, iPad, or Mac/Windows PC without typing passwords.
            </p>

            {settings.credentialId && (
              <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-1">
                <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>Registered Device:</span>
                  <span className="text-emerald-500 font-mono text-[10px]">Hardware Secure Enclave</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {settings.credentialName || 'Biometric Passkey'}
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center gap-2 flex-wrap">
            {settings.credentialId ? (
              <>
                <LiquidButton
                  variant="secondary"
                  size="sm"
                  onClick={handleTestBiometrics}
                  isLoading={isTestingBio}
                  icon={<ScanFace size={13} />}
                >
                  Test Biometric Sensor
                </LiquidButton>

                <button
                  onClick={() => {
                    if (window.confirm('Remove this biometric credential from your vault?')) {
                      removeBiometric();
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <Trash2 size={13} />
                  <span>Unlink</span>
                </button>
              </>
            ) : (
              <LiquidButton
                variant="primary"
                size="sm"
                onClick={handleRegisterBiometrics}
                isLoading={isRegisteringBio}
                icon={<Fingerprint size={14} />}
              >
                Link Face ID / Fingerprint
              </LiquidButton>
            )}
          </div>
        </div>

        {/* 2. Quick Vault PIN */}
        <div className="p-4 rounded-2xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Quick Vault PIN
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    4 or 6-digit numeric passcode
                  </span>
                </div>
              </div>

              {settings.pinHash ? (
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {settings.pinLength || 4}-Digit PIN Set
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-500/10 text-slate-500 dark:text-slate-400">
                  Not Configured
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              A tactile keypad PIN serves as instant mobile access and guaranteed fallback when biometrics are unavailable or in low lighting.
            </p>

            {settings.pinHash && (
              <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Encryption:</span>
                <span className="font-mono text-emerald-500 font-semibold">SHA-256 with Unique Salt</span>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center gap-2 flex-wrap">
            <LiquidButton
              variant={settings.pinHash ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleOpenPinModal}
              icon={<KeyRound size={13} />}
            >
              {settings.pinHash ? 'Change Vault PIN' : 'Set Up Quick PIN'}
            </LiquidButton>

            {settings.pinHash && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to remove your Quick PIN?')) {
                    removePin();
                  }
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <Trash2 size={13} />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Auto-Lock Settings & Policies */}
      <div className="p-4 rounded-2xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Clock size={13} />
          <span>Auto-Lock & Mobile Privacy Rules</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Timeout Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Lock Application After:
            </label>
            <select
              value={settings.autoLockTimeout}
              onChange={(e) => updateSettings({ autoLockTimeout: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value={0}>Immediately on minimize / background (Banking Grade)</option>
              <option value={60}>After 1 minute of inactivity</option>
              <option value={300}>After 5 minutes of inactivity</option>
              <option value={900}>After 15 minutes of inactivity</option>
              <option value={-1}>Only upon closing / fresh launch</option>
            </select>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Recommended: Immediately to safeguard private ledger records if you switch apps.
            </p>
          </div>

          {/* Keypad Scramble Option */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Shoulder-Surfing Defense:
            </label>
            <div className="flex items-center justify-between p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Shuffle size={14} className="text-blue-500" />
                <span className="text-xs text-slate-700 dark:text-slate-300">Scramble Keypad Numbers</span>
              </div>
              <input
                type="checkbox"
                checked={settings.scrambleKeypad || false}
                onChange={(e) => updateSettings({ scrambleKeypad: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Randomizes keypad positions on each lock screen display to prevent trace detection.
            </p>
          </div>
        </div>
      </div>

      {/* Modal: Setup / Change PIN */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {settings.pinHash ? 'Change Quick Vault PIN' : 'Set Up Quick Vault PIN'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Choose a 4 or 6-digit numeric passcode
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePin} className="space-y-4">
              {/* PIN Length choice */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">PIN Length:</span>
                <button
                  type="button"
                  onClick={() => {
                    setPinLength(4);
                    setNewPin('');
                    setConfirmPin('');
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    pinLength === 4
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  4 Digits (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPinLength(6);
                    setNewPin('');
                    setConfirmPin('');
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    pinLength === 6
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  6 Digits (Extra Secure)
                </button>
              </div>

              {/* Enter PIN */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Enter {pinLength}-Digit PIN:
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={pinLength}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, pinLength))}
                  placeholder="••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-center text-lg tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              {/* Confirm PIN */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Confirm {pinLength}-Digit PIN:
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={pinLength}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, pinLength))}
                  placeholder="••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-center text-lg tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {pinError && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-1.5 font-medium">
                  <AlertTriangle size={14} className="flex-shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <LiquidButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPinModalOpen(false)}
                >
                  Cancel
                </LiquidButton>
                <LiquidButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={newPin.length !== pinLength || confirmPin.length !== pinLength}
                  icon={<CheckCircle2 size={14} />}
                >
                  Save PIN Code
                </LiquidButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </LiquidGlassCard>
  );
};
