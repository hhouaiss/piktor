import { NextRequest, NextResponse } from 'next/server';
import { isAdminUser } from '@/lib/server-admin-auth';
import { createClient } from '@/lib/supabase/server';

/**
 * Admin Status Check Endpoint
 *
 * Returns whether the current authenticated user is an admin.
 * This allows the frontend to automatically enable admin mode.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({
        isAdmin: false,
        message: 'User not authenticated'
      });
    }

    // Check if user is in admin list (from ADMIN_USER_IDS env var)
    const isAdmin = isAdminUser(user.id);

    if (isAdmin) {
      console.log(`[Admin Check] Admin user detected: ${user.id.substring(0, 8)}...`);
    }

    return NextResponse.json({
      isAdmin,
      userId: isAdmin ? user.id.substring(0, 8) + '...' : undefined // Partial ID for debugging
    });
  } catch (error) {
    console.error('[Admin Check] Error checking admin status:', error);
    return NextResponse.json({
      isAdmin: false,
      error: 'Failed to check admin status'
    }, { status: 500 });
  }
}
