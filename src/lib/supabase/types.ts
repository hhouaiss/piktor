// Database schema types for Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          photo_url: string | null
          created_at: string
          updated_at: string
          usage: Json
          preferences: Json
          subscription: Json | null
        }
        Insert: {
          id?: string
          email: string
          display_name?: string | null
          photo_url?: string | null
          created_at?: string
          updated_at?: string
          usage?: Json
          preferences?: Json
          subscription?: Json | null
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          photo_url?: string | null
          created_at?: string
          updated_at?: string
          usage?: Json
          preferences?: Json
          subscription?: Json | null
        }
      }
      visuals: {
        Row: {
          id: string
          user_id: string
          project_id: string
          visual_id: string
          original_url: string
          thumbnail_url: string | null
          metadata: Json | null
          views: number
          downloads: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          visual_id: string
          original_url: string
          thumbnail_url?: string | null
          metadata?: Json | null
          views?: number
          downloads?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          visual_id?: string
          original_url?: string
          thumbnail_url?: string | null
          metadata?: Json | null
          views?: number
          downloads?: number
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          category: string
          product_info: Json | null
          default_style: string
          default_environment: string
          preferred_formats: string[]
          status: string
          is_public: boolean
          total_visuals: number
          total_views: number
          total_downloads: number
          created_at: string
          updated_at: string
          last_activity_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          category: string
          product_info?: Json | null
          default_style: string
          default_environment: string
          preferred_formats: string[]
          status?: string
          is_public?: boolean
          total_visuals?: number
          total_views?: number
          total_downloads?: number
          created_at?: string
          updated_at?: string
          last_activity_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          category?: string
          product_info?: Json | null
          default_style?: string
          default_environment?: string
          preferred_formats?: string[]
          status?: string
          is_public?: boolean
          total_visuals?: number
          total_views?: number
          total_downloads?: number
          created_at?: string
          updated_at?: string
          last_activity_at?: string
        }
      }
      usage_records: {
        Row: {
          id: string
          user_id: string
          type: string
          visual_id: string | null
          project_id: string | null
          credits_used: number | null
          metadata: Json
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          visual_id?: string | null
          project_id?: string | null
          credits_used?: number | null
          metadata: Json
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          visual_id?: string | null
          project_id?: string | null
          credits_used?: number | null
          metadata?: Json
          timestamp?: string
        }
      }
      user_stats: {
        Row: {
          id: string
          user_id: string
          period: string
          stats: Json
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          period: string
          stats: Json
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          period?: string
          stats?: Json
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_price_id: string | null
          plan_id: string
          status: string
          billing_interval: string
          amount: number
          currency: string
          current_period_start: string
          current_period_end: string
          cancel_at: string | null
          canceled_at: string | null
          trial_start: string | null
          trial_end: string | null
          generations_limit: number
          generations_used: number
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          plan_id: string
          status: string
          billing_interval: string
          amount: number
          currency: string
          current_period_start: string
          current_period_end: string
          cancel_at?: string | null
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
          generations_limit: number
          generations_used?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          plan_id?: string
          status?: string
          billing_interval?: string
          amount?: number
          currency?: string
          current_period_start?: string
          current_period_end?: string
          cancel_at?: string | null
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
          generations_limit?: number
          generations_used?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          stripe_invoice_id: string
          stripe_subscription_id: string | null
          amount: number
          currency: string
          status: string
          invoice_pdf: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_invoice_id: string
          stripe_subscription_id?: string | null
          amount: number
          currency: string
          status: string
          invoice_pdf?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_invoice_id?: string
          stripe_subscription_id?: string | null
          amount?: number
          currency?: string
          status?: string
          invoice_pdf?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reset_monthly_usage: {
        Args: Record<string, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Application-level types (based on existing Firebase types)
export interface User {
  id: string
  email: string
  display_name?: string | null
  photo_url?: string | null
  created_at: Date
  updated_at: Date
  email_confirmed?: boolean
  subscription?: {
    plan: 'free' | 'pro' | 'business'
    status: 'active' | 'canceled' | 'past_due'
    currentPeriodEnd: string
  } | null
  usage: {
    creditsUsed: number
    creditsTotal: number
    resetDate: string | null
  }
  preferences: {
    language: string
    notifications: boolean
    theme: 'light' | 'dark' | 'auto'
  }
}

// Legacy Firebase User interface for compatibility
export interface FirebaseUser {
  id: string
  email: string
  displayName?: string | null
  photoURL?: string | null
  createdAt: Date
  updatedAt: Date
  subscription?: {
    plan: 'free' | 'pro' | 'business'
    status: 'active' | 'canceled' | 'past_due'
    currentPeriodEnd: string
  } | null
  usage: {
    creditsUsed: number
    creditsTotal: number
    resetDate: string | null
  }
  preferences: {
    language: string
    notifications: boolean
    theme: 'light' | 'dark' | 'auto'
  }
}

export interface VisualMetadata {
  prompt?: string;
  product?: {
    name?: string;
    category?: string;
  };
  contextPreset?: string;
  branding?: {
    aesthetic?: string;
    moodKeywords?: string[];
  };
  [key: string]: any;
}

export interface Visual {
  id: string
  userId: string
  name: string
  description?: string
  projectId: string

  // Image data
  originalImageUrl: string
  thumbnailUrl: string | null
  downloadUrls: {
    [format: string]: string // e.g., 'instagram_post': 'url', 'e_commerce': 'url'
  }

  // Generation metadata
  prompt: string
  style: string
  environment: string
  format: string[]
  generationParams: {
    model: string
    seed?: number
    steps?: number
    guidanceScale?: number
    [key: string]: any
  }
  metadata?: VisualMetadata

  // Content metadata
  tags: string[]
  colors: string[] // Dominant colors
  dimensions: {
    width: number
    height: number
  }
  fileSize: number
  mimeType: string

  // Analytics
  views: number
  downloads: number
  shares: number
  isFavorite: boolean

  // Timestamps
  createdAt: string
  updatedAt: string
  lastViewedAt?: string
}

export interface Project {
  id: string
  userId: string
  name: string
  description?: string | null
  category: string // e.g., 'furniture', 'product', 'marketing'

  // Product information
  productInfo?: {
    name: string
    brand?: string
    category: string
    description: string
    tags: string[]
  } | null

  // Generation settings
  defaultStyle: string
  defaultEnvironment: string
  preferredFormats: string[]

  // Status
  status: 'draft' | 'active' | 'archived'
  isPublic: boolean

  // Analytics
  totalVisuals: number
  totalViews: number
  totalDownloads: number

  // Timestamps
  createdAt: string
  updatedAt: string
  lastActivityAt: string
}

export interface UsageRecord {
  id: string
  userId: string
  type: 'generation' | 'download' | 'view' | 'share'

  // Context
  visualId?: string | null
  projectId?: string | null
  creditsUsed?: number | null

  // Metadata
  metadata: {
    userAgent?: string
    ip?: string
    source?: string // e.g., 'dashboard', 'api'
    [key: string]: any
  }

  timestamp: string
}

export interface UserStats {
  id: string
  userId: string
  period: string // e.g., '2024-09', 'daily-2024-09-12'

  stats: {
    generationsCount: number
    generationsCredits: number
    downloadsCount: number
    viewsCount: number
    sharesCount: number
    projectsCount: number
    visualsCount: number
  }

  updatedAt: string
}

// API response types
export interface DashboardStats {
  totalVisuals: number
  thisMonth: number
  downloads: number
  views: number
  creditsUsed: number
  creditsRemaining: number
  projects: number
}

export interface RecentProject {
  id: string
  name: string
  thumbnail: string
  createdAt: string
  format: string[]
  downloads: number
  views: number
  visualsCount: number
}

// Error types
export interface SupabaseError extends Error {
  name: string
  message: string
  status?: number
  code?: string
  details?: string
  hint?: string
}

// Search and filter types
export interface VisualFilters {
  search?: string
  projectId?: string
  format?: string
  style?: string
  environment?: string
  tags?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  isFavorite?: boolean
}

export interface VisualSort {
  field: 'created_at' | 'updated_at' | 'name' | 'downloads' | 'views'
  direction: 'asc' | 'desc'
}

export interface PaginationOptions {
  limit: number
  offset?: number
  cursor?: string
}

export interface PaginatedResult<T> {
  data: T[]
  hasMore: boolean
  nextPageToken?: string
  total?: number
  count?: number
}

// Helper types for transforming data between Supabase and application formats
export type DatabaseUser = Database['public']['Tables']['users']['Row']
export type DatabaseVisual = Database['public']['Tables']['visuals']['Row']
export type DatabaseProject = Database['public']['Tables']['projects']['Row']
export type DatabaseUsageRecord = Database['public']['Tables']['usage_records']['Row']
export type DatabaseUserStats = Database['public']['Tables']['user_stats']['Row']

export type InsertUser = Database['public']['Tables']['users']['Insert']
export type InsertVisual = Database['public']['Tables']['visuals']['Insert']
export type InsertProject = Database['public']['Tables']['projects']['Insert']
export type InsertUsageRecord = Database['public']['Tables']['usage_records']['Insert']
export type InsertUserStats = Database['public']['Tables']['user_stats']['Insert']

export type UpdateUser = Database['public']['Tables']['users']['Update']
export type UpdateVisual = Database['public']['Tables']['visuals']['Update']
export type UpdateProject = Database['public']['Tables']['projects']['Update']
export type UpdateUsageRecord = Database['public']['Tables']['usage_records']['Update']
export type UpdateUserStats = Database['public']['Tables']['user_stats']['Update']