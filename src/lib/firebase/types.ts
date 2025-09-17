import { Timestamp } from 'firebase/firestore';

// User-related types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  subscription?: {
    plan: 'free' | 'pro' | 'business';
    status: 'active' | 'canceled' | 'past_due';
    currentPeriodEnd: Timestamp;
  };
  usage: {
    creditsUsed: number;
    creditsTotal: number;
    resetDate: Timestamp;
  };
  preferences: {
    language: string;
    notifications: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
}

// Project/Visual types
export interface Visual {
  id: string;
  userId: string;
  name: string;
  description?: string;
  projectId: string;
  
  // Image data
  originalImageUrl: string;
  thumbnailUrl: string;
  downloadUrls: {
    [format: string]: string; // e.g., 'instagram_post': 'url', 'e_commerce': 'url'
  };
  
  // Generation metadata
  prompt: string;
  style: string;
  environment: string;
  format: string[];
  generationParams: {
    model: string;
    seed?: number;
    steps?: number;
    guidanceScale?: number;
    [key: string]: any;
  };
  
  // Content metadata
  tags: string[];
  colors: string[]; // Dominant colors
  dimensions: {
    width: number;
    height: number;
  };
  fileSize: number;
  mimeType: string;
  
  // Analytics
  views: number;
  downloads: number;
  shares: number;
  isFavorite: boolean;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastViewedAt?: Timestamp;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: string; // e.g., 'furniture', 'product', 'marketing'
  
  // Product information
  productInfo?: {
    name: string;
    brand?: string;
    category: string;
    description: string;
    tags: string[];
  };
  
  // Generation settings
  defaultStyle: string;
  defaultEnvironment: string;
  preferredFormats: string[];
  
  // Status
  status: 'draft' | 'active' | 'archived';
  isPublic: boolean;
  
  // Analytics
  totalVisuals: number;
  totalViews: number;
  totalDownloads: number;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastActivityAt: Timestamp;
}

// Usage tracking
export interface UsageRecord {
  id: string;
  userId: string;
  type: 'generation' | 'download' | 'view' | 'share';
  
  // Context
  visualId?: string;
  projectId?: string;
  creditsUsed?: number;
  
  // Metadata
  metadata: {
    userAgent?: string;
    ip?: string;
    source?: string; // e.g., 'dashboard', 'api'
    [key: string]: any;
  };
  
  timestamp: Timestamp;
}

// Analytics aggregation
export interface UserStats {
  userId: string;
  period: string; // e.g., '2024-09', 'daily-2024-09-12'
  
  stats: {
    generationsCount: number;
    generationsCredits: number;
    downloadsCount: number;
    viewsCount: number;
    sharesCount: number;
    projectsCount: number;
    visualsCount: number;
  };
  
  updatedAt: Timestamp;
}

// Firestore document references
export interface FirestoreUser extends Omit<User, 'id'> {}
export interface FirestoreVisual extends Omit<Visual, 'id'> {}
export interface FirestoreProject extends Omit<Project, 'id'> {}
export interface FirestoreUsageRecord extends Omit<UsageRecord, 'id'> {}
export interface FirestoreUserStats extends Omit<UserStats, 'id'> {}

// API response types
export interface DashboardStats {
  totalVisuals: number;
  thisMonth: number;
  downloads: number;
  views: number;
  creditsUsed: number;
  creditsRemaining: number;
  projects: number;
}

export interface RecentProject {
  id: string;
  name: string;
  thumbnail: string;
  createdAt: string;
  format: string[];
  downloads: number;
  views: number;
  visualsCount: number;
}

// Error types
export interface FirebaseError extends Error {
  code: string;
  message: string;
  customData?: Record<string, any>;
}

// Search and filter types
export interface VisualFilters {
  search?: string;
  projectId?: string;
  format?: string;
  style?: string;
  environment?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  isFavorite?: boolean;
}

export interface VisualSort {
  field: 'createdAt' | 'updatedAt' | 'name' | 'downloads' | 'views';
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  limit: number;
  startAfter?: any; // Firestore document snapshot
  startAt?: any; // Firestore document snapshot
}

export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  nextPageToken?: string;
  total?: number;
}