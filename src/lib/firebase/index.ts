// Export Firebase configuration
export { default as app, auth, db, storage, analytics } from './config';

// Export services
export { authService } from './auth';
export { firestoreService } from './firestore';
export { storageService } from './storage';
// Note: generationService excluded from client exports to avoid server-side imports

// Export real-time hooks
export {
  useDashboardStats,
  useRecentProjects,
  useVisualLibrary,
  useProjects,
  useActivityTracker,
  useOptimisticUpdates,
  useSyncedState
} from './realtime-service';

// Export types
export type {
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
  FirebaseError
} from './types';

// Export storage types
export type {
  UploadProgress,
  ImageVariant,
  UploadOptions,
  UploadResult
} from './storage';

// Export generation types
export type {
  GenerationRequest,
  GeneratedImageData,
  GenerationResult
} from './generation-service';