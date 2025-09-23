import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Get Firebase configuration with proper environment variable validation
export function getFirebaseConfig() {
  const isClient = typeof window !== 'undefined';

  // SECURITY: Never use hardcoded API keys - always require environment variables
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  };

  // Log environment variable status for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Firebase config loaded:', {
      context: isClient ? 'client' : 'server',
      hasEnvVars: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      configComplete: Object.values(config).every(val => val && val !== 'undefined'),
      config: {
        ...config,
        apiKey: config.apiKey ? `${config.apiKey.slice(0, 10)}...` : '[MISSING]'
      }
    });
  }

  return config;
}

// Firebase configuration object
const firebaseConfig = getFirebaseConfig();

// Validate Firebase configuration with more robust checking
function validateFirebaseEnv() {
  const requiredFields = [
    { key: 'apiKey', value: firebaseConfig.apiKey },
    { key: 'authDomain', value: firebaseConfig.authDomain },
    { key: 'projectId', value: firebaseConfig.projectId },
    { key: 'storageBucket', value: firebaseConfig.storageBucket },
    { key: 'messagingSenderId', value: firebaseConfig.messagingSenderId },
    { key: 'appId', value: firebaseConfig.appId }
  ];

  const missingFields = requiredFields.filter(field =>
    !field.value ||
    field.value === 'undefined' ||
    field.value === '' ||
    field.value.length < 5  // Basic sanity check for valid values
  );

  if (missingFields.length > 0) {
    const isClient = typeof window !== 'undefined';
    const errorMessage = `Firebase configuration validation failed: ${missingFields.map(f => f.key).join(', ')}`;

    console.error(errorMessage);
    console.error('Configuration details:', {
      context: isClient ? 'client' : 'server',
      nodeEnv: process.env.NODE_ENV,
      config: {
        ...firebaseConfig,
        apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.slice(0, 10)}...` : '[MISSING]'
      },
      envVarsPresent: {
        apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID
      }
    });

    // SECURITY: Never allow missing environment variables in any environment
    // This prevents accidental deployment without proper configuration

    throw new Error(errorMessage);
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('Firebase configuration validated successfully');
  }
}

// Cached Firebase instances
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;

// Initialize Firebase app with lazy loading
function initializeFirebaseApp(): FirebaseApp {
  if (app) {
    return app;
  }

  try {
    // Check if Firebase app already exists
    if (getApps().length > 0) {
      app = getApps()[0];
      return app;
    }

    // Validate configuration before initialization
    validateFirebaseEnv();

    // Initialize Firebase app with validated config
    if (process.env.NODE_ENV === 'development') {
      console.log('Initializing Firebase with config:', {
        ...firebaseConfig,
        apiKey: firebaseConfig.apiKey ? '[SET]' : '[MISSING]'
      });
    }

    app = initializeApp(firebaseConfig);

    if (process.env.NODE_ENV === 'development') {
      console.log('Firebase app initialized successfully');
    }
    return app;
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    console.error('Config used:', firebaseConfig);
    throw error;
  }
}

// Lazy getters for Firebase services
export function getFirebaseAuth(): Auth {
  if (!auth) {
    try {
      const firebaseApp = initializeFirebaseApp();
      auth = getAuth(firebaseApp);
      if (process.env.NODE_ENV === 'development') {
        console.log('Firebase Auth initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize Firebase Auth:', error);
      throw error;
    }
  }
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    const firebaseApp = initializeFirebaseApp();
    db = getFirestore(firebaseApp);
  }
  return db;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    const firebaseApp = initializeFirebaseApp();
    storage = getStorage(firebaseApp);
  }
  return storage;
}

export function getFirebaseAnalytics(): Analytics | null {
  // Only initialize analytics in browser environment
  if (typeof window === 'undefined') {
    return null;
  }

  if (!analytics) {
    try {
      const firebaseApp = initializeFirebaseApp();
      analytics = getAnalytics(firebaseApp);
    } catch (error) {
      console.warn('Failed to initialize Firebase Analytics:', error);
      return null;
    }
  }
  return analytics;
}

// Backward compatibility exports (deprecated - use function getters instead)
export { getFirebaseAuth as auth };
export { getFirebaseDb as db };
export { getFirebaseStorage as storage };

// Export the app getter
export function getFirebaseApp(): FirebaseApp {
  return initializeFirebaseApp();
}

export default getFirebaseApp;