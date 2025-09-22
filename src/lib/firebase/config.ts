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

// Fallback Firebase config if environment variables aren't loaded
const fallbackConfig = {
  apiKey: 'AIzaSyDdxMA4viuO0wPMczGH7grn9r3dfh9RjWQ',
  authDomain: 'piktor-app.firebaseapp.com',
  projectId: 'piktor-app',
  storageBucket: 'piktor-app.firebasestorage.app',
  messagingSenderId: '906790513286',
  appId: '1:906790513286:web:15d9388385f3fd200c3f07',
  measurementId: 'G-1GX72CF6CH'
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || fallbackConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || fallbackConfig.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || fallbackConfig.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || fallbackConfig.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || fallbackConfig.appId,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || fallbackConfig.measurementId
};

// Initialize Firebase only if no apps exist
let app: any;
try {
  // Only validate when actually initializing Firebase and env vars are missing
  if (getApps().length === 0) {
    const missingVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID'
    ].filter(envVar => !process.env[envVar]);

    if (missingVars.length > 0) {
      console.warn(`Using fallback Firebase config. Missing env vars: ${missingVars.join(', ')}`);
    }

    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
} catch (error) {
  console.error('Firebase initialization failed:', error);
  // Create a minimal app instance to prevent errors
  app = null;
}

// Initialize Firebase services only if app is available
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;

// Analytics - only initialize in browser environment
export const analytics = (typeof window !== 'undefined' && app) ? getAnalytics(app) : null;

export default app;