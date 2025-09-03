/**
 * Google Gemini API Service
 * Provides integration with Google Gemini 2.5 Flash Image and Pro for image generation and analysis
 */

import { GoogleGenAI } from "@google/genai";
import { ContextPreset } from '@/components/image-generator/types';
import { AssetType } from '@/components/image-generator/types';

// Gemini API Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY not found in environment variables');
}

// Initialize Google Gemini client
const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

// Types for Gemini API
export interface GeminiImageGenerationRequest {
  prompt: string;
  aspectRatio?: string;
  seed?: number;
  referenceImages?: Array<{
    data: string; // base64
    mimeType: string;
  }>;
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

export interface GeminiImageAnalysisRequest {
  imageData: string; // Base64 encoded image
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GeminiResponse {
  success: boolean;
  data?: {
    imageUrl?: string;
    imageData?: string; // Base64 encoded image
    analysisText?: string;
    candidates?: unknown[]; // Simplified to avoid complex type issues
  };
  error?: string;
  metadata?: {
    model: string;
    timestamp: string;
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
  };
}

export interface GeminiGenerationResult {
  url?: string; // Data URL for frontend compatibility
  imageData?: string; // Base64 encoded image data
  prompt: string;
  metadata: {
    model: string;
    timestamp: string;
    size: string;
    variation: number;
    contextPreset: ContextPreset;
    generationMethod: 'text-to-image' | 'image-editing';
    seed?: number;
  };
}

/**
 * Convert context preset to appropriate aspect ratio for Gemini API
 */
export function getGeminiAspectRatio(contextPreset: ContextPreset): string {
  switch (contextPreset) {
    case 'social_media_story':
      return '9:16'; // Vertical for Instagram/Facebook stories
    case 'hero':
    case 'lifestyle':
      return '3:2'; // Horizontal for banners and lifestyle
    case 'social_media_square':
      return '1:1'; // Perfect square for Instagram posts
    case 'packshot':
    case 'detail':
    default:
      return '1:1'; // Square for packshots and default
  }
}

/**
 * Convert File to base64 string for Gemini API
 */
export async function fileToBase64Gemini(file: File): Promise<{ data: string; mimeType: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64String = buffer.toString('base64');
    
    return {
      data: base64String,
      mimeType: file.type
    };
  } catch (error) {
    throw new Error(`Failed to convert file to base64: ${error}`);
  }
}

/**
 * Generate images using Gemini 2.5 Flash Image with multimodal support
 * Supports both text-to-image and image+text-to-image generation
 */
export async function generateImageWithGemini(
  request: GeminiImageGenerationRequest
): Promise<GeminiResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  try {
    // Validate reference images if provided
    if (request.referenceImages && request.referenceImages.length > 0) {
      console.log(`Processing ${request.referenceImages.length} reference images for Gemini API`);
      
      // Validate each image
      for (let i = 0; i < request.referenceImages.length; i++) {
        const img = request.referenceImages[i];
        if (!img.data || !img.mimeType) {
          throw new Error(`Invalid reference image ${i + 1}: missing data or mimeType`);
        }
        
        // Validate MIME type
        if (!img.mimeType.startsWith('image/')) {
          throw new Error(`Invalid reference image ${i + 1}: invalid MIME type ${img.mimeType}`);
        }
        
        // Check base64 data size (rough validation)
        const sizeKB = (img.data.length * 3) / 4 / 1024;
        console.log(`Reference image ${i + 1}: ${img.mimeType}, ~${Math.round(sizeKB)}KB`);
        
        if (sizeKB > 5120) { // 5MB limit
          console.warn(`Reference image ${i + 1} may be too large (${Math.round(sizeKB)}KB), this might cause API failures`);
        }
      }
    }

    // Build content array for multimodal support - Gemini expects a flat structure
    const contents: Array<string | { inlineData: { mimeType: string; data: string } }> = [];
    
    // Add reference images first if provided
    if (request.referenceImages && request.referenceImages.length > 0) {
      console.log(`Building multimodal content with ${request.referenceImages.length} reference images`);
      
      // Add all reference images with validation
      for (const refImage of request.referenceImages) {
        // Validate base64 data
        if (!refImage.data || typeof refImage.data !== 'string') {
          throw new Error('Invalid reference image data: data must be a base64 string');
        }
        
        if (!refImage.mimeType || !refImage.mimeType.startsWith('image/')) {
          throw new Error(`Invalid reference image MIME type: ${refImage.mimeType}`);
        }
        
        // Log image size for debugging
        console.log(`Adding reference image: ${refImage.mimeType}, data length: ${refImage.data.length}`);
        
        contents.push({
          inlineData: {
            data: refImage.data,
            mimeType: refImage.mimeType
          }
        });
      }
      
      // Add enhanced prompt that references the images
      const enhancedPrompt = `Use the provided reference images to understand the exact product appearance, style, materials, and details. Generate a new image that maintains the same product identity while applying this instruction: ${request.prompt}`;
      contents.push(enhancedPrompt);
    } else {
      // Text-only generation
      console.log('Building text-only content');
      contents.push(request.prompt);
    }

    console.log(`Making Gemini API request with ${contents.length} content items`);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents,
    });

    // Extract image data from response
    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      throw new Error('No content generated by Gemini');
    }

    let imageData: string | undefined;
    let textResponse: string | undefined;

    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        imageData = part.inlineData.data;
      }
      if (part.text) {
        textResponse = part.text;
      }
    }

    if (!imageData) {
      throw new Error('No image data generated by Gemini');
    }

    return {
      success: true,
      data: {
        imageData,
        analysisText: textResponse,
        candidates: response.candidates,
      },
      metadata: {
        model: "gemini-2.5-flash-image-preview",
        timestamp: new Date().toISOString(),
        usage: {
          totalTokens: response.usageMetadata?.totalTokenCount,
          promptTokens: response.usageMetadata?.promptTokenCount,
          completionTokens: response.usageMetadata?.candidatesTokenCount,
        }
      }
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    
    let errorMessage = 'Unknown Gemini API error';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
      metadata: {
        model: "gemini-2.5-flash-image-preview",
        timestamp: new Date().toISOString(),
      }
    };
  }
}

/**
 * Analyze images using Gemini 2.5 Pro (image analysis)
 */
export async function analyzeImageWithGemini(
  request: GeminiImageAnalysisRequest
): Promise<GeminiResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  try {
    // Detect image MIME type from base64 data
    let mimeType = 'image/jpeg'; // Default
    if (request.imageData.startsWith('data:')) {
      const match = request.imageData.match(/data:([^;]+);base64,/);
      if (match) {
        mimeType = match[1];
      }
    }

    // Clean base64 data
    const cleanBase64 = request.imageData.replace(/^data:[^;]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType
          }
        },
        request.prompt
      ],
    });

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      throw new Error('No analysis generated by Gemini');
    }

    const textResponse = candidate.content.parts
      .filter(part => part.text)
      .map(part => part.text)
      .join('');

    return {
      success: true,
      data: {
        analysisText: textResponse,
        candidates: response.candidates,
      },
      metadata: {
        model: "gemini-2.5-pro",
        timestamp: new Date().toISOString(),
        usage: {
          totalTokens: response.usageMetadata?.totalTokenCount,
          promptTokens: response.usageMetadata?.promptTokenCount,
          completionTokens: response.usageMetadata?.candidatesTokenCount,
        }
      }
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown Gemini API error',
      metadata: {
        model: "gemini-2.5-pro",
        timestamp: new Date().toISOString(),
      }
    };
  }
}


/**
 * Generate multiple images with Gemini API
 */
export async function generateMultipleImagesWithGemini(
  baseRequest: GeminiImageGenerationRequest,
  variations: number,
  contextPreset: ContextPreset
): Promise<GeminiGenerationResult[]> {
  const results: GeminiGenerationResult[] = [];
  
  for (let i = 0; i < variations; i++) {
    try {
      // Add variation to the prompt for different results
      const request = {
        ...baseRequest,
        prompt: `${baseRequest.prompt} (variation ${i + 1})`,
        seed: baseRequest.seed ? baseRequest.seed + i : Math.floor(Math.random() * 1000000),
      };

      const response = await generateImageWithGemini(request);
      
      if (response.success && response.data?.imageData) {
        const dataUrl = base64ToDataUrl(response.data.imageData, 'image/jpeg');
        results.push({
          url: dataUrl, // For frontend compatibility
          imageData: response.data.imageData,
          prompt: request.prompt,
          metadata: {
            model: 'gemini-2.5-flash-image-preview',
            timestamp: new Date().toISOString(),
            size: request.aspectRatio || '1:1',
            variation: i + 1,
            contextPreset,
            generationMethod: 'text-to-image',
            seed: request.seed,
          },
        });
      }
    } catch (error) {
      console.error(`Failed to generate variation ${i + 1}:`, error);
      // Continue with other variations
    }
  }

  return results;
}

/**
 * Edit images with Gemini (using both image and text input)
 */
export async function editImageWithGemini(
  imageData: string,
  prompt: string,
  contextPreset: ContextPreset
): Promise<GeminiGenerationResult | null> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  try {
    // Detect image MIME type
    let mimeType = 'image/jpeg';
    if (imageData.startsWith('data:')) {
      const match = imageData.match(/data:([^;]+);base64,/);
      if (match) {
        mimeType = match[1];
      }
    }

    // Clean base64 data
    const cleanBase64 = imageData.replace(/^data:[^;]+;base64,/, '');

    // For editing, we use Gemini 2.5 Flash Image with both image and text
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType
          }
        },
        `Based on this image, ${prompt}`
      ],
    });

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      throw new Error('No content generated by Gemini for image editing');
    }

    let generatedImageData: string | undefined;
    
    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        generatedImageData = part.inlineData.data;
        break;
      }
    }

    if (!generatedImageData) {
      throw new Error('No image data generated by Gemini for editing');
    }

    const dataUrl = base64ToDataUrl(generatedImageData, 'image/jpeg');
    return {
      url: dataUrl, // For frontend compatibility
      imageData: generatedImageData,
      prompt: prompt,
      metadata: {
        model: 'gemini-2.5-flash-image-preview',
        timestamp: new Date().toISOString(),
        size: getGeminiAspectRatio(contextPreset),
        variation: 1,
        contextPreset,
        generationMethod: 'image-editing',
      },
    };
  } catch (error) {
    console.error('Failed to edit image with Gemini:', error);
    return null;
  }
}

/**
 * Edit multiple images with Gemini API
 */
export async function editMultipleImagesWithGemini(
  imageData: string,
  basePrompt: string,
  variations: number,
  contextPreset: ContextPreset
): Promise<GeminiGenerationResult[]> {
  const results: GeminiGenerationResult[] = [];
  
  for (let i = 0; i < variations; i++) {
    try {
      // Add variation to the prompt
      const prompt = `${basePrompt} (variation ${i + 1} with different style or perspective)`;
      
      const result = await editImageWithGemini(imageData, prompt, contextPreset);
      
      if (result) {
        results.push({
          ...result,
          metadata: {
            ...result.metadata,
            variation: i + 1,
          },
        });
      }
    } catch (error) {
      console.error(`Failed to edit variation ${i + 1}:`, error);
      // Continue with other variations
    }
  }

  return results;
}

/**
 * Convert base64 image data to a data URL for frontend consumption
 */
export function base64ToDataUrl(base64Data: string, mimeType: string = 'image/jpeg'): string {
  if (base64Data.startsWith('data:')) {
    return base64Data;
  }
  return `data:${mimeType};base64,${base64Data}`;
}

/**
 * Save base64 image data to a temporary buffer (for further processing)
 */
export function base64ToBuffer(base64Data: string): Buffer {
  const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
  return Buffer.from(cleanBase64, 'base64');
}

/**
 * Process multiple reference images for multimodal generation
 */
export async function processReferenceImages(
  imageFiles: File[]
): Promise<Array<{ data: string; mimeType: string }>> {
  if (!imageFiles || imageFiles.length === 0) {
    console.warn('No image files provided to processReferenceImages');
    return [];
  }

  console.log(`Processing ${imageFiles.length} reference images...`);
  const processedImages = [];
  const errors = [];
  
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    try {
      // Validate file object
      if (!file || !file.name || !file.type || !file.size) {
        throw new Error(`Invalid file object at index ${i}`);
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error(`File ${file.name} is not an image (type: ${file.type})`);
      }
      
      // Validate file size (max 10MB for processing)
      const maxSizeBytes = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSizeBytes) {
        throw new Error(`File ${file.name} is too large (${Math.round(file.size / 1024 / 1024)}MB), max size is 10MB`);
      }
      
      console.log(`Processing image ${i + 1}/${imageFiles.length}: ${file.name} (${file.type}, ${Math.round(file.size / 1024)}KB)`);
      
      const { data, mimeType } = await fileToBase64Gemini(file);
      
      // Additional validation of processed data
      if (!data || data.length === 0) {
        throw new Error(`Failed to extract base64 data from ${file.name}`);
      }
      
      // Validate base64 encoding
      try {
        atob(data.substring(0, 100)); // Test decode a small portion
      } catch {
        throw new Error(`Invalid base64 encoding for ${file.name}`);
      }
      
      processedImages.push({ 
        data, 
        mimeType
      });
      
      console.log(`Successfully processed ${file.name}`);
    } catch (error) {
      const errorMsg = `Failed to process reference image ${file?.name || `at index ${i}`}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      errors.push(errorMsg);
      // Continue with other images instead of failing completely
    }
  }
  
  if (processedImages.length === 0 && imageFiles.length > 0) {
    throw new Error(`Failed to process any reference images. Errors: ${errors.join('; ')}`);
  }
  
  if (errors.length > 0) {
    console.warn(`Processed ${processedImages.length}/${imageFiles.length} images successfully. Errors occurred: ${errors.join('; ')}`);
  } else {
    console.log(`Successfully processed all ${processedImages.length} reference images`);
  }
  
  return processedImages;
}

/**
 * Optimize reference images for Gemini API
 * Reduces file size while maintaining quality for product details
 */
export function optimizeReferenceImages(
  images: Array<{ data: string; mimeType: string }>,
  maxSizeKB: number = 2048
): Array<{ data: string; mimeType: string }> {
  return images.map(image => {
    const sizeKB = (image.data.length * 3) / 4 / 1024; // Rough base64 to bytes conversion
    
    if (sizeKB <= maxSizeKB) {
      return image;
    }
    
    // For now, return as-is. In production, you might want to implement
    // client-side image compression or server-side optimization
    console.warn(`Reference image size (${Math.round(sizeKB)}KB) exceeds recommended limit (${maxSizeKB}KB)`);
    return image;
  });
}

/**
 * Generate images with reference image support
 */
export async function generateImageWithReferences(
  prompt: string,
  referenceImages: Array<{ data: string; mimeType: string }>,
  contextPreset: ContextPreset,
  aspectRatio?: string
): Promise<GeminiResponse> {
  const optimizedImages = optimizeReferenceImages(referenceImages);
  
  const request: GeminiImageGenerationRequest = {
    prompt,
    aspectRatio: aspectRatio || getGeminiAspectRatio(contextPreset),
    referenceImages: optimizedImages,
  };
  
  return generateImageWithGemini(request);
}

/**
 * Generate multiple variations with reference images
 */
export async function generateMultipleImagesWithReferences(
  basePrompt: string,
  referenceImages: Array<{ data: string; mimeType: string }>,
  variations: number,
  contextPreset: ContextPreset
): Promise<GeminiGenerationResult[]> {
  const results: GeminiGenerationResult[] = [];
  const optimizedImages = optimizeReferenceImages(referenceImages);
  
  for (let i = 0; i < variations; i++) {
    try {
      const request: GeminiImageGenerationRequest = {
        prompt: `${basePrompt} (variation ${i + 1})`,
        aspectRatio: getGeminiAspectRatio(contextPreset),
        referenceImages: optimizedImages,
        seed: Math.floor(Math.random() * 1000000) + i,
      };

      const response = await generateImageWithGemini(request);
      
      if (response.success && response.data?.imageData) {
        const dataUrl = base64ToDataUrl(response.data.imageData, 'image/jpeg');
        results.push({
          url: dataUrl,
          imageData: response.data.imageData,
          prompt: request.prompt,
          metadata: {
            model: 'gemini-2.5-flash-image-preview',
            timestamp: new Date().toISOString(),
            size: request.aspectRatio || '1:1',
            variation: i + 1,
            contextPreset,
            generationMethod: 'text-to-image',
            seed: request.seed,
          },
        });
      }
    } catch (error) {
      console.error(`Failed to generate variation ${i + 1} with references:`, error);
      // Continue with other variations
    }
  }

  return results;
}

/**
 * Asset type transformation prompts for professional marketing assets
 */
export function getAssetTransformationPrompt(assetType: AssetType, productName: string): string {
  const basePrompts = {
    lifestyle: `Transform this ${productName} into a stunning lifestyle scene. Place the product naturally in a modern, sophisticated real-world environment such as a beautifully designed living room, bedroom, kitchen, or office space. Include complementary furniture, decor, and proper lighting that enhances the product's appeal. The scene should feel authentic, inviting, and aspirational, showing potential customers how the product fits perfectly into their desired lifestyle. Use professional interior design principles with attention to color harmony, spatial composition, and ambient lighting.`,
    
    ad: `Create a high-impact advertising image for this ${productName}. Apply commercial photography techniques with dramatic, professional lighting that makes the product the clear hero of the composition. Use sophisticated styling, perfect product placement, and visual elements that communicate premium quality and desirability. The image should have the polished, attention-grabbing quality suitable for marketing campaigns, print ads, or digital advertising. Focus on creating emotional appeal while maintaining commercial viability.`,
    
    social: `Transform this ${productName} into an engaging social media image perfect for Instagram, Facebook, or Pinterest. Apply trendy, contemporary styling with vibrant but tasteful colors, modern composition, and elements that encourage social sharing. Include lifestyle context that resonates with target demographics while maintaining the product as the focal point. The aesthetic should be current, photogenic, and optimized for mobile viewing with high engagement potential.`,
    
    hero: `Create a premium hero banner image for this ${productName} suitable for website headers and landing pages. Design with professional composition that leaves strategic white space for text overlay while making the product the dominant visual element. Apply sophisticated lighting, clean backgrounds, and brand-appropriate styling. The image should communicate quality, trustworthiness, and premium positioning while maintaining visual impact at various screen sizes.`,
    
    variation: `Generate an appealing variation of this ${productName} by modifying its color, material, finish, or texture while maintaining the same style, composition, and product integrity. Explore different colorways such as natural wood tones, metallic finishes, fabric textures, or contemporary color palettes that would appeal to different customer preferences. Ensure the variation looks authentic and professionally rendered while clearly showing the alternative design option.`
  };

  return basePrompts[assetType];
}

/**
 * Edit a single image to create a specific asset type
 */
export async function editImageToAssetType(
  imageData: string,
  assetType: AssetType,
  productName: string,
  customPrompt?: string,
  contextPreset?: ContextPreset
): Promise<GeminiGenerationResult | null> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  try {
    // Use custom prompt if provided, otherwise use the asset type prompt
    const prompt = customPrompt || getAssetTransformationPrompt(assetType, productName);
    
    // Detect image MIME type
    let mimeType = 'image/jpeg';
    if (imageData.startsWith('data:')) {
      const match = imageData.match(/data:([^;]+);base64,/);
      if (match) {
        mimeType = match[1];
      }
    }

    // Clean base64 data
    const cleanBase64 = imageData.replace(/^data:[^;]+;base64,/, '');

    console.log(`Editing image to ${assetType} asset type for ${productName}`);

    // Use Gemini 2.5 Flash Image for editing with both image and text
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType
          }
        },
        `Based on this product image, ${prompt}. Maintain the product's original identity, quality, and key features while applying the transformation. The result should look professional and commercially viable.`
      ],
    });

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      throw new Error('No content generated by Gemini for asset transformation');
    }

    let generatedImageData: string | undefined;
    
    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        generatedImageData = part.inlineData.data;
        break;
      }
    }

    if (!generatedImageData) {
      throw new Error('No image data generated by Gemini for asset transformation');
    }

    const dataUrl = base64ToDataUrl(generatedImageData, 'image/jpeg');
    
    // Determine the appropriate context preset based on asset type
    const finalContextPreset = contextPreset || getContextPresetForAssetType(assetType);
    
    return {
      url: dataUrl,
      imageData: generatedImageData,
      prompt: prompt,
      metadata: {
        model: 'gemini-2.5-flash-image-preview',
        timestamp: new Date().toISOString(),
        size: getGeminiAspectRatio(finalContextPreset),
        variation: 1,
        contextPreset: finalContextPreset,
        generationMethod: 'image-editing',
      },
    };
  } catch (error) {
    console.error('Failed to edit image to asset type:', error);
    return null;
  }
}

/**
 * Generate multiple variations for an asset type
 */
export async function editImageToMultipleAssetVariations(
  imageData: string,
  assetType: AssetType,
  productName: string,
  variations: number,
  customPrompt?: string,
  contextPreset?: ContextPreset
): Promise<GeminiGenerationResult[]> {
  const results: GeminiGenerationResult[] = [];
  
  for (let i = 0; i < variations; i++) {
    try {
      // Add variation instruction to the prompt
      const basePrompt = customPrompt || getAssetTransformationPrompt(assetType, productName);
      const variationPrompt = `${basePrompt} (Create variation ${i + 1} with a different style, perspective, or approach while maintaining the ${assetType} theme)`;
      
      const result = await editImageToAssetType(imageData, assetType, productName, variationPrompt, contextPreset);
      
      if (result) {
        results.push({
          ...result,
          metadata: {
            ...result.metadata,
            variation: i + 1,
          },
        });
      }
    } catch (error) {
      console.error(`Failed to generate ${assetType} variation ${i + 1}:`, error);
      // Continue with other variations
    }
  }

  return results;
}

/**
 * Get appropriate context preset for asset type
 */
function getContextPresetForAssetType(assetType: AssetType): ContextPreset {
  const assetToContextMap: Record<AssetType, ContextPreset> = {
    lifestyle: 'lifestyle',
    ad: 'hero', 
    social: 'instagram',
    hero: 'hero',
    variation: 'packshot',
  };
  
  return assetToContextMap[assetType];
}

/**
 * Batch edit multiple images to different asset types
 */
export async function batchEditImages(
  editingRequests: Array<{
    imageData: string;
    assetType: AssetType;
    productName: string;
    variations: number;
    customPrompt?: string;
  }>
): Promise<Array<{ assetType: AssetType; results: GeminiGenerationResult[] }>> {
  const batchResults = [];
  
  for (const request of editingRequests) {
    try {
      console.log(`Processing batch edit for ${request.assetType} with ${request.variations} variations`);
      
      const results = await editImageToMultipleAssetVariations(
        request.imageData,
        request.assetType,
        request.productName,
        request.variations,
        request.customPrompt
      );
      
      batchResults.push({
        assetType: request.assetType,
        results
      });
    } catch (error) {
      console.error(`Failed to process batch edit for ${request.assetType}:`, error);
      // Continue with other requests
      batchResults.push({
        assetType: request.assetType,
        results: []
      });
    }
  }
  
  return batchResults;
}