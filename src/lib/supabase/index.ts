// Main exports for Supabase integration
export { supabase, supabaseAdmin, getSupabaseClient, SUPABASE_CONFIG } from './config';
export { supabaseService as default } from './database';

// Re-export types
export type {
  Database,
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
  InsertUser,
  InsertVisual,
  InsertProject,
  InsertUsageRecord,
  InsertUserStats,
  UpdateUser,
  UpdateVisual,
  UpdateProject,
  UpdateUsageRecord,
  UpdateUserStats,
  Json
} from './types';

// Named exports for convenience
export { supabaseService } from './database';
export { supabaseAuthService } from './auth';
export { supabaseStorageService } from './storage';
export { supabaseAdminStorageService } from './admin-storage';
export { generationService } from './generation-service';