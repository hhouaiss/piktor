/**
 * Analytics Service for Visual Tracking
 *
 * Provides functions to track and retrieve analytics for visuals:
 * - View tracking
 * - Download tracking
 * - Dashboard statistics
 * - Recent visuals
 */

import { supabaseClient } from './client';
import { supabaseAdmin } from './config';

export interface DashboardStats {
  totalVisuals: number;
  thisMonthVisuals: number;
  totalDownloads: number;
  totalViews: number;
}

export interface VisualAnalytics {
  visualId: string;
  views: number;
  downloads: number;
}

class AnalyticsService {
  /**
   * Track a view for a visual
   */
  async trackView(visualId: string): Promise<number> {
    try {
      const { data, error } = await supabaseClient.rpc('increment_visual_views', {
        visual_uuid: visualId
      } as any);

      if (error) {
        console.error('[Analytics] Error tracking view:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('[Analytics] Exception tracking view:', error);
      return 0;
    }
  }

  /**
   * Track a download for a visual
   */
  async trackDownload(visualId: string): Promise<number> {
    try {
      const { data, error } = await supabaseClient.rpc('increment_visual_downloads', {
        visual_uuid: visualId
      } as any);

      if (error) {
        console.error('[Analytics] Error tracking download:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('[Analytics] Exception tracking download:', error);
      return 0;
    }
  }

  /**
   * Get dashboard statistics for a user
   */
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      const { data, error } = await supabaseClient.rpc('get_user_dashboard_stats', {
        user_uuid: userId
      } as any);

      if (error) {
        console.error('[Analytics] Error fetching dashboard stats:', error);
        return {
          totalVisuals: 0,
          thisMonthVisuals: 0,
          totalDownloads: 0,
          totalViews: 0
        };
      }

      // RPC returns an array with a single row
      const stats: any = Array.isArray(data) ? data[0] : data;

      return {
        totalVisuals: stats?.total_visuals || 0,
        thisMonthVisuals: stats?.this_month_visuals || 0,
        totalDownloads: stats?.total_downloads || 0,
        totalViews: stats?.total_views || 0
      };
    } catch (error) {
      console.error('[Analytics] Exception fetching dashboard stats:', error);
      return {
        totalVisuals: 0,
        thisMonthVisuals: 0,
        totalDownloads: 0,
        totalViews: 0
      };
    }
  }

  /**
   * Get recent visuals for a user
   */
  async getRecentVisuals(userId: string, limit: number = 6) {
    try {
      const { data, error } = await supabaseClient
        .from('visuals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[Analytics] Error fetching recent visuals:', error);
        return [];
      }

      // Transform database rows to Visual type
      const visuals = (data || []).map((dbVisual: any) => {
        const metadata = dbVisual.metadata || {};

        return {
          id: dbVisual.id,
          userId: dbVisual.user_id,
          name: metadata.name || `Visual ${dbVisual.visual_id}`,
          description: metadata.description,
          projectId: dbVisual.project_id,
          originalImageUrl: dbVisual.original_url,
          thumbnailUrl: dbVisual.thumbnail_url,
          downloadUrls: metadata.downloadUrls || {},
          prompt: metadata.prompt || '',
          style: metadata.style || 'modern',
          environment: metadata.environment || 'neutral',
          format: metadata.format || ['instagram_post'],
          generationParams: metadata.generationParams || { model: 'default' },
          metadata: metadata,
          tags: metadata.tags || [],
          colors: metadata.colors || [],
          dimensions: metadata.dimensions || { width: 1024, height: 1024 },
          fileSize: metadata.fileSize || 0,
          mimeType: metadata.mimeType || 'image/jpeg',
          views: dbVisual.views || 0,
          downloads: dbVisual.downloads || 0,
          shares: metadata.shares || 0,
          isFavorite: metadata.isFavorite || false,
          createdAt: new Date(dbVisual.created_at).toISOString(),
          updatedAt: new Date(dbVisual.updated_at).toISOString(),
          lastViewedAt: metadata.lastViewedAt
        };
      });

      return visuals;
    } catch (error) {
      console.error('[Analytics] Exception fetching recent visuals:', error);
      return [];
    }
  }

  /**
   * Get analytics for a specific visual
   */
  async getVisualAnalytics(visualId: string): Promise<VisualAnalytics | null> {
    try {
      const { data, error } = await supabaseClient
        .from('visuals')
        .select('visual_id, views, downloads')
        .eq('visual_id', visualId)
        .single();

      if (error || !data) {
        console.error('[Analytics] Error fetching visual analytics:', error);
        return null;
      }

      return {
        visualId: (data as any).visual_id,
        views: (data as any).views || 0,
        downloads: (data as any).downloads || 0
      };
    } catch (error) {
      console.error('[Analytics] Exception fetching visual analytics:', error);
      return null;
    }
  }

  /**
   * Batch track views (for optimization if needed)
   */
  async batchTrackViews(visualIds: string[]): Promise<void> {
    try {
      // Track views in parallel
      await Promise.all(visualIds.map(id => this.trackView(id)));
    } catch (error) {
      console.error('[Analytics] Exception batch tracking views:', error);
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
