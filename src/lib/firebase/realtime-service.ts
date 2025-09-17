"use client";

import { useEffect, useState, useCallback } from 'react';
import { firestoreService } from './';
import type { Visual, Project, DashboardStats, RecentProject } from './types';

/**
 * Custom hook for real-time dashboard stats
 */
export function useDashboardStats(userId: string | null) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStats = useCallback(async () => {
    if (!userId) {
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const dashboardStats = await firestoreService.getDashboardStats(userId);
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshStats();
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(refreshStats, 30000);
    
    return () => clearInterval(interval);
  }, [refreshStats]);

  return { stats, loading, error, refreshStats };
}

/**
 * Custom hook for real-time recent projects
 */
export function useRecentProjects(userId: string | null, limit: number = 5) {
  const [projects, setProjects] = useState<RecentProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProjects = useCallback(async () => {
    if (!userId) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const recentProjects = await firestoreService.getRecentProjects(userId, limit);
      setProjects(recentProjects);
    } catch (error) {
      console.error('Error loading recent projects:', error);
      setError('Erreur lors du chargement des projets récents');
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  return { projects, loading, error, refreshProjects };
}

/**
 * Custom hook for real-time visual library with subscriptions
 */
export function useVisualLibrary(userId: string | null) {
  const [visuals, setVisuals] = useState<Visual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setVisuals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Set up real-time subscription
    const unsubscribe = firestoreService.subscribeToUserVisuals(
      userId,
      (updatedVisuals) => {
        setVisuals(updatedVisuals);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const updateVisual = useCallback(async (visualId: string, updates: Partial<Visual>) => {
    try {
      await firestoreService.updateVisual(visualId, updates);
      // The real-time subscription will handle the UI update
    } catch (error) {
      console.error('Error updating visual:', error);
      setError('Erreur lors de la mise à jour');
    }
  }, []);

  const deleteVisual = useCallback(async (visualId: string) => {
    try {
      await firestoreService.deleteVisual(visualId);
      // The real-time subscription will handle the UI update
    } catch (error) {
      console.error('Error deleting visual:', error);
      setError('Erreur lors de la suppression');
    }
  }, []);

  const toggleFavorite = useCallback(async (visualId: string) => {
    try {
      await firestoreService.toggleVisualFavorite(visualId);
      // The real-time subscription will handle the UI update
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setError('Erreur lors de la mise à jour du favori');
    }
  }, []);

  return {
    visuals,
    loading,
    error,
    updateVisual,
    deleteVisual,
    toggleFavorite
  };
}

/**
 * Custom hook for real-time projects with subscriptions
 */
export function useProjects(userId: string | null) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Set up real-time subscription
    const unsubscribe = firestoreService.subscribeToUserProjects(
      userId,
      (updatedProjects) => {
        setProjects(updatedProjects);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const createProject = useCallback(async (projectData: Partial<Project>) => {
    if (!userId) throw new Error('User not authenticated');
    
    try {
      const projectId = await firestoreService.createProject(userId, projectData);
      // The real-time subscription will handle the UI update
      return projectId;
    } catch (error) {
      console.error('Error creating project:', error);
      setError('Erreur lors de la création du projet');
      throw error;
    }
  }, [userId]);

  const updateProject = useCallback(async (projectId: string, updates: Partial<Project>) => {
    try {
      await firestoreService.updateProject(projectId, updates);
      // The real-time subscription will handle the UI update
    } catch (error) {
      console.error('Error updating project:', error);
      setError('Erreur lors de la mise à jour du projet');
    }
  }, []);

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      await firestoreService.deleteProject(projectId);
      // The real-time subscription will handle the UI update
    } catch (error) {
      console.error('Error deleting project:', error);
      setError('Erreur lors de la suppression du projet');
    }
  }, []);

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject
  };
}

/**
 * Custom hook for tracking user activity and analytics
 */
export function useActivityTracker(userId: string | null) {
  const trackActivity = useCallback(async (
    type: 'generation' | 'download' | 'view' | 'share',
    context: {
      visualId?: string;
      projectId?: string;
      metadata?: Record<string, any>;
    }
  ) => {
    if (!userId) return;

    try {
      await firestoreService.recordUsage({
        userId,
        type,
        visualId: context.visualId,
        projectId: context.projectId,
        metadata: {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          ...context.metadata
        },
        timestamp: new Date() as any
      });
    } catch (error) {
      console.error('Error tracking activity:', error);
      // Don't throw error for analytics - fail silently
    }
  }, [userId]);

  const trackGeneration = useCallback((visualId: string, projectId: string, metadata?: Record<string, any>) => {
    return trackActivity('generation', { visualId, projectId, metadata });
  }, [trackActivity]);

  const trackDownload = useCallback((visualId: string, projectId: string, metadata?: Record<string, any>) => {
    return trackActivity('download', { visualId, projectId, metadata });
  }, [trackActivity]);

  const trackView = useCallback((visualId: string, projectId: string, metadata?: Record<string, any>) => {
    return trackActivity('view', { visualId, projectId, metadata });
  }, [trackActivity]);

  const trackShare = useCallback((visualId: string, projectId: string, metadata?: Record<string, any>) => {
    return trackActivity('share', { visualId, projectId, metadata });
  }, [trackActivity]);

  return {
    trackGeneration,
    trackDownload,
    trackView,
    trackShare
  };
}

/**
 * Custom hook for optimistic UI updates
 */
export function useOptimisticUpdates<T extends { id: string }>(initialData: T[]) {
  const [optimisticData, setOptimisticData] = useState<T[]>(initialData);
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());

  // Update optimistic data when real data changes
  useEffect(() => {
    setOptimisticData(initialData);
  }, [initialData]);

  const optimisticUpdate = useCallback(async (
    id: string,
    updates: Partial<T>,
    updateFn: () => Promise<void>
  ) => {
    // Add to pending updates
    setPendingUpdates(prev => new Set(prev).add(id));
    
    // Apply optimistic update
    setOptimisticData(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));

    try {
      // Execute actual update
      await updateFn();
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticData(initialData);
      throw error;
    } finally {
      // Remove from pending updates
      setPendingUpdates(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [initialData]);

  const optimisticDelete = useCallback(async (
    id: string,
    deleteFn: () => Promise<void>
  ) => {
    // Add to pending updates
    setPendingUpdates(prev => new Set(prev).add(id));
    
    // Apply optimistic delete
    setOptimisticData(prev => prev.filter(item => item.id !== id));

    try {
      // Execute actual delete
      await deleteFn();
    } catch (error) {
      // Revert optimistic delete on error
      setOptimisticData(initialData);
      throw error;
    } finally {
      // Remove from pending updates
      setPendingUpdates(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [initialData]);

  return {
    data: optimisticData,
    pendingUpdates,
    optimisticUpdate,
    optimisticDelete
  };
}

/**
 * Hook for managing local state sync with Firebase
 */
export function useSyncedState<T>(
  key: string,
  defaultValue: T,
  userId: string | null
) {
  const [value, setValue] = useState<T>(defaultValue);
  const [syncing, setSyncing] = useState(false);

  // Load initial value from localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !userId) return;
    
    try {
      const storageKey = `piktor_${userId}_${key}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setValue(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading synced state:', error);
    }
  }, [key, userId]);

  // Save to localStorage on value change
  useEffect(() => {
    if (typeof window === 'undefined' || !userId) return;
    
    try {
      const storageKey = `piktor_${userId}_${key}`;
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving synced state:', error);
    }
  }, [key, userId, value]);

  const syncValue = useCallback(async (newValue: T) => {
    setValue(newValue);
    
    if (!userId) return;
    
    setSyncing(true);
    try {
      // Here you could sync to Firebase user preferences
      // await firestoreService.updateUserPreferences(userId, { [key]: newValue });
    } catch (error) {
      console.error('Error syncing to Firebase:', error);
    } finally {
      setSyncing(false);
    }
  }, [key, userId]);

  return [value, syncValue, syncing] as const;
}