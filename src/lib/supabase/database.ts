import { supabaseAdmin } from './config';
import { supabaseClient } from './client';
import { getPlaceholderUrl } from '../image-placeholders';

// Use the cookie-based client instead of the old localStorage client
const supabase = supabaseClient;
import type {
  User,
  Visual,
  Project,
  UsageRecord,
  UserStats,
  DashboardStats,
  RecentProject,
  VisualFilters,
  VisualSort,
  PaginationOptions,
  PaginatedResult,
  SupabaseError,
  DatabaseUser,
  DatabaseVisual,
  DatabaseProject,
  DatabaseUsageRecord,
  DatabaseUserStats,
  InsertVisual,
  InsertProject,
  InsertUsageRecord,
  UpdateVisual,
  UpdateProject
} from './types';

/**
 * Transform database user row to application User type
 */
function transformUser(dbUser: DatabaseUser): User {
  const usage = (dbUser.usage as any) || { creditsUsed: 0, creditsTotal: 50, resetDate: null };
  const preferences = (dbUser.preferences as any) || { language: 'fr', notifications: true, theme: 'auto' };
  const subscription = dbUser.subscription as any;

  return {
    id: dbUser.id,
    email: dbUser.email,
    display_name: dbUser.display_name,
    photo_url: dbUser.photo_url,
    created_at: new Date(dbUser.created_at),
    updated_at: new Date(dbUser.updated_at),
    usage,
    preferences,
    subscription
  };
}

/**
 * Transform database visual row to application Visual type
 */
function transformVisual(dbVisual: DatabaseVisual): Visual {
  const metadata = (dbVisual.metadata as any) || {};

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
    metadata: metadata, // Add metadata field
    tags: metadata.tags || [],
    colors: metadata.colors || [],
    dimensions: metadata.dimensions || { width: 1024, height: 1024 },
    fileSize: metadata.fileSize || 0,
    mimeType: metadata.mimeType || 'image/jpeg',
    views: dbVisual.views || 0, // Read from database column, not metadata
    downloads: dbVisual.downloads || 0, // Read from database column, not metadata
    shares: metadata.shares || 0,
    isFavorite: metadata.isFavorite || false,
    createdAt: new Date(dbVisual.created_at).toISOString(),
    updatedAt: new Date(dbVisual.updated_at).toISOString(),
    lastViewedAt: metadata.lastViewedAt
  };
}

/**
 * Transform database project row to application Project type
 */
function transformProject(dbProject: DatabaseProject): Project {
  const productInfo = dbProject.product_info as any;

  return {
    id: dbProject.id,
    userId: dbProject.user_id,
    name: dbProject.name,
    description: dbProject.description,
    category: dbProject.category,
    productInfo,
    defaultStyle: dbProject.default_style,
    defaultEnvironment: dbProject.default_environment,
    preferredFormats: dbProject.preferred_formats,
    status: dbProject.status as 'draft' | 'active' | 'archived',
    isPublic: dbProject.is_public,
    totalVisuals: dbProject.total_visuals,
    totalViews: dbProject.total_views,
    totalDownloads: dbProject.total_downloads,
    createdAt: dbProject.created_at,
    updatedAt: dbProject.updated_at,
    lastActivityAt: dbProject.last_activity_at
  };
}

class SupabaseService {
  // ============================================================================
  // PROJECT OPERATIONS
  // ============================================================================

  /**
   * Create a new project
   */
  async createProject(userId: string, projectData: Partial<Project>): Promise<string> {
    try {
      const project: InsertProject = {
        user_id: userId,
        name: projectData.name || 'Nouveau Projet',
        description: projectData.description,
        category: projectData.category || 'product',
        product_info: projectData.productInfo ? JSON.stringify(projectData.productInfo) : null,
        default_style: projectData.defaultStyle || 'modern',
        default_environment: projectData.defaultEnvironment || 'neutral',
        preferred_formats: projectData.preferredFormats || ['instagram_post'],
        status: 'active',
        is_public: false,
        total_visuals: 0,
        total_views: 0,
        total_downloads: 0
      };

      const { data, error } = await (supabase as any)
        .from('projects')
        .insert(project)
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating project:', error);
      throw new Error(`Failed to create project: ${(error as any).message}`);
    }
  }

  /**
   * Get project by ID
   */
  async getProject(projectId: string): Promise<Project | null> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return transformProject(data);
    } catch (error) {
      console.error('Error getting project:', error);
      throw new Error(`Failed to get project: ${(error as any).message}`);
    }
  }

  /**
   * Get user's projects
   */
  async getUserProjects(userId: string, options?: PaginationOptions): Promise<PaginatedResult<Project>> {
    try {
      let query = supabase
        .from('projects')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('last_activity_at', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, (options.offset + (options?.limit || 10)) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const projects = data ? data.map(transformProject) : [];

      return {
        data: projects,
        hasMore: (count || 0) > projects.length + (options?.offset || 0),
        total: count || 0,
        count: projects.length
      };
    } catch (error) {
      console.error('Error getting user projects:', error);
      throw new Error(`Failed to get user projects: ${(error as any).message}`);
    }
  }

  /**
   * Update project
   */
  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    try {
      const updateData: UpdateProject = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.productInfo !== undefined) updateData.product_info = JSON.stringify(updates.productInfo);
      if (updates.defaultStyle !== undefined) updateData.default_style = updates.defaultStyle;
      if (updates.defaultEnvironment !== undefined) updateData.default_environment = updates.defaultEnvironment;
      if (updates.preferredFormats !== undefined) updateData.preferred_formats = updates.preferredFormats;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;

      // Always update the last activity timestamp
      updateData.last_activity_at = new Date().toISOString();

      const { error } = await (supabase as any)
        .from('projects')
        .update(updateData)
        .eq('id', projectId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating project:', error);
      throw new Error(`Failed to update project: ${(error as any).message}`);
    }
  }

  /**
   * Delete project and all associated visuals
   */
  async deleteProject(projectId: string): Promise<void> {
    try {
      // Delete all visuals in project first (due to foreign key constraint)
      await supabase
        .from('visuals')
        .delete()
        .eq('project_id', projectId);

      // Delete project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw new Error(`Failed to delete project: ${(error as any).message}`);
    }
  }

  // ============================================================================
  // VISUAL OPERATIONS
  // ============================================================================

  /**
   * Create a new visual
   */
  async createVisual(visualData: Omit<Visual, 'id'>): Promise<string> {
    try {
      const metadata = {
        name: visualData.name,
        description: visualData.description,
        downloadUrls: visualData.downloadUrls,
        prompt: visualData.prompt,
        style: visualData.style,
        environment: visualData.environment,
        format: visualData.format,
        generationParams: visualData.generationParams,
        tags: visualData.tags,
        colors: visualData.colors,
        dimensions: visualData.dimensions,
        fileSize: visualData.fileSize,
        mimeType: visualData.mimeType,
        views: 0,
        downloads: 0,
        shares: 0,
        isFavorite: false
      };

      const visual: InsertVisual = {
        user_id: visualData.userId,
        project_id: visualData.projectId,
        visual_id: `visual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        original_url: visualData.originalImageUrl,
        thumbnail_url: visualData.thumbnailUrl,
        metadata: JSON.stringify(metadata)
      };

      const { data, error } = await (supabase as any)
        .from('visuals')
        .insert(visual)
        .select('id')
        .single();

      if (error) throw error;

      // Update project stats
      await this.incrementProjectStats(visualData.projectId, { totalVisuals: 1 });

      // Record usage
      await this.recordUsage({
        userId: visualData.userId,
        type: 'generation',
        visualId: data.id,
        projectId: visualData.projectId,
        creditsUsed: 1,
        metadata: {
          source: 'dashboard',
          prompt: visualData.prompt,
          style: visualData.style,
          environment: visualData.environment
        },
        timestamp: new Date().toISOString()
      });

      return data.id;
    } catch (error) {
      console.error('Error creating visual:', error);
      throw new Error(`Failed to create visual: ${(error as any).message}`);
    }
  }

  /**
   * Get visual by ID
   */
  async getVisual(visualId: string): Promise<Visual | null> {
    try {
      const { data, error } = await supabase
        .from('visuals')
        .select('*')
        .eq('id', visualId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return transformVisual(data);
    } catch (error) {
      console.error('Error getting visual:', error);
      throw new Error(`Failed to get visual: ${(error as any).message}`);
    }
  }

  /**
   * Get user's visuals with filters and pagination
   */
  async getUserVisuals(
    userId: string,
    filters?: VisualFilters,
    sort?: VisualSort,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Visual>> {
    try {
      console.log('[Database] getUserVisuals called for user:', userId);

      let query = supabase
        .from('visuals')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // Apply filters
      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId);
      }

      // Apply sorting
      const sortField = sort?.field || 'created_at';
      const sortDirection = sort?.direction === 'asc' ? { ascending: true } : { ascending: false };
      query = query.order(sortField, sortDirection);

      // Apply pagination
      if (pagination?.limit) {
        query = query.limit(pagination.limit);
      }

      if (pagination?.offset) {
        query = query.range(pagination.offset, (pagination.offset + (pagination?.limit || 20)) - 1);
      }

      const { data, error, count } = await query;

      console.log('[Database] Query result:', {
        dataCount: data?.length || 0,
        error: error?.message,
        totalCount: count
      });

      if (error) {
        // If the error is about column not found, it means this is an empty database
        // Return empty result instead of throwing
        if (error.message?.includes('does not exist') || error.code === 'PGRST203') {
          return {
            data: [],
            hasMore: false,
            total: 0,
            count: 0
          };
        }
        throw error;
      }

      let visuals = data ? data.map(transformVisual) : [];

      // Apply client-side filters that can't be done at DB level
      if (filters) {
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          visuals = visuals.filter(visual =>
            visual.name.toLowerCase().includes(searchLower) ||
            visual.description?.toLowerCase().includes(searchLower) ||
            visual.prompt.toLowerCase().includes(searchLower) ||
            visual.tags.some(tag => tag.toLowerCase().includes(searchLower))
          );
        }

        if (filters.format) {
          visuals = visuals.filter(visual => visual.format.includes(filters.format!));
        }

        if (filters.style) {
          visuals = visuals.filter(visual => visual.style === filters.style);
        }

        if (filters.environment) {
          visuals = visuals.filter(visual => visual.environment === filters.environment);
        }

        if (filters.isFavorite !== undefined) {
          visuals = visuals.filter(visual => visual.isFavorite === filters.isFavorite);
        }

        if (filters.tags && filters.tags.length > 0) {
          visuals = visuals.filter(visual =>
            filters.tags!.some(filterTag => visual.tags.includes(filterTag))
          );
        }

        if (filters.dateRange) {
          const startDate = filters.dateRange.start.toISOString();
          const endDate = filters.dateRange.end.toISOString();
          visuals = visuals.filter(visual =>
            visual.createdAt >= startDate && visual.createdAt <= endDate
          );
        }
      }

      return {
        data: visuals,
        hasMore: (count || 0) > visuals.length + (pagination?.offset || 0),
        total: count || 0,
        count: visuals.length
      };
    } catch (error) {
      console.error('Error getting user visuals:', error);
      throw new Error(`Failed to get user visuals: ${(error as any).message}`);
    }
  }

  /**
   * Update visual
   */
  async updateVisual(visualId: string, updates: Partial<Visual>): Promise<void> {
    try {
      const current = await this.getVisual(visualId);
      if (!current) throw new Error('Visual not found');

      const updateData: UpdateVisual = {};
      let metadataUpdated = false;
      const currentMetadata = { ...current };

      // Handle simple fields
      if (updates.originalImageUrl !== undefined) updateData.original_url = updates.originalImageUrl;
      if (updates.thumbnailUrl !== undefined) updateData.thumbnail_url = updates.thumbnailUrl;

      // Handle metadata fields
      const metadataFields = [
        'name', 'description', 'downloadUrls', 'prompt', 'style', 'environment',
        'format', 'generationParams', 'tags', 'colors', 'dimensions',
        'fileSize', 'mimeType', 'views', 'downloads', 'shares', 'isFavorite', 'lastViewedAt'
      ];

      for (const field of metadataFields) {
        if (updates[field as keyof Visual] !== undefined) {
          (currentMetadata as any)[field] = (updates as any)[field];
          metadataUpdated = true;
        }
      }

      if (metadataUpdated) {
        updateData.metadata = JSON.stringify({
          name: currentMetadata.name,
          description: currentMetadata.description,
          downloadUrls: currentMetadata.downloadUrls,
          prompt: currentMetadata.prompt,
          style: currentMetadata.style,
          environment: currentMetadata.environment,
          format: currentMetadata.format,
          generationParams: currentMetadata.generationParams,
          tags: currentMetadata.tags,
          colors: currentMetadata.colors,
          dimensions: currentMetadata.dimensions,
          fileSize: currentMetadata.fileSize,
          mimeType: currentMetadata.mimeType,
          views: currentMetadata.views,
          downloads: currentMetadata.downloads,
          shares: currentMetadata.shares,
          isFavorite: currentMetadata.isFavorite,
          lastViewedAt: currentMetadata.lastViewedAt
        });
      }

      const { error } = await (supabase as any)
        .from('visuals')
        .update(updateData)
        .eq('id', visualId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating visual:', error);
      throw new Error(`Failed to update visual: ${(error as any).message}`);
    }
  }

  /**
   * Delete visual
   */
  async deleteVisual(visualId: string): Promise<void> {
    try {
      const visual = await this.getVisual(visualId);
      if (!visual) return;

      const { error } = await supabase
        .from('visuals')
        .delete()
        .eq('id', visualId);

      if (error) throw error;

      // Update project stats
      await this.incrementProjectStats(visual.projectId, { totalVisuals: -1 });
    } catch (error) {
      console.error('Error deleting visual:', error);
      throw new Error(`Failed to delete visual: ${(error as any).message}`);
    }
  }

  /**
   * Toggle visual favorite status
   */
  async toggleVisualFavorite(visualId: string): Promise<boolean> {
    try {
      const visual = await this.getVisual(visualId);
      if (!visual) throw new Error('Visual not found');

      const newFavoriteStatus = !visual.isFavorite;
      await this.updateVisual(visualId, { isFavorite: newFavoriteStatus });

      return newFavoriteStatus;
    } catch (error) {
      console.error('Error toggling visual favorite:', error);
      throw new Error(`Failed to toggle visual favorite: ${(error as any).message}`);
    }
  }

  /**
   * Increment visual stats (views, downloads, shares)
   */
  async incrementVisualStats(
    visualId: string,
    stats: { views?: number; downloads?: number; shares?: number }
  ): Promise<void> {
    try {
      const visual = await this.getVisual(visualId);
      if (!visual) throw new Error('Visual not found');

      const updates: Partial<Visual> = {
        lastViewedAt: new Date().toISOString()
      };

      if (stats.views) updates.views = (visual.views || 0) + stats.views;
      if (stats.downloads) updates.downloads = (visual.downloads || 0) + stats.downloads;
      if (stats.shares) updates.shares = (visual.shares || 0) + stats.shares;

      await this.updateVisual(visualId, updates);

      // Record usage for downloads
      if (stats.downloads) {
        await this.recordUsage({
          userId: visual.userId,
          type: 'download',
          visualId,
          projectId: visual.projectId,
          metadata: { source: 'dashboard' },
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error incrementing visual stats:', error);
      throw new Error(`Failed to increment visual stats: ${(error as any).message}`);
    }
  }

  // ============================================================================
  // DASHBOARD STATS
  // ============================================================================

  /**
   * Get dashboard stats for user
   */
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      // Get user data for credits
      const { data: userData } = await supabase
        .from('users')
        .select('usage')
        .eq('id', userId)
        .single();

      const usage = ((userData as any)?.usage as any) || { creditsUsed: 0, creditsTotal: 50 };

      // Get user's projects and visuals count
      const [projectsResult, visualsResult] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('visuals').select('created_at, metadata', { count: 'exact' }).eq('user_id', userId)
      ]);

      const totalProjects = projectsResult.count || 0;
      const totalVisuals = visualsResult.count || 0;
      const visuals = visualsResult.data || [];

      // Calculate this month's visuals
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthVisuals = visuals.filter(v =>
        new Date((v as any).created_at) >= startOfMonth
      ).length;

      // Calculate total downloads and views from metadata
      let totalDownloads = 0;
      let totalViews = 0;

      visuals.forEach(visual => {
        const metadata = ((visual as any).metadata as any) || {};
        totalDownloads += metadata.downloads || 0;
        totalViews += metadata.views || 0;
      });

      return {
        totalVisuals,
        thisMonth: thisMonthVisuals,
        downloads: totalDownloads,
        views: totalViews,
        creditsUsed: usage.creditsUsed || 0,
        creditsRemaining: (usage.creditsTotal || 50) - (usage.creditsUsed || 0),
        projects: totalProjects
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw new Error(`Failed to get dashboard stats: ${(error as any).message}`);
    }
  }

  /**
   * Get recent projects for dashboard
   */
  async getRecentProjects(userId: string, limitCount: number = 5): Promise<RecentProject[]> {
    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('last_activity_at', { ascending: false })
        .limit(limitCount);

      if (error) throw error;

      const recentProjects: RecentProject[] = [];

      for (const project of projects) {
        // Get latest visual for thumbnail
        const { data: visuals } = await supabase
          .from('visuals')
          .select('thumbnail_url')
          .eq('project_id', (project as any).id)
          .order('created_at', { ascending: false })
          .limit(1);

        const latestVisual = visuals?.[0];

        recentProjects.push({
          id: (project as any).id,
          name: (project as any).name,
          thumbnail: (latestVisual as any)?.thumbnail_url || getPlaceholderUrl('thumbnail'),
          createdAt: (project as any).created_at,
          format: (project as any).preferred_formats,
          downloads: (project as any).total_downloads,
          views: (project as any).total_views,
          visualsCount: (project as any).total_visuals
        });
      }

      return recentProjects;
    } catch (error) {
      console.error('Error getting recent projects:', error);
      throw new Error(`Failed to get recent projects: ${(error as any).message}`);
    }
  }

  // ============================================================================
  // USAGE TRACKING
  // ============================================================================

  /**
   * Record usage event
   */
  async recordUsage(usageData: Omit<UsageRecord, 'id'>): Promise<void> {
    try {
      const usage: InsertUsageRecord = {
        user_id: usageData.userId,
        type: usageData.type,
        visual_id: usageData.visualId,
        project_id: usageData.projectId,
        credits_used: usageData.creditsUsed,
        metadata: JSON.stringify(usageData.metadata),
        timestamp: usageData.timestamp
      };

      const { error } = await (supabase as any)
        .from('usage_records')
        .insert(usage);

      if (error) throw error;
    } catch (error) {
      console.error('Error recording usage:', error);
      // Don't throw error for usage tracking failures to avoid blocking main operations
    }
  }

  /**
   * Get usage statistics for user
   */
  async getUserUsageStats(
    userId: string,
    period: string = 'monthly'
  ): Promise<UserStats | null> {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('period', period)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return {
        id: (data as any).id,
        userId: (data as any).user_id,
        period: (data as any).period,
        stats: (data as any).stats as any,
        updatedAt: (data as any).updated_at
      };
    } catch (error) {
      console.error('Error getting user usage stats:', error);
      throw new Error(`Failed to get user usage stats: ${(error as any).message}`);
    }
  }

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  /**
   * Subscribe to user's visuals in real-time
   */
  subscribeToUserVisuals(
    userId: string,
    callback: (visuals: Visual[]) => void,
    filters?: VisualFilters
  ): () => void {
    try {
      const channel = supabase
        .channel('user_visuals')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'visuals',
            filter: `user_id=eq.${userId}`
          },
          async () => {
            // Refetch data when changes occur
            try {
              const result = await this.getUserVisuals(userId, filters, undefined, { limit: 50 });
              callback(result.data);
            } catch (error) {
              console.error('Error in visual subscription callback:', error);
            }
          }
        )
        .subscribe();

      // Initial data fetch
      this.getUserVisuals(userId, filters, undefined, { limit: 50 })
        .then(result => callback(result.data))
        .catch(error => console.error('Error fetching initial visuals:', error));

      return () => {
        channel.unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up visual subscription:', error);
      return () => {};
    }
  }

  /**
   * Subscribe to user's projects in real-time
   */
  subscribeToUserProjects(
    userId: string,
    callback: (projects: Project[]) => void
  ): () => void {
    try {
      const channel = supabase
        .channel('user_projects')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'projects',
            filter: `user_id=eq.${userId}`
          },
          async () => {
            // Refetch data when changes occur
            try {
              const result = await this.getUserProjects(userId);
              callback(result.data);
            } catch (error) {
              console.error('Error in project subscription callback:', error);
            }
          }
        )
        .subscribe();

      // Initial data fetch
      this.getUserProjects(userId)
        .then(result => callback(result.data))
        .catch(error => console.error('Error fetching initial projects:', error));

      return () => {
        channel.unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up project subscription:', error);
      return () => {};
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Increment project statistics
   */
  private async incrementProjectStats(
    projectId: string,
    stats: { totalVisuals?: number; totalViews?: number; totalDownloads?: number }
  ): Promise<void> {
    try {
      const project = await this.getProject(projectId);
      if (!project) return;

      const updates: Partial<Project> = {
        lastActivityAt: new Date().toISOString()
      };

      if (stats.totalVisuals) {
        updates.totalVisuals = Math.max(0, project.totalVisuals + stats.totalVisuals);
      }
      if (stats.totalViews) {
        updates.totalViews = Math.max(0, project.totalViews + stats.totalViews);
      }
      if (stats.totalDownloads) {
        updates.totalDownloads = Math.max(0, project.totalDownloads + stats.totalDownloads);
      }

      await this.updateProject(projectId, updates);
    } catch (error) {
      console.error('Error incrementing project stats:', error);
      // Don't throw error for stats updates to avoid blocking main operations
    }
  }

  /**
   * Search visuals by text
   */
  async searchVisuals(
    userId: string,
    searchTerm: string,
    limit: number = 20
  ): Promise<Visual[]> {
    try {
      // Use the existing getUserVisuals method with search filter
      const result = await this.getUserVisuals(
        userId,
        { search: searchTerm },
        undefined,
        { limit }
      );
      return result.data;
    } catch (error) {
      console.error('Error searching visuals:', error);
      throw new Error(`Failed to search visuals: ${(error as any).message}`);
    }
  }

  /**
   * Get trending visuals (most viewed in last 7 days)
   */
  async getTrendingVisuals(userId: string, maxResults: number = 10): Promise<Visual[]> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const result = await this.getUserVisuals(
        userId,
        { dateRange: { start: sevenDaysAgo, end: new Date() } },
        { field: 'views', direction: 'desc' },
        { limit: maxResults }
      );

      // Filter for visuals that actually have views and were viewed recently
      return result.data.filter(visual =>
        visual.views > 0 &&
        visual.lastViewedAt &&
        new Date(visual.lastViewedAt) >= sevenDaysAgo
      );
    } catch (error) {
      console.error('Error getting trending visuals:', error);
      throw new Error(`Failed to get trending visuals: ${(error as any).message}`);
    }
  }

  // ============================================================================
  // USER OPERATIONS
  // ============================================================================

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return transformUser(data);
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error(`Failed to get user: ${(error as any).message}`);
    }
  }

  /**
   * Update user
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const updateData: any = {};

      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.display_name !== undefined) updateData.display_name = updates.display_name;
      if (updates.photo_url !== undefined) updateData.photo_url = updates.photo_url;
      if (updates.usage !== undefined) updateData.usage = JSON.stringify(updates.usage);
      if (updates.preferences !== undefined) updateData.preferences = JSON.stringify(updates.preferences);
      if (updates.subscription !== undefined) updateData.subscription = JSON.stringify(updates.subscription);

      const { error } = await (supabase as any)
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error(`Failed to update user: ${(error as any).message}`);
    }
  }
}

export const supabaseService = new SupabaseService();
export default supabaseService;