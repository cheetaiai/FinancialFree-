import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : ({} as Record<string, any>);

export const firebaseConfig = {
  apiKey: (env.VITE_FIREBASE_API_KEY as string) || "",
  authDomain: (env.VITE_FIREBASE_AUTH_DOMAIN as string) || "financialfree-c171e.firebaseapp.com",
  databaseURL: (env.VITE_FIREBASE_DATABASE_URL as string) || "https://financialfree-c171e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: (env.VITE_FIREBASE_PROJECT_ID as string) || "financialfree-c171e",
  storageBucket: (env.VITE_FIREBASE_STORAGE_BUCKET as string) || "financialfree-c171e.firebasestorage.app",
  messagingSenderId: (env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || "696948243469",
  appId: (env.VITE_FIREBASE_APP_ID as string) || "1:696948243469:web:35b8aef4e4612c92002944",
  measurementId: (env.VITE_FIREBASE_MEASUREMENT_ID as string) || "G-24P8GVL131"
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;
let googleProviderInstance: GoogleAuthProvider | null = null;

// Gracefully initialize Firebase only when an API key is provided and valid
if (firebaseConfig.apiKey && firebaseConfig.apiKey.trim().length > 0) {
  try {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(appInstance);
    firestoreInstance = getFirestore(appInstance);
    googleProviderInstance = new GoogleAuthProvider();
    googleProviderInstance.setCustomParameters({ prompt: 'select_account' });
  } catch (err) {
    console.warn('Firebase initialization skipped or failed safely:', err);
  }
}

export const app = appInstance;
export const auth = authInstance;
export const firestore = firestoreInstance;
export const googleProvider = googleProviderInstance;
export const isFirebaseConfigured = !!(authInstance && firestoreInstance);

export {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type FirebaseUser
};


