import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let adminApp: any = null;

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'piktor-app';
  
  try {
    // Check if running with emulator first
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      console.log('🔥 Using Firebase Admin SDK with emulator');
      return initializeApp({
        projectId: projectId
      });
    }

    // Use service account credentials if available (both dev and production)
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      console.log('🔥 Using Firebase Admin SDK with service account credentials');
      return initializeApp({
        credential: cert({
          projectId: projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        projectId: projectId
      });
    }

    // Fallback to default credentials if no service account
    console.log('🔥 Using Firebase Admin SDK with default credentials');
    return initializeApp({
      credential: applicationDefault(),
      projectId: projectId
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    return null;
  }
}

// Initialize the admin app
try {
  adminApp = initializeFirebaseAdmin();
} catch (error) {
  console.error('Firebase Admin initialization failed:', error);
  adminApp = null;
}

// Export admin services
export const adminDb = adminApp ? getFirestore(adminApp) : null;
export const adminStorage = adminApp ? getStorage(adminApp) : null;
export const isAdminAvailable = adminApp !== null;

export default adminApp;