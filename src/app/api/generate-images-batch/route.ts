import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import sharp from "sharp";
import { buildPrompt, getImageSize } from "@/lib/prompt-builder";
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

// Helper function to convert any image format to PNG for OpenAI compatibility
async function convertImageToPNG(imageBuffer: Buffer, originalMimeType: string): Promise<{ buffer: Buffer; mimeType: string }> {
  try {
    // Check if the image is already PNG - no conversion needed
    if (originalMimeType === 'image/png') {
      console.log('Image is already PNG format, no conversion needed');
      return { buffer: imageBuffer, mimeType: 'image/png' };
    }

    console.log(`Converting image from ${originalMimeType} to PNG format`);
    
    // Use Sharp to convert the image to PNG
    const convertedBuffer = await sharp(imageBuffer)
      .png({
        // Use high quality settings
        quality: 100,
        compressionLevel: 6,
        // Preserve transparency
        progressive: false,
        force: true
      })
      .toBuffer();

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
      return NextResponse.json({ 
        error: `Failed to convert image to PNG format: ${conversionError instanceof Error ? conversionError.message : 'Unknown conversion error'}`,
        originalFileType: fileType,
        fileName: fileName,
        details: 'This error occurs when the uploaded image cannot be processed or converted to PNG format required by OpenAI'
      }, { status: 400 });
    }

    // Validate that we have a fused profile
    if (!productConfig.productImages.fusedProfile) {
      return NextResponse.json({ error: "Product profile not analyzed. Please complete product specs first." }, { status: 400 });
    }

    const profile = productConfig.productImages.fusedProfile;
    const settings = productConfig.uiSettings;

    try {
      const prompt = buildPrompt(profile, settings, settings.contextPreset);
      const size = getImageSize(settings.contextPreset);

      console.log(`Generating ${settings.variations} ${settings.contextPreset} variations for product: ${productConfig.productImages.productName}`);
      console.log('Using prompt:', prompt);
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
        promptLength: prompt.length,
        variations: settings.variations,
        size: size
      });

      const response = await openai.images.edit({
        image: imageFile,
        prompt: prompt,
        n: settings.variations,
        size: size,
        response_format: "b64_json",
      });

      const variations = (response.data || []).map((imageData, index) => ({
        url: `data:image/png;base64,${imageData.b64_json}`,
        prompt: prompt,
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
          prompt: prompt,
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
      
      // Enhanced error logging for OpenAI API issues
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        if ('response' in error) {
          const apiError = error as Error & { response?: { status?: number; data?: unknown } };
          console.error('OpenAI API Response Status:', apiError.response?.status);
          console.error('OpenAI API Response Data:', apiError.response?.data);
        }
      }
      
      return NextResponse.json({
        error: error instanceof Error ? error.message : "Unknown error occurred during generation",
        details: error instanceof Error ? error.stack : undefined,
        productName: productConfig.productImages.productName,
        debugInfo: {
          bufferSize: imageBuffer?.length,
          fileName: fileName,
          fileType: fileType,
          fileSize: fileSize,
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Product image generation error:", error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error occurred during product generation",
      details: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}