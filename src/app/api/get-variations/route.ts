import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { EditResult } from '@/lib/supabase/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const visualId = searchParams.get('visualId');

    if (!visualId) {
      return NextResponse.json(
        { error: 'Visual ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch variations from image_edits table
    type EditQueryResult = {
      data: any[] | null;
      error: any;
    };

    const editQuery: EditQueryResult = await supabase
      .from('image_edits')
      .select('*')
      .eq('original_visual_id', visualId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }) as any;

    if (editQuery.error) {
      console.error('[get-variations] Error fetching variations:', editQuery.error);
      return NextResponse.json(
        { error: 'Failed to fetch variations' },
        { status: 500 }
      );
    }

    // Transform to EditResult format
    const variations: EditResult[] = (editQuery.data || []).map((edit: any) => ({
      editId: edit.edit_id,
      editedImageUrl: edit.edited_image_url,
      thumbnailUrl: edit.thumbnail_url,
      editParams: edit.edit_params,
      metadata: edit.metadata,
      versionNumber: edit.version_number,
    }));

    return NextResponse.json({
      success: true,
      variations,
      count: variations.length,
    });

  } catch (error) {
    console.error('[get-variations] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
