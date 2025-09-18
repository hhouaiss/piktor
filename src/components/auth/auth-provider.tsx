"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { authService } from '@/lib/firebase';
import type { User } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, displayName?: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      setError(null);
      
      if (firebaseUser) {
        try {
          // Get full user data from Firestore
          const userData = await authService.getUserData(firebaseUser.uid);
          setUser(userData);
        } catch (error) {
          console.error('Error fetching user data:', error);

          // Check if it's a permission error or missing user document
          if ((error as any)?.code === 'permission-denied' || (error as any)?.message?.includes('Missing or insufficient permissions') || (error as any)?.message?.includes('User document not found')) {
            console.log('User document not found or permission denied, creating fallback user');

            // Create a fallback user from Firebase Auth data
            const now = Timestamp.now();
            const fallbackUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || undefined,
              photoURL: firebaseUser.photoURL || undefined,
              createdAt: now,
              updatedAt: now,
              usage: {
                creditsUsed: 0,
                creditsTotal: 50,
                resetDate: now
              },
              preferences: {
                language: 'fr',
                notifications: true,
                theme: 'auto'
              }
            };

            setUser(fallbackUser);
            setError(null); // Clear error since we have a fallback

            // Try to create the user document in the background
            try {
              await authService.createUserDocument();
              console.log('Successfully created user document in background');
            } catch (createError) {
              console.error('Failed to create user document in background:', createError);
              // Don't show error to user, they can still use the app
            }
          } else {
            setError('Erreur lors du chargement des données utilisateur');
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<User> => {
    try {
      setError(null);
      setLoading(true);
      const user = await authService.signIn(email, password);
      return user;
    } catch (error: any) {
      setError(error.message || 'Erreur de connexion');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string): Promise<User> => {
    try {
      setError(null);
      setLoading(true);
      const user = await authService.register(email, password, displayName);
      return user;
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la création du compte');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<User> => {
    try {
      setError(null);
      setLoading(true);
      const user = await authService.signInWithGoogle();
      return user;
    } catch (error: any) {
      setError(error.message || 'Erreur de connexion avec Google');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setError(null);
      await authService.signOut();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la déconnexion');
      throw error;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      setError(null);
      await authService.resetPassword(email);
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la réinitialisation du mot de passe');
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    if (!user) throw new Error('Utilisateur non connecté');
    
    try {
      setError(null);
      await authService.updateUserProfile(user.id, updates);
      
      // Refresh user data
      const updatedUser = await authService.getUserData(user.id);
      setUser(updatedUser);
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la mise à jour du profil');
      throw error;
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (!firebaseUser) return;
    
    try {
      const userData = await authService.getUserData(firebaseUser.uid);
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useRequireAuth(): AuthContextType {
  const auth = useAuth();
  
  if (!auth.user && !auth.loading) {
    throw new Error('This component requires authentication');
  }
  
  return auth;
}