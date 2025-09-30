/**
 * Server-Side Admin Authentication
 *
 * This module provides secure server-side verification of admin users.
 * Admin status is verified against a server-side list, NOT client headers.
 *
 * Security: Admin user IDs are stored in environment variables, never exposed to client.
 */

// Get admin user IDs from environment variable
// Format: Comma-separated UUIDs
const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) || [];

/**
 * Check if a user ID is an admin
 * This is the ONLY source of truth for admin status
 */
export function isAdminUser(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return ADMIN_USER_IDS.includes(userId);
}

/**
 * Verify admin override request
 * Returns true only if:
 * 1. Admin override header is present
 * 2. User ID is in the server-side admin list
 * 3. Environment is configured
 */
export function verifyAdminOverride(
  adminHeader: string | null,
  userId: string | null | undefined
): { isValid: boolean; reason: string } {
  // No admin override requested
  if (adminHeader !== 'true') {
    return { isValid: false, reason: 'no-override-requested' };
  }

  // No user ID provided
  if (!userId) {
    console.warn('[Security] Admin override attempted without user ID');
    return { isValid: false, reason: 'missing-user-id' };
  }

  // Check if user is in admin list
  if (!isAdminUser(userId)) {
    console.warn(`[Security] Unauthorized admin override attempt by user: ${userId}`);
    return { isValid: false, reason: 'unauthorized-user' };
  }

  // All checks passed
  console.log(`[Admin] Verified admin access for user: ${userId}`);
  return { isValid: true, reason: 'verified-admin' };
}

/**
 * Get list of admin user IDs (for debugging only)
 * Never expose this to client!
 */
export function getAdminUserIds(): string[] {
  return [...ADMIN_USER_IDS];
}

/**
 * Check if admin system is configured
 */
export function isAdminSystemConfigured(): boolean {
  return ADMIN_USER_IDS.length > 0;
}

// Log admin configuration on module load (server-side only)
if (typeof window === 'undefined') {
  if (ADMIN_USER_IDS.length > 0) {
    console.log(`[Admin Auth] Admin system configured with ${ADMIN_USER_IDS.length} admin user(s)`);
    console.log(`[Admin Auth] Admin user IDs: ${ADMIN_USER_IDS.map(id => id.substring(0, 8) + '...').join(', ')}`);
  } else {
    console.warn('[Admin Auth] No admin users configured. Set ADMIN_USER_IDS environment variable.');
  }
}
