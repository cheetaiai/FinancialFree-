import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : ({} as Record<string, any>);

// New Firebase Web App configuration provided by user
export const firebaseConfig = {
  apiKey: (env.VITE_FIREBASE_API_KEY as string) || "AIzaSyCAiGwtVgGpUj6HfPVtRP9qmAIn3iahJdo",
  authDomain: (env.VITE_FIREBASE_AUTH_DOMAIN as string) || "financialfreestudio.firebaseapp.com",
  projectId: (env.VITE_FIREBASE_PROJECT_ID as string) || "financialfreestudio",
  storageBucket: (env.VITE_FIREBASE_STORAGE_BUCKET as string) || "financialfreestudio.firebasestorage.app",
  messagingSenderId: (env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || "844725196136",
  appId: (env.VITE_FIREBASE_APP_ID as string) || "1:844725196136:web:d76436c027568bf1b2f2dd",
  measurementId: (env.VITE_FIREBASE_MEASUREMENT_ID as string) || "G-J5TVRDYR2G"
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
  sendPasswordResetEmail,
  sendEmailVerification,
  type FirebaseUser
};
