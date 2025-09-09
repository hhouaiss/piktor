"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  UsageLimitResult,
  UsageData,
  UsageLimitConfig,
  DEFAULT_USAGE_CONFIG,
  checkUsageLimit,
  recordGeneration,
  getCurrentUsage,
  resetUsage,
  enableAdminMode,
  disableAdminMode,
  debugUsageState,
} from '@/lib/usage-limits';

interface UsageLimitContextValue {
  // State
  usageData: UsageData | null;
  limitResult: UsageLimitResult;
  isLoading: boolean;
  
  // Actions
  checkLimit: () => UsageLimitResult;
  recordNewGeneration: () => void;
  resetUserUsage: () => void;
  refreshUsageData: () => void;
  
  // Admin functions
  enableAdminAccess: () => void;
  disableAdminAccess: () => void;
  debugUsage: () => void;
  
  // Configuration
  config: UsageLimitConfig;
  updateConfig: (newConfig: Partial<UsageLimitConfig>) => void;
  
  // Convenience getters
  canGenerate: boolean;
  remainingGenerations: number;
  isLimitReached: boolean;
  isAdminOverride: boolean;
  environment: 'preview' | 'production' | 'development';
}

const UsageLimitContext = createContext<UsageLimitContextValue | undefined>(undefined);

interface UsageLimitProviderProps {
  children: ReactNode;
  initialConfig?: Partial<UsageLimitConfig>;
}

export function UsageLimitProvider({ children, initialConfig = {} }: UsageLimitProviderProps) {
  const [config, setConfig] = useState<UsageLimitConfig>({
    ...DEFAULT_USAGE_CONFIG,
    ...initialConfig,
  });
  
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [limitResult, setLimitResult] = useState<UsageLimitResult>({
    canGenerate: true,
    remainingGenerations: config.maxGenerations,
    isLimitReached: false,
    isAdminOverride: false,
    environment: 'development',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Refresh usage data from storage
  const refreshUsageData = useCallback(() => {
    setIsLoading(true);
    try {
      const currentUsage = getCurrentUsage(config);
      const currentLimit = checkUsageLimit(config);
      
      setUsageData(currentUsage);
      setLimitResult(currentLimit);
    } catch (error) {
      console.error('Error refreshing usage data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  // Initialize on mount and when config changes
  useEffect(() => {
    refreshUsageData();
  }, [refreshUsageData]);

  // Check current limit without updating state
  const checkLimit = useCallback(() => {
    return checkUsageLimit(config);
  }, [config]);

  // Record a new generation and update state
  const recordNewGeneration = useCallback(() => {
    try {
      const newUsageData = recordGeneration(config);
      const newLimitResult = checkUsageLimit(config);
      
      setUsageData(newUsageData);
      setLimitResult(newLimitResult);
      
      // Log the generation for debugging
      console.log('Generation recorded:', {
        count: newUsageData.generationCount,
        remaining: newLimitResult.remainingGenerations,
        canGenerate: newLimitResult.canGenerate,
      });
    } catch (error) {
      console.error('Error recording generation:', error);
    }
  }, [config]);

  // Reset usage data
  const resetUserUsage = useCallback(() => {
    try {
      resetUsage(config);
      refreshUsageData();
      console.log('Usage data reset successfully');
    } catch (error) {
      console.error('Error resetting usage:', error);
    }
  }, [config, refreshUsageData]);

  // Enable admin mode
  const enableAdminAccess = useCallback(() => {
    try {
      enableAdminMode(config);
      refreshUsageData();
    } catch (error) {
      console.error('Error enabling admin mode:', error);
    }
  }, [config, refreshUsageData]);

  // Disable admin mode
  const disableAdminAccess = useCallback(() => {
    try {
      disableAdminMode(config);
      refreshUsageData();
    } catch (error) {
      console.error('Error disabling admin mode:', error);
    }
  }, [config, refreshUsageData]);

  // Debug function
  const debugUsage = useCallback(() => {
    debugUsageState(config);
  }, [config]);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<UsageLimitConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Convenience getters
  const contextValue: UsageLimitContextValue = {
    // State
    usageData,
    limitResult,
    isLoading,
    
    // Actions
    checkLimit,
    recordNewGeneration,
    resetUserUsage,
    refreshUsageData,
    
    // Admin functions
    enableAdminAccess,
    disableAdminAccess,
    debugUsage,
    
    // Configuration
    config,
    updateConfig,
    
    // Convenience getters
    canGenerate: limitResult.canGenerate,
    remainingGenerations: limitResult.remainingGenerations,
    isLimitReached: limitResult.isLimitReached,
    isAdminOverride: limitResult.isAdminOverride,
    environment: limitResult.environment,
  };

  return (
    <UsageLimitContext.Provider value={contextValue}>
      {children}
    </UsageLimitContext.Provider>
  );
}

export function useUsageLimit() {
  const context = useContext(UsageLimitContext);
  if (context === undefined) {
    throw new Error('useUsageLimit must be used within a UsageLimitProvider');
  }
  return context;
}

// Hook for checking if generation is allowed before attempting
export function useCanGenerate() {
  const { canGenerate, remainingGenerations, isLimitReached, environment, isAdminOverride } = useUsageLimit();
  
  return {
    canGenerate,
    remainingGenerations,
    isLimitReached,
    environment,
    isAdminOverride,
    message: getUsageMessage(canGenerate, remainingGenerations, environment, isAdminOverride),
  };
}

// Hook for recording generations with automatic state updates
export function useGenerationRecorder() {
  const { recordNewGeneration, canGenerate, limitResult } = useUsageLimit();
  
  const recordGeneration = useCallback(() => {
    if (!canGenerate) {
      console.warn('Attempted to record generation but limit is reached');
      return false;
    }
    
    recordNewGeneration();
    return true;
  }, [recordNewGeneration, canGenerate]);
  
  return {
    recordGeneration,
    canRecord: canGenerate,
    limitResult,
  };
}

// Helper function to get user-friendly usage messages
function getUsageMessage(
  canGenerate: boolean,
  remainingGenerations: number,
  environment: string,
  isAdminOverride: boolean
): string {
  if (isAdminOverride) {
    return 'Accès administrateur : générations illimitées';
  }
  
  if (environment === 'preview') {
    return 'Environnement de prévisualisation : générations illimitées';
  }
  
  if (environment === 'development') {
    return 'Environnement de développement : générations illimitées';
  }
  
  if (!canGenerate) {
    return 'Limite de générations atteinte. Contactez-nous pour plus de générations.';
  }
  
  if (remainingGenerations === 1) {
    return '1 génération restante avant la limite';
  }
  
  if (remainingGenerations <= 2) {
    return `${remainingGenerations} générations restantes avant la limite`;
  }
  
  return `${remainingGenerations} générations restantes`;
}