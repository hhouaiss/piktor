import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { buildOptimizedPrompt } from "@/lib/prompt-builder";
import { ProductConfiguration } from "@/components/image-generator/types";
import { 
  editMultipleImagesWithBFL,
  getAspectRatio, 
  fileToBase64
} from "@/lib/bfl-api";

// Helper function to create a proper File object from Buffer (legacy function, no longer needed for BFL API)
function createFileFromBuffer(buffer: Buffer, filename: string, contentType: string): File {
  try {
    // Create a Blob first
    const blob = new Blob([buffer], { type: contentType });
    
    // Create a proper File object (legacy function)
    const file = new File([blob], filename, { 
      type: contentType,
      lastModified: Date.now()
    });
    
    console.log('Created File using File constructor');
    return file;
  } catch (error) {
    console.error('Error creating File/Blob:', error);
    
    // If File constructor is not available, create a minimal File-like object
    // that satisfies OpenAI's requirements
    const fileWrapper = new Blob([buffer], { type: contentType }) as Blob & {
      name: string;
      lastModified: number;
      webkitRelativePath: string;
    };
    fileWrapper.name = filename;
    fileWrapper.lastModified = Date.now();
    fileWrapper.webkitRelativePath = '';
    
    console.log('Created File-like object using Blob');
    return fileWrapper as File;
  }
}

// Helper function to convert any image format to PNG with RGBA (legacy function, no longer needed for BFL API)
async function convertImageToPNG(imageBuffer: Buffer, originalMimeType: string): Promise<{ buffer: Buffer; mimeType: string }> {
  try {
    console.log(`Processing image from ${originalMimeType} to PNG format`);
    
    // Get image metadata to check current format
    const metadata = await sharp(imageBuffer).metadata();
    console.log('Image metadata:', {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      channels: metadata.channels,
      hasAlpha: metadata.hasAlpha,
      density: metadata.density
    });

    // Always process through Sharp to ensure proper format
    // Converting to RGBA format for compatibility
    let sharpInstance = sharp(imageBuffer);

    // Ensure we have the right number of channels
    // For images.edit, we need RGBA (4 channels) or LA (2 channels) or L (1 channel)
    if (metadata.channels === 3) {
      // RGB -> RGBA (add alpha channel)
      console.log('Converting RGB to RGBA by adding alpha channel');
      sharpInstance = sharpInstance.ensureAlpha();
    } else if (metadata.channels === 1) {
      // Grayscale (L) is acceptable as-is
      console.log('Grayscale image detected, keeping as L format');
    } else if (metadata.channels === 2) {
      // LA (grayscale + alpha) is acceptable as-is
      console.log('Grayscale + Alpha image detected, keeping as LA format');
    } else if (metadata.channels === 4) {
      // RGBA is already correct
      console.log('RGBA image detected, format is correct');
    } else {
      // Unexpected number of channels, convert to RGBA
      console.log(`Unexpected channel count (${metadata.channels}), converting to RGBA`);
      sharpInstance = sharpInstance.ensureAlpha();
    }
    
    // Convert to PNG with proper settings
    const convertedBuffer = await sharpInstance
      .png({
        // Use high quality settings
        quality: 100,
        compressionLevel: 6,
        // Preserve transparency and ensure proper format
        progressive: false,
        force: true,
        // Ensure we maintain proper color depth
        palette: false
      })
      .toBuffer();

    // Verify the converted image format
    const convertedMetadata = await sharp(convertedBuffer).metadata();
    console.log('Converted image metadata:', {
      format: convertedMetadata.format,
      width: convertedMetadata.width,
      height: convertedMetadata.height,
      channels: convertedMetadata.channels,
      hasAlpha: convertedMetadata.hasAlpha
    });

    // Validate the conversion result
    if (convertedMetadata.channels !== 1 && convertedMetadata.channels !== 2 && convertedMetadata.channels !== 4) {
      throw new Error(`Image conversion failed: resulted in ${convertedMetadata.channels} channels, expected 1 (L), 2 (LA), or 4 (RGBA) channels`);
    }

    console.log(`Successfully converted ${originalMimeType} to PNG. Original size: ${imageBuffer.length} bytes, Converted size: ${convertedBuffer.length} bytes`);
    
    return { 
      buffer: convertedBuffer, 
      mimeType: 'image/png' 
    };

  } catch (error) {
    console.error('Error converting image to PNG:', error);
    throw new Error(`Failed to convert image from ${originalMimeType} to PNG: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


export async function POST(request: NextRequest) {
  try {
    if (!process.env.BFL_API_KEY) {
      return NextResponse.json({ 
        error: "BFL API key not configured. Please add BFL_API_KEY to your .env.local file" 
      }, { status: 500 });
    }

    const formData = await request.formData();
    
    // Get product configuration
    const configStr = formData.get("configuration") as string;
    if (!configStr) {
      return NextResponse.json({ error: "No product configuration provided" }, { status: 400 });
    }

    let productConfig: ProductConfiguration;
    try {
      productConfig = JSON.parse(configStr);
    } catch {
      return NextResponse.json({ error: "Invalid configuration JSON" }, { status: 400 });
    }

    // Get primary reference image
    const primaryImageFile = formData.get("primaryImage");
    if (!primaryImageFile) {
      return NextResponse.json({ error: "No primary reference image provided" }, { status: 400 });
    }

    // Debug: Log what we received
    console.log('Primary image type:', typeof primaryImageFile);
    console.log('Primary image instanceof File:', primaryImageFile instanceof File);
    console.log('Primary image constructor:', primaryImageFile.constructor.name);

    // Handle both File objects and other types
    let imageBuffer: Buffer;
    let fileName: string = "primary-image";
    let fileType: string = "image/png";
    let fileSize: number = 0;

    if (primaryImageFile instanceof File) {
      // Proper File object
      console.log('Processing as File object');
      fileName = primaryImageFile.name;
      fileType = primaryImageFile.type;
      fileSize = primaryImageFile.size;

      // Validate file type - accept common image formats that we can convert to PNG
      const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff'];
      if (!fileType.startsWith('image/')) {
        return NextResponse.json({ 
          error: "Primary image must be a valid image file",
          receivedType: fileType,
          supportedTypes: supportedTypes
        }, { status: 400 });
      }

      // Validate file size (max 4MB for compatibility)
      if (fileSize > 4 * 1024 * 1024) {
        return NextResponse.json({ error: "Primary image must be smaller than 4MB" }, { status: 400 });
      }

      imageBuffer = Buffer.from(await primaryImageFile.arrayBuffer());
    } else if (typeof primaryImageFile === 'object' && 'arrayBuffer' in primaryImageFile) {
      // File-like object (likely our UploadedImage)
      console.log('Processing as File-like object');
      const fileObj = primaryImageFile as { name?: string; type?: string; size?: number; arrayBuffer: () => Promise<ArrayBuffer> };
      fileName = fileObj.name || "primary-image";
      fileType = fileObj.type || "image/png";
      fileSize = fileObj.size || 0;

      // Validate file type - accept common image formats that we can convert to PNG
      const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff'];
      if (!fileType.startsWith('image/')) {
        return NextResponse.json({ 
          error: "Primary image must be a valid image file",
          receivedType: fileType,
          supportedTypes: supportedTypes
        }, { status: 400 });
      }

      // Validate file size (max 4MB for compatibility)
      if (fileSize > 4 * 1024 * 1024) {
        return NextResponse.json({ error: "Primary image must be smaller than 4MB" }, { status: 400 });
      }

      imageBuffer = Buffer.from(await fileObj.arrayBuffer());
    } else {
      return NextResponse.json({ 
        error: "Invalid primary image format. Expected File object but received: " + typeof primaryImageFile,
        details: `Received type: ${typeof primaryImageFile}, constructor: ${primaryImageFile?.constructor?.name || 'unknown'}`
      }, { status: 400 });
    }

    // Convert image to PNG format if needed for compatibility
    try {
      console.log(`Original image format: ${fileType}, size: ${imageBuffer.length} bytes`);
      
      const convertedImage = await convertImageToPNG(imageBuffer, fileType);
      imageBuffer = convertedImage.buffer;
      const originalFileType = fileType;
      fileType = convertedImage.mimeType;
      
      // Update filename to reflect PNG format if conversion happened
      if (!fileName.toLowerCase().endsWith('.png') && convertedImage.mimeType === 'image/png') {
        const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
        fileName = `${nameWithoutExt}.png`;
      }
      
      console.log(`Image conversion complete - Original: ${originalFileType}, Final: ${fileType}`);
      console.log(`Final image for processing: ${fileName} (${fileType}, ${imageBuffer.length} bytes)`);
      
      // Additional validation after conversion
      if (imageBuffer.length === 0) {
        throw new Error('Converted image buffer is empty');
      }
      
      // Check converted size doesn't exceed limit
      if (imageBuffer.length > 4 * 1024 * 1024) {
        return NextResponse.json({ 
          error: "Converted image is too large (max 4MB)",
          convertedSize: imageBuffer.length,
          originalType: originalFileType
        }, { status: 400 });
      }
      
    } catch (conversionError) {
      console.error('Image conversion failed:', conversionError);
      
      // Provide specific error messages for common issues
      let userFriendlyError = 'Unable to process the uploaded image';
      let detailedReason = 'Unknown conversion error';
      
      if (conversionError instanceof Error) {
        detailedReason = conversionError.message;
        
        // Check for specific error patterns
        if (conversionError.message.includes('channels')) {
          userFriendlyError = 'Image format incompatible with API';
          detailedReason = 'The image uses an unsupported color format. API requires images in RGBA, LA, or L format.';
        } else if (conversionError.message.includes('Input file contains unsupported image format')) {
          userFriendlyError = 'Unsupported image format';
          detailedReason = 'The uploaded file is not a valid image or uses an unsupported format.';
        } else if (conversionError.message.includes('Input buffer contains unsupported image format')) {
          userFriendlyError = 'Corrupted or invalid image file';
          detailedReason = 'The image file appears to be corrupted or incomplete.';
        }
      }
      
      return NextResponse.json({ 
        error: userFriendlyError,
        originalFileType: fileType,
        fileName: fileName,
        details: detailedReason,
        supportedFormats: ['PNG (RGBA/LA/L)', 'JPEG (will be converted to RGBA)', 'WebP (will be converted to RGBA)', 'GIF (will be converted to RGBA)'],
        troubleshooting: 'Try saving your image in PNG format with transparency, or use a different image file.'
      }, { status: 400 });
    }

    // Validate that we have a fused profile
    if (!productConfig.productImages.fusedProfile) {
      return NextResponse.json({ error: "Product profile not analyzed. Please complete product specs first." }, { status: 400 });
    }

    const profile = productConfig.productImages.fusedProfile;
    const settings = productConfig.uiSettings;

    try {
      // Build optimized prompt with validation
      const promptResult = buildOptimizedPrompt(profile, settings, settings.contextPreset);
      // const size = getImageSize(settings.contextPreset);

      console.log(`Generating ${settings.variations} ${settings.contextPreset} variations for product: ${productConfig.productImages.productName}`);
      console.log('Prompt validation:', {
        originalLength: promptResult.originalLength,
        optimizedLength: promptResult.optimizedLength,
        optimizationApplied: promptResult.optimizationApplied,
        isValid: promptResult.validationResult.isValid,
        exceedsLimit: promptResult.validationResult.exceedsLimit
      });
      
      // Check if prompt is still invalid after optimization
      if (!promptResult.validationResult.isValid) {
        const error = `Prompt too long: ${promptResult.validationResult.length}/${promptResult.validationResult.limit} characters. ${promptResult.validationResult.suggestions?.join(' ') || ''}`;
        console.error('Prompt validation failed:', error);
        return NextResponse.json({ 
          error: 'Prompt length validation failed',
          details: error,
          promptLength: promptResult.validationResult.length,
          promptLimit: promptResult.validationResult.limit,
          suggestions: promptResult.validationResult.suggestions
        }, { status: 400 });
      }

      console.log('Using optimized prompt:', promptResult.prompt);
      console.log(`Primary image: ${fileName} (${fileType}, ${fileSize} bytes)`);
      console.log(`Image buffer size: ${imageBuffer.length} bytes`);

      // Always create a new File object since image may have been converted to PNG
      console.log('Creating File-like object from converted buffer for processing');
      const imageFile = createFileFromBuffer(imageBuffer, fileName, fileType);
      
      console.log('Final File object for processing:', imageFile.name, imageFile.type, imageFile.size);
      console.log('File object constructor:', imageFile.constructor.name);
      console.log('File object has required properties:', {
        hasName: 'name' in imageFile,
        hasType: 'type' in imageFile,
        hasSize: 'size' in imageFile,
        hasArrayBuffer: 'arrayBuffer' in imageFile
      });

      console.log('Calling BFL FLUX Kontext Max image editing with:', {
        imageType: typeof imageFile,
        imageName: imageFile.name,
        imageSize: imageFile.size,
        promptLength: promptResult.prompt.length,
        variations: settings.variations,
        aspectRatio: getAspectRatio(settings.contextPreset)
      });

      // Convert image to base64 for BFL API
      const imageBase64 = await fileToBase64(imageFile);
      
      const bflRequest = {
        prompt: promptResult.prompt,
        input_image: imageBase64,
        aspect_ratio: getAspectRatio(settings.contextPreset),
        prompt_upsampling: true,
        safety_tolerance: 2,
        output_format: 'jpeg' as const,
      };

      const bflResults = await editMultipleImagesWithBFL(
        bflRequest,
        settings.variations,
        settings.contextPreset
      );

      const variations = bflResults.map((result, index) => ({
        url: result.url,
        prompt: promptResult.prompt,
        metadata: {
          model: "flux-kontext-pro",
          timestamp: new Date().toISOString(),
          size: result.metadata.size,
          quality: settings.quality,
          variation: index + 1,
          contextPreset: settings.contextPreset,
        },
      }));

      const result = {
        productConfigId: productConfig.id,
        productName: productConfig.productImages.productName,
        contextPreset: settings.contextPreset,
        variations,
        generationDetails: {
          primaryImageUsed: fileName,
          totalSourceImages: productConfig.productImages.images.length,
          profileSource: 'fused_multi_image_analysis',
          prompt: promptResult.prompt,
          promptMetadata: {
            originalLength: promptResult.originalLength,
            optimizedLength: promptResult.optimizedLength,
            optimizationApplied: promptResult.optimizationApplied,
            validationResult: promptResult.validationResult
          }
        }
      };

      return NextResponse.json({
        success: true,
        result,
        metadata: {
          productName: productConfig.productImages.productName,
          contextPreset: settings.contextPreset,
          variationsGenerated: variations.length,
          settings: settings,
          timestamp: new Date().toISOString(),
        },
      });

    } catch (error) {
      console.error(`Error generating images for product: ${productConfig.productImages.productName}:`, error);
      
      // Enhanced error logging and user-friendly messages for BFL API issues
      let userError = "Unknown error occurred during generation";
      let statusCode = 500;
      let additionalInfo = {};
      
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        
        // Check for BFL API errors
        if (error.message.includes('BFL API error')) {
          statusCode = 400;
          userError = "BFL API request failed";
          additionalInfo = {
            issue: "The request to Black Forest Labs API failed",
            solution: "Please check your image and prompt, then try again"
          };
        } else if (error.message.includes('BFL_API_KEY not configured')) {
          statusCode = 500;
          userError = "API configuration error";
          additionalInfo = {
            issue: "BFL API key is not properly configured",
            solution: "Please contact support"
          };
        } else if (error.message.includes('generation failed')) {
          statusCode = 500;
          userError = "Image generation failed";
          additionalInfo = {
            issue: "The image generation process failed",
            solution: "Please try again with a different image or prompt"
          };
        } else if (error.message.includes('timed out')) {
          statusCode = 408;
          userError = "Generation timed out";
          additionalInfo = {
            issue: "The image generation took too long to complete",
            solution: "Please try again"
          };
        }
        
        // If we haven't identified a specific API error, use the original message
        if (userError === "Unknown error occurred during generation") {
          userError = error.message;
        }
      }
      
      return NextResponse.json({
        error: userError,
        details: error instanceof Error ? error.stack : undefined,
        productName: productConfig.productImages.productName,
        debugInfo: {
          bufferSize: imageBuffer?.length,
          fileName: fileName,
          fileType: fileType,
          fileSize: fileSize,
        },
        ...additionalInfo
      }, { status: statusCode });
    }

  } catch (error) {
    console.error("Product image generation error:", error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error occurred during product generation",
      details: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}