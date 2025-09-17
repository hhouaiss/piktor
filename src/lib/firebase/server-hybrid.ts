/**
 * Hybrid server-side Firebase service
 * 
 * Uses Firebase Admin SDK when available, falls back to client SDK
 * with permissive security rules for development and testing.
 */

import { adminDb, isAdminAvailable } from './admin';
import { serverFirestoreService as clientService } from './server-simple';
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

class HybridFirestoreService {
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
    if (isAdminAvailable && adminDb) {
      // Use Admin SDK
      const userRef = adminDb.collection(this.USERS_COLLECTION).doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data() as FirestoreUser;
      return {
        id: userId,
        ...userData
      };
    } else {
      // Fallback to client SDK
      return clientService.getUserData(userId);
    }
  }

  async ensureUserDocument(userId: string, userData: Partial<FirestoreUser>): Promise<void> {
    if (isAdminAvailable && adminDb) {
      // Use Admin SDK
      const userRef = adminDb.collection(this.USERS_COLLECTION).doc(userId);
      const userDoc = await userRef.get();

      const timestamp = new Date();

      if (!userDoc.exists) {
        const defaultUserData: FirestoreUser = {
          email: userData.email || '',
          displayName: userData.displayName || undefined,
          photoURL: userData.photoURL || undefined,
          createdAt: timestamp as any,
          updatedAt: timestamp as any,
          usage: {
            creditsUsed: 0,
            creditsTotal: 50,
            resetDate: timestamp as any
          },
          preferences: {
            language: 'fr',
            notifications: true,
            theme: 'auto'
          },
          ...userData
        };

        await userRef.set(defaultUserData);
      } else {
        await userRef.update({
          updatedAt: timestamp,
          ...userData
        });
      }
    } else {
      // Fallback to client SDK
      return clientService.ensureUserDocument(userId, userData);
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
    if (isAdminAvailable && adminDb) {
      // Use Admin SDK
      const userRef = adminDb.collection(this.USERS_COLLECTION).doc(userId);
      const userData = await this.getUserData(userId);
      
      const newCreditsUsed = userData.usage.creditsUsed + creditsUsed;
      
      if (newCreditsUsed > userData.usage.creditsTotal) {
        throw new Error('Insufficient credits');
      }

      await userRef.update({
        'usage.creditsUsed': newCreditsUsed,
        updatedAt: new Date()
      });
    } else {
      // Fallback to client SDK
      return clientService.useCredits(userId, creditsUsed);
    }
  }

  // ============================================================================
  // PROJECT OPERATIONS
  // ============================================================================

  async createProject(userId: string, projectData: Partial<Project>): Promise<string> {
    if (isAdminAvailable && adminDb) {
      // Use Admin SDK
      const projectRef = adminDb.collection(this.PROJECTS_COLLECTION).doc();
      
      const timestamp = new Date();
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
        createdAt: timestamp as any,
        updatedAt: timestamp as any,
        lastActivityAt: timestamp as any
      };

      await projectRef.set(project);
      return projectRef.id;
    } else {
      // Fallback to client SDK
      return clientService.createProject(userId, projectData);
    }
  }

  async getProject(projectId: string): Promise<Project | null> {
    if (isAdminAvailable && adminDb) {
      // Use Admin SDK
      const projectRef = adminDb.collection(this.PROJECTS_COLLECTION).doc(projectId);
      const projectDoc = await projectRef.get();

      if (!projectDoc.exists) {
        return null;
      }

      const data = projectDoc.data() as FirestoreProject;
      return { id: projectDoc.id, ...data };
    } else {
      // Fallback to client SDK
      return clientService.getProject(projectId);
    }
  }

  async getUserProjects(userId: string, options?: PaginationOptions): Promise<PaginatedResult<Project>> {
    if (isAdminAvailable && adminDb) {
      // Use Admin SDK
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
    } else {
      // Fallback to client SDK
      return clientService.getUserProjects(userId, options);
    }
  }

  async updateProject(projectId: string, updates: Partial<FirestoreProject>): Promise<void> {
    if (isAdminAvailable && adminDb) {
      // Use Admin SDK
      const projectRef = adminDb.collection(this.PROJECTS_COLLECTION).doc(projectId);
      
      await projectRef.update({
        ...updates,
        updatedAt: new Date(),
        lastActivityAt: new Date()
      });
    } else {
      // Fallback to client SDK
      return clientService.updateProject(projectId, updates);
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    if (isAdminAvailable && adminDb) {
      // Use Admin SDK
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
    } else {
      // Fallback to client SDK
      return clientService.deleteProject(projectId);
    }
  }

  // ============================================================================
  // VISUAL OPERATIONS
  // ============================================================================

  async createVisual(visualData: Omit<Visual, 'id'>): Promise<string> {
    if (isAdminAvailable && adminDb) {
      // Use Admin SDK
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
    } else {
      // Fallback to client SDK
      return clientService.createVisual(visualData);
    }
  }

  async getVisual(visualId: string): Promise<Visual | null> {
    if (isAdminAvailable && adminDb) {
      // Use Admin SDK
      const visualRef = adminDb.collection(this.VISUALS_COLLECTION).doc(visualId);
      const visualDoc = await visualRef.get();

      if (!visualDoc.exists) {
        return null;
      }

      const data = visualDoc.data() as FirestoreVisual;
      return { id: visualDoc.id, ...data };
    } else {
      // Fallback to client SDK
      return clientService.getVisual(visualId);
    }
  }

  async getUserVisuals(
    userId: string,
    filters?: VisualFilters,
    sort?: VisualSort,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Visual>> {
    if (isAdminAvailable && adminDb) {
      // Use Admin SDK
      let query = adminDb.collection(this.VISUALS_COLLECTION)
        .where('userId', '==', userId);

      // Apply filters (simplified for now)
      if (filters?.projectId) {
        query = query.where('projectId', '==', filters.projectId);
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
    } else {
      // Fallback to client SDK
      return clientService.getUserVisuals(userId, filters, sort, pagination);
    }
  }

  async updateVisual(visualId: string, updates: Partial<FirestoreVisual>): Promise<void> {
    if (isAdminAvailable && adminDb) {
      // Use Admin SDK
      const visualRef = adminDb.collection(this.VISUALS_COLLECTION).doc(visualId);
      
      await visualRef.update({
        ...updates,
        updatedAt: new Date()
      });
    } else {
      // Fallback to client SDK
      return clientService.updateVisual(visualId, updates);
    }
  }

  async deleteVisual(visualId: string): Promise<void> {
    if (isAdminAvailable && adminDb) {
      // Use Admin SDK
      const visual = await this.getVisual(visualId);
      if (!visual) return;

      const visualRef = adminDb.collection(this.VISUALS_COLLECTION).doc(visualId);
      await visualRef.delete();

      // Update project stats
      await this.incrementProjectStats(visual.projectId, { totalVisuals: -1 });
    } else {
      // Fallback to client SDK
      return clientService.deleteVisual(visualId);
    }
  }

  // ============================================================================
  // DASHBOARD STATS
  // ============================================================================

  async getDashboardStats(userId: string): Promise<DashboardStats> {
    // This can use either service
    return clientService.getDashboardStats(userId);
  }

  async getRecentProjects(userId: string, limit: number = 5): Promise<RecentProject[]> {
    // This can use either service
    return clientService.getRecentProjects(userId, limit);
  }

  // ============================================================================
  // USAGE TRACKING
  // ============================================================================

  async recordUsage(usageData: Omit<UsageRecord, 'id'>): Promise<void> {
    if (isAdminAvailable && adminDb) {
      // Use Admin SDK
      const usageRef = adminDb.collection(this.USAGE_COLLECTION).doc();
      
      const usage: FirestoreUsageRecord = {
        ...usageData,
        timestamp: new Date() as any
      };

      await usageRef.set(usage);
    } else {
      // Fallback to client SDK
      return clientService.recordUsage(usageData);
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async incrementProjectStats(
    projectId: string,
    stats: { totalVisuals?: number; totalViews?: number; totalDownloads?: number }
  ): Promise<void> {
    if (isAdminAvailable && adminDb) {
      // Use Admin SDK
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
    } else {
      // Fallback to client SDK  
      // Client SDK has this implemented already
    }
  }
}

export const serverFirestoreService = new HybridFirestoreService();
export default serverFirestoreService;