/**
 * Usage Limiting System for Piktor SaaS Platform
 * 
 * This module provides comprehensive usage tracking and limiting functionality
 * with environment-based controls and admin override capabilities.
 */

export interface UsageLimitConfig {
  maxGenerations: number;
  trackingMethod: 'localStorage' | 'sessionStorage' | 'cookie';
  storageKey: string;
  adminBypassKey?: string;
}

export interface UsageData {
  generationCount: number;
  firstGeneration: string; // ISO date string
  lastGeneration: string; // ISO date string
  sessionId: string;
  environment: 'preview' | 'production' | 'development';
}

export interface UsageLimitResult {
  canGenerate: boolean;
  remainingGenerations: number;
  isLimitReached: boolean;
  isAdminOverride: boolean;
  environment: 'preview' | 'production' | 'development';
  resetInfo?: {
    resetMethod: 'daily' | 'session' | 'manual';
    nextReset?: string;
  };
}

// Default configuration
export const DEFAULT_USAGE_CONFIG: UsageLimitConfig = {
  maxGenerations: 5,
  trackingMethod: 'localStorage',
  storageKey: 'piktor_usage_data',
  adminBypassKey: 'piktor_admin_bypass'
};

/**
 * Detects the current environment based on URL and Vercel deployment context
 */
export function detectEnvironment(): 'preview' | 'production' | 'development' {
  if (typeof window === 'undefined') {
    // Server-side detection
    if (process.env.NODE_ENV === 'development') return 'development';
    if (process.env.VERCEL_ENV === 'preview') return 'preview';
    if (process.env.VERCEL_ENV === 'production') return 'production';
    return 'production'; // default fallback
  }

  // Client-side detection
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  
  // Development environment
  if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
    return 'development';
  }
  
  // Vercel preview deployments typically have a specific pattern
  if (hostname.includes('vercel.app') && !hostname.includes('piktor.vercel.app')) {
    return 'preview';
  }
  
  // Check for preview branch indicator in URL or hostname
  if (hostname.includes('preview-') || pathname.includes('/preview/')) {
    return 'preview';
  }
  
  // Production environment (your main domain)
  return 'production';
}

/**
 * Checks if the current user has admin override privileges
 */
export function checkAdminOverride(config: UsageLimitConfig = DEFAULT_USAGE_CONFIG): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    // Check for admin bypass flag in localStorage
    if (config.adminBypassKey) {
      const adminFlag = localStorage.getItem(config.adminBypassKey);
      if (adminFlag === 'true') return true;
    }
    
    // Check for admin query parameter (for easy testing/debugging)
    const urlParams = new URLSearchParams(window.location.search);
    const adminParam = urlParams.get('admin');
    if (adminParam === 'true' || adminParam === '1') {
      // Optionally save admin status to localStorage for session persistence
      if (config.adminBypassKey) {
        localStorage.setItem(config.adminBypassKey, 'true');
      }
      return true;
    }
    
    // Check for specific admin domains/emails (you can extend this)
    const hostname = window.location.hostname;
    if (hostname.includes('admin.') || hostname.includes('internal.')) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn('Error checking admin override:', error);
    return false;
  }
}

/**
 * Generates a session ID for tracking usage across browser sessions
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Gets the current usage data from storage
 */
export function getCurrentUsage(config: UsageLimitConfig = DEFAULT_USAGE_CONFIG): UsageData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    let storedData: string | null = null;
    
    switch (config.trackingMethod) {
      case 'localStorage':
        storedData = localStorage.getItem(config.storageKey);
        break;
      case 'sessionStorage':
        storedData = sessionStorage.getItem(config.storageKey);
        break;
      case 'cookie':
        storedData = getCookie(config.storageKey);
        break;
    }
    
    if (!storedData) return null;
    
    const parsed = JSON.parse(storedData) as UsageData;
    
    // Validate the parsed data structure
    if (!parsed.generationCount || !parsed.sessionId) return null;
    
    return parsed;
  } catch (error) {
    console.warn('Error reading usage data:', error);
    return null;
  }
}

/**
 * Updates the usage data in storage
 */
function updateUsageData(data: UsageData, config: UsageLimitConfig = DEFAULT_USAGE_CONFIG): void {
  if (typeof window === 'undefined') return;
  
  try {
    const serialized = JSON.stringify(data);
    
    switch (config.trackingMethod) {
      case 'localStorage':
        localStorage.setItem(config.storageKey, serialized);
        break;
      case 'sessionStorage':
        sessionStorage.setItem(config.storageKey, serialized);
        break;
      case 'cookie':
        setCookie(config.storageKey, serialized, 7); // 7 days expiry
        break;
    }
  } catch (error) {
    console.error('Error updating usage data:', error);
  }
}

/**
 * Checks if a generation is allowed and returns detailed limit information
 */
export function checkUsageLimit(config: UsageLimitConfig = DEFAULT_USAGE_CONFIG): UsageLimitResult {
  const environment = detectEnvironment();
  const isAdminOverride = checkAdminOverride(config);
  
  // Preview environment: unlimited generations
  if (environment === 'preview') {
    return {
      canGenerate: true,
      remainingGenerations: Infinity,
      isLimitReached: false,
      isAdminOverride: false,
      environment,
      resetInfo: {
        resetMethod: 'manual',
      }
    };
  }
  
  // Admin override: unlimited generations
  if (isAdminOverride) {
    return {
      canGenerate: true,
      remainingGenerations: Infinity,
      isLimitReached: false,
      isAdminOverride: true,
      environment,
      resetInfo: {
        resetMethod: 'manual',
      }
    };
  }
  
  // Development environment: unlimited for testing (unless forcing limits for testing)
  if (environment === 'development') {
    // Check if we're forcing limits for testing
    const forceLimitsForTesting = typeof window !== 'undefined' && 
      localStorage.getItem('piktor_force_limits_testing') === 'true';
    
    if (!forceLimitsForTesting) {
      return {
        canGenerate: true,
        remainingGenerations: Infinity,
        isLimitReached: false,
        isAdminOverride: false,
        environment,
        resetInfo: {
          resetMethod: 'manual',
        }
      };
    }
    // If forcing limits, fall through to normal limit checking
  }
  
  // Production environment: enforce limits
  const currentUsage = getCurrentUsage(config);
  
  if (!currentUsage) {
    // First time user
    return {
      canGenerate: true,
      remainingGenerations: config.maxGenerations - 1,
      isLimitReached: false,
      isAdminOverride: false,
      environment,
      resetInfo: {
        resetMethod: 'session',
      }
    };
  }
  
  const remaining = config.maxGenerations - currentUsage.generationCount;
  const isLimitReached = remaining <= 0;
  
  return {
    canGenerate: !isLimitReached,
    remainingGenerations: Math.max(0, remaining),
    isLimitReached,
    isAdminOverride: false,
    environment,
    resetInfo: {
      resetMethod: 'session',
    }
  };
}

/**
 * Records a new generation and updates the usage counter
 */
export function recordGeneration(config: UsageLimitConfig = DEFAULT_USAGE_CONFIG): UsageData {
  const environment = detectEnvironment();
  const now = new Date().toISOString();
  
  let currentUsage = getCurrentUsage(config);
  
  if (!currentUsage) {
    // First generation
    currentUsage = {
      generationCount: 1,
      firstGeneration: now,
      lastGeneration: now,
      sessionId: generateSessionId(),
      environment,
    };
  } else {
    // Increment generation count
    currentUsage = {
      ...currentUsage,
      generationCount: currentUsage.generationCount + 1,
      lastGeneration: now,
      environment,
    };
  }
  
  updateUsageData(currentUsage, config);
  return currentUsage;
}

/**
 * Resets the usage data (admin function)
 */
export function resetUsage(config: UsageLimitConfig = DEFAULT_USAGE_CONFIG): void {
  if (typeof window === 'undefined') return;
  
  try {
    switch (config.trackingMethod) {
      case 'localStorage':
        localStorage.removeItem(config.storageKey);
        break;
      case 'sessionStorage':
        sessionStorage.removeItem(config.storageKey);
        break;
      case 'cookie':
        deleteCookie(config.storageKey);
        break;
    }
  } catch (error) {
    console.error('Error resetting usage data:', error);
  }
}

/**
 * Enables admin mode for unlimited generations
 */
export function enableAdminMode(config: UsageLimitConfig = DEFAULT_USAGE_CONFIG): void {
  if (typeof window === 'undefined') return;
  
  if (config.adminBypassKey) {
    try {
      localStorage.setItem(config.adminBypassKey, 'true');
      console.log('Admin mode enabled - unlimited generations available');
    } catch (error) {
      console.error('Error enabling admin mode:', error);
    }
  }
}

/**
 * Disables admin mode
 */
export function disableAdminMode(config: UsageLimitConfig = DEFAULT_USAGE_CONFIG): void {
  if (typeof window === 'undefined') return;
  
  if (config.adminBypassKey) {
    try {
      localStorage.removeItem(config.adminBypassKey);
      console.log('Admin mode disabled - standard limits apply');
    } catch (error) {
      console.error('Error disabling admin mode:', error);
    }
  }
}

// Cookie helper functions
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return;
  
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict`;
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
}

/**
 * Debug function to log current usage state
 */
export function debugUsageState(config: UsageLimitConfig = DEFAULT_USAGE_CONFIG): void {
  const environment = detectEnvironment();
  const isAdminOverride = checkAdminOverride(config);
  const currentUsage = getCurrentUsage(config);
  const limitCheck = checkUsageLimit(config);
  
  console.group('Piktor Usage Limiting Debug');
  console.log('Environment:', environment);
  console.log('Admin Override:', isAdminOverride);
  console.log('Current Usage:', currentUsage);
  console.log('Limit Check:', limitCheck);
  console.log('Config:', config);
  console.groupEnd();
}