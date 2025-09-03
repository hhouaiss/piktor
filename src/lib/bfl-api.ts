/**
 * Black Forest Labs API Service
 * Provides integration with FLUX Kontext Pro for image generation and editing
 */

import { ContextPreset } from '@/components/image-generator/types';

// BFL API Configuration
const BFL_API_BASE = 'https://api.bfl.ai/v1';
const BFL_API_KEY = process.env.BFL_API_KEY;

if (!BFL_API_KEY) {
  console.warn('BFL_API_KEY not found in environment variables');
}

// Types for BFL API
export interface BFLImageGenerationRequest {
  prompt: string;
  aspect_ratio?: string;
  seed?: number;
  prompt_upsampling?: boolean;
  safety_tolerance?: number;
  output_format?: 'jpeg' | 'png';
  webhook_url?: string;
  webhook_secret?: string;
}

export interface BFLImageEditingRequest extends BFLImageGenerationRequest {
  input_image: string; // Base64 encoded image
  input_image_2?: string;
  input_image_3?: string;
  input_image_4?: string;
}

export interface BFLResponse {
  id: string;
  status: 'Pending' | 'Ready' | 'Error' | 'Failed';
  polling_url?: string; // URL for polling the result
  result?: {
    sample: string; // URL to generated image
  };
  error?: string;
}

export interface BFLGenerationResult {
  url: string;
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
 * Convert context preset to appropriate aspect ratio for BFL API
 */
export function getAspectRatio(contextPreset: ContextPreset): string {
  switch (contextPreset) {
    case 'story':
      return '2:3'; // Vertical for stories
    case 'hero':
    case 'lifestyle':
      return '3:2'; // Horizontal for banners
    case 'packshot':
    case 'instagram':
    case 'detail':
    default:
      return '1:1'; // Square for social media
  }
}

/**
 * Convert File to base64 string for BFL API (Node.js compatible)
 */
export async function fileToBase64(file: File): Promise<string> {
  try {
    // Convert File to ArrayBuffer, then to Buffer, then to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64String = buffer.toString('base64');
    
    // Return as data URL format required by BFL API
    return `data:${file.type};base64,${base64String}`;
  } catch (error) {
    throw new Error(`Failed to convert file to base64: ${error}`);
  }
}

/**
 * Generate images using FLUX Kontext Pro (text-to-image)
 */
export async function generateImageWithBFL(
  request: BFLImageGenerationRequest
): Promise<BFLResponse> {
  if (!BFL_API_KEY) {
    throw new Error('BFL_API_KEY not configured');
  }

  const response = await fetch(`${BFL_API_BASE}/flux-kontext-pro`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-key': BFL_API_KEY,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`BFL API error: ${response.status} - ${errorData}`);
  }

  return response.json();
}

/**
 * Edit images using FLUX Kontext Pro (image-to-image)
 */
export async function editImageWithBFL(
  request: BFLImageEditingRequest
): Promise<BFLResponse> {
  if (!BFL_API_KEY) {
    throw new Error('BFL_API_KEY not configured');
  }

  const response = await fetch(`${BFL_API_BASE}/flux-kontext-pro`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-key': BFL_API_KEY,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`BFL API error: ${response.status} - ${errorData}`);
  }

  return response.json();
}

/**
 * Poll for BFL generation result using the polling URL from the initial response
 */
export async function pollBFLResult(
  pollingUrl: string,
  maxAttempts: number = 30,
  intervalMs: number = 2000
): Promise<BFLResponse> {
  if (!BFL_API_KEY) {
    throw new Error('BFL_API_KEY not configured');
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(pollingUrl, {
      headers: {
        'accept': 'application/json',
        'x-key': BFL_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to poll BFL result: ${response.status}`);
    }

    const result: BFLResponse = await response.json();

    if (result.status === 'Ready') {
      return result;
    }

    if (result.status === 'Error' || result.status === 'Failed') {
      throw new Error(`BFL generation failed: ${result.error || 'Unknown error'}`);
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error('BFL generation timed out');
}

/**
 * Generate multiple images with BFL API
 */
export async function generateMultipleImagesWithBFL(
  baseRequest: BFLImageGenerationRequest,
  variations: number,
  contextPreset: ContextPreset
): Promise<BFLGenerationResult[]> {
  const results: BFLGenerationResult[] = [];
  
  for (let i = 0; i < variations; i++) {
    try {
      // Add some variation to the seed for different results
      const request = {
        ...baseRequest,
        seed: baseRequest.seed ? baseRequest.seed + i : Math.floor(Math.random() * 1000000),
      };

      // Start generation
      const response = await generateImageWithBFL(request);
      
      // Poll for result using the polling URL
      if (!response.polling_url) {
        throw new Error('No polling URL returned from BFL API');
      }
      const finalResult = await pollBFLResult(response.polling_url);
      
      if (finalResult.result?.sample) {
        results.push({
          url: finalResult.result.sample,
          prompt: request.prompt,
          metadata: {
            model: 'flux-kontext-pro',
            timestamp: new Date().toISOString(),
            size: request.aspect_ratio || '1:1',
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
 * Edit multiple images with BFL API
 */
export async function editMultipleImagesWithBFL(
  baseRequest: BFLImageEditingRequest,
  variations: number,
  contextPreset: ContextPreset
): Promise<BFLGenerationResult[]> {
  const results: BFLGenerationResult[] = [];
  
  for (let i = 0; i < variations; i++) {
    try {
      // Add some variation to the seed for different results
      const request = {
        ...baseRequest,
        seed: baseRequest.seed ? baseRequest.seed + i : Math.floor(Math.random() * 1000000),
      };

      // Start editing
      const response = await editImageWithBFL(request);
      
      // Poll for result using the polling URL
      if (!response.polling_url) {
        throw new Error('No polling URL returned from BFL API');
      }
      const finalResult = await pollBFLResult(response.polling_url);
      
      if (finalResult.result?.sample) {
        results.push({
          url: finalResult.result.sample,
          prompt: request.prompt,
          metadata: {
            model: 'flux-kontext-pro',
            timestamp: new Date().toISOString(),
            size: request.aspect_ratio || '1:1',
            variation: i + 1,
            contextPreset,
            generationMethod: 'image-editing',
            seed: request.seed,
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