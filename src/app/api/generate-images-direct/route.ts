import { NextRequest, NextResponse } from "next/server";
import { ContextPreset } from "@/components/image-generator/types";
import { 
  generateMultipleImagesWithGemini, 
  generateMultipleImagesWithReferences,
  getGeminiAspectRatio
} from "@/lib/gemini-api";
import { generateProductionPrompt } from "@/lib/production-prompt-engine";

interface GenerationParams {
  contextPreset: ContextPreset;
  variations: number;
  quality: 'high' | 'medium' | 'low';
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        error: "Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file" 
      }, { status: 500 });
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
      variations: Math.min(Math.max(params.variations, 1), 4) as 1 | 2 | 3 | 4,
      props: []
    };

    // Generate production-optimized prompt using the enhanced Production Prompt Engine
    const promptResult = generateProductionPrompt(
      productSpecs, 
      params.contextPreset, 
      defaultUISettings
    );

    console.log(`Generating ${params.variations} ${params.contextPreset} images using Google Nano Banana (Production Optimized)`);
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
          params.variations,
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
        params.variations,
        params.contextPreset
      );
      
      referenceImagesUsed = false;
      console.log(`Generated ${variations.length} variations using text-only fallback`);
    }

    const result = {
      productConfigId: `direct-generation-${Date.now()}`,
      productName: productSpecs.productName,
      contextPreset: params.contextPreset,
      variations,
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