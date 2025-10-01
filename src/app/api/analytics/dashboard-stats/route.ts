import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/lib/supabase/analytics-service';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    const stats = await analyticsService.getDashboardStats(userId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[Dashboard Stats API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
