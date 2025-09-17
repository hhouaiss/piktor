/**
 * Server-side Firebase service using Firebase Admin SDK
 * 
 * This service is designed for use in API routes and server-side code.
 * It uses Firebase Admin SDK which has elevated privileges and doesn't
 * require user authentication.
 */

import { adminDb } from './admin';
import { db } from './config';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import type {
  User,
  Visual,
  Project,
  UsageRecord,
  UserStats,
  FirestoreUser,
  FirestoreVisual,
  FirestoreProject,
  FirestoreUsageRecord,
  FirestoreUserStats,
  VisualFilters,
  VisualSort,
  PaginationOptions,
  PaginatedResult,
  DashboardStats,
  RecentProject
} from './types';

class ServerFirestoreService {
  // Collections
  private readonly USERS_COLLECTION = 'users';
  private readonly PROJECTS_COLLECTION = 'projects';
  private readonly VISUALS_COLLECTION = 'visuals';
  private readonly USAGE_COLLECTION = 'usage';
  private readonly STATS_COLLECTION = 'user_stats';

  // Use client SDK for now (in development)
  private get firestore() {
    return db; // Use client SDK consistently
  }

  // ============================================================================
  // USER OPERATIONS
  // ============================================================================

  /**
   * Get user data from Firestore using Admin SDK
   */
  async getUserData(userId: string): Promise<User> {
    const userRef = doc(this.firestore, this.USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User document not found');
    }

    const userData = userDoc.data() as FirestoreUser;
    return {
      id: userId,
      ...userData
    };
  }

  /**
   * Create or update user document
   */
  async ensureUserDocument(userId: string, userData: Partial<FirestoreUser>): Promise<void> {
    const userRef = doc(this.firestore, this.USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);

    const timestamp = serverTimestamp();

    if (!userDoc.exists()) {
      const defaultUserData: FirestoreUser = {
        email: userData.email || '',
        displayName: userData.displayName || undefined,
        photoURL: userData.photoURL || undefined,
        createdAt: timestamp as any,
        updatedAt: timestamp as any,
        usage: {
          creditsUsed: 0,
          creditsTotal: 50, // Default free tier
          resetDate: serverTimestamp() as any
        },
        preferences: {
          language: 'fr',
          notifications: true,
          theme: 'auto'
        },
        ...userData
      };

      await setDoc(userRef, defaultUserData);
    } else {
      // Update last activity
      await updateDoc(userRef, {
        updatedAt: timestamp,
        ...userData
      });
    }
  }

  private getNextMonthTimestamp(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  /**
   * Check if user has sufficient credits
   */
  async hasCredits(userId: string, creditsNeeded: number = 1): Promise<boolean> {
    const userData = await this.getUserData(userId);
    return (userData.usage.creditsTotal - userData.usage.creditsUsed) >= creditsNeeded;
  }

  /**
   * Use credits for generation
   */
  async useCredits(userId: string, creditsUsed: number): Promise<void> {
    const userRef = doc(this.firestore, this.USERS_COLLECTION, userId);
    const userData = await this.getUserData(userId);
    
    const newCreditsUsed = userData.usage.creditsUsed + creditsUsed;
    
    if (newCreditsUsed > userData.usage.creditsTotal) {
      throw new Error('Insufficient credits');
    }

    await updateDoc(userRef, {
      'usage.creditsUsed': newCreditsUsed,
      updatedAt: serverTimestamp()
    });
  }

  // ============================================================================
  // PROJECT OPERATIONS
  // ============================================================================

  /**
   * Create a new project using Admin SDK
   */
  async createProject(userId: string, projectData: Partial<Project>): Promise<string> {
    const projectRef = doc(collection(this.firestore, this.PROJECTS_COLLECTION));
    
    const timestamp = serverTimestamp();
    const project: FirestoreProject = {
      userId,
      name: projectData.name || 'Nouveau Projet',
      description: projectData.description || undefined,
      category: projectData.category || 'product',
      productInfo: projectData.productInfo || undefined, // Make sure this is not undefined
      defaultStyle: projectData.defaultStyle || 'modern',
      defaultEnvironment: projectData.defaultEnvironment || 'neutral',
      preferredFormats: projectData.preferredFormats || ['instagram_post'],
      status: 'active',
      isPublic: false,
      totalVisuals: 0,
      totalViews: 0,
      totalDownloads: 0,
      createdAt: timestamp as any,
      updatedAt: timestamp as any,
      lastActivityAt: timestamp as any
    };

    await setDoc(projectRef, project);
    return projectRef.id;
  }

  /**
   * Get project by ID
   */
  async getProject(projectId: string): Promise<Project | null> {
    const projectRef = doc(this.firestore, this.PROJECTS_COLLECTION, projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      return null;
    }

    const data = projectDoc.data() as FirestoreProject;
    return { id: projectDoc.id, ...data };
  }

  /**
   * Get user's projects
   */
  async getUserProjects(userId: string, options?: PaginationOptions): Promise<PaginatedResult<Project>> {
    // This method is not used - return empty result for now
    return {
      data: [],
      hasMore: false,
      nextPageToken: undefined
    };
  }

  /**
   * Update project
   */
  async updateProject(projectId: string, updates: Partial<FirestoreProject>): Promise<void> {
    // This method is not used - stub implementation
    console.warn('updateProject called on unused server service');
  }

  /**
   * Delete project and all associated visuals
   */
  async deleteProject(projectId: string): Promise<void> {
    // This method is not used - stub implementation
    console.warn('deleteProject called on unused server service');
  }

  // ============================================================================
  // VISUAL OPERATIONS
  // ============================================================================

  /**
   * Create a new visual using Admin SDK
   */
  async createVisual(visualData: Omit<Visual, 'id'>): Promise<string> {
    // This method is not used - stub implementation
    console.warn('createVisual called on unused server service');
    return 'stub-id';
  }

  /**
   * Get visual by ID
   */
  async getVisual(visualId: string): Promise<Visual | null> {
    // This method is not used - stub implementation
    console.warn('getVisual called on unused server service');
    return null;
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
    // This method is not used - return empty result for now
    return {
      data: [],
      hasMore: false,
      nextPageToken: undefined
    };
  }

  /**
   * Update visual
   */
  async updateVisual(visualId: string, updates: Partial<FirestoreVisual>): Promise<void> {
    // This method is not used - stub implementation
    console.warn('updateVisual called on unused server service');
  }

  /**
   * Delete visual
   */
  async deleteVisual(visualId: string): Promise<void> {
    // This method is not used - stub implementation
    console.warn('deleteVisual called on unused server service');
  }

  // ============================================================================
  // DASHBOARD STATS
  // ============================================================================

  /**
   * Get dashboard stats for user
   */
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    // Get user's projects and visuals
    const [projectsResult, visualsResult] = await Promise.all([
      this.getUserProjects(userId, { limit: 1000 }),
      this.getUserVisuals(userId, undefined, undefined, { limit: 1000 })
    ]);

    const projects = projectsResult.data;
    const visuals = visualsResult.data;

    // Calculate this month's visuals
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthVisuals = visuals.filter(v => {
      const createdAt = v.createdAt instanceof Date ? v.createdAt : (v.createdAt as any).toDate();
      return createdAt >= startOfMonth;
    });

    // Get user data for credits
    const userData = await this.getUserData(userId);

    return {
      totalVisuals: visuals.length,
      thisMonth: thisMonthVisuals.length,
      downloads: visuals.reduce((sum, v) => sum + v.downloads, 0),
      views: visuals.reduce((sum, v) => sum + v.views, 0),
      creditsUsed: userData.usage.creditsUsed || 0,
      creditsRemaining: (userData.usage.creditsTotal || 50) - (userData.usage.creditsUsed || 0),
      projects: projects.length
    };
  }

  /**
   * Get recent projects for dashboard
   */
  async getRecentProjects(userId: string, limit: number = 5): Promise<RecentProject[]> {
    // This method is not used - return empty result for now
    return [];
  }

  // ============================================================================
  // USAGE TRACKING
  // ============================================================================

  /**
   * Record usage event
   */
  async recordUsage(usageData: Omit<UsageRecord, 'id'>): Promise<void> {
    // This method is not used - stub implementation
    console.warn('recordUsage called on unused server service');
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
    // This method is not used - stub implementation
    console.warn('incrementProjectStats called on unused server service');
  }
}

export const serverFirestoreService = new ServerFirestoreService();
export default serverFirestoreService;