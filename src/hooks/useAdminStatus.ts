'use client';

import { useEffect, useState } from 'react';
import { useSimpleAuth } from '@/components/auth/simple-auth-provider';
import { enableAdminMode } from '@/lib/usage-limits';

/**
 * Hook to automatically detect and enable admin status
 *
 * This hook:
 * 1. Checks if current user is an admin (via server API)
 * 2. Automatically enables admin mode in localStorage
 * 3. Refreshes usage context to apply unlimited access
 *
 * Admin users get:
 * - Unlimited generations
 * - All premium features
 * - No watermarks
 * - No upgrade prompts
 */
export function useAdminStatus() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useSimpleAuth();

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/admin/check');

        if (!response.ok) {
          throw new Error('Failed to check admin status');
        }

        const data = await response.json();

        if (data.isAdmin) {
          console.log('[Admin] Admin user detected - enabling full access');

          // Auto-enable admin mode in localStorage
          enableAdminMode();

          setIsAdmin(true);

          // Trigger a page refresh to apply admin mode
          // This ensures all contexts pick up the admin status
          if (typeof window !== 'undefined') {
            // Only refresh if not already in admin mode
            const currentAdminMode = localStorage.getItem('piktor_admin_bypass');
            if (currentAdminMode !== 'true') {
              window.location.reload();
            }
          }
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('[Admin] Failed to check admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdminStatus();
  }, [user]);

  return { isAdmin, loading };
}
