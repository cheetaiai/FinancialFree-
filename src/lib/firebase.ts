import { initializeApp, getApps, getApp } from 'firebase/app';

export const firebaseConfig = {
  apiKey: "AIzaSyDL-B5oHnSA3WixMdnwLgGA2_Q1wRDencQ",
  authDomain: "financialfree-c171e.firebaseapp.com",
  databaseURL: "https://financialfree-c171e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "financialfree-c171e",
  storageBucket: "financialfree-c171e.firebasestorage.app",
  messagingSenderId: "696948243469",
  appId: "1:696948243469:web:35b8aef4e4612c92002944",
  measurementId: "G-24P8GVL131"
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
