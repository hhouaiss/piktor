"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabaseClient } from '@/lib/supabase/config';
import type { User } from '@/lib/supabase/types';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: { display_name?: string; photo_url?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function SimpleAuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to create user object from Supabase user
  const createUserFromSupabase = (supabaseUser: SupabaseUser): User => {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      display_name: supabaseUser.user_metadata?.display_name ||
                   supabaseUser.user_metadata?.name ||
                   supabaseUser.email?.split('@')[0] || 'User',
      photo_url: supabaseUser.user_metadata?.photo_url ||
                supabaseUser.user_metadata?.avatar_url || null,
      created_at: new Date(supabaseUser.created_at),
      updated_at: new Date(),
      email_confirmed: !!supabaseUser.email_confirmed_at,
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
  };

  // Helper to fetch user data from database (with fallback)
  const fetchUserData = async (supabaseUser: SupabaseUser): Promise<User> => {
    try {
      // For now, just use the Supabase auth data without hitting the database
      // This avoids the RLS issue where the client-side query requires auth context
      return createUserFromSupabase(supabaseUser);

      // TODO: Implement proper user profile fetching after auth is working
      // const { data, error } = await supabaseClient
      //   .from('users')
      //   .select('*')
      //   .eq('id', supabaseUser.id)
      //   .single();
      //
      // if (error || !data) {
      //   return createUserFromSupabase(supabaseUser);
      // }
      //
      // return transformDatabaseUser(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      return createUserFromSupabase(supabaseUser);
    }
  };

  // Handle auth state changes
  const handleAuthChange = async (event: string, session: Session | null) => {
    try {
      setSession(session);
      setSupabaseUser(session?.user || null);
      setError(null);

      if (session?.user) {
        const userData = await fetchUserData(session.user);
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error handling auth change:', error);
      setError('Authentication error');
      setUser(null);
      setSupabaseUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          throw error;
        }

        if (mounted) {
          await handleAuthChange('INITIAL_SESSION', session);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setError('Failed to initialize authentication');
          setLoading(false);
        }
      }
    };

    // Set up auth listener
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          await handleAuthChange(event, session);
        }
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // The auth state change will handle setting the user
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message || 'Failed to sign in');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            name: displayName
          }
        }
      });

      if (error) throw error;

      // The auth state change will handle setting the user
    } catch (error: any) {
      console.error('Sign up error:', error);
      setError(error.message || 'Failed to sign up');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabaseClient.auth.signOut();

      if (error) throw error;

      // Clear state immediately
      setUser(null);
      setSupabaseUser(null);
      setSession(null);

      // Redirect to signin page after successful logout
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin';
      }
    } catch (error: any) {
      console.error('Sign out error:', error);
      setError(error.message || 'Failed to sign out');
      setLoading(false);
      throw error;
    }
    // Note: We don't set loading to false here because we're redirecting
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      setError(null);

      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Reset password error:', error);
      setError(error.message || 'Failed to send reset email');
      throw error;
    }
  };

  const updateProfile = async (updates: { display_name?: string; photo_url?: string }): Promise<void> => {
    try {
      setError(null);

      if (!supabaseUser) {
        throw new Error('No authenticated user');
      }

      // Update the user profile in the users table
      const updateData: Record<string, any> = {};
      if (updates.display_name !== undefined) updateData.display_name = updates.display_name;
      if (updates.photo_url !== undefined) updateData.photo_url = updates.photo_url;

      const { error } = await (supabaseClient as any)
        .from('users')
        .update(updateData)
        .eq('id', supabaseUser.id);

      if (error) throw error;

      // Refresh user data
      const updatedUser = await fetchUserData(supabaseUser);
      setUser(updatedUser);
    } catch (error: any) {
      console.error('Update profile error:', error);
      setError(error.message || 'Failed to update profile');
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
    signOut,
    resetPassword,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSimpleAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider');
  }
  return context;
}