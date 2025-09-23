import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin SDK with better error handling and logging
function initializeFirebaseAdmin() {
  console.log('[FirebaseAdmin] Starting initialization...');

  if (getApps().length > 0) {
    console.log('[FirebaseAdmin] Using existing Firebase admin app');
    return getApps()[0];
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'piktor-app';
  console.log('[FirebaseAdmin] Project ID:', projectId);

  try {
    // Check if running with emulator first
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      console.log('[FirebaseAdmin] Using Firebase Admin SDK with emulator');
      return initializeApp({
        projectId: projectId
      });
    }

    // Validate environment variables
    const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;
    const hasClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL;

    console.log('[FirebaseAdmin] Environment check:', {
      hasPrivateKey,
      hasClientEmail,
      projectId,
      nodeEnv: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
      isProduction: process.env.NODE_ENV === 'production'
    });

    // Use service account credentials if available (both dev and production)
    if (hasPrivateKey && hasClientEmail) {
      console.log('[FirebaseAdmin] Initializing with service account credentials');

      // Clean and validate private key
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      if (privateKey) {
        // Replace literal \n with actual newlines
        privateKey = privateKey.replace(/\\n/g, '\n');

        // Validate private key format
        if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
          throw new Error('Invalid private key format - missing BEGIN marker');
        }
        if (!privateKey.includes('-----END PRIVATE KEY-----')) {
          throw new Error('Invalid private key format - missing END marker');
        }
      }

      const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;

      console.log('[FirebaseAdmin] Storage bucket:', storageBucket);

      const app = initializeApp({
        credential: cert({
          projectId: projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        projectId: projectId,
        storageBucket: storageBucket
      });

      console.log('[FirebaseAdmin] Successfully initialized with service account');
      return app;
    }

    // Fallback to default credentials if no service account
    console.log('[FirebaseAdmin] Attempting to use default credentials');
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;

    const app = initializeApp({
      credential: applicationDefault(),
      projectId: projectId,
      storageBucket: storageBucket
    });

    console.log('[FirebaseAdmin] Successfully initialized with default credentials');
    return app;
  } catch (error) {
    console.error('[FirebaseAdmin] Initialization failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      projectId,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    });
    throw error;
  }
}

// Initialize the admin app with better error handling
let adminApp: any = null;
let adminInitError: Error | null = null;

try {
  adminApp = initializeFirebaseAdmin();
  console.log('[FirebaseAdmin] Admin app initialized successfully');
} catch (error) {
  console.error('[FirebaseAdmin] Failed to initialize admin app:', error);
  adminInitError = error instanceof Error ? error : new Error('Unknown initialization error');
  adminApp = null;
}

// Export admin services with error checking
function getAdminDb() {
  if (adminInitError) {
    throw new Error(`Firebase Admin not available: ${adminInitError.message}`);
  }
  if (!adminApp) {
    throw new Error('Firebase Admin app not initialized');
  }
  return getFirestore(adminApp);
}

function getAdminStorage() {
  if (adminInitError) {
    throw new Error(`Firebase Admin not available: ${adminInitError.message}`);
  }
  if (!adminApp) {
    throw new Error('Firebase Admin app not initialized');
  }
  return getStorage(adminApp);
}

export const adminDb = adminApp ? getFirestore(adminApp) : null;
export const adminStorage = adminApp ? getStorage(adminApp) : null;
export const isAdminAvailable = adminApp !== null;

// Export functions for better error handling
export { getAdminDb, getAdminStorage };
export { adminInitError };

export default adminApp;