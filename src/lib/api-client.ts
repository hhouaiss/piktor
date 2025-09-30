import { supabaseClient } from '@/lib/supabase/config';

/**
 * Get authentication headers for API requests using Supabase
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    // Get current session from Supabase
    const { data: { session }, error } = await supabaseClient.auth.getSession();

    if (error) {
      console.warn('[API Client] Error getting auth session:', error);
      return {};
    }

    if (!session || !session.user) {
      console.warn('[API Client] No authenticated user found for headers');
      return {};
    }

    console.log('[API Client] Getting auth headers for user:', session.user.id);

    const headers = {
      'x-user-id': session.user.id,
      'Authorization': `Bearer ${session.access_token}`
    };

    console.log('[API Client] Auth headers prepared successfully:', {
      hasUserId: !!headers['x-user-id'],
      hasAuth: !!headers.Authorization,
      userId: headers['x-user-id']
    });

    return headers;
  } catch (error) {
    console.error('[API Client] Failed to get auth headers:', error);
    return {};
  }
}

/**
 * Make an authenticated POST request
 */
export async function authenticatedPost(url: string, data: unknown, additionalHeaders: Record<string, string> = {}): Promise<Response> {
  const headers = await getAuthHeaders();

  // Ensure we have authentication before making the request
  if (!headers['x-user-id']) {
    throw new Error('User must be authenticated to make this request');
  }

  const finalHeaders = {
    'Content-Type': 'application/json',
    ...headers,
    ...additionalHeaders
  };

  console.log('[API Client] Making authenticated POST request:', {
    url,
    hasUserId: !!(finalHeaders as any)['x-user-id'],
    hasAuth: !!(finalHeaders as any).Authorization,
    additionalHeaders: Object.keys(additionalHeaders)
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: finalHeaders,
    body: JSON.stringify(data)
  });

  console.log('[API Client] POST response:', {
    url,
    status: response.status,
    ok: response.ok
  });

  return response;
}

/**
 * Make an authenticated GET request
 */
export async function authenticatedGet(url: string): Promise<Response> {
  const headers = await getAuthHeaders();

  // Ensure we have authentication before making the request
  if (!headers['x-user-id']) {
    throw new Error('User must be authenticated to make this request');
  }

  console.log('[API Client] Making authenticated GET request:', {
    url,
    hasUserId: !!headers['x-user-id'],
    hasAuth: !!headers.Authorization
  });

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...headers
    }
  });

  console.log('[API Client] GET response:', {
    url,
    status: response.status,
    ok: response.ok
  });

  return response;
}

/**
 * Debug authentication state - useful for troubleshooting
 */
export async function debugAuthState(): Promise<{
  hasSupabaseUser: boolean;
  userId?: string;
  canGetHeaders: boolean;
  headers?: Record<string, string>;
  error?: string;
}> {
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();

    const result = {
      hasSupabaseUser: !!(session && session.user),
      userId: session?.user?.id,
      canGetHeaders: false,
      headers: undefined as Record<string, string> | undefined,
      error: error?.message
    };

    if (session && session.user) {
      try {
        const headers = await getAuthHeaders();
        result.canGetHeaders = !!headers['x-user-id'];
        result.headers = headers;
      } catch (headerError) {
        result.error = headerError instanceof Error ? headerError.message : 'Unknown error getting headers';
      }
    }

    return result;
  } catch (error) {
    return {
      hasSupabaseUser: false,
      canGetHeaders: false,
      error: error instanceof Error ? error.message : 'Unknown error in debug'
    };
  }
}