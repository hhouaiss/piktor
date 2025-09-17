/**
 * Server-side Firebase service with mock authentication
 * 
 * This service uses the regular Firebase Client SDK but simulates
 * authentication for server-side operations in development.
 */

import { db, auth } from './config';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  writeBatch,
  serverTimestamp,
  Timestamp,
  increment
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

class MockAuthFirestoreService {
  private authInitialized = false;
  private authPromise: Promise<void>;

  constructor() {
    this.authPromise = this.initializeAuth();
  }

  // Initialize anonymous authentication for server-side operations
  private async initializeAuth(): Promise<void> {
    if (this.authInitialized) return;

    // Skip auth initialization during build time
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
      console.log('Skipping Firebase auth during build time');
      this.authInitialized = true;
      return;
    }

    try {
      // Sign in anonymously to get authentication context
      await signInAnonymously(auth);
      this.authInitialized = true;
      console.log('🔥 Firebase authenticated for server-side operations');
    } catch (error) {
      console.error('Failed to initialize Firebase auth:', error);
      // Continue without auth - rules should be permissive
      this.authInitialized = true; // Mark as initialized to prevent retries
    }
  }

  // Ensure auth is initialized before any operation
  private async ensureAuth(): Promise<void> {
    await this.authPromise;
  }

  // Collections
  private readonly USERS_COLLECTION = 'users';
  private readonly PROJECTS_COLLECTION = 'projects';
  private readonly VISUALS_COLLECTION = 'visuals';
  private readonly USAGE_COLLECTION = 'usage';
  private readonly STATS_COLLECTION = 'user_stats';

  // ============================================================================
  // USER OPERATIONS
  // ============================================================================

  async getUserData(userId: string): Promise<User> {
    await this.ensureAuth();
    
    const userRef = doc(db, this.USERS_COLLECTION, userId);
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

  async ensureUserDocument(userId: string, userData: Partial<FirestoreUser>): Promise<void> {
    await this.ensureAuth();
    
    const userRef = doc(db, this.USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      const defaultUserData: FirestoreUser = {
        email: userData.email || '',
        displayName: userData.displayName || undefined,
        photoURL: userData.photoURL || undefined,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
        usage: {
          creditsUsed: 0,
          creditsTotal: 50,
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
      await updateDoc(userRef, {
        updatedAt: serverTimestamp(),
        ...userData
      });
    }
  }

  private getNextMonthDate(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  async hasCredits(userId: string, creditsNeeded: number = 1): Promise<boolean> {
    const userData = await this.getUserData(userId);
    return (userData.usage.creditsTotal - userData.usage.creditsUsed) >= creditsNeeded;
  }

  async useCredits(userId: string, creditsUsed: number): Promise<void> {
    const userRef = doc(db, this.USERS_COLLECTION, userId);
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

  async createProject(userId: string, projectData: Partial<Project>): Promise<string> {
    await this.ensureAuth();
    
    const project: FirestoreProject = {
      userId,
      name: projectData.name || 'Nouveau Projet',
      description: projectData.description || undefined,
      category: projectData.category || 'product',
      productInfo: projectData.productInfo || undefined,
      defaultStyle: projectData.defaultStyle || 'modern',
      defaultEnvironment: projectData.defaultEnvironment || 'neutral',
      preferredFormats: projectData.preferredFormats || ['instagram_post'],
      status: 'active',
      isPublic: false,
      totalVisuals: 0,
      totalViews: 0,
      totalDownloads: 0,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      lastActivityAt: serverTimestamp() as any
    };

    const docRef = await addDoc(collection(db, this.PROJECTS_COLLECTION), project);
    return docRef.id;
  }

  async getProject(projectId: string): Promise<Project | null> {
    await this.ensureAuth();
    
    const projectRef = doc(db, this.PROJECTS_COLLECTION, projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      return null;
    }

    const data = projectDoc.data() as FirestoreProject;
    return { id: projectDoc.id, ...data };
  }

  async getUserProjects(userId: string, options?: PaginationOptions): Promise<PaginatedResult<Project>> {
    await this.ensureAuth();
    
    let q = query(
      collection(db, this.PROJECTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('lastActivityAt', 'desc')
    );

    if (options?.limit) {
      q = query(q, limit(options.limit));
    }

    if (options?.startAfter) {
      const startAfterDoc = await getDoc(doc(db, this.PROJECTS_COLLECTION, options.startAfter));
      if (startAfterDoc.exists()) {
        q = query(q, startAfter(startAfterDoc));
      }
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

  async updateProject(projectId: string, updates: Partial<FirestoreProject>): Promise<void> {
    await this.ensureAuth();
    
    const projectRef = doc(db, this.PROJECTS_COLLECTION, projectId);
    
    await updateDoc(projectRef, {
      ...updates,
      updatedAt: serverTimestamp(),
      lastActivityAt: serverTimestamp()
    });
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.ensureAuth();
    
    const batch = writeBatch(db);

    // Delete project
    const projectRef = doc(db, this.PROJECTS_COLLECTION, projectId);
    batch.delete(projectRef);

    // Delete all visuals in project
    const visualsQuery = query(
      collection(db, this.VISUALS_COLLECTION),
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

  async createVisual(visualData: Omit<Visual, 'id'>): Promise<string> {
    await this.ensureAuth();
    
    const visual: FirestoreVisual = {
      ...visualData,
      views: 0,
      downloads: 0,
      shares: 0,
      isFavorite: false,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any
    };

    const docRef = await addDoc(collection(db, this.VISUALS_COLLECTION), visual);

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
      timestamp: serverTimestamp() as any
    });

    return docRef.id;
  }

  async getVisual(visualId: string): Promise<Visual | null> {
    await this.ensureAuth();
    
    const visualRef = doc(db, this.VISUALS_COLLECTION, visualId);
    const visualDoc = await getDoc(visualRef);

    if (!visualDoc.exists()) {
      return null;
    }

    const data = visualDoc.data() as FirestoreVisual;
    return { id: visualDoc.id, ...data };
  }

  async getUserVisuals(
    userId: string,
    filters?: VisualFilters,
    sort?: VisualSort,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Visual>> {
    await this.ensureAuth();
    
    let q = query(
      collection(db, this.VISUALS_COLLECTION),
      where('userId', '==', userId)
    );

    // Apply filters
    if (filters?.projectId) {
      q = query(q, where('projectId', '==', filters.projectId));
    }

    if (filters?.format) {
      q = query(q, where('format', 'array-contains', filters.format));
    }

    if (filters?.style) {
      q = query(q, where('style', '==', filters.style));
    }

    if (filters?.environment) {
      q = query(q, where('environment', '==', filters.environment));
    }

    if (filters?.isFavorite !== undefined) {
      q = query(q, where('isFavorite', '==', filters.isFavorite));
    }

    if (filters?.tags && filters.tags.length > 0) {
      q = query(q, where('tags', 'array-contains-any', filters.tags));
    }

    // Apply sorting
    const sortField = sort?.field || 'createdAt';
    const sortDirection = sort?.direction || 'desc';
    q = query(q, orderBy(sortField, sortDirection));

    // Apply pagination
    if (pagination?.limit) {
      q = query(q, limit(pagination.limit));
    }

    if (pagination?.startAfter) {
      const startAfterDoc = await getDoc(doc(db, this.VISUALS_COLLECTION, pagination.startAfter));
      if (startAfterDoc.exists()) {
        q = query(q, startAfter(startAfterDoc));
      }
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

  async updateVisual(visualId: string, updates: Partial<FirestoreVisual>): Promise<void> {
    await this.ensureAuth();
    
    const visualRef = doc(db, this.VISUALS_COLLECTION, visualId);
    
    await updateDoc(visualRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  async deleteVisual(visualId: string): Promise<void> {
    await this.ensureAuth();
    
    const visual = await this.getVisual(visualId);
    if (!visual) return;

    const visualRef = doc(db, this.VISUALS_COLLECTION, visualId);
    await deleteDoc(visualRef);

    // Update project stats
    await this.incrementProjectStats(visual.projectId, { totalVisuals: -1 });
  }

  // ============================================================================
  // DASHBOARD STATS
  // ============================================================================

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


  async getRecentProjects(userId: string, limitCount: number = 5): Promise<RecentProject[]> {
    const projectsResult = await this.getUserProjects(userId, { limit: limitCount });
    const recentProjects: RecentProject[] = [];

    for (const project of projectsResult.data) {
      // Get latest visual for thumbnail
      const visualsQuery = query(
        collection(db, this.VISUALS_COLLECTION),
        where('projectId', '==', project.id),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      const visualsSnapshot = await getDocs(visualsQuery);
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

  async recordUsage(usageData: Omit<UsageRecord, 'id'>): Promise<void> {
    await this.ensureAuth();
    
    const usage: FirestoreUsageRecord = {
      ...usageData,
      timestamp: serverTimestamp() as any
    };

    await addDoc(collection(db, this.USAGE_COLLECTION), usage);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async incrementProjectStats(
    projectId: string,
    stats: { totalVisuals?: number; totalViews?: number; totalDownloads?: number }
  ): Promise<void> {
    const projectRef = doc(db, this.PROJECTS_COLLECTION, projectId);
    const updates: any = { lastActivityAt: serverTimestamp() };

    if (stats.totalVisuals) {
      updates.totalVisuals = increment(stats.totalVisuals);
    }
    if (stats.totalViews) {
      updates.totalViews = increment(stats.totalViews);
    }
    if (stats.totalDownloads) {
      updates.totalDownloads = increment(stats.totalDownloads);
    }

    await updateDoc(projectRef, updates);
  }
}

export const serverFirestoreService = new MockAuthFirestoreService();
export default serverFirestoreService;