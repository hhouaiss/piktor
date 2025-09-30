"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabaseAuthService } from '@/lib/supabase/auth';
import type { User } from '@/lib/supabase/types';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, displayName?: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  completeOnboarding: (data: Record<string, any>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function SupabaseAuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const handleAuthState = async (supabaseUser: any, session: any) => {
      if (!mounted) return;

      setSupabaseUser(supabaseUser);
      setSession(session);
      setError(null);

      if (supabaseUser && session) {
        try {
          // Get full user data from database
          const userData = await supabaseAuthService.getUserData(supabaseUser.id);
          if (mounted) setUser(userData);
        } catch (error) {
          console.error('Error fetching user data:', error);

          // Create a fallback user from Supabase Auth data
          const fallbackUser: User = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            display_name: supabaseUser.user_metadata?.display_name ||
                         supabaseUser.user_metadata?.name ||
                         supabaseUser.email?.split('@')[0],
            photo_url: supabaseUser.user_metadata?.photo_url ||
                      supabaseUser.user_metadata?.avatar_url,
            created_at: new Date(supabaseUser.created_at),
            updated_at: new Date(),
            email_confirmed: supabaseUser.email_confirmed_at !== null,
            usage: {
              creditsUsed: 0,
              creditsTotal: 50,
              resetDate: null
            },
            preferences: {
              language: 'fr',
              notifications: true,
              theme: 'auto'
            }
          };

          if (mounted) {
            setUser(fallbackUser);
            setError(null); // Clear error since we have a fallback
          }

          // Try to ensure the user profile exists in the background
          setTimeout(async () => {
            if (!mounted) return;
            try {
              await supabaseAuthService.getUserData(supabaseUser.id);
              // If successful, refresh the user data
              const refreshedData = await supabaseAuthService.getUserData(supabaseUser.id);
              if (mounted) setUser(refreshedData);
              console.log('Successfully refreshed user data');
            } catch (refreshError) {
              console.error('Failed to refresh user data:', refreshError);
              // Keep the fallback user
            }
          }, 1000);
        }
      } else {
        if (mounted) setUser(null);
      }

      if (mounted) setLoading(false);
    };

    // Get initial session immediately
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabaseAuthService.getCurrentSessionAsync();
        await handleAuthState(session?.user ?? null, session);
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted) setLoading(false);
      }
    };

    // Initialize auth state immediately
    initializeAuth();

    // Set up auth state listener for future changes
    const unsubscribe = supabaseAuthService.onAuthStateChange(handleAuthState);

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<User> => {
    try {
      setError(null);
      setLoading(true);
      const user = await supabaseAuthService.signIn(email, password);
      return user;
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur de connexion';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string): Promise<User> => {
    try {
      setError(null);
      setLoading(true);
      const user = await supabaseAuthService.register(email, password, displayName);
      return user;
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la création du compte';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<User> => {
    try {
      setError(null);
      setLoading(true);
      const user = await supabaseAuthService.signInWithGoogle();
      return user;
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur de connexion avec Google';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setError(null);
      await supabaseAuthService.signOut();
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la déconnexion';
      setError(errorMessage);
      throw error;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      setError(null);
      await supabaseAuthService.resetPassword(email);
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la réinitialisation du mot de passe';
      setError(errorMessage);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      setError(null);
      await supabaseAuthService.updateUserProfile(user.id, updates);

      // Refresh user data
      const updatedUser = await supabaseAuthService.getUserData(user.id);
      setUser(updatedUser);
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la mise à jour du profil';
      setError(errorMessage);
      throw error;
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (!supabaseUser) return;

    try {
      const userData = await supabaseAuthService.getUserData(supabaseUser.id);
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const completeOnboarding = async (data: Record<string, any>): Promise<boolean> => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      setError(null);
      const result = await supabaseAuthService.completeOnboarding(data);

      // Refresh user data to get updated preferences
      await refreshUser();

      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la finalisation de l\'inscription';
      setError(errorMessage);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    supabaseUser,
    session,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
    refreshUser,
    completeOnboarding
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSupabaseAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}

export function useRequireSupabaseAuth(): AuthContextType {
  const auth = useSupabaseAuth();

  if (!auth.user && !auth.loading) {
    throw new Error('This component requires authentication');
  }

  return auth;
}