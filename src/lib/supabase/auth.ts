import { createClient, type AuthChangeEvent, type Session, type User as SupabaseUser, type AuthError } from '@supabase/supabase-js';
import { supabaseClient, supabaseAdmin } from './config';
import type { User, SupabaseError } from './types';

class SupabaseAuthService {
  private currentUser: SupabaseUser | null = null;
  private currentSession: Session | null = null;
  private unsubscribeAuth: (() => void) | null = null;

  constructor() {
    this.initAuthStateListener();
  }

  private initAuthStateListener() {
    try {
      // Get initial session
      supabaseClient.auth.getSession().then(({ data: { session } }) => {
        this.currentSession = session;
        this.currentUser = session?.user ?? null;
      });

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
        this.currentSession = session;
        this.currentUser = session?.user ?? null;

        if (session?.user) {
          // Ensure user profile exists in our database
          try {
            await this.ensureUserProfile(session.user);
          } catch (error) {
            console.error('[SupabaseAuthService] Error ensuring user profile:', error);
            // Don't throw - allow auth to continue working even if profile creation fails
          }
        }
      });

      this.unsubscribeAuth = () => subscription.unsubscribe();
      console.log('[SupabaseAuthService] Auth state listener initialized successfully');
    } catch (error) {
      console.error('[SupabaseAuthService] Error setting up auth listener:', error);

      // Set up a retry mechanism for auth initialization
      setTimeout(() => {
        console.log('[SupabaseAuthService] Retrying auth initialization...');
        try {
          this.initAuthStateListener();
        } catch (retryError) {
          console.error('[SupabaseAuthService] Retry failed:', retryError);
        }
      }, 2000);
    }
  }

  /**
   * Ensure user profile exists in public.users table
   */
  private async ensureUserProfile(supabaseUser: SupabaseUser): Promise<void> {
    try {
      // Check if user profile exists
      const { data: existingUser, error: fetchError } = await supabaseClient
        .from('users')
        .select('id')
        .eq('id', supabaseUser.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error checking user profile:', fetchError);
        return;
      }

      if (!existingUser) {
        // User profile doesn't exist, let the database trigger handle creation
        // The trigger should have already created it, but let's ensure it exists
        const { data: newUser, error: insertError } = await (supabaseClient as any)
          .from('users')
          .insert({
            id: supabaseUser.id,
            email: supabaseUser.email!,
            display_name: supabaseUser.user_metadata?.display_name ||
                         supabaseUser.user_metadata?.name ||
                         supabaseUser.email?.split('@')[0],
            photo_url: supabaseUser.user_metadata?.photo_url || supabaseUser.user_metadata?.avatar_url
          })
          .select()
          .single();

        if (insertError && insertError.code !== '23505') { // 23505 = unique violation (already exists)
          console.error('Error creating user profile:', insertError);
        } else {
          console.log('Created user profile for:', supabaseUser.email);
        }
      }
    } catch (error) {
      console.error('[SupabaseAuthService] Error ensuring user profile:', error);
    }
  }

  /**
   * Register new user with email and password
   */
  async register(email: string, password: string, displayName?: string): Promise<User> {
    try {
      // Basic client-side validation
      if (!email || !email.includes('@')) {
        throw new Error('Adresse email invalide');
      }

      if (!password || password.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
      }

      // Register the user with Supabase Auth
      // For MVP: email_confirm is set to auto-confirm in Supabase settings
      const { data: authData, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            name: displayName
          },
          // For MVP: skip email confirmation
          emailRedirectTo: undefined
        }
      });

      if (error) throw error;
      if (!authData.user) throw new Error('Registration failed');

      // The trigger should automatically create the user profile
      // But let's ensure it exists with a single retry
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        const userData = await this.getUserData(authData.user.id);
        return userData;
      } catch (getUserError) {
        // If profile doesn't exist, create it manually
        console.log('[Auth] User profile not found, creating manually...');
        await this.ensureUserProfile(authData.user);

        // Try one more time to get the data
        const userData = await this.getUserData(authData.user.id);
        return userData;
      }
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<User> {
    try {
      const { data: authData, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (!authData.user) throw new Error('Sign in failed');

      return await this.getUserData(authData.user.id);
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Sign in with Google (OAuth)
   */
  async signInWithGoogle(): Promise<User> {
    try {
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'profile email',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) throw error;

      // Since OAuth is a redirect, we'll need to handle this differently
      // For now, throw an error indicating this needs to be handled on the client side
      throw new Error('Google sign-in requires redirect handling on the client side');
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) throw error;
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): SupabaseUser | null {
    return this.currentUser;
  }

  /**
   * Get current session
   */
  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  /**
   * Get current session from Supabase (async version)
   */
  async getCurrentSessionAsync() {
    return await supabaseClient.auth.getSession();
  }

  /**
   * Get user data from database
   */
  async getUserData(userId: string): Promise<User> {
    const { data, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // Handle case where user profile doesn't exist yet (PGRST116 = no rows returned)
    if (error && error.code === 'PGRST116') {
      console.log('[getUserData] User profile not found, attempting to create it for:', userId);

      // Get user from auth to create profile
      const { data: authData } = await supabaseClient.auth.getUser();
      if (authData?.user?.id === userId) {
        // Create the user profile
        await this.ensureUserProfile(authData.user);

        // Try again to fetch the profile
        const { data: retryData, error: retryError } = await supabaseClient
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (retryError || !retryData) {
          console.error('[getUserData] Failed to create user profile:', retryError);
          throw new Error(`Failed to create user profile for user ID: ${userId}`);
        }

        const userData = retryData as any;
        return {
          id: userData.id,
          email: userData.email,
          display_name: userData.display_name,
          photo_url: userData.photo_url,
          usage: userData.usage || { creditsUsed: 0, creditsTotal: 50, resetDate: null },
          preferences: userData.preferences || { language: 'fr', notifications: true, theme: 'auto' },
          subscription: userData.subscription,
          email_confirmed: true,
          created_at: new Date(userData.created_at),
          updated_at: new Date(userData.updated_at)
        };
      }

      // If we couldn't get the auth user or IDs don't match, throw error
      throw new Error(`User profile not found for user ID: ${userId}`);
    }

    // Handle other errors
    if (error) {
      console.error('Error fetching user profile:', error);
      throw new Error(`Error fetching user profile: ${error.message}`);
    }

    if (!data) {
      throw new Error(`User profile not found for user ID: ${userId}`);
    }

    const userData = data as any;
    return {
      id: userData.id,
      email: userData.email,
      display_name: userData.display_name,
      photo_url: userData.photo_url,
      usage: userData.usage || { creditsUsed: 0, creditsTotal: 50, resetDate: null },
      preferences: userData.preferences || { language: 'fr', notifications: true, theme: 'auto' },
      subscription: userData.subscription,
      email_confirmed: true, // We'll get this from auth session instead
      created_at: new Date(userData.created_at),
      updated_at: new Date(userData.updated_at)
    };
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    const { error } = await (supabaseClient as any)
      .from('users')
      .update({
        display_name: updates.display_name,
        photo_url: updates.photo_url,
        preferences: updates.preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    // Update Supabase Auth profile if needed
    if (updates.display_name || updates.photo_url) {
      const { error: authError } = await supabaseClient.auth.updateUser({
        data: {
          display_name: updates.display_name,
          photo_url: updates.photo_url
        }
      });
      if (authError) {
        console.warn('Failed to update auth profile:', authError);
        // Don't throw - the database was updated successfully
      }
    }
  }

  /**
   * Complete user onboarding
   */
  async completeOnboarding(onboardingData: Record<string, any>): Promise<boolean> {
    if (!this.currentUser) throw new Error('User not authenticated');

    // Simple implementation - just update preferences
    await this.updateUserProfile(this.currentUser.id, {
      preferences: {
        ...onboardingData,
        onboarding_completed: true
      } as any
    });

    return true;
  }

  /**
   * Check if user has sufficient credits
   * Now checks the subscriptions table instead of user.usage
   */
  async hasCredits(userId: string, creditsNeeded: number = 1): Promise<boolean> {
    try {
      // Check subscriptions table for active subscription
      const { data: subscription, error } = await supabaseClient
        .from('subscriptions')
        .select('generations_limit, generations_used, status')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing', 'past_due'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single() as { data: { generations_limit: number; generations_used: number; status: string } | null; error: any };

      if (error) {
        if (error.code === 'PGRST116') {
          // No subscription found - user should have free tier
          console.log('[hasCredits] No active subscription found for user:', userId);
          return false;
        }
        console.error('[hasCredits] Error fetching subscription:', error);
        throw error;
      }

      if (!subscription) {
        console.log('[hasCredits] No subscription data found for user:', userId);
        return false;
      }

      const remainingCredits = subscription.generations_limit - subscription.generations_used;
      const hasEnoughCredits = remainingCredits >= creditsNeeded;

      console.log('[hasCredits] Credits check for user:', userId, {
        generationsLimit: subscription.generations_limit,
        generationsUsed: subscription.generations_used,
        remainingCredits,
        creditsNeeded,
        hasEnoughCredits,
        status: subscription.status
      });

      return hasEnoughCredits;
    } catch (error) {
      console.error('[hasCredits] Error checking credits:', error);
      // Fallback to old behavior if subscriptions table doesn't exist
      // This ensures backward compatibility during migration
      try {
        const userData = await this.getUserData(userId);
        return (userData.usage.creditsTotal - userData.usage.creditsUsed) >= creditsNeeded;
      } catch (fallbackError) {
        console.error('[hasCredits] Fallback also failed:', fallbackError);
        throw fallbackError;
      }
    }
  }

  /**
   * Use credits for generation
   */
  async useCredits(userId: string, creditsUsed: number): Promise<void> {
    const { data, error } = await (supabaseClient as any)
      .rpc('update_user_usage', {
        user_uuid: userId,
        credits_used_delta: creditsUsed
      });

    if (error) throw error;

    // Verify the user still has credits available after the update
    const userData = await this.getUserData(userId);
    if (userData.usage.creditsUsed > userData.usage.creditsTotal) {
      throw new Error('Insufficient credits');
    }
  }

  /**
   * Get user dashboard data
   */
  async getDashboardData(userId?: string): Promise<any> {
    const targetUserId = userId || this.currentUser?.id;
    if (!targetUserId) throw new Error('User not authenticated');

    // Simple implementation - just get user data for now
    const userData = await this.getUserData(targetUserId);
    return {
      user: userData,
      stats: {
        total_projects: 0,
        total_visuals: 0
      },
      recent_activity: []
    };
  }

  /**
   * Log authentication attempt (for rate limiting)
   */
  private async logAuthAttempt(email: string, attemptType: string, success: boolean): Promise<void> {
    try {
      // Use the admin client to log attempts since this bypasses RLS
      await (supabaseAdmin as any)
        .rpc('log_auth_attempt', {
          attempt_email: email,
          attempt_type_param: attemptType,
          attempt_success: success
        });
    } catch (error) {
      console.error('Failed to log auth attempt:', error);
      // Don't throw - this is just for logging
    }
  }

  /**
   * Sign up alias for register method (for compatibility with auth provider)
   */
  async signUp(email: string, password: string, displayName?: string): Promise<User> {
    return await this.register(email, password, displayName);
  }

  /**
   * Update user profile (for compatibility with auth provider)
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    if (!this.currentUser) throw new Error('No user authenticated');

    await this.updateUserProfile(this.currentUser.id, updates);
    return await this.getUserData(this.currentUser.id);
  }

  /**
   * Create user document (for compatibility with auth provider)
   */
  async createUserDocument(): Promise<void> {
    if (!this.currentUser) throw new Error('No user authenticated');

    try {
      await this.ensureUserProfile(this.currentUser);
    } catch (error) {
      console.error('[SupabaseAuthService] Error creating user document:', error);
      throw error;
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: SupabaseUser | null, session: Session | null) => void): () => void {
    try {
      const {
        data: { subscription },
      } = supabaseClient.auth.onAuthStateChange((event, session) => {
        callback(session?.user ?? null, session);
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('[SupabaseAuthService] Error setting up auth state listener:', error);
      return () => {}; // Return a no-op function
    }
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: AuthError | Error): SupabaseError {
    let message = 'Une erreur est survenue';

    if ('message' in error) {
      // Handle Supabase-specific errors
      switch (error.message) {
        case 'Email not confirmed':
          message = 'Veuillez confirmer votre adresse email';
          break;
        case 'Invalid login credentials':
          message = 'Email ou mot de passe incorrect';
          break;
        case 'Email already registered':
          message = 'Cette adresse email est déjà utilisée';
          break;
        case 'Password should be at least 6 characters':
          message = 'Le mot de passe doit contenir au moins 6 caractères';
          break;
        case 'Unable to validate email address: invalid format':
          message = 'Adresse email invalide';
          break;
        case 'Too many requests':
          message = 'Trop de tentatives. Veuillez réessayer plus tard';
          break;
        case 'Network error':
          message = 'Erreur de connexion réseau';
          break;
        default:
          message = error.message;
      }
    }

    return {
      name: 'SupabaseError',
      message,
      status: (error as any)?.status || 500
    } as SupabaseError;
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

export const supabaseAuthService = new SupabaseAuthService();
export default supabaseAuthService;