import { authService } from '@/lib/firebase';
import { auth } from '@/lib/firebase/config';

/**
 * Get authentication headers for API requests
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  // Try multiple sources for current user to handle timing issues
  let currentUser = authService.getCurrentUser();

  // Fallback to Firebase auth if authService doesn't have user yet
  if (!currentUser && auth.currentUser) {
    currentUser = auth.currentUser;
  }

  if (!currentUser) {
    console.warn('[API Client] No authenticated user found for headers');
    return {};
  }

  console.log('[API Client] Getting auth headers for user:', currentUser.uid);

  try {
    const idToken = await currentUser.getIdToken();
    const headers = {
      'x-user-id': currentUser.uid,
      'Authorization': `Bearer ${idToken}`
    };

    console.log('[API Client] Auth headers prepared successfully:', {
      hasUserId: !!headers['x-user-id'],
      hasAuth: !!headers.Authorization,
      userId: headers['x-user-id']
    });

    return headers;
  } catch (error) {
    console.error('[API Client] Failed to get auth token:', error);
    // Return at least the user ID if token fails
    return {
      'x-user-id': currentUser.uid
    };
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
  hasAuthServiceUser: boolean;
  hasFirebaseAuthUser: boolean;
  userIds: {
    authService?: string;
    firebaseAuth?: string;
  };
  canGetHeaders: boolean;
  headers?: Record<string, string>;
  error?: string;
}> {
  try {
    const authServiceUser = authService.getCurrentUser();
    const firebaseAuthUser = auth.currentUser;

    const result = {
      hasAuthServiceUser: !!authServiceUser,
      hasFirebaseAuthUser: !!firebaseAuthUser,
      userIds: {
        authService: authServiceUser?.uid,
        firebaseAuth: firebaseAuthUser?.uid
      },
      canGetHeaders: false,
      headers: undefined as Record<string, string> | undefined,
      error: undefined as string | undefined
    };

    try {
      const headers = await getAuthHeaders();
      result.canGetHeaders = !!headers['x-user-id'];
      result.headers = headers;
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error getting headers';
    }

    return result;
  } catch (error) {
    return {
      hasAuthServiceUser: false,
      hasFirebaseAuthUser: false,
      userIds: {},
      canGetHeaders: false,
      error: error instanceof Error ? error.message : 'Unknown error in debug'
    };
  }
}