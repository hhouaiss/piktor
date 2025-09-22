"use client";

import { auth, db } from './config';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

/**
 * Test Firebase connection and security rules
 */
export async function testFirebaseConnection() {
  try {
    console.log('[Firebase Test] Starting connection tests...');

    // Check if Firebase services are available
    if (!auth) {
      console.error('[Firebase Test] Firebase auth not initialized');
      return;
    }

    if (!db) {
      console.error('[Firebase Test] Firebase Firestore not initialized');
      return;
    }

    // Check authentication state
    const currentUser = auth.currentUser;
    console.log('[Firebase Test] Auth state:', {
      isAuthenticated: !!currentUser,
      uid: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified
    });

    if (!currentUser) {
      console.log('[Firebase Test] No authenticated user - tests cannot proceed');
      return;
    }

    // Test user document access
    try {
      console.log('[Firebase Test] Testing user document access...');
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        console.log('[Firebase Test] ✅ User document read successful');
        console.log('[Firebase Test] User data:', userDoc.data());
      } else {
        console.log('[Firebase Test] ❌ User document does not exist');
      }
    } catch (error) {
      console.error('[Firebase Test] ❌ User document read failed:', error);
    }

    // Test projects query
    try {
      console.log('[Firebase Test] Testing projects query...');
      const projectsQuery = query(
        collection(db, 'projects'),
        where('userId', '==', currentUser.uid)
      );

      const projectsSnapshot = await getDocs(projectsQuery);
      console.log('[Firebase Test] ✅ Projects query successful');
      console.log('[Firebase Test] Projects count:', projectsSnapshot.size);

      projectsSnapshot.forEach(doc => {
        console.log('[Firebase Test] Project:', {
          id: doc.id,
          data: doc.data()
        });
      });
    } catch (error) {
      console.error('[Firebase Test] ❌ Projects query failed:', error);
    }

    // Test visuals query
    try {
      console.log('[Firebase Test] Testing visuals query...');
      const visualsQuery = query(
        collection(db, 'visuals'),
        where('userId', '==', currentUser.uid)
      );

      const visualsSnapshot = await getDocs(visualsQuery);
      console.log('[Firebase Test] ✅ Visuals query successful');
      console.log('[Firebase Test] Visuals count:', visualsSnapshot.size);
    } catch (error) {
      console.error('[Firebase Test] ❌ Visuals query failed:', error);
    }

    console.log('[Firebase Test] Connection tests completed');

  } catch (error) {
    console.error('[Firebase Test] ❌ General test error:', error);
  }
}

/**
 * Wait for authentication to be ready
 */
export function waitForAuth(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!auth) {
      console.error('[Firebase Test] Firebase auth not initialized');
      resolve(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(!!user);
    });
  });
}