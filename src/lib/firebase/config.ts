import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Validate required environment variables only when Firebase is actually used
function validateFirebaseEnv() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];

  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingVars.length > 0) {
    const errorMessage = `Missing required Firebase environment variables: ${missingVars.join(', ')}`;
    console.error(errorMessage);
    console.error('Make sure your .env.local file contains all required Firebase variables');
    console.error('Current NODE_ENV:', process.env.NODE_ENV);
    console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('FIREBASE')));
    throw new Error(errorMessage);
  }
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase only if no apps exist
let app: any;
try {
  if (getApps().length === 0) {
    // Validate all required environment variables before initializing
    validateFirebaseEnv();
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
} catch (error) {
  console.error('Firebase initialization failed:', error);
  // Don't create fallback app - let it fail properly
  app = null;
}

// Initialize Firebase services only if app is available
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;

// Analytics - only initialize in browser environment
export const analytics = (typeof window !== 'undefined' && app) ? getAnalytics(app) : null;

export default app;