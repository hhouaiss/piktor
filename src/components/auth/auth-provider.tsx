"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabaseClient } from '@/lib/supabase/config';
import { supabaseAuthService } from '@/lib/supabase/auth';
import type { User } from '@/lib/supabase/types';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
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
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          setError('Error getting session');
        } else if (session?.user) {
          setSupabaseUser(session.user);
          await loadUserData(session.user);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setError('Error loading user session');
      } finally {
        setLoading(false);
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);

      if (session?.user) {
        setSupabaseUser(session.user);
        setError(null);
        await loadUserData(session.user);
      } else {
        setSupabaseUser(null);
        setUser(null);
      }

      setLoading(false);
    });

    getInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserData = async (supabaseUser: SupabaseUser) => {
    try {
      const userData = await supabaseAuthService.getUserData(supabaseUser.id);
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user data:', error);

      // Create a fallback user from Supabase Auth data
      const fallbackUser: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        display_name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || undefined,
        photo_url: supabaseUser.user_metadata?.avatar_url || undefined,
        created_at: new Date(),
        updated_at: new Date(),
        usage: {
          creditsUsed: 0,
          creditsTotal: 50,
          resetDate: new Date().toISOString()
        },
        preferences: {
          language: 'fr',
          notifications: true,
          theme: 'auto'
        }
      };

      setUser(fallbackUser);
      setError(null);

      // Try to create the user document in the background
      try {
        await supabaseAuthService.createUserDocument();
        console.log('Successfully created user document in background');
      } catch (createError) {
        console.error('Failed to create user document in background:', createError);
        // Don't show error to user, they can still use the app
      }
    }
  };

  const signIn = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    setError(null);

    try {
      const user = await supabaseAuthService.signIn(email, password);
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la connexion';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string): Promise<User> => {
    setLoading(true);
    setError(null);

    try {
      const user = await supabaseAuthService.signUp(email, password, displayName);
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création du compte';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<User> => {
    setLoading(true);
    setError(null);

    try {
      const user = await supabaseAuthService.signInWithGoogle();
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la connexion Google';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await supabaseAuthService.signOut();
      setUser(null);
      setSupabaseUser(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la déconnexion';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    setError(null);

    try {
      await supabaseAuthService.resetPassword(email);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la réinitialisation du mot de passe';
      setError(errorMessage);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    if (!user) throw new Error('Aucun utilisateur connecté');

    setError(null);

    try {
      const updatedUser = await supabaseAuthService.updateProfile(updates);
      setUser(updatedUser);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil';
      setError(errorMessage);
      throw error;
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (!supabaseUser) return;

    setError(null);

    try {
      await loadUserData(supabaseUser);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du rafraîchissement des données utilisateur';
      setError(errorMessage);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    supabaseUser,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}