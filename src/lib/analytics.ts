/**
 * Google Analytics tracking utilities for Piktor SaaS
 */

// Define proper types for gtag parameters
type GtagEventParameters = {
  event_category?: string;
  event_label?: string;
  value?: number;
  custom_parameters?: Record<string, string | number | boolean | undefined>;
  page_path?: string;
  page_title?: string;
};

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: GtagEventParameters
    ) => void;
  }
}

// Check if gtag is available and we're in production or development
const isTrackingEnabled = () => {
  return typeof window !== 'undefined' && 
         typeof window.gtag === 'function';
};

// Generic event tracking function
export const trackEvent = (
  eventName: string,
  parameters?: GtagEventParameters
) => {
  if (isTrackingEnabled()) {
    window.gtag('event', eventName, {
      event_category: 'engagement',
      ...parameters
    });
  }

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', eventName, parameters);
  }
};

// Page view tracking
export const trackPageView = (pagePath: string, pageTitle?: string) => {
  if (isTrackingEnabled()) {
    window.gtag('config', 'G-NH26LFWXZ7', {
      page_path: pagePath,
      page_title: pageTitle
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Page View:', pagePath, pageTitle);
  }
};

// Image generation specific events
export const trackImageGeneration = {
  // When user uploads reference images
  imageUploaded: (data: {
    imageCount: number;
    productType?: string;
    productName?: string;
  }) => {
    trackEvent('image_uploaded', {
      event_category: 'generator',
      event_label: 'reference_upload',
      value: data.imageCount,
      custom_parameters: {
        product_type: data.productType || 'unknown',
        product_name: data.productName || 'unknown'
      }
    });
  },

  // When generation starts
  generationStarted: (data: {
    referenceImageCount: number;
    productType?: string;
    productName?: string;
  }) => {
    trackEvent('image_generation_started', {
      event_category: 'generator',
      event_label: 'generation_start',
      value: data.referenceImageCount,
      custom_parameters: {
        product_type: data.productType || 'unknown',
        product_name: data.productName || 'unknown'
      }
    });
  },

  // When generation completes successfully
  generationCompleted: (data: {
    generatedImageCount: number;
    generationTime?: number;
    productType?: string;
    productName?: string;
  }) => {
    trackEvent('image_generation_completed', {
      event_category: 'generator',
      event_label: 'generation_success',
      value: data.generatedImageCount,
      custom_parameters: {
        product_type: data.productType || 'unknown',
        product_name: data.productName || 'unknown',
        generation_time_seconds: data.generationTime
      }
    });
  },

  // When generation fails
  generationFailed: (data: {
    errorType: string;
    errorMessage?: string;
    productType?: string;
  }) => {
    trackEvent('image_generation_failed', {
      event_category: 'generator',
      event_label: 'generation_error',
      custom_parameters: {
        error_type: data.errorType,
        error_message: data.errorMessage,
        product_type: data.productType || 'unknown'
      }
    });
  },

  // When user downloads generated image
  imageDownloaded: (data: {
    imageIndex: number;
    productType?: string;
    filename?: string;
  }) => {
    trackEvent('image_downloaded', {
      event_category: 'generator',
      event_label: 'image_download',
      value: data.imageIndex + 1,
      custom_parameters: {
        product_type: data.productType || 'unknown',
        filename: data.filename
      }
    });
  },

  // When user views image in modal
  imageViewed: (data: {
    imageIndex: number;
    productType?: string;
  }) => {
    trackEvent('image_viewed', {
      event_category: 'generator',
      event_label: 'image_modal_view',
      value: data.imageIndex + 1,
      custom_parameters: {
        product_type: data.productType || 'unknown'
      }
    });
  }
};

// Usage limit tracking
export const trackUsageLimit = {
  // When user hits usage limit
  limitReached: (data: {
    generationCount: number;
    environment: string;
  }) => {
    trackEvent('usage_limit_reached', {
      event_category: 'limits',
      event_label: 'generation_limit_hit',
      value: data.generationCount,
      custom_parameters: {
        environment: data.environment
      }
    });
  },

  // When user resets usage (development)
  limitReset: (data: {
    previousCount: number;
  }) => {
    trackEvent('usage_limit_reset', {
      event_category: 'limits',
      event_label: 'usage_reset',
      value: data.previousCount
    });
  }
};

// Conversion tracking
export const trackConversion = {
  // When user clicks demo booking
  demoBookingClicked: (data: {
    location: 'header' | 'generator_result' | 'limit_reached' | 'about' | 'cta_section';
    hasGeneratedImages?: boolean;
    generationCount?: number;
  }) => {
    trackEvent('demo_booking_clicked', {
      event_category: 'conversion',
      event_label: 'demo_cta_click',
      custom_parameters: {
        click_location: data.location,
        has_generated: data.hasGeneratedImages || false,
        generation_count: data.generationCount || 0
      }
    });
  },

  // When user clicks contact
  contactClicked: (data: {
    location: 'header' | 'footer' | 'limit_reached' | 'contact_page';
    hasGeneratedImages?: boolean;
  }) => {
    trackEvent('contact_clicked', {
      event_category: 'conversion',
      event_label: 'contact_cta_click',
      custom_parameters: {
        click_location: data.location,
        has_generated: data.hasGeneratedImages || false
      }
    });
  },

  // When user tries to generate again after limit
  tryAgainAfterLimit: () => {
    trackEvent('try_again_after_limit', {
      event_category: 'conversion',
      event_label: 'retry_after_limit'
    });
  }
};

// Navigation tracking
export const trackNavigation = {
  // When user scrolls to generator from CTA
  scrollToGenerator: (data: {
    source: 'header_cta' | 'hero_cta' | 'hash_navigation';
    currentPage?: string;
  }) => {
    trackEvent('scroll_to_generator', {
      event_category: 'navigation',
      event_label: 'generator_scroll',
      custom_parameters: {
        scroll_source: data.source,
        current_page: data.currentPage || 'unknown'
      }
    });
  },

  // When user navigates to generator from other pages
  navigateToGenerator: (data: {
    fromPage: string;
  }) => {
    trackEvent('navigate_to_generator', {
      event_category: 'navigation',
      event_label: 'page_navigation',
      custom_parameters: {
        from_page: data.fromPage
      }
    });
  }
};

// Dashboard specific tracking
export const trackDashboard = {
  // Dashboard navigation and interaction
  sidebarToggled: (collapsed: boolean) => {
    trackEvent('dashboard_sidebar_toggled', {
      event_category: 'dashboard',
      event_label: collapsed ? 'collapsed' : 'expanded'
    });
  },

  pageViewed: (pageName: string) => {
    trackEvent('dashboard_page_viewed', {
      event_category: 'dashboard',
      event_label: pageName
    });
  },

  searchPerformed: (query: string, context: 'library' | 'tutorials' | 'support') => {
    trackEvent('dashboard_search', {
      event_category: 'search',
      event_label: context,
      custom_parameters: {
        search_query: query,
        search_context: context
      }
    });
  },

  filterApplied: (filterType: string, filterValue: string, context: string) => {
    trackEvent('dashboard_filter_applied', {
      event_category: 'dashboard',
      event_label: context,
      custom_parameters: {
        filter_type: filterType,
        filter_value: filterValue,
        context: context
      }
    });
  },

  // Visual creation workflow
  creationStepCompleted: (step: number, stepName: string) => {
    trackEvent('creation_step_completed', {
      event_category: 'creation_flow',
      event_label: stepName,
      value: step
    });
  },

  creationAbandoned: (step: number, reason?: string) => {
    trackEvent('creation_abandoned', {
      event_category: 'creation_flow',
      event_label: 'abandoned',
      value: step,
      custom_parameters: {
        abandonment_reason: reason || 'unknown'
      }
    });
  },

  // Library interactions
  visualViewed: (visualId: string, source: 'grid' | 'list' | 'search') => {
    trackEvent('visual_viewed', {
      event_category: 'library',
      event_label: 'visual_view',
      custom_parameters: {
        visual_id: visualId,
        view_source: source
      }
    });
  },

  visualFavorited: (visualId: string, isFavorited: boolean) => {
    trackEvent('visual_favorited', {
      event_category: 'library',
      event_label: isFavorited ? 'favorited' : 'unfavorited',
      custom_parameters: {
        visual_id: visualId
      }
    });
  },

  visualDeleted: (visualId: string) => {
    trackEvent('visual_deleted', {
      event_category: 'library',
      event_label: 'visual_deleted',
      custom_parameters: {
        visual_id: visualId
      }
    });
  },

  // Settings and account
  settingChanged: (settingName: string, newValue: string | number | boolean, oldValue?: string | number | boolean) => {
    trackEvent('setting_changed', {
      event_category: 'settings',
      event_label: settingName,
      custom_parameters: {
        setting_name: settingName,
        new_value: String(newValue),
        old_value: oldValue ? String(oldValue) : undefined
      }
    });
  },

  profileUpdated: (fieldsUpdated: string[]) => {
    trackEvent('profile_updated', {
      event_category: 'account',
      event_label: 'profile_edit',
      custom_parameters: {
        fields_updated: fieldsUpdated.join(','),
        field_count: fieldsUpdated.length
      }
    });
  },

  subscriptionViewed: (planType: string) => {
    trackEvent('subscription_viewed', {
      event_category: 'subscription',
      event_label: 'plan_viewed',
      custom_parameters: {
        current_plan: planType
      }
    });
  },

  planChangeInitiated: (fromPlan: string, toPlan: string) => {
    trackEvent('plan_change_initiated', {
      event_category: 'subscription',
      event_label: 'plan_change',
      custom_parameters: {
        from_plan: fromPlan,
        to_plan: toPlan
      }
    });
  },

  // Support interactions
  ticketCreated: (category: string, priority: string) => {
    trackEvent('support_ticket_created', {
      event_category: 'support',
      event_label: 'ticket_created',
      custom_parameters: {
        ticket_category: category,
        ticket_priority: priority
      }
    });
  },

  chatStarted: (context: 'help' | 'support' | 'sales') => {
    trackEvent('chat_started', {
      event_category: 'support',
      event_label: 'chat_initiated',
      custom_parameters: {
        chat_context: context
      }
    });
  },

  tutorialViewed: (tutorialId: string, tutorialType: 'video' | 'guide' | 'tip') => {
    trackEvent('tutorial_viewed', {
      event_category: 'tutorials',
      event_label: tutorialType,
      custom_parameters: {
        tutorial_id: tutorialId
      }
    });
  },

  faqExpanded: (faqId: string, category: string) => {
    trackEvent('faq_expanded', {
      event_category: 'help',
      event_label: 'faq_view',
      custom_parameters: {
        faq_id: faqId,
        faq_category: category
      }
    });
  },

  // Performance and engagement metrics
  sessionDuration: (durationMinutes: number, pagesVisited: number) => {
    trackEvent('dashboard_session', {
      event_category: 'engagement',
      event_label: 'session_summary',
      value: durationMinutes,
      custom_parameters: {
        pages_visited: pagesVisited,
        session_duration_minutes: durationMinutes
      }
    });
  },

  featureDiscovered: (featureName: string, discoveryMethod: 'tooltip' | 'tutorial' | 'exploration') => {
    trackEvent('feature_discovered', {
      event_category: 'onboarding',
      event_label: featureName,
      custom_parameters: {
        discovery_method: discoveryMethod
      }
    });
  }
};