/**
 * Admin utilities for testing and managing the usage limiting system
 * 
 * These functions are available in the browser console for debugging
 * and testing purposes.
 */

import { 
  enableAdminMode, 
  disableAdminMode, 
  resetUsage, 
  debugUsageState,
  DEFAULT_USAGE_CONFIG 
} from './usage-limits';

// Trigger context refresh function (will be set by the context provider)
let triggerContextRefresh: (() => void) | null = null;

// Function to register the context refresh callback
export const registerContextRefresh = (callback: () => void) => {
  triggerContextRefresh = callback;
};

// Helper to trigger refresh if available
const refreshContext = () => {
  if (triggerContextRefresh) {
    triggerContextRefresh();
  } else {
    console.warn('Context refresh not available, changes may not be reflected immediately');
  }
};

// Make admin functions globally available for testing
if (typeof window !== 'undefined') {
  // @ts-expect-error - Adding to window for debugging
  window.piktorAdmin = {
    // Enable unlimited generations
    enableAdmin: () => {
      enableAdminMode();
      console.log('✅ Admin mode enabled - unlimited generations');
      refreshContext();
    },
    
    // Disable admin mode
    disableAdmin: () => {
      disableAdminMode();
      console.log('❌ Admin mode disabled - limits enforced');
      refreshContext();
    },
    
    // Reset usage counter
    resetUsage: () => {
      resetUsage();
      console.log('🔄 Usage counter reset');
      refreshContext();
    },
    
    // Show current usage state
    debug: () => {
      debugUsageState();
    },
    
    // Quick test - set usage to 4 generations (1 remaining)
    setNearLimit: () => {
      const config = DEFAULT_USAGE_CONFIG;
      const testData = {
        generationCount: 4,
        firstGeneration: new Date().toISOString(),
        lastGeneration: new Date().toISOString(),
        sessionId: 'test_session_near_limit',
        environment: 'development' as const,
      };
      localStorage.setItem(config.storageKey, JSON.stringify(testData));
      console.log('⚠️ Usage set to 4/5 generations (1 remaining)');
      refreshContext();
    },
    
    // Quick test - set usage to maximum (limit reached)
    setAtLimit: () => {
      const config = DEFAULT_USAGE_CONFIG;
      const testData = {
        generationCount: 5,
        firstGeneration: new Date().toISOString(),
        lastGeneration: new Date().toISOString(),
        sessionId: 'test_session_at_limit',
        environment: 'production' as const,
      };
      localStorage.setItem(config.storageKey, JSON.stringify(testData));
      console.log('🚫 Usage set to 5/5 generations (limit reached)');
      refreshContext();
    },
    
    // Enable limit testing in development
    enableLimitTesting: () => {
      localStorage.setItem('piktor_force_limits_testing', 'true');
      console.log('🧪 Limit testing enabled in development environment');
      refreshContext();
    },

    // Disable limit testing in development (back to unlimited)
    disableLimitTesting: () => {
      localStorage.removeItem('piktor_force_limits_testing');
      console.log('♾️ Development environment back to unlimited generations');
      refreshContext();
    },

    // Simulate production environment
    simulateProduction: () => {
      // This is a client-side simulation - the actual detection happens in the utility
      console.log('🌍 For production simulation, deploy to Vercel main branch');
      console.log('📝 Current environment detection is based on hostname and deployment context');
      console.log('💡 TIP: Use piktorAdmin.enableLimitTesting() to test limits in development');
    },
    
    // Show help
    help: () => {
      console.group('🔧 Piktor Admin Utils');
      console.log('Available commands:');
      console.log('piktorAdmin.enableAdmin()     - Enable unlimited generations');
      console.log('piktorAdmin.disableAdmin()    - Disable admin mode');
      console.log('piktorAdmin.resetUsage()      - Reset usage counter');
      console.log('piktorAdmin.debug()           - Show current usage state');
      console.log('piktorAdmin.setNearLimit()    - Set usage to 4/5 (testing)');
      console.log('piktorAdmin.setAtLimit()      - Set usage to 5/5 (testing)');
      console.log('piktorAdmin.enableLimitTesting() - Force limits in development');
      console.log('piktorAdmin.disableLimitTesting() - Disable dev limit testing');
      console.log('piktorAdmin.simulateProduction() - Info about production simulation');
      console.log('piktorAdmin.help()            - Show this help');
      console.groupEnd();
    }
  };
  
  console.log('🔧 Piktor admin utils loaded. Type piktorAdmin.help() for available commands.');
}

// Export for programmatic usage
export const adminUtils = {
  enableAdminMode,
  disableAdminMode,
  resetUsage,
  debugUsageState,
};