import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration error:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');

  throw new Error(
    'Missing required Supabase environment variables. Please check your .env.local file.'
  );
}

// Client-side Supabase client (uses anon key with RLS)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Export as supabaseClient for consistency with auth service
export const supabaseClient = supabase;

// Server-side Supabase client (uses service role key, bypasses RLS)
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper to get the appropriate client based on context
export function getSupabaseClient(useServiceRole: boolean = false) {
  return useServiceRole ? supabaseAdmin : supabase;
}

// Database configuration
export const SUPABASE_CONFIG = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  serviceKey: supabaseServiceKey,
  tables: {
    users: 'users',
    visuals: 'visuals',
    projects: 'projects', // For future use
    usage: 'usage_records', // For future use
    stats: 'user_stats' // For future use
  }
} as const;

export type SupabaseClient = typeof supabase;
export type SupabaseAdmin = typeof supabaseAdmin;