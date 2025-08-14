// A/B Testing Framework for Piktor
// Enables testing different UI variations, copy, and features

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // 0-100, percentage of users who see this variant
  config: Record<string, any>;
  isControl?: boolean;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  variants: ABTestVariant[];
  targetAudience?: {
    newUsers?: boolean;
    returningUsers?: boolean;
    geo?: string[];
    deviceType?: 'mobile' | 'desktop' | 'tablet';
  };
  conversionGoals: string[]; // e.g., 'upload_complete', 'generation_start', 'download_complete'
}

export interface ABTestResult {
  testId: string;
  variantId: string;
  userId: string;
  sessionId: string;
  timestamp: string;
  conversions: string[];
  metadata?: Record<string, any>;
}

class ABTestingService {
  private tests: Map<string, ABTest> = new Map();
  private userAssignments: Map<string, Map<string, string>> = new Map(); // userId -> testId -> variantId
  private results: ABTestResult[] = [];

  /**
   * Initialize the A/B testing service with test configurations
   */
  async initialize(tests: ABTest[]) {
    tests.forEach(test => {
      this.tests.set(test.id, test);
    });
    
    // Load existing user assignments from localStorage
    this.loadUserAssignments();
  }

  /**
   * Get the assigned variant for a user in a specific test
   */
  getVariant(testId: string, userId: string): ABTestVariant | null {
    const test = this.tests.get(testId);
    if (!test || test.status !== 'running') {
      return null;
    }

    // Check if user already has an assignment
    const userTests = this.userAssignments.get(userId);
    if (userTests?.has(testId)) {
      const assignedVariantId = userTests.get(testId)!;
      return test.variants.find(v => v.id === assignedVariantId) || null;
    }

    // Assign variant based on weights
    const variant = this.assignVariant(test, userId);
    
    // Store assignment
    if (!this.userAssignments.has(userId)) {
      this.userAssignments.set(userId, new Map());
    }
    this.userAssignments.get(userId)!.set(testId, variant.id);
    
    // Persist to localStorage
    this.saveUserAssignments();

    return variant;
  }

  /**
   * Track a conversion event for a user
   */
  trackConversion(
    testId: string, 
    userId: string, 
    conversionType: string,
    metadata?: Record<string, any>
  ) {
    const test = this.tests.get(testId);
    const userTests = this.userAssignments.get(userId);
    const variantId = userTests?.get(testId);

    if (!test || !variantId) {
      return;
    }

    const result: ABTestResult = {
      testId,
      variantId,
      userId,
      sessionId: this.getSessionId(),
      timestamp: new Date().toISOString(),
      conversions: [conversionType],
      metadata
    };

    this.results.push(result);
    
    // In a real implementation, this would send to analytics service
    this.sendToAnalytics(result);
  }

  /**
   * Get test results and statistics
   */
  getTestResults(testId: string) {
    const test = this.tests.get(testId);
    if (!test) return null;

    const testResults = this.results.filter(r => r.testId === testId);
    
    // Calculate conversion rates for each variant
    const variantStats = test.variants.map(variant => {
      const variantResults = testResults.filter(r => r.variantId === variant.id);
      const uniqueUsers = new Set(variantResults.map(r => r.userId)).size;
      
      const conversionStats = test.conversionGoals.reduce((stats, goal) => {
        const conversions = variantResults.filter(r => r.conversions.includes(goal)).length;
        const conversionRate = uniqueUsers > 0 ? (conversions / uniqueUsers) * 100 : 0;
        
        stats[goal] = {
          conversions,
          conversionRate,
          uniqueUsers
        };
        
        return stats;
      }, {} as Record<string, any>);

      return {
        variantId: variant.id,
        variantName: variant.name,
        totalUsers: uniqueUsers,
        conversions: conversionStats
      };
    });

    return {
      testId,
      testName: test.name,
      status: test.status,
      variants: variantStats,
      totalResults: testResults.length,
      dateRange: {
        start: test.startDate,
        end: test.endDate || new Date().toISOString()
      }
    };
  }

  private assignVariant(test: ABTest, userId: string): ABTestVariant {
    // Use hash of userId for consistent assignment
    const hash = this.hashString(userId + test.id);
    const randomValue = hash % 100;
    
    let cumulativeWeight = 0;
    for (const variant of test.variants) {
      cumulativeWeight += variant.weight;
      if (randomValue < cumulativeWeight) {
        return variant;
      }
    }
    
    // Fallback to control variant
    return test.variants.find(v => v.isControl) || test.variants[0];
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('piktor-session-id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('piktor-session-id', sessionId);
    }
    return sessionId;
  }

  private loadUserAssignments() {
    try {
      const stored = localStorage.getItem('piktor-ab-assignments');
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([userId, tests]) => {
          this.userAssignments.set(userId, new Map(Object.entries(tests as Record<string, string>)));
        });
      }
    } catch (error) {
      console.warn('Failed to load AB test assignments:', error);
    }
  }

  private saveUserAssignments() {
    try {
      const data: Record<string, Record<string, string>> = {};
      this.userAssignments.forEach((tests, userId) => {
        data[userId] = Object.fromEntries(tests);
      });
      localStorage.setItem('piktor-ab-assignments', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save AB test assignments:', error);
    }
  }

  private sendToAnalytics(result: ABTestResult) {
    // In production, send to your analytics service
    console.log('AB Test Event:', result);
    
    // Example: Send to Google Analytics, Mixpanel, etc.
    // analytics.track('ab_test_conversion', result);
  }
}

// Singleton instance
export const abTestingService = new ABTestingService();

// React hook for using A/B tests
import { useState, useEffect } from 'react';

export function useABTest(testId: string, userId: string) {
  const [variant, setVariant] = useState<ABTestVariant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const assignedVariant = abTestingService.getVariant(testId, userId);
    setVariant(assignedVariant);
    setIsLoading(false);
  }, [testId, userId]);

  const trackConversion = (conversionType: string, metadata?: Record<string, any>) => {
    abTestingService.trackConversion(testId, userId, conversionType, metadata);
  };

  return {
    variant,
    isLoading,
    trackConversion,
    isInTest: variant !== null
  };
}

// Predefined A/B tests for Piktor
export const PIKTOR_AB_TESTS: ABTest[] = [
  {
    id: 'homepage_hero',
    name: 'Homepage Hero Copy Test',
    description: 'Test different value propositions on the homepage',
    status: 'running',
    startDate: '2024-01-15T00:00:00Z',
    variants: [
      {
        id: 'control',
        name: 'Original Copy',
        weight: 50,
        isControl: true,
        config: {
          headline: 'Transform Your Furniture Images with AI',
          subheading: 'Upload images and 3D models of your desks to generate consistent, professional packshots, lifestyle images, and social media visuals powered by AI.',
          ctaText: 'Start Creating'
        }
      },
      {
        id: 'benefit_focused',
        name: 'Benefit-Focused Copy',
        weight: 50,
        config: {
          headline: 'Sell More Furniture with Studio-Quality Images',
          subheading: 'Turn basic product photos into professional marketing assets in minutes. Generate lifestyle scenes that convert browsers into buyers.',
          ctaText: 'Transform Your First Image - Free'
        }
      }
    ],
    conversionGoals: ['homepage_cta_click', 'upload_complete', 'generation_start']
  },
  {
    id: 'stepper_flow',
    name: 'Generation Flow Optimization',
    description: 'Test different approaches to the 4-step generation process',
    status: 'running',
    startDate: '2024-01-20T00:00:00Z',
    variants: [
      {
        id: 'linear',
        name: 'Linear Flow (Control)',
        weight: 50,
        isControl: true,
        config: {
          allowSkip: false,
          showProgress: true,
          navigationStyle: 'linear'
        }
      },
      {
        id: 'flexible',
        name: 'Flexible Navigation',
        weight: 50,
        config: {
          allowSkip: true,
          showProgress: true,
          navigationStyle: 'flexible'
        }
      }
    ],
    conversionGoals: ['step_complete', 'generation_complete', 'download_complete']
  },
  {
    id: 'onboarding_tour',
    name: 'Product Tour Impact',
    description: 'Measure the impact of showing the product tour to new users',
    status: 'running',
    startDate: '2024-01-25T00:00:00Z',
    variants: [
      {
        id: 'no_tour',
        name: 'No Tour (Control)',
        weight: 50,
        isControl: true,
        config: {
          showTour: false
        }
      },
      {
        id: 'auto_tour',
        name: 'Automatic Tour',
        weight: 50,
        config: {
          showTour: true,
          autoStart: true
        }
      }
    ],
    targetAudience: {
      newUsers: true
    },
    conversionGoals: ['tour_complete', 'first_upload', 'first_generation']
  }
];

// Initialize A/B testing on app startup
export async function initializeABTesting() {
  await abTestingService.initialize(PIKTOR_AB_TESTS);
}