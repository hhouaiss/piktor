import { authService } from '@/lib/firebase';

/**
 * Get authentication headers for API calls
 */
export function getAuthHeaders(): Record<string, string> {
  const user = authService.getCurrentUser();
  const headers: Record<string, string> = {};
  
  if (user) {
    headers['x-user-id'] = user.uid;
    // TODO: Add JWT token when implemented
    // headers['authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Make an authenticated API call
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const authHeaders = getAuthHeaders();
  
  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      ...authHeaders
    }
  };
  
  return fetch(url, mergedOptions);
}

/**
 * Make an authenticated API call with JSON payload
 */
export async function authenticatedPost(
  url: string,
  data: any,
  additionalHeaders: Record<string, string> = {}
): Promise<Response> {
  return authenticatedFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...additionalHeaders
    },
    body: JSON.stringify(data)
  });
}

/**
 * Helper to check if user is authenticated before making API calls
 */
export function requireAuth(): string {
  const user = authService.getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated to perform this action');
  }
  return user.uid;
}