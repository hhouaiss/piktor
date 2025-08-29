import { NextRequest, NextResponse } from "next/server";
import { AssetType, EditedImage } from "@/components/image-generator/types";
import { 
  editImageToAssetType, 
  editImageToMultipleAssetVariations,
  batchEditImages
} from "@/lib/gemini-api";

interface EditImageRequest {
  sourceImageUrl: string;
  sourceImageId: string;
  productName: string;
  assetType: AssetType;
  variations?: number;
  customPrompt?: string;
}

interface BatchEditRequest {
  sourceImageUrl: string;
  sourceImageId: string;
  productName: string;
  requests: Array<{
    assetType: AssetType;
    variations: number;
    customPrompt?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        error: "Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file" 
      }, { status: 500 });
    }

    const body = await request.json();
    const { mode = 'single' } = body;

    if (mode === 'single') {
      return await handleSingleEdit(body);
    } else if (mode === 'batch') {
      return await handleBatchEdit(body);
    } else {
      return NextResponse.json({ 
        error: "Invalid mode. Must be 'single' or 'batch'" 
      }, { status: 400 });
    }

  } catch (error) {
    console.error("Image editing error:", error);
    
    let userError = "Unknown error occurred during image editing";
    const statusCode = 500;
    
    if (error instanceof Error) {
      userError = error.message;
    }
    
    return NextResponse.json({
      error: userError,
      approach: "gemini-2.5-flash-image-editing"
    }, { status: statusCode });
  }
}

async function handleSingleEdit(body: EditImageRequest) {
  const { sourceImageUrl, sourceImageId, productName, assetType, variations = 1, customPrompt } = body;

  // Validate required fields
  if (!sourceImageUrl || !sourceImageId || !productName || !assetType) {
    return NextResponse.json({ 
      error: "Missing required fields: sourceImageUrl, sourceImageId, productName, assetType" 
    }, { status: 400 });
  }

  // Validate asset type
  const validAssetTypes: AssetType[] = ['lifestyle', 'ad', 'social', 'hero', 'variation'];
  if (!validAssetTypes.includes(assetType)) {
    return NextResponse.json({ 
      error: `Invalid asset type. Must be one of: ${validAssetTypes.join(', ')}` 
    }, { status: 400 });
  }

  // Validate variations count
  const maxVariations = 4;
  const variationCount = Math.min(Math.max(variations, 1), maxVariations);

  console.log(`Processing single edit request:`);
  console.log(`- Source Image: ${sourceImageId}`);
  console.log(`- Product: ${productName}`);
  console.log(`- Asset Type: ${assetType}`);
  console.log(`- Variations: ${variationCount}`);
  console.log(`- Custom Prompt: ${customPrompt ? 'Yes' : 'No'}`);

  try {
    let results;

    if (variationCount === 1) {
      // Single variation
      const result = await editImageToAssetType(
        sourceImageUrl,
        assetType,
        productName,
        customPrompt
      );

      if (!result) {
        throw new Error('Failed to generate edited image');
      }

      results = [result];
    } else {
      // Multiple variations
      results = await editImageToMultipleAssetVariations(
        sourceImageUrl,
        assetType,
        productName,
        variationCount,
        customPrompt
      );

      if (results.length === 0) {
        throw new Error('Failed to generate any edited variations');
      }
    }

    // Transform results to match the EditedImage interface
    const editedImages = results.map((result, index) => ({
      id: `edited_${sourceImageId}_${assetType}_${index + 1}_${Date.now()}`,
      sourceImageId,
      url: result.url || '',
      assetType,
      prompt: result.prompt,
      metadata: {
        model: result.metadata.model,
        timestamp: result.metadata.timestamp,
        size: result.metadata.size,
        variation: result.metadata.variation || (index + 1),
        editingMethod: 'image-to-image' as const,
      }
    }));

    const response = {
      success: true,
      sourceImageId,
      assetType,
      editedImages,
      editingDetails: {
        productName,
        assetType,
        variationsGenerated: editedImages.length,
        variationsRequested: variationCount,
        model: 'gemini-2.5-flash-image-preview',
        editingMethod: 'image-to-image',
        customPromptUsed: !!customPrompt,
        processingTime: Date.now(), // Simplified timestamp
      }
    };

    console.log(`Single edit completed: generated ${editedImages.length} ${assetType} variations`);
    return NextResponse.json({ result: response });

  } catch (error) {
    console.error(`Single edit failed:`, error);
    throw error;
  }
}

async function handleBatchEdit(body: BatchEditRequest) {
  const { sourceImageUrl, sourceImageId, productName, requests } = body;

  // Validate required fields
  if (!sourceImageUrl || !sourceImageId || !productName || !requests || !Array.isArray(requests)) {
    return NextResponse.json({ 
      error: "Missing required fields: sourceImageUrl, sourceImageId, productName, requests (array)" 
    }, { status: 400 });
  }

  if (requests.length === 0) {
    return NextResponse.json({ 
      error: "At least one editing request is required" 
    }, { status: 400 });
  }

  // Validate and prepare batch requests
  const validAssetTypes: AssetType[] = ['lifestyle', 'ad', 'social', 'hero', 'variation'];
  const maxVariations = 4;
  
  const batchRequests = requests.map(req => {
    if (!validAssetTypes.includes(req.assetType)) {
      throw new Error(`Invalid asset type: ${req.assetType}. Must be one of: ${validAssetTypes.join(', ')}`);
    }

    return {
      imageData: sourceImageUrl,
      assetType: req.assetType,
      productName,
      variations: Math.min(Math.max(req.variations || 1, 1), maxVariations),
      customPrompt: req.customPrompt,
    };
  });

  console.log(`Processing batch edit request:`);
  console.log(`- Source Image: ${sourceImageId}`);
  console.log(`- Product: ${productName}`);
  console.log(`- Asset Types: ${batchRequests.map(r => r.assetType).join(', ')}`);
  console.log(`- Total Variations: ${batchRequests.reduce((sum, r) => sum + r.variations, 0)}`);

  try {
    const batchResults = await batchEditImages(batchRequests);

    // Transform results to match our interface
    const allEditedImages: Record<AssetType, EditedImage[]> = {} as Record<AssetType, EditedImage[]>;
    let totalGenerated = 0;
    let totalRequested = 0;

    for (const batchResult of batchResults) {
      const { assetType, results } = batchResult;
      
      const editedImages = results.map((result, index) => ({
        id: `edited_${sourceImageId}_${assetType}_${index + 1}_${Date.now()}`,
        sourceImageId,
        url: result.url || '',
        assetType,
        prompt: result.prompt,
        metadata: {
          model: result.metadata.model,
          timestamp: result.metadata.timestamp,
          size: result.metadata.size,
          variation: result.metadata.variation || (index + 1),
          editingMethod: 'image-to-image' as const,
        }
      }));

      allEditedImages[assetType] = editedImages;
      totalGenerated += editedImages.length;
      
      // Find requested count for this asset type
      const originalRequest = batchRequests.find(r => r.assetType === assetType);
      totalRequested += originalRequest?.variations || 0;
    }

    const response = {
      success: true,
      sourceImageId,
      editedImagesByAssetType: allEditedImages,
      batchDetails: {
        productName,
        assetTypesProcessed: batchResults.map(r => r.assetType),
        totalVariationsGenerated: totalGenerated,
        totalVariationsRequested: totalRequested,
        model: 'gemini-2.5-flash-image-preview',
        editingMethod: 'batch-image-to-image',
        processingTime: Date.now(), // Simplified timestamp
      }
    };

    console.log(`Batch edit completed: generated ${totalGenerated} variations across ${batchResults.length} asset types`);
    return NextResponse.json({ result: response });

  } catch (error) {
    console.error(`Batch edit failed:`, error);
    throw error;
  }
}