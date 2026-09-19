// Web Authentication API (WebAuthn) and Quick Vault PIN Utility for FinancialFree

export interface BiometricSettings {
  enabled: boolean;
  useBiometrics: boolean;
  usePin: boolean;
  pinLength: 4 | 6;
  pinHash: string | null;
  pinSalt: string | null;
  credentialId: string | null;
  credentialName: string | null;
  registeredAt: string | null;
  autoLockTimeout: number; // in seconds: 0 = immediate, 60 = 1min, 300 = 5min, 900 = 15min, -1 = never
  lockOnAppStart: boolean;
  scrambleKeypad?: boolean;
}

const STORAGE_PREFIX = 'financialfree_privacy_lock_';

export function getDefaultBiometricSettings(): BiometricSettings {
  return {
    enabled: false,
    useBiometrics: false,
    usePin: false,
    pinLength: 4,
    pinHash: null,
    pinSalt: null,
    credentialId: null,
    credentialName: null,
    registeredAt: null,
    autoLockTimeout: 0, // default immediate on minimize/blur for mobile banking privacy
    lockOnAppStart: true,
    scrambleKeypad: false,
  };
}

export function loadBiometricSettings(userId?: string): BiometricSettings {
  if (typeof window === 'undefined') return getDefaultBiometricSettings();
  try {
    const key = `${STORAGE_PREFIX}${userId || 'default'}`;
    const raw = localStorage.getItem(key);
    if (!raw) return getDefaultBiometricSettings();
    const parsed = JSON.parse(raw);
    return { ...getDefaultBiometricSettings(), ...parsed };
  } catch (err) {
    console.warn('Failed to load biometric settings:', err);
    return getDefaultBiometricSettings();
  }
}

export function saveBiometricSettings(settings: BiometricSettings, userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `${STORAGE_PREFIX}${userId || 'default'}`;
    localStorage.setItem(key, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save biometric settings:', err);
  }
}

// Check if running inside an iframe (e.g. AI Studio development preview)
export function isRunningInIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

// Safe ArrayBuffer to Base64URL
export function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Safe Base64URL to Uint8Array ArrayBuffer
export function base64UrlToBuffer(base64url: string): ArrayBuffer {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Check if WebAuthn is supported by current browser
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.credentials !== 'undefined' &&
    typeof navigator.credentials.create === 'function' &&
    typeof navigator.credentials.get === 'function'
  );
}

// Check if hardware platform authenticator (Touch ID, Face ID, Android Biometrics, Windows Hello) is available
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    return true;
  } catch {
    return false;
  }
}

// Generate random cryptographic salt
export function generateSalt(): string {
  const array = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 16; i++) array[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Secure SHA-256 PIN hashing with salt using browser Web Crypto
export async function hashPin(pin: string, salt: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    // Basic fallback if subtle crypto is unavailable
    let hash = 0;
    const str = `${salt}:${pin}:financialfree_vault_salt`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${pin}:financialfree_vault_salt_v1`);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPinHash(pin: string, salt: string, expectedHash: string): Promise<boolean> {
  const calculated = await hashPin(pin, salt);
  return calculated === expectedHash;
}

// Register a biometric / passkey credential via WebAuthn API
export async function registerBiometricCredential(
  user: { id: string; email: string },
  customName?: string
): Promise<{ success: boolean; credentialId?: string; credentialName?: string; error?: string }> {
  if (!isWebAuthnSupported()) {
    return {
      success: false,
      error: 'Web Authentication API is not supported in this browser.',
    };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userIdBytes = new TextEncoder().encode(user.id || 'financialfree_user');
    const hostname = window.location.hostname;

    // Build PublicKeyCredentialCreationOptions
    const creationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'FinancialFree Secure Vault',
        // Omit id if running on IP address or raw localhost where rpId might fail
        ...(hostname && hostname !== 'localhost' && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)
          ? { id: hostname }
          : {}),
      },
      user: {
        id: userIdBytes,
        name: user.email || 'user@financialfree.app',
        displayName: (user.email ? user.email.split('@')[0] : 'FinancialFree User'),
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },   // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Enforce on-device biometric sensor
        userVerification: 'preferred',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    };

    let credential: Credential | null = null;

    try {
      credential = await navigator.credentials.create({
        publicKey: creationOptions,
      });
    } catch (attachmentErr: any) {
      // If platform attachment failed (e.g., in some browser emulators), retry without forcing 'platform'
      if (attachmentErr?.name === 'NotSupportedError' || attachmentErr?.message?.includes('platform')) {
        const fallbackOptions: PublicKeyCredentialCreationOptions = {
          ...creationOptions,
          authenticatorSelection: {
            userVerification: 'preferred' as UserVerificationRequirement,
            residentKey: 'preferred' as ResidentKeyRequirement,
          },
        };
        credential = await navigator.credentials.create({
          publicKey: fallbackOptions,
        });
      } else {
        throw attachmentErr;
      }
    }

    if (!credential) {
      return {
        success: false,
        error: 'Biometric credential creation was canceled or not returned.',
      };
    }

    const pubKeyCred = credential as PublicKeyCredential;
    const credentialId = bufferToBase64Url(pubKeyCred.rawId);

    // Detect friendly device name (iOS Face ID, Android Biometrics, Touch ID, Windows Hello)
    const userAgent = navigator.userAgent;
    let detectedName = customName;
    if (!detectedName) {
      if (/iPhone|iPad|iPod/.test(userAgent)) {
        detectedName = 'Apple Face ID / Touch ID';
      } else if (/Android/.test(userAgent)) {
        detectedName = 'Android Fingerprint / Face Unlock';
      } else if (/Macintosh/.test(userAgent)) {
        detectedName = 'Mac Touch ID / Apple Passkey';
      } else if (/Windows/.test(userAgent)) {
        detectedName = 'Windows Hello Biometrics';
      } else {
        detectedName = 'Biometric Passkey';
      }
    }

    return {
      success: true,
      credentialId,
      credentialName: detectedName,
    };
  } catch (err: any) {
    console.error('WebAuthn register error:', err);

    let friendlyMessage = 'Biometric registration failed.';
    if (err?.name === 'NotAllowedError') {
      friendlyMessage =
        'Authentication was canceled or denied by the device security policy.';
    } else if (err?.name === 'InvalidStateError') {
      friendlyMessage = 'This biometric credential is already registered on this device.';
    } else if (err?.name === 'NotSupportedError') {
      friendlyMessage =
        'Platform biometric sensors are not available on this device or in this view mode.';
    } else if (err?.message) {
      friendlyMessage = err.message;
    }

    return {
      success: false,
      error: friendlyMessage,
    };
  }
}

// Authenticate / Verify using WebAuthn credential
export async function authenticateWithBiometrics(
  credentialIdBase64?: string | null
): Promise<{ success: boolean; error?: string }> {
  if (!isWebAuthnSupported()) {
    return {
      success: false,
      error: 'Web Authentication API is not supported on this browser.',
    };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    const hostname = window.location.hostname;

    const requestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      timeout: 60000,
      userVerification: 'preferred',
      ...(hostname && hostname !== 'localhost' && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)
        ? { rpId: hostname }
        : {}),
    };

    // If specific credential ID is registered, pass it in allowCredentials
    if (credentialIdBase64) {
      try {
        requestOptions.allowCredentials = [
          {
            id: base64UrlToBuffer(credentialIdBase64),
            type: 'public-key',
            transports: ['internal'],
          },
        ];
      } catch (convErr) {
        console.warn('Could not parse stored credential ID, attempting discoverable passkey:', convErr);
      }
    }

    const assertion = await navigator.credentials.get({
      publicKey: requestOptions,
    });

    if (!assertion) {
      return {
        success: false,
        error: 'Biometric verification was canceled.',
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error('WebAuthn verification error:', err);

    let friendlyMessage = 'Biometric verification failed.';
    if (err?.name === 'NotAllowedError') {
      friendlyMessage = 'Biometric scan was canceled or timed out.';
    } else if (err?.name === 'SecurityError') {
      friendlyMessage = 'Security policy prevented WebAuthn verification.';
    } else if (err?.message) {
      friendlyMessage = err.message;
    }

    return {
      success: false,
      error: friendlyMessage,
    };
  }
}
