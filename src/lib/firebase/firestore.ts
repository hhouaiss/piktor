import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  onSnapshot,
  writeBatch,
  increment,
  arrayUnion,
  arrayRemove,
  Timestamp,
  type DocumentSnapshot,
  type QuerySnapshot,
  type QueryConstraint
} from 'firebase/firestore';

import { getFirebaseDb } from './config';
import { getPlaceholderUrl } from '../image-placeholders';
import type {
  Visual,
  Project,
  UsageRecord,
  UserStats,
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

class FirestoreService {
  // Collections
  private readonly USERS_COLLECTION = 'users';
  private readonly PROJECTS_COLLECTION = 'projects';
  private readonly VISUALS_COLLECTION = 'visuals';
  private readonly USAGE_COLLECTION = 'usage';
  private readonly STATS_COLLECTION = 'user_stats';

  // ============================================================================
  // PROJECT OPERATIONS
  // ============================================================================

  /**
   * Create a new project
   */
  async createProject(userId: string, projectData: Partial<Project>): Promise<string> {

    const projectRef = collection(getFirebaseDb(), this.PROJECTS_COLLECTION);

    const project: FirestoreProject = {
      userId,
      name: projectData.name || 'Nouveau Projet',
      ...(projectData.description && { description: projectData.description }),
      category: projectData.category || 'product',
      ...(projectData.productInfo && { productInfo: projectData.productInfo }),
      defaultStyle: projectData.defaultStyle || 'modern',
      defaultEnvironment: projectData.defaultEnvironment || 'neutral',
      preferredFormats: projectData.preferredFormats || ['instagram_post'],
      status: 'active',
      isPublic: false,
      totalVisuals: 0,
      totalViews: 0,
      totalDownloads: 0,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      lastActivityAt: serverTimestamp() as Timestamp
    };

    const docRef = await addDoc(projectRef, project);
    return docRef.id;
  }

  /**
   * Get project by ID
   */
  async getProject(projectId: string): Promise<Project | null> {

    const projectRef = doc(getFirebaseDb(), this.PROJECTS_COLLECTION, projectId);
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

    let q = query(
      collection(getFirebaseDb(), this.PROJECTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('lastActivityAt', 'desc')
    );

    if (options?.limit) {
      q = query(q, limit(options.limit));
    }

    if (options?.startAfter) {
      q = query(q, startAfter(options.startAfter));
    }

    const snapshot = await getDocs(q);
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

    const projectRef = doc(getFirebaseDb(), this.PROJECTS_COLLECTION, projectId);
    
    await updateDoc(projectRef, {
      ...updates,
      updatedAt: serverTimestamp(),
      lastActivityAt: serverTimestamp()
    });
  }

  /**
   * Delete project and all associated visuals
   */
  async deleteProject(projectId: string): Promise<void> {

    const batch = writeBatch(getFirebaseDb());

    // Delete project
    const projectRef = doc(getFirebaseDb(), this.PROJECTS_COLLECTION, projectId);
    batch.delete(projectRef);

    // Delete all visuals in project
    const visualsQuery = query(
      collection(getFirebaseDb(), this.VISUALS_COLLECTION),
      where('projectId', '==', projectId)
    );
    const visualsSnapshot = await getDocs(visualsQuery);

    visualsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }

  // ============================================================================
  // VISUAL OPERATIONS
  // ============================================================================

  /**
   * Create a new visual
   */
  async createVisual(visualData: Omit<Visual, 'id'>): Promise<string> {

    const visualRef = collection(getFirebaseDb(), this.VISUALS_COLLECTION);
    
    const visual: FirestoreVisual = {
      ...visualData,
      views: 0,
      downloads: 0,
      shares: 0,
      isFavorite: false,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    };

    const docRef = await addDoc(visualRef, visual);

    // Update project stats
    await this.incrementProjectStats(visualData.projectId, { totalVisuals: 1 });

    // Record usage
    await this.recordUsage({
      userId: visualData.userId,
      type: 'generation',
      visualId: docRef.id,
      projectId: visualData.projectId,
      creditsUsed: 1,
      metadata: {
        source: 'dashboard',
        prompt: visualData.prompt,
        style: visualData.style,
        environment: visualData.environment
      },
      timestamp: serverTimestamp() as Timestamp
    });

    return docRef.id;
  }

  /**
   * Get visual by ID
   */
  async getVisual(visualId: string): Promise<Visual | null> {

    const visualRef = doc(getFirebaseDb(), this.VISUALS_COLLECTION, visualId);
    const visualDoc = await getDoc(visualRef);

    if (!visualDoc.exists()) {
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

    const constraints: QueryConstraint[] = [where('userId', '==', userId)];

    // Apply filters
    if (filters?.projectId) {
      constraints.push(where('projectId', '==', filters.projectId));
    }

    if (filters?.format) {
      constraints.push(where('format', 'array-contains', filters.format));
    }

    if (filters?.style) {
      constraints.push(where('style', '==', filters.style));
    }

    if (filters?.environment) {
      constraints.push(where('environment', '==', filters.environment));
    }

    if (filters?.isFavorite !== undefined) {
      constraints.push(where('isFavorite', '==', filters.isFavorite));
    }

    if (filters?.tags && filters.tags.length > 0) {
      constraints.push(where('tags', 'array-contains-any', filters.tags));
    }

    // Apply sorting
    const sortField = sort?.field || 'createdAt';
    const sortDirection = sort?.direction || 'desc';
    constraints.push(orderBy(sortField, sortDirection));

    // Apply pagination
    if (pagination?.limit) {
      constraints.push(limit(pagination.limit));
    }

    let q = query(collection(getFirebaseDb(), this.VISUALS_COLLECTION), ...constraints);

    if (pagination?.startAfter) {
      q = query(q, startAfter(pagination.startAfter));
    }

    const snapshot = await getDocs(q);
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

    const visualRef = doc(getFirebaseDb(), this.VISUALS_COLLECTION, visualId);
    
    await updateDoc(visualRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Delete visual
   */
  async deleteVisual(visualId: string): Promise<void> {
    const visual = await this.getVisual(visualId);
    if (!visual) return;


    const visualRef = doc(getFirebaseDb(), this.VISUALS_COLLECTION, visualId);
    await deleteDoc(visualRef);

    // Update project stats
    await this.incrementProjectStats(visual.projectId, { totalVisuals: -1 });
  }

  /**
   * Toggle visual favorite status
   */
  async toggleVisualFavorite(visualId: string): Promise<boolean> {
    const visual = await this.getVisual(visualId);
    if (!visual) throw new Error('Visual not found');

    const newFavoriteStatus = !visual.isFavorite;
    await this.updateVisual(visualId, { isFavorite: newFavoriteStatus });

    return newFavoriteStatus;
  }

  /**
   * Increment visual stats (views, downloads, shares)
   */
  async incrementVisualStats(
    visualId: string,
    stats: { views?: number; downloads?: number; shares?: number }
  ): Promise<void> {

    const visualRef = doc(getFirebaseDb(), this.VISUALS_COLLECTION, visualId);
    const updates: any = { lastViewedAt: serverTimestamp() };

    if (stats.views) updates.views = increment(stats.views);
    if (stats.downloads) updates.downloads = increment(stats.downloads);
    if (stats.shares) updates.shares = increment(stats.shares);

    await updateDoc(visualRef, updates);

    // Record usage for downloads
    if (stats.downloads) {
      const visual = await this.getVisual(visualId);
      if (visual) {
        await this.recordUsage({
          userId: visual.userId,
          type: 'download',
          visualId,
          projectId: visual.projectId,
          metadata: { source: 'dashboard' },
          timestamp: serverTimestamp() as Timestamp
        });
      }
    }
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
    const thisMonthVisuals = visuals.filter(v => 
      v.createdAt.toDate() >= startOfMonth
    );

    // Get user data for credits

    const userRef = doc(getFirebaseDb(), this.USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    return {
      totalVisuals: visuals.length,
      thisMonth: thisMonthVisuals.length,
      downloads: visuals.reduce((sum, v) => sum + v.downloads, 0),
      views: visuals.reduce((sum, v) => sum + v.views, 0),
      creditsUsed: userData?.usage?.creditsUsed || 0,
      creditsRemaining: (userData?.usage?.creditsTotal || 50) - (userData?.usage?.creditsUsed || 0),
      projects: projects.length
    };
  }

  /**
   * Get recent projects for dashboard
   */
  async getRecentProjects(userId: string, limitCount: number = 5): Promise<RecentProject[]> {
    const projectsResult = await this.getUserProjects(userId, { limit: limitCount });
    const recentProjects: RecentProject[] = [];


    for (const project of projectsResult.data) {
      // Get latest visual for thumbnail
      const visualsQuery = query(
        collection(getFirebaseDb(), this.VISUALS_COLLECTION),
        where('projectId', '==', project.id),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      const visualsSnapshot = await getDocs(visualsQuery);
      const latestVisual = visualsSnapshot.docs[0]?.data() as FirestoreVisual;

      recentProjects.push({
        id: project.id,
        name: project.name,
        thumbnail: latestVisual?.thumbnailUrl || getPlaceholderUrl('thumbnail'),
        createdAt: project.createdAt.toDate().toISOString(),
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

    const usageRef = collection(getFirebaseDb(), this.USAGE_COLLECTION);
    
    const usage: FirestoreUsageRecord = {
      ...usageData,
      timestamp: serverTimestamp() as Timestamp
    };

    await addDoc(usageRef, usage);
  }

  /**
   * Get usage statistics for user
   */
  async getUserUsageStats(
    userId: string,
    period: string = 'monthly'
  ): Promise<UserStats | null> {

    const statsRef = doc(getFirebaseDb(), this.STATS_COLLECTION, `${userId}_${period}`);
    const statsDoc = await getDoc(statsRef);

    if (!statsDoc.exists()) {
      return null;
    }

    const data = statsDoc.data() as FirestoreUserStats;
    return { ...data, userId, period };
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
      const db = getFirebaseDb();

    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    ];

    // Apply basic filters
    if (filters?.projectId) {
      constraints.push(where('projectId', '==', filters.projectId));
    }

    const q = query(collection(getFirebaseDb(), this.VISUALS_COLLECTION), ...constraints);

    return onSnapshot(q, (snapshot) => {
      const visuals: Visual[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as FirestoreVisual;
        visuals.push({ id: doc.id, ...data });
      });
      callback(visuals);
    });
    } catch (error) {
      console.error('Firebase Firestore not initialized:', error);
      // Return a no-op unsubscribe function
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
      const db = getFirebaseDb();

    const q = query(
      collection(getFirebaseDb(), this.PROJECTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('lastActivityAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const projects: Project[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as FirestoreProject;
        projects.push({ id: doc.id, ...data });
      });
      callback(projects);
    });
    } catch (error) {
      console.error('Firebase Firestore not initialized:', error);
      // Return a no-op unsubscribe function
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

    const projectRef = doc(getFirebaseDb(), this.PROJECTS_COLLECTION, projectId);
    const updates: any = { lastActivityAt: serverTimestamp() };

    if (stats.totalVisuals) updates.totalVisuals = increment(stats.totalVisuals);
    if (stats.totalViews) updates.totalViews = increment(stats.totalViews);
    if (stats.totalDownloads) updates.totalDownloads = increment(stats.totalDownloads);

    await updateDoc(projectRef, updates);
  }

  /**
   * Search visuals by text
   */
  async searchVisuals(
    userId: string,
    searchTerm: string,
    limit: number = 20
  ): Promise<Visual[]> {
    // Firestore doesn't support full-text search natively
    // This is a basic implementation - consider using Algolia or similar for production
    const allVisuals = await this.getUserVisuals(userId, undefined, undefined, { limit: 1000 });
    
    const searchLower = searchTerm.toLowerCase();
    return allVisuals.data.filter(visual =>
      visual.name.toLowerCase().includes(searchLower) ||
      visual.description?.toLowerCase().includes(searchLower) ||
      visual.prompt.toLowerCase().includes(searchLower) ||
      visual.tags.some(tag => tag.toLowerCase().includes(searchLower))
    ).slice(0, limit);
  }

  /**
   * Get trending visuals (most viewed in last 7 days)
   */
  async getTrendingVisuals(userId: string, maxResults: number = 10): Promise<Visual[]> {

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const q = query(
      collection(getFirebaseDb(), this.VISUALS_COLLECTION),
      where('userId', '==', userId),
      where('lastViewedAt', '>=', Timestamp.fromDate(sevenDaysAgo)),
      orderBy('views', 'desc'),
      limit(maxResults)
    );

    const snapshot = await getDocs(q);
    const visuals: Visual[] = [];

    snapshot.forEach(doc => {
      const data = doc.data() as FirestoreVisual;
      visuals.push({ id: doc.id, ...data });
    });

    return visuals;
  }
}

export const firestoreService = new FirestoreService();
export default firestoreService;