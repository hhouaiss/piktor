import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser,
  AuthError,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import type { User, FirestoreUser, FirebaseError } from './types';

class AuthService {
  private currentUser: FirebaseUser | null = null;
  private unsubscribeAuth: (() => void) | null = null;

  constructor() {
    this.initAuthStateListener();
  }

  private initAuthStateListener() {
    if (!auth) {
      console.error('[AuthService] Firebase auth not initialized');
      return;
    }

    this.unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      this.currentUser = firebaseUser;

      if (firebaseUser) {
        // Ensure user document exists in Firestore
        await this.ensureUserDocument(firebaseUser);
      }
    });
  }

  /**
   * Create or update user document in Firestore
   */
  private async ensureUserDocument(firebaseUser: FirebaseUser): Promise<void> {
    if (!db) {
      console.error('[AuthService] Firebase Firestore not initialized');
      return;
    }

    const userRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      const userData: FirestoreUser = {
        email: firebaseUser.email!,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
        usage: {
          creditsUsed: 0,
          creditsTotal: 50, // Default free tier
          resetDate: this.getNextMonthTimestamp()
        },
        preferences: {
          language: 'fr',
          notifications: true,
          theme: 'auto'
        }
      };

      // Only add displayName and photoURL if they exist
      if (firebaseUser.displayName) {
        userData.displayName = firebaseUser.displayName;
      }
      if (firebaseUser.photoURL) {
        userData.photoURL = firebaseUser.photoURL;
      }

      await setDoc(userRef, userData);
      console.log('Created new user document for:', firebaseUser.email);
    } else {
      // Update last activity and sync Firebase Auth data
      const existingData = userDoc.data() as FirestoreUser;
      const updatedData: Partial<FirestoreUser> = {
        updatedAt: serverTimestamp() as any
      };

      // Sync displayName and photoURL from Firebase Auth if they've changed
      if (firebaseUser.displayName !== existingData.displayName) {
        if (firebaseUser.displayName) {
          updatedData.displayName = firebaseUser.displayName;
        }
        console.log('Syncing displayName:', firebaseUser.displayName);
      }
      if (firebaseUser.photoURL !== existingData.photoURL) {
        if (firebaseUser.photoURL) {
          updatedData.photoURL = firebaseUser.photoURL;
        }
        console.log('Syncing photoURL:', firebaseUser.photoURL);
      }

      await setDoc(userRef, updatedData, { merge: true });
    }
  }

  private getNextMonthTimestamp() {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return serverTimestamp() as any; // In practice, you'd calculate the actual next month
  }

  /**
   * Register new user with email and password
   */
  async register(email: string, password: string, displayName?: string): Promise<User> {
    if (!auth) {
      throw new Error('Firebase auth not initialized');
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      if (displayName) {
        await updateProfile(firebaseUser, { displayName });
      }

      await this.ensureUserDocument(firebaseUser);
      
      return await this.getUserData(firebaseUser.uid);
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<User> {
    if (!auth) {
      throw new Error('Firebase auth not initialized');
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return await this.getUserData(userCredential.user.uid);
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<User> {
    if (!auth) {
      throw new Error('Firebase auth not initialized');
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');

      const userCredential = await signInWithPopup(auth, provider);
      await this.ensureUserDocument(userCredential.user);
      
      return await this.getUserData(userCredential.user.uid);
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    if (!auth) {
      throw new Error('Firebase auth not initialized');
    }

    try {
      await signOut(auth);
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    if (!auth) {
      throw new Error('Firebase auth not initialized');
    }

    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): FirebaseUser | null {
    return this.currentUser;
  }

  /**
   * Get user data from Firestore
   */
  async getUserData(userId: string): Promise<User> {
    if (!db) {
      throw new Error('Firebase Firestore not initialized');
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // If user document doesn't exist, create it if we have a current user
      const firebaseUser = this.currentUser;
      if (firebaseUser && firebaseUser.uid === userId) {
        console.log('User document not found, creating it automatically...');
        await this.ensureUserDocument(firebaseUser);
        
        // Try again after creating the document
        const newUserDoc = await getDoc(userRef);
        if (newUserDoc.exists()) {
          const userData = newUserDoc.data() as FirestoreUser;
          return {
            id: userId,
            ...userData
          };
        }
      }
      
      throw new Error(`User document not found for user ID: ${userId}`);
    }

    const userData = userDoc.data() as FirestoreUser;
    return {
      id: userId,
      ...userData
    };
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<FirestoreUser>): Promise<void> {
    if (!db) {
      throw new Error('Firebase Firestore not initialized');
    }

    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    }, { merge: true });

    // Update Firebase Auth profile if needed
    if (this.currentUser && (updates.displayName || updates.photoURL)) {
      await updateProfile(this.currentUser, {
        displayName: updates.displayName || this.currentUser.displayName,
        photoURL: updates.photoURL || this.currentUser.photoURL
      });
    }
  }

  /**
   * Manually create user document for current user (useful for fixing missing documents)
   */
  async createUserDocument(): Promise<User | null> {
    const firebaseUser = this.currentUser;
    if (!firebaseUser) {
      console.log('No current user to create document for');
      return null;
    }

    console.log('Creating user document for:', firebaseUser.email);
    await this.ensureUserDocument(firebaseUser);
    return await this.getUserData(firebaseUser.uid);
  }

  /**
   * Check if user has sufficient credits
   */
  async hasCredits(userId: string, creditsNeeded: number = 1): Promise<boolean> {
    const userData = await this.getUserData(userId);
    return (userData.usage.creditsTotal - userData.usage.creditsUsed) >= creditsNeeded;
  }

  /**
   * Use credits for generation
   */
  async useCredits(userId: string, creditsUsed: number): Promise<void> {
    if (!db) {
      throw new Error('Firebase Firestore not initialized');
    }

    const userRef = doc(db, 'users', userId);
    const userData = await this.getUserData(userId);
    
    const newCreditsUsed = userData.usage.creditsUsed + creditsUsed;
    
    if (newCreditsUsed > userData.usage.creditsTotal) {
      throw new Error('Insufficient credits');
    }

    await setDoc(userRef, {
      usage: {
        ...userData.usage,
        creditsUsed: newCreditsUsed
      },
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: FirebaseUser | null) => void): () => void {
    if (!auth) {
      console.error('[AuthService] Firebase auth not initialized');
      return () => {}; // Return a no-op function
    }

    return onAuthStateChanged(auth, callback);
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: AuthError): FirebaseError {
    let message = 'Une erreur est survenue';

    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'Cette adresse email est déjà utilisée';
        break;
      case 'auth/weak-password':
        message = 'Le mot de passe doit contenir au moins 6 caractères';
        break;
      case 'auth/user-not-found':
        message = 'Aucun compte trouvé avec cette adresse email';
        break;
      case 'auth/wrong-password':
        message = 'Mot de passe incorrect';
        break;
      case 'auth/invalid-email':
        message = 'Adresse email invalide';
        break;
      case 'auth/user-disabled':
        message = 'Ce compte a été désactivé';
        break;
      case 'auth/too-many-requests':
        message = 'Trop de tentatives. Veuillez réessayer plus tard';
        break;
      case 'auth/network-request-failed':
        message = 'Erreur de connexion réseau';
        break;
      case 'auth/popup-closed-by-user':
        message = 'Connexion annulée';
        break;
      default:
        message = error.message;
    }

    return {
      name: 'FirebaseError',
      code: error.code,
      message,
      customData: error.customData
    } as FirebaseError;
  }

  /**
   * Cleanup auth listener
   */
  dispose(): void {
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
      this.unsubscribeAuth = null;
    }
  }
}

export const authService = new AuthService();
export default authService;