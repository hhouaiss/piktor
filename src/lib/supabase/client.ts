/**
 * Client-side Supabase Client for Browser
 * For use in Client Components
 * Uses cookies for session persistence (compatible with SSR)
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

/**
 * Create a Supabase client for browser (client-side)
 * This client persists sessions via cookies, making them accessible to server-side code
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Create a singleton instance for use across the app
let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!client) {
    client = createClient();
  }
  return client;
}

// Export for direct use
export const supabaseClient = getSupabaseClient();
