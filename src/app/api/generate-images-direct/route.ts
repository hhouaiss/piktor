import { NextRequest, NextResponse } from "next/server";
import { ContextPreset } from "@/components/image-generator/types";
import {
  generateMultipleImagesWithGemini,
  generateMultipleImagesWithReferences,
  getGeminiAspectRatio
} from "@/lib/gemini-api";
import { generateProductionPrompt } from "@/lib/production-prompt-engine";
import { detectEnvironment } from "@/lib/usage-limits";
import { authService, firestoreService } from "@/lib/firebase";
import { generationService } from "@/lib/firebase/generation-service";
import type { GenerationRequest, GeneratedImageData } from "@/lib/firebase/generation-service";

interface GenerationParams {
  contextPreset: ContextPreset;
  variations: number;
  quality: 'high' | 'medium' | 'low';
}

// Server-side usage limit checking with Firebase integration
async function checkServerSideUsageLimit(request: NextRequest): Promise<{ allowed: boolean; reason?: string; environment: string; userId?: string }> {
  const environment = detectEnvironment();

  console.log('[checkServerSideUsageLimit] Starting usage limit check, environment:', environment);

  // Extract user ID from headers for Firebase integration (even in dev/preview)
  const userId = request.headers.get('x-user-id');
  const authHeader = request.headers.get('Authorization');

  console.log('[checkServerSideUsageLimit] Extracted headers:', {
    hasUserId: !!userId,
    hasAuthHeader: !!authHeader,
    userId: userId,
    userIdPrefix: userId ? userId.substring(0, 8) + '...' : 'none'
  });

  // Preview branch: unlimited generations (but include userId for Firebase)
  if (environment === 'preview') {
    return { allowed: true, environment, userId: userId || undefined };
  }

  // Development: unlimited generations (but include userId for Firebase)
  if (environment === 'development') {
    return { allowed: true, environment, userId: userId || undefined };
  }

  // Check for admin override in headers
  const adminHeader = request.headers.get('x-admin-override');
  if (adminHeader === 'true') {
    return { allowed: true, reason: 'admin-override', environment, userId: userId || undefined };
  }

  // For production, we rely on client-side tracking
  // but add additional server-side rate limiting based on IP/session
  const clientUsageHeader = request.headers.get('x-usage-count');
  const maxGenerations = 5;

  if (clientUsageHeader) {
    const usageCount = parseInt(clientUsageHeader, 10);
    if (usageCount >= maxGenerations) {
      return {
        allowed: false,
        reason: `Usage limit exceeded (${usageCount}/${maxGenerations})`,
        environment,
        userId: userId || undefined
      };
    }
  }

  return { allowed: true, environment, userId: userId || undefined };
}

export async function POST(request: NextRequest) {
  try {
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
      }, { status: 429 }); // Too Many Requests
    }

    const { productSpecs, referenceImages, generationParams } = await request.json();
    
    // DEBUG: Log what the API receives
    console.log(`[API] Received context preset: ${generationParams?.contextPreset}`);
    console.log(`[API] Full generationParams:`, generationParams);
    
    if (!productSpecs) {
      return NextResponse.json({ error: "No product specifications provided" }, { status: 400 });
    }

    if (!referenceImages || !Array.isArray(referenceImages) || referenceImages.length === 0) {
      return NextResponse.json({ error: "No reference images provided" }, { status: 400 });
    }

    const params = generationParams as GenerationParams;

    // Validate basic specs
    if (!productSpecs.productName || !productSpecs.productType) {
      return NextResponse.json({ 
        error: "Missing required product specifications. Please provide product name and type." 
      }, { status: 400 });
    }

    // Create default UI settings for prompt generation
    const defaultUISettings = {
      contextPreset: params.contextPreset,
      backgroundStyle: 'minimal' as const,
      productPosition: 'center' as const,
      lighting: 'studio_softbox' as const,
      strictMode: false,
      quality: params.quality,
      variations: 1 as 1 | 2 | 3 | 4,
      props: []
    };

    // Generate production-optimized prompt using the enhanced Production Prompt Engine
    const promptResult = generateProductionPrompt(
      productSpecs, 
      params.contextPreset, 
      defaultUISettings
    );

    console.log(`Generating 1 ${params.contextPreset} image using Google Nano Banana (Production Optimized)`);
    console.log(`Product: ${productSpecs.productName}`);
    console.log(`Reference Images: ${referenceImages.length} base64 images provided`);
    console.log(`Prompt Length: ${promptResult.metadata.promptLength} characters`);
    console.log(`Production Ready: ${promptResult.metadata.productionReady}`);
    console.log(`Optimizations Applied: ${promptResult.metadata.optimizationsApplied.join(', ')}`);
    
    // DEBUG: Log first 500 characters of the actual prompt
    console.log('=== PROMPT PREVIEW (First 500 chars) ===');
    console.log(promptResult.prompt.substring(0, 500) + '...');
    console.log('=== END PROMPT PREVIEW ===');
    
    // Log warnings and recommendations
    if (promptResult.warnings.length > 0) {
      console.warn('Prompt Warnings:', promptResult.warnings);
    }
    if (promptResult.recommendations.length > 0) {
      console.log('Prompt Recommendations:', promptResult.recommendations);
    }

    let variations;
    let referenceImagesUsed = false;
    let referenceImageProcessingError: string | null = null;

    // Use base64 reference images for multimodal generation
    console.log(`Using multimodal generation with ${referenceImages.length} base64 reference images`);
    
    try {
      // Validate base64 images
      const validImages = referenceImages.filter((img: { data: string; mimeType: string }) => 
        img.data && img.mimeType && img.mimeType.startsWith('image/')
      );
      
      if (validImages.length > 0) {
        console.log(`Using ${validImages.length} valid base64 reference images for multimodal generation`);
        
        // Generate with reference images
        variations = await generateMultipleImagesWithReferences(
          promptResult.prompt,
          validImages,
          1,
          params.contextPreset
        );
        
        referenceImagesUsed = true;
        console.log(`Generated ${variations.length} variations with reference images`);
      } else {
        throw new Error('No valid reference images found');
      }
    } catch (referenceError) {
      console.error('Reference image processing failed:', referenceError);
      referenceImageProcessingError = referenceError instanceof Error ? referenceError.message : 'Unknown error processing reference images';
      console.warn('Failed to process reference images, falling back to text-only generation');
      
      // Fallback to text-only generation
      const aspectRatio = getGeminiAspectRatio(params.contextPreset);
      const geminiRequest = {
        prompt: `${promptResult.prompt}

🚨 FALLBACK MODE: Reference images could not be processed. Generating from description only with enhanced constraints for quality assurance.`,
        aspectRatio: aspectRatio,
      };

      variations = await generateMultipleImagesWithGemini(
        geminiRequest,
        1,
        params.contextPreset
      );
      
      referenceImagesUsed = false;
      console.log(`Generated ${variations.length} variations using text-only fallback`);
    }

    // CRITICAL FIX: Save generated images to Firebase Storage if user is authenticated
    let firebaseResults: any[] = [];
    let shouldSaveToFirebase = false;
    let isUserAuthenticated = false;

    if (usageLimitCheck.userId) {
      console.log('[Direct API] User authenticated, preparing to save images to Firebase:', {
        userId: usageLimitCheck.userId,
        imageCount: variations.length,
        environment: usageLimitCheck.environment
      });

      shouldSaveToFirebase = true;
      isUserAuthenticated = true;

      try {
        // Convert API variations to GeneratedImageData format
        const generatedImageData: GeneratedImageData[] = variations.map((variation: any) => ({
          url: variation.url,
          imageData: '', // We'll use the URL to download the image
          format: 'jpeg'
        }));

        // Create generation request for Firebase saving
        const generationRequest: GenerationRequest = {
          userId: usageLimitCheck.userId,
          prompt: promptResult.prompt,
          style: 'modern', // Default fallback
          environment: 'lifestyle', // Default fallback
          formats: ['square'], // Default fallback
          generationParams: {
            contextPreset: params.contextPreset,
            variations: params.variations,
            quality: params.quality,
            model: 'google-nano-banana',
            timestamp: new Date().toISOString(),
            sourceAPI: 'generate-images-direct',
            productionReady: promptResult.metadata.productionReady,
            engineVersion: promptResult.metadata.engineVersion
          }
        };

        console.log('[Direct API] Calling generationService.saveGeneratedImages...');
        firebaseResults = await generationService.saveGeneratedImages(
          generationRequest,
          generatedImageData
        );

        console.log('[Direct API] Firebase save completed:', {
          results: firebaseResults.map(r => ({
            success: r.success,
            visualId: r.visualId,
            projectId: r.projectId,
            error: r.error
          }))
        });

        // Update variations with Firebase Storage URLs if successful
        firebaseResults.forEach((result, index) => {
          const variation = variations[index];
          if (result.success && result.visual && result.visual.originalImageUrl && variation) {
            console.log(`[Direct API] Updating variation ${index} with Firebase URL:`, {
              originalUrl: variation.url?.substring(0, 50) + '...',
              firebaseUrl: result.visual.originalImageUrl.substring(0, 50) + '...'
            });

            // Replace the external URL with Firebase Storage URL
            variation.url = result.visual.originalImageUrl;
            variation.firebaseUrl = result.visual.originalImageUrl;
            variation.visualId = result.visualId;
            variation.projectId = result.projectId;
            variation.savedToFirebase = true;
          } else if (result.error && variation) {
            console.error(`[Direct API] Failed to save variation ${index} to Firebase:`, result.error);
            variation.savedToFirebase = false;
            variation.firebaseError = result.error;
          }
        });

      } catch (firebaseError) {
        console.error('[Direct API] Failed to save images to Firebase:', firebaseError);
        // Don't fail the entire request if Firebase saving fails
        // Just log the error and continue with external URLs
        firebaseResults = [];
        shouldSaveToFirebase = false;

        // Mark all variations as not saved to Firebase
        variations.forEach((variation: any) => {
          variation.savedToFirebase = false;
          variation.firebaseError = firebaseError instanceof Error ? firebaseError.message : 'Unknown Firebase error';
        });
      }
    } else {
      console.log('[Direct API] No user authentication found, skipping Firebase save:', {
        hasUserId: !!usageLimitCheck.userId,
        environment: usageLimitCheck.environment
      });
    }

    const result = {
      productConfigId: `direct-generation-${Date.now()}`,
      productName: productSpecs.productName,
      contextPreset: params.contextPreset,
      variations,
      usageLimitInfo: {
        environment: usageLimitCheck.environment,
        limitEnforced: usageLimitCheck.environment === 'production',
        serverSideValidation: true,
      },
      firebaseIntegration: {
        userAuthenticated: isUserAuthenticated,
        shouldSaveToFirebase,
        savedToFirebase: firebaseResults.length > 0 && firebaseResults.some(r => r.success),
        savedCount: firebaseResults.filter(r => r.success).length,
        totalImages: variations.length,
        errors: firebaseResults.filter(r => !r.success).map(r => r.error)
      },
      generationDetails: {
        sourceImageCount: referenceImages.length,
        profileSource: 'production-prompt-engine-v2',
        prompt: promptResult.prompt,
        promptLength: promptResult.metadata.promptLength,
        model: 'google-nano-banana-optimized',
        engineVersion: promptResult.metadata.engineVersion,
        generationMethod: referenceImagesUsed ? 'multimodal-image-to-image' : 'production-text-to-image',
        productIntelligence: promptResult.metadata.productIntelligence,
        qualityLevel: promptResult.metadata.qualityLevel,
        productionReady: promptResult.metadata.productionReady,
        optimizationsApplied: promptResult.metadata.optimizationsApplied,
        constraintStats: promptResult.metadata.constraintStats,
        placementAnalysis: promptResult.metadata.placementAnalysis,
        validationResults: promptResult.metadata.validationResults,
        warnings: promptResult.warnings,
        recommendations: promptResult.recommendations,
        referenceImagesUsed,
        referenceImageProcessingError,
        userSpecifications: {
          productType: productSpecs.productType,
          materials: productSpecs.materials,
          dimensions: productSpecs.dimensions,
          additionalSpecs: productSpecs.additionalSpecs
        },
        enhancedFeatures: {
          smartPlacement: true,
          intelligentPlacementDetection: true,
          enhancedConstraintSystem: true,
          humanElementPrevention: true,
          irrelevantObjectElimination: true,
          artifactPrevention: true,
          materialIntelligence: true,
          contextualLighting: true,
          professionalComposition: true,
          productionQualityAssurance: true,
          zeroToleranceConstraints: true
        }
      }
    };

    return NextResponse.json({ result });

  } catch (error) {
    console.error("Direct generation error:", error);
    
    let userError = "Unknown error occurred during generation";
    const statusCode = 500;
    
    if (error instanceof Error) {
      userError = error.message;
    }
    
    return NextResponse.json({
      error: userError,
      approach: "production-optimized-prompt-engine-generation",
      engineVersion: "2.0.0-production",
      model: "google-nano-banana"
    }, { status: statusCode });
  }
}