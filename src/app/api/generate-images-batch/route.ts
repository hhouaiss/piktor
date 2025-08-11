import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import sharp from "sharp";
import { buildOptimizedPrompt, getImageSize } from "@/lib/prompt-builder";
import { ProductConfiguration } from "@/components/image-generator/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to create a proper File object from Buffer for OpenAI
function createFileFromBuffer(buffer: Buffer, filename: string, contentType: string): File {
  try {
    // Create a Blob first
    const blob = new Blob([buffer], { type: contentType });
    
    // Create a proper File object that OpenAI expects
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

// Helper function to convert any image format to PNG with RGBA for OpenAI compatibility
async function convertImageToPNG(imageBuffer: Buffer, originalMimeType: string): Promise<{ buffer: Buffer; mimeType: string }> {
  try {
    console.log(`Processing image from ${originalMimeType} to OpenAI-compatible PNG format`);
    
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
    // OpenAI images.edit requires RGBA, LA, or L formats
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

    // Validate the result meets OpenAI requirements
    if (convertedMetadata.channels !== 1 && convertedMetadata.channels !== 2 && convertedMetadata.channels !== 4) {
      throw new Error(`Image conversion failed: resulted in ${convertedMetadata.channels} channels, but OpenAI requires 1 (L), 2 (LA), or 4 (RGBA) channels`);
    }

    console.log(`Successfully converted ${originalMimeType} to OpenAI-compatible PNG. Original size: ${imageBuffer.length} bytes, Converted size: ${convertedBuffer.length} bytes`);
    
    return { 
      buffer: convertedBuffer, 
      mimeType: 'image/png' 
    };

  } catch (error) {
    console.error('Error converting image to OpenAI-compatible PNG:', error);
    throw new Error(`Failed to convert image from ${originalMimeType} to OpenAI-compatible PNG: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file" 
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

      // Validate file size (max 4MB for OpenAI images.edit)
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

      // Validate file size (max 4MB for OpenAI images.edit)
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

    // Convert image to PNG format if needed for OpenAI compatibility
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
      console.log(`Final image for OpenAI: ${fileName} (${fileType}, ${imageBuffer.length} bytes)`);
      
      // Additional validation after conversion
      if (imageBuffer.length === 0) {
        throw new Error('Converted image buffer is empty');
      }
      
      // Check converted size doesn't exceed OpenAI limit
      if (imageBuffer.length > 4 * 1024 * 1024) {
        return NextResponse.json({ 
          error: "Converted image is too large for OpenAI (max 4MB)",
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
          userFriendlyError = 'Image format incompatible with OpenAI API';
          detailedReason = 'The image uses an unsupported color format. OpenAI requires images in RGBA, LA, or L format.';
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
      const size = getImageSize(settings.contextPreset);

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
      console.log('Creating File-like object from converted buffer for OpenAI');
      const imageFile = createFileFromBuffer(imageBuffer, fileName, fileType);
      
      console.log('Final File object for OpenAI:', imageFile.name, imageFile.type, imageFile.size);
      console.log('File object constructor:', imageFile.constructor.name);
      console.log('File object has required properties:', {
        hasName: 'name' in imageFile,
        hasType: 'type' in imageFile,
        hasSize: 'size' in imageFile,
        hasArrayBuffer: 'arrayBuffer' in imageFile
      });

      console.log('Calling OpenAI images.edit with:', {
        imageType: typeof imageFile,
        imageName: imageFile.name,
        imageSize: imageFile.size,
        promptLength: promptResult.prompt.length,
        variations: settings.variations,
        size: size
      });

      const response = await openai.images.edit({
        image: imageFile,
        prompt: promptResult.prompt,
        n: settings.variations,
        size: size,
        response_format: "b64_json",
      });

      const variations = (response.data || []).map((imageData, index) => ({
        url: `data:image/png;base64,${imageData.b64_json}`,
        prompt: promptResult.prompt,
        metadata: {
          model: "gpt-image-1", // Using images.edit endpoint
          timestamp: new Date().toISOString(),
          size: size,
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
      
      // Enhanced error logging and user-friendly messages for OpenAI API issues
      let userError = "Unknown error occurred during generation";
      let statusCode = 500;
      let additionalInfo = {};
      
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        
        // Check for OpenAI API response
        if ('response' in error) {
          const apiError = error as Error & { response?: { status?: number; data?: unknown } };
          console.error('OpenAI API Response Status:', apiError.response?.status);
          console.error('OpenAI API Response Data:', apiError.response?.data);
          
          // Handle specific OpenAI API errors
          if (apiError.response?.status === 400) {
            statusCode = 400;
            
            // Check for image format errors
            if (error.message.includes('Invalid input image') && error.message.includes('format must be in')) {
              userError = "Image format not supported by OpenAI API";
              additionalInfo = {
                issue: "The uploaded image format is not compatible with OpenAI's image editing API",
                requiredFormats: ["RGBA", "LA", "L"],
                receivedFormat: "RGB or other unsupported format",
                solution: "This should have been automatically fixed. Please try uploading a different image or contact support."
              };
            } else if (error.message.includes('image')) {
              userError = "Image validation failed";
              additionalInfo = {
                issue: "The image did not pass OpenAI's validation requirements",
                solution: "Try a different image, ensure it's a valid image file, and check that it's under 4MB"
              };
            }
          } else if (apiError.response?.status === 429) {
            statusCode = 429;
            userError = "API rate limit exceeded";
            additionalInfo = {
              issue: "Too many requests to OpenAI API",
              solution: "Please wait a moment before trying again"
            };
          }
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