import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug endpoint for troubleshooting download issues
 * Helps diagnose URL validation and accessibility problems
 */
interface DiagnosticCheck {
  [key: string]: unknown;
}

interface Diagnostics {
  url: string;
  timestamp: string;
  checks: {
    url_format?: DiagnosticCheck;
    domain_validation?: DiagnosticCheck;
    accessibility?: DiagnosticCheck;
    cors?: DiagnosticCheck;
  };
  summary?: {
    canDownload: boolean;
    issues: string[];
    recommendations: string[];
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({
        error: 'Image URL is required',
        usage: 'Add ?url=<image_url> to debug the URL'
      }, { status: 400 });
    }

    const diagnostics: Diagnostics = {
      url: imageUrl,
      timestamp: new Date().toISOString(),
      checks: {}
    };

    // URL validation
    try {
      const urlObj = new URL(imageUrl);
      diagnostics.checks.url_format = {
        valid: true,
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        pathname: urlObj.pathname,
        search: urlObj.search
      };
    } catch (urlError) {
      diagnostics.checks.url_format = {
        valid: false,
        error: urlError instanceof Error ? urlError.message : 'Invalid URL format'
      };
      return NextResponse.json(diagnostics, { status: 400 });
    }

    const urlObj = new URL(imageUrl);

    // Domain validation
    const allowedDomains = [
      'delivery-eu1.bfl.ai',
      'delivery-us1.bfl.ai', 
      'delivery.bfl.ai',
      'cdn.bfl.ai',
      'static.bfl.ai',
      'images.bfl.ai',
      'assets.bfl.ai'
    ];
    
    const isValidDomain = allowedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );
    
    diagnostics.checks.domain_validation = {
      hostname: urlObj.hostname,
      allowed: isValidDomain,
      allowedDomains: allowedDomains
    };

    // Accessibility test
    try {
      console.log(`[Debug] Testing accessibility for: ${imageUrl}`);
      
      const startTime = Date.now();
      const response = await fetch(imageUrl, {
        method: 'HEAD', // Just headers, no body
        headers: {
          'User-Agent': 'Piktor-Debug-Service/1.0'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      const endTime = Date.now();
      
      diagnostics.checks.accessibility = {
        reachable: true,
        status: response.status,
        statusText: response.statusText,
        responseTime: `${endTime - startTime}ms`,
        headers: {
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length'),
          cacheControl: response.headers.get('cache-control'),
          lastModified: response.headers.get('last-modified'),
          etag: response.headers.get('etag')
        }
      };

      if (!response.ok) {
        (diagnostics.checks.accessibility as DiagnosticCheck).error = `HTTP ${response.status}: ${response.statusText}`;
      }

    } catch (fetchError) {
      diagnostics.checks.accessibility = {
        reachable: false,
        error: fetchError instanceof Error ? fetchError.message : 'Network error',
        details: 'Failed to reach the URL'
      };
    }

    // CORS check
    try {
      const corsResponse = await fetch(imageUrl, {
        method: 'OPTIONS',
        headers: {
          'Origin': request.headers.get('origin') || 'https://piktor.example.com',
          'Access-Control-Request-Method': 'GET'
        },
        signal: AbortSignal.timeout(5000)
      });

      diagnostics.checks.cors = {
        tested: true,
        preflight_status: corsResponse.status,
        headers: {
          accessControlAllowOrigin: corsResponse.headers.get('access-control-allow-origin'),
          accessControlAllowMethods: corsResponse.headers.get('access-control-allow-methods'),
          accessControlAllowHeaders: corsResponse.headers.get('access-control-allow-headers')
        }
      };
    } catch (corsError) {
      diagnostics.checks.cors = {
        tested: true,
        error: corsError instanceof Error ? corsError.message : 'CORS test failed',
        note: 'This is why we need a proxy endpoint'
      };
    }

    // Summary and recommendations
    const accessibilityReachable = Boolean((diagnostics.checks.accessibility as DiagnosticCheck)?.reachable);
    diagnostics.summary = {
      canDownload: isValidDomain && accessibilityReachable,
      issues: [] as string[],
      recommendations: [] as string[]
    };

    if (!isValidDomain) {
      diagnostics.summary.issues.push('Domain not in allowed list');
      diagnostics.summary.recommendations.push('Add the domain to allowedDomains in the download API');
    }

    if (!diagnostics.checks.accessibility?.reachable) {
      diagnostics.summary.issues.push('URL not accessible');
      diagnostics.summary.recommendations.push('Check if the URL has expired or if there are network issues');
    }

    const accessibilityStatus = (diagnostics.checks.accessibility as DiagnosticCheck)?.status;
    if (typeof accessibilityStatus === 'number' && accessibilityStatus >= 400) {
      diagnostics.summary.issues.push(`HTTP error: ${accessibilityStatus}`);
      diagnostics.summary.recommendations.push('Check if the image still exists at the URL');
    }

    return NextResponse.json(diagnostics, { 
      status: diagnostics.summary.canDownload ? 200 : 422 
    });

  } catch (error) {
    console.error('[Debug] Unexpected error:', error);
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}