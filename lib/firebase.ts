import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase configuration
// Uses environment variables for production, falls back to hardcoded values for local dev
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyA9OAufnbJNXe5oVM2g5hLTlUXVXLGBFOQ",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "restaurant-matcher-hoboken.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "restaurant-matcher-hoboken",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "restaurant-matcher-hoboken.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "730734482142",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:730734482142:web:544431899afdbdcd0be84f"
};

// Initialize Firebase (avoid re-initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Cloud Functions
export const functions = getFunctions(app);

// Uncomment this line if you want to use the local emulator during development
// connectFunctionsEmulator(functions, 'localhost', 5001);

export default app;
