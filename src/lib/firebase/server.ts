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
    return adminDb || db; // Use client SDK if admin SDK not available
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
        displayName: userData.displayName || null,
        photoURL: userData.photoURL || null,
        createdAt: timestamp as any,
        updatedAt: timestamp as any,
        usage: {
          creditsUsed: 0,
          creditsTotal: 50, // Default free tier
          resetDate: this.getNextMonthTimestamp()
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
      description: projectData.description || null,
      category: projectData.category || 'product',
      productInfo: projectData.productInfo || null, // Make sure this is not undefined
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
    let query = adminDb.collection(this.PROJECTS_COLLECTION)
      .where('userId', '==', userId)
      .orderBy('lastActivityAt', 'desc');

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.startAfter) {
      const startAfterDoc = await adminDb.collection(this.PROJECTS_COLLECTION).doc(options.startAfter).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const snapshot = await query.get();
    const projects: Project[] = [];

    snapshot.forEach(doc => {
      const data = doc.data() as FirestoreProject;
      projects.push({ id: doc.id, ...data });
    });

    return {
      data: projects,
      hasMore: snapshot.docs.length === (options?.limit || 10),
      nextPageToken: snapshot.docs[snapshot.docs.length - 1]?.id
    };
  }

  /**
   * Update project
   */
  async updateProject(projectId: string, updates: Partial<FirestoreProject>): Promise<void> {
    const projectRef = adminDb.collection(this.PROJECTS_COLLECTION).doc(projectId);
    
    await projectRef.update({
      ...updates,
      updatedAt: new Date(),
      lastActivityAt: new Date()
    });
  }

  /**
   * Delete project and all associated visuals
   */
  async deleteProject(projectId: string): Promise<void> {
    const batch = adminDb.batch();

    // Delete project
    const projectRef = adminDb.collection(this.PROJECTS_COLLECTION).doc(projectId);
    batch.delete(projectRef);

    // Delete all visuals in project
    const visualsSnapshot = await adminDb.collection(this.VISUALS_COLLECTION)
      .where('projectId', '==', projectId)
      .get();

    visualsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }

  // ============================================================================
  // VISUAL OPERATIONS
  // ============================================================================

  /**
   * Create a new visual using Admin SDK
   */
  async createVisual(visualData: Omit<Visual, 'id'>): Promise<string> {
    const visualRef = adminDb.collection(this.VISUALS_COLLECTION).doc();
    
    const timestamp = new Date();
    const visual: FirestoreVisual = {
      ...visualData,
      views: 0,
      downloads: 0,
      shares: 0,
      isFavorite: false,
      createdAt: timestamp as any,
      updatedAt: timestamp as any
    };

    await visualRef.set(visual);

    // Update project stats
    await this.incrementProjectStats(visualData.projectId, { totalVisuals: 1 });

    // Record usage
    await this.recordUsage({
      userId: visualData.userId,
      type: 'generation',
      visualId: visualRef.id,
      projectId: visualData.projectId,
      creditsUsed: 1,
      metadata: {
        source: 'dashboard',
        prompt: visualData.prompt,
        style: visualData.style,
        environment: visualData.environment
      },
      timestamp: timestamp as any
    });

    return visualRef.id;
  }

  /**
   * Get visual by ID
   */
  async getVisual(visualId: string): Promise<Visual | null> {
    const visualRef = adminDb.collection(this.VISUALS_COLLECTION).doc(visualId);
    const visualDoc = await visualRef.get();

    if (!visualDoc.exists) {
      return null;
    }

    const data = visualDoc.data() as FirestoreVisual;
    return { id: visualDoc.id, ...data };
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
    let query = adminDb.collection(this.VISUALS_COLLECTION)
      .where('userId', '==', userId);

    // Apply filters
    if (filters?.projectId) {
      query = query.where('projectId', '==', filters.projectId);
    }

    if (filters?.format) {
      query = query.where('format', 'array-contains', filters.format);
    }

    if (filters?.style) {
      query = query.where('style', '==', filters.style);
    }

    if (filters?.environment) {
      query = query.where('environment', '==', filters.environment);
    }

    if (filters?.isFavorite !== undefined) {
      query = query.where('isFavorite', '==', filters.isFavorite);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.where('tags', 'array-contains-any', filters.tags);
    }

    // Apply sorting
    const sortField = sort?.field || 'createdAt';
    const sortDirection = sort?.direction || 'desc';
    query = query.orderBy(sortField, sortDirection);

    // Apply pagination
    if (pagination?.limit) {
      query = query.limit(pagination.limit);
    }

    if (pagination?.startAfter) {
      const startAfterDoc = await adminDb.collection(this.VISUALS_COLLECTION).doc(pagination.startAfter).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const snapshot = await query.get();
    const visuals: Visual[] = [];

    snapshot.forEach(doc => {
      const data = doc.data() as FirestoreVisual;
      visuals.push({ id: doc.id, ...data });
    });

    return {
      data: visuals,
      hasMore: snapshot.docs.length === (pagination?.limit || 20),
      nextPageToken: snapshot.docs[snapshot.docs.length - 1]?.id
    };
  }

  /**
   * Update visual
   */
  async updateVisual(visualId: string, updates: Partial<FirestoreVisual>): Promise<void> {
    const visualRef = adminDb.collection(this.VISUALS_COLLECTION).doc(visualId);
    
    await visualRef.update({
      ...updates,
      updatedAt: new Date()
    });
  }

  /**
   * Delete visual
   */
  async deleteVisual(visualId: string): Promise<void> {
    const visual = await this.getVisual(visualId);
    if (!visual) return;

    const visualRef = adminDb.collection(this.VISUALS_COLLECTION).doc(visualId);
    await visualRef.delete();

    // Update project stats
    await this.incrementProjectStats(visual.projectId, { totalVisuals: -1 });
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
    const projectsResult = await this.getUserProjects(userId, { limit });
    const recentProjects: RecentProject[] = [];

    for (const project of projectsResult.data) {
      // Get latest visual for thumbnail
      const visualsSnapshot = await adminDb.collection(this.VISUALS_COLLECTION)
        .where('projectId', '==', project.id)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
      
      const latestVisual = visualsSnapshot.docs[0]?.data() as FirestoreVisual;

      recentProjects.push({
        id: project.id,
        name: project.name,
        thumbnail: latestVisual?.thumbnailUrl || '/api/placeholder/300/200',
        createdAt: project.createdAt instanceof Date ? project.createdAt.toISOString() : (project.createdAt as any).toDate().toISOString(),
        format: project.preferredFormats,
        downloads: project.totalDownloads,
        views: project.totalViews,
        visualsCount: project.totalVisuals
      });
    }

    return recentProjects;
  }

  // ============================================================================
  // USAGE TRACKING
  // ============================================================================

  /**
   * Record usage event
   */
  async recordUsage(usageData: Omit<UsageRecord, 'id'>): Promise<void> {
    const usageRef = adminDb.collection(this.USAGE_COLLECTION).doc();
    
    const usage: FirestoreUsageRecord = {
      ...usageData,
      timestamp: new Date() as any
    };

    await usageRef.set(usage);
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
    const projectRef = adminDb.collection(this.PROJECTS_COLLECTION).doc(projectId);
    const projectDoc = await projectRef.get();
    
    if (projectDoc.exists) {
      const currentData = projectDoc.data() as FirestoreProject;
      const updates: any = { lastActivityAt: new Date() };

      if (stats.totalVisuals) {
        updates.totalVisuals = (currentData.totalVisuals || 0) + stats.totalVisuals;
      }
      if (stats.totalViews) {
        updates.totalViews = (currentData.totalViews || 0) + stats.totalViews;
      }
      if (stats.totalDownloads) {
        updates.totalDownloads = (currentData.totalDownloads || 0) + stats.totalDownloads;
      }

      await projectRef.update(updates);
    }
  }
}

export const serverFirestoreService = new ServerFirestoreService();
export default serverFirestoreService;