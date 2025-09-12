import { NextRequest, NextResponse } from "next/server";
import { 
  buildDashboardPromptWithFallbacks,
  validateDashboardSettings,
  convertDashboardToProductionSpecs,
  DashboardProductProfile,
  DashboardGenerationSettings
} from "@/lib/dashboard-prompt-engine";
import { 
  generateMultipleImagesWithReferences,
  generateMultipleImagesWithGemini,
  getGeminiAspectRatio
} from "@/lib/gemini-api";
import { generateProductionPrompt } from "@/lib/production-prompt-engine";
import { detectEnvironment } from "@/lib/usage-limits";

// Dashboard-specific generation request interface
interface DashboardGenerationRequest {
  productProfile: DashboardProductProfile;
  settings: DashboardGenerationSettings;
  referenceImages: Array<{
    data: string; // base64
    mimeType: string;
  }>;
}

// Server-side usage limit checking (reused from existing system)
async function checkServerSideUsageLimit(request: NextRequest): Promise<{ allowed: boolean; reason?: string; environment: string }> {
  const environment = detectEnvironment();
  
  // Preview branch: unlimited generations
  if (environment === 'preview') {
    return { allowed: true, environment };
  }
  
  // Development: unlimited generations
  if (environment === 'development') {
    return { allowed: true, environment };
  }
  
  // Check for admin override in headers
  const adminHeader = request.headers.get('x-admin-override');
  if (adminHeader === 'true') {
    return { allowed: true, reason: 'admin-override', environment };
  }
  
  // For production, we rely on client-side tracking
  const clientUsageHeader = request.headers.get('x-usage-count');
  const maxGenerations = 5;
  
  if (clientUsageHeader) {
    const usageCount = parseInt(clientUsageHeader, 10);
    if (usageCount >= maxGenerations) {
      return { 
        allowed: false, 
        reason: `Usage limit exceeded (${usageCount}/${maxGenerations})`, 
        environment 
      };
    }
  }
  
  return { allowed: true, environment };
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Dashboard API] Processing dashboard image generation request...');
    
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        error: "Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file" 
      }, { status: 500 });
    }

    // Check usage limits first
    const usageLimitCheck = await checkServerSideUsageLimit(request);
    if (!usageLimitCheck.allowed) {
      return NextResponse.json({ 
        error: "Usage limit exceeded", 
        details: usageLimitCheck.reason,
        environment: usageLimitCheck.environment,
        limitType: 'server-side',
        maxGenerations: 5,
        suggestion: "Contact us for unlimited access or try again later"
      }, { status: 429 });
    }

    const requestBody = await request.json() as DashboardGenerationRequest;
    const { productProfile, settings, referenceImages } = requestBody;
    
    console.log('[Dashboard API] Request details:', {
      productName: productProfile.productName,
      productCategory: productProfile.productCategory,
      imagesUploaded: productProfile.uploadedImages.length,
      referenceImagesProvided: referenceImages.length,
      style: settings.style,
      environment: settings.environment,
      lighting: settings.lighting,
      angle: settings.angle,
      formats: settings.formats
    });

    // Validate dashboard settings and provide feedback
    const validation = validateDashboardSettings(settings, productProfile);
    console.log('[Dashboard API] Settings validation:', {
      isValid: validation.isValid,
      completeness: `${validation.completeness}%`,
      warningsCount: validation.warnings.length,
      recommendationsCount: validation.recommendations.length
    });

    // Generate the enhanced dashboard prompt
    const dashboardPrompt = buildDashboardPromptWithFallbacks(productProfile, settings);
    console.log('[Dashboard API] Dashboard prompt generated:', {
      promptLength: dashboardPrompt.length,
      customInstructionsIncluded: Boolean(settings.customPrompt)
    });

    // Convert dashboard settings to production specs for hybrid approach
    const productionSpecs = convertDashboardToProductionSpecs(productProfile, settings);
    
    // Also generate production-optimized prompt for comparison/fallback
    const productionPromptResult = generateProductionPrompt(
      productionSpecs.productSpecs,
      productionSpecs.generationParams.contextPreset as any,
      {
        contextPreset: productionSpecs.generationParams.contextPreset as any,
        backgroundStyle: 'minimal',
        productPosition: 'center',
        lighting: 'studio_softbox',
        strictMode: true,
        quality: 'high',
        variations: 1,
        props: []
      }
    );

    // Create hybrid prompt combining dashboard personalization with production quality
    const hybridPrompt = `${dashboardPrompt}

🔧 PRODUCTION QUALITY ENHANCEMENT:
${productionPromptResult.prompt.split('🔧 PRODUCTION QUALITY ENHANCEMENT:')[1] || 'Professional commercial furniture photography standards apply.'}`;

    console.log('[Dashboard API] Hybrid prompt system:', {
      dashboardPromptLength: dashboardPrompt.length,
      productionPromptLength: productionPromptResult.prompt.length,
      hybridPromptLength: hybridPrompt.length,
      productionReady: productionPromptResult.metadata.productionReady
    });

    // Generate images using multimodal approach with reference images
    let variations;
    let generationMethod = 'unknown';
    let generationError = null;

    try {
      // Validate reference images
      const validImages = referenceImages.filter(img => 
        img.data && img.mimeType && img.mimeType.startsWith('image/')
      );
      
      if (validImages.length > 0) {
        console.log('[Dashboard API] Using multimodal generation with reference images:', validImages.length);
        
        // Use hybrid prompt with reference images for best results
        variations = await generateMultipleImagesWithReferences(
          hybridPrompt,
          validImages,
          settings.formats.length, // Generate one image per format
          productionSpecs.generationParams.contextPreset as any
        );
        
        generationMethod = 'multimodal-dashboard-hybrid';
        console.log('[Dashboard API] Generated variations with reference images:', variations.length);
      } else {
        throw new Error('No valid reference images provided');
      }
    } catch (referenceError) {
      console.error('[Dashboard API] Reference image processing failed:', referenceError);
      generationError = referenceError instanceof Error ? referenceError.message : 'Unknown error';
      
      // Fallback to text-only generation using dashboard prompt
      console.log('[Dashboard API] Falling back to text-only generation with dashboard prompt');
      
      const aspectRatio = getGeminiAspectRatio(productionSpecs.generationParams.contextPreset as any);
      const geminiRequest = {
        prompt: `${dashboardPrompt}

🚨 TEXT-ONLY GENERATION MODE: Reference images could not be processed. Generating from personalized dashboard description with enhanced quality constraints.`,
        aspectRatio: aspectRatio,
      };

      variations = await generateMultipleImagesWithGemini(
        geminiRequest,
        settings.formats.length,
        productionSpecs.generationParams.contextPreset as any
      );
      
      generationMethod = 'text-only-dashboard-enhanced';
      console.log('[Dashboard API] Generated variations using text-only fallback:', variations.length);
    }

    // Build comprehensive response
    const result = {
      generationId: `dashboard-${Date.now()}`,
      productName: productProfile.productName,
      productCategory: productProfile.productCategory,
      settings: settings,
      variations: variations.map((variation, index) => ({
        ...variation,
        format: settings.formats[index] || settings.formats[0],
        prompt: index === 0 ? dashboardPrompt : `${dashboardPrompt} (Format: ${settings.formats[index] || 'primary'})`
      })),
      
      // Enhanced metadata for dashboard
      dashboardMetadata: {
        settingsValidation: validation,
        personalizedPrompt: dashboardPrompt,
        promptLength: dashboardPrompt.length,
        styleConfiguration: settings.style,
        environmentConfiguration: settings.environment,
        lightingConfiguration: settings.lighting,
        cameraAngleConfiguration: settings.angle,
        formatOptimizations: settings.formats,
        customInstructionsApplied: Boolean(settings.customPrompt),
        fallbacksApplied: validation.completeness < 100,
        generationMethod,
        generationError,
        referenceImagesUsed: referenceImages.length > 0 && !generationError,
        referenceImageCount: referenceImages.length
      },
      
      // Production system metadata
      productionMetadata: {
        engineVersion: productionPromptResult.metadata.engineVersion,
        productionReady: productionPromptResult.metadata.productionReady,
        qualityScore: productionPromptResult.qualityScore,
        optimizationsApplied: productionPromptResult.metadata.optimizationsApplied,
        hybridApproach: true
      },
      
      // Usage and environment info
      usageLimitInfo: {
        environment: usageLimitCheck.environment,
        limitEnforced: usageLimitCheck.environment === 'production',
        serverSideValidation: true,
      },
      
      // User feedback
      feedback: {
        warnings: validation.warnings,
        recommendations: validation.recommendations,
        completeness: validation.completeness,
        generationQuality: generationError ? 'degraded' : 'optimal',
        nextSteps: generateNextSteps(validation, settings, generationError)
      }
    };

    console.log('[Dashboard API] Generation completed successfully:', {
      variations: result.variations.length,
      generationMethod: result.dashboardMetadata.generationMethod,
      qualityScore: result.productionMetadata.qualityScore,
      completeness: result.feedback.completeness
    });

    return NextResponse.json({ 
      success: true,
      result 
    });

  } catch (error) {
    console.error("[Dashboard API] Generation error:", error);
    
    let userError = "Unknown error occurred during dashboard generation";
    let statusCode = 500;
    
    if (error instanceof Error) {
      userError = error.message;
      
      // Provide specific error guidance for dashboard users
      if (error.message.includes('API key')) {
        userError = "Service configuration error. Please try again in a moment.";
      } else if (error.message.includes('rate limit')) {
        userError = "Service temporarily busy. Please wait a moment and try again.";
        statusCode = 429;
      } else if (error.message.includes('image')) {
        userError = "Problem processing uploaded images. Please check image format and size.";
        statusCode = 400;
      }
    }
    
    return NextResponse.json({
      error: userError,
      approach: "dashboard-personalized-generation",
      system: "enhanced-dashboard-prompt-engine",
      version: "1.0.0",
      suggestion: "Please check your personalization settings and uploaded images, then try again."
    }, { status: statusCode });
  }
}

// Helper function to generate actionable next steps for users
function generateNextSteps(
  validation: ReturnType<typeof validateDashboardSettings>,
  settings: DashboardGenerationSettings,
  generationError: string | null
): string[] {
  const steps: string[] = [];
  
  if (generationError) {
    steps.push("Upload clear, high-quality product images for better results");
    steps.push("Ensure images show the product from different angles");
  }
  
  if (validation.completeness < 100) {
    steps.push("Complete all personalization options for optimal results");
  }
  
  if (validation.warnings.length > 0) {
    steps.push("Review the warnings above and adjust settings if needed");
  }
  
  if (settings.formats.length > 1) {
    steps.push("Each format is optimized separately - review each result");
  }
  
  if (!settings.customPrompt) {
    steps.push("Consider adding special instructions for unique requirements");
  }
  
  if (steps.length === 0) {
    steps.push("Great settings! Your images are generated with full personalization");
    steps.push("Download your results and create more variations if needed");
  }
  
  return steps;
}