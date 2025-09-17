import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDdxMA4viuO0wPMczGH7grn9r3dfh9RjWQ",
  authDomain: "piktor-app.firebaseapp.com",
  projectId: "piktor-app",
  storageBucket: "piktor-app.firebasestorage.app",
  messagingSenderId: "906790513286",
  appId: "1:906790513286:web:15d9388385f3fd200c3f07",
  measurementId: "G-1GX72CF6CH"
};

// Initialize Firebase only if no apps exist
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics - only initialize in browser environment
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;