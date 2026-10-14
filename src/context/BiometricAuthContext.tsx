import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import {
  BiometricSettings,
  loadBiometricSettings,
  saveBiometricSettings,
  getDefaultBiometricSettings,
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  registerBiometricCredential,
  authenticateWithBiometrics as verifyWebAuthnCredential,
  hashPin,
  verifyPinHash,
  generateSalt,
  isRunningInIframe
} from '../lib/biometrics';

interface BiometricAuthContextType {
  isLocked: boolean;
  settings: BiometricSettings;
  isPlatformAuthAvailable: boolean;
  isWebAuthnAvailable: boolean;
  isIframe: boolean;
  hasSecurityConfigured: boolean;
  lockApp: () => void;
  unlockApp: () => void;
  verifyPin: (pin: string) => Promise<{ success: boolean; error?: string; remainingAttempts?: number }>;
  setPin: (pin: string, length?: 4 | 6) => Promise<boolean>;
  removePin: () => void;
  registerBiometric: (customName?: string) => Promise<{ success: boolean; error?: string }>;
  removeBiometric: () => void;
  authenticateWithBiometrics: () => Promise<{ success: boolean; error?: string }>;
  togglePrivacyLock: (enable: boolean) => void;
  updateSettings: (partial: Partial<BiometricSettings>) => void;
  failedPinAttempts: number;
  isLockedOut: boolean;
  lockoutRemainingSeconds: number;
}

const BiometricAuthContext = createContext<BiometricAuthContextType | undefined>(undefined);

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_SECONDS = 30;

export const BiometricAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [settings, setSettings] = useState<BiometricSettings>(() => {
    return loadBiometricSettings(user?.id);
  });

  const [isPlatformAuthAvailable, setIsPlatformAuthAvailable] = useState(false);
  const [isWebAuthnAvailable, setIsWebAuthnAvailable] = useState(false);
  const isIframe = isRunningInIframe();

  // Locked state: if privacy lock is enabled and either biometrics or PIN is configured, lock on app start
  const hasSecurityConfigured = settings.enabled && (Boolean(settings.pinHash) || Boolean(settings.credentialId));
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return hasSecurityConfigured && settings.lockOnAppStart;
  });

  // Lockout protection against brute-force PIN attempts
  const [failedPinAttempts, setFailedPinAttempts] = useState(0);
  const [lockoutRemainingSeconds, setLockoutRemainingSeconds] = useState(0);
  const isLockedOut = lockoutRemainingSeconds > 0;

  const lastHiddenTimeRef = useRef<number | null>(null);

  // Load user-specific settings whenever user changes
  useEffect(() => {
    if (user?.id) {
      const userSettings = loadBiometricSettings(user.id);
      setSettings(userSettings);
      if (userSettings.enabled && (userSettings.pinHash || userSettings.credentialId) && userSettings.lockOnAppStart) {
        setIsLocked(true);
      }
    }
  }, [user?.id]);

  // Check hardware biometrics availability on mount
  useEffect(() => {
    setIsWebAuthnAvailable(isWebAuthnSupported());
    isPlatformAuthenticatorAvailable().then((available) => {
      setIsPlatformAuthAvailable(available);
    });
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutRemainingSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemainingSeconds]);

  // Mobile App auto-lock on blur, backgrounding, or tab switch
  useEffect(() => {
    if (!isAuthenticated || !settings.enabled) return;
    if (!settings.pinHash && !settings.credentialId) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        lastHiddenTimeRef.current = Date.now();
        // If immediate timeout (0 seconds), lock right away on minimize
        if (settings.autoLockTimeout === 0) {
          setIsLocked(true);
        }
      } else if (document.visibilityState === 'visible') {
        if (lastHiddenTimeRef.current && settings.autoLockTimeout > 0) {
          const elapsedSeconds = (Date.now() - lastHiddenTimeRef.current) / 1000;
          if (elapsedSeconds >= settings.autoLockTimeout) {
            setIsLocked(true);
          }
        }
        lastHiddenTimeRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, settings.enabled, settings.autoLockTimeout, settings.pinHash, settings.credentialId]);

  // Lock and Unlock handlers
  const lockApp = useCallback(() => {
    setIsLocked(true);
  }, []);

  const unlockApp = useCallback(() => {
    setIsLocked(false);
    setFailedPinAttempts(0);
    setLockoutRemainingSeconds(0);
  }, []);

  // Update Settings helper
  const updateSettings = useCallback(
    (partial: Partial<BiometricSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial };
        saveBiometricSettings(next, user?.id);
        return next;
      });
    },
    [user?.id]
  );

  const togglePrivacyLock = useCallback(
    (enable: boolean) => {
      updateSettings({ enabled: enable });
      if (!enable) {
        setIsLocked(false);
      }
    },
    [updateSettings]
  );

  // Set or change PIN
  const setPin = useCallback(
    async (pin: string, length: 4 | 6 = 4): Promise<boolean> => {
      try {
        const salt = generateSalt();
        const hash = await hashPin(pin, salt);
        updateSettings({
          enabled: true,
          usePin: true,
          pinLength: length,
          pinHash: hash,
          pinSalt: salt,
        });
        showToast('Vault Quick PIN successfully updated!', 'success');
        return true;
      } catch (err) {
        console.error('Failed to set PIN:', err);
        showToast('Failed to save PIN. Please try again.', 'error');
        return false;
      }
    },
    [updateSettings, showToast]
  );

  const removePin = useCallback(() => {
    updateSettings({
      usePin: false,
      pinHash: null,
      pinSalt: null,
    });
    showToast('PIN removed from vault settings.', 'info');
  }, [updateSettings, showToast]);

  // Verify PIN with lockout protection
  const verifyPin = useCallback(
    async (pin: string): Promise<{ success: boolean; error?: string; remainingAttempts?: number }> => {
      if (isLockedOut) {
        return {
          success: false,
          error: `Too many failed attempts. Vault locked for ${lockoutRemainingSeconds}s.`,
        };
      }

      if (!settings.pinHash || !settings.pinSalt) {
        return { success: false, error: 'No PIN is configured on this device.' };
      }

      const isValid = await verifyPinHash(pin, settings.pinSalt, settings.pinHash);

      if (isValid) {
        unlockApp();
        return { success: true };
      } else {
        const newAttempts = failedPinAttempts + 1;
        setFailedPinAttempts(newAttempts);

        if (newAttempts >= MAX_FAILED_ATTEMPTS) {
          setLockoutRemainingSeconds(LOCKOUT_DURATION_SECONDS);
          return {
            success: false,
            error: `Maximum attempts exceeded. Locked for ${LOCKOUT_DURATION_SECONDS} seconds.`,
            remainingAttempts: 0,
          };
        }

        const remaining = MAX_FAILED_ATTEMPTS - newAttempts;
        return {
          success: false,
          error: `Incorrect PIN. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`,
          remainingAttempts: remaining,
        };
      }
    },
    [isLockedOut, lockoutRemainingSeconds, settings.pinHash, settings.pinSalt, failedPinAttempts, unlockApp]
  );

  // Register WebAuthn Biometric / Passkey
  const registerBiometric = useCallback(
    async (customName?: string): Promise<{ success: boolean; error?: string }> => {
      if (!user) {
        return { success: false, error: 'You must be logged in to register biometrics.' };
      }

      const result = await registerBiometricCredential(
        { id: user.id, email: user.email },
        customName
      );

      if (result.success && result.credentialId) {
        updateSettings({
          enabled: true,
          useBiometrics: true,
          credentialId: result.credentialId,
          credentialName: result.credentialName || 'Biometric Passkey',
          registeredAt: new Date().toISOString(),
        });
        showToast(
          `Biometric sensor (${result.credentialName || 'Passkey'}) registered successfully!`,
          'success'
        );
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Registration failed.' };
      }
    },
    [user, updateSettings, showToast]
  );

  const removeBiometric = useCallback(() => {
    updateSettings({
      useBiometrics: false,
      credentialId: null,
      credentialName: null,
      registeredAt: null,
    });
    showToast('Biometric passkey removed from this device.', 'info');
  }, [updateSettings, showToast]);

  // Authenticate with WebAuthn Biometrics
  const authenticateWithBiometrics = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    const result = await verifyWebAuthnCredential(settings.credentialId);
    if (result.success) {
      unlockApp();
      return { success: true };
    }
    return { success: false, error: result.error };
  }, [settings.credentialId, unlockApp]);

  return (
    <BiometricAuthContext.Provider
      value={{
        isLocked,
        settings,
        isPlatformAuthAvailable,
        isWebAuthnAvailable,
        isIframe,
        hasSecurityConfigured,
        lockApp,
        unlockApp,
        verifyPin,
        setPin,
        removePin,
        registerBiometric,
        removeBiometric,
        authenticateWithBiometrics,
        togglePrivacyLock,
        updateSettings,
        failedPinAttempts,
        isLockedOut,
        lockoutRemainingSeconds,
      }}
    >
      {children}
    </BiometricAuthContext.Provider>
  );
};

export const useBiometricAuth = (): BiometricAuthContextType => {
  const context = useContext(BiometricAuthContext);
  if (!context) {
    throw new Error('useBiometricAuth must be used within a BiometricAuthProvider');
  }
  return context;
};
