/**
 * Google Analytics tracking utilities for Piktor SaaS
 */

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
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
  parameters?: Record<string, any>
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
    window.gtag('config', 'G-40Z06ESGCJ', {
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