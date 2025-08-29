"use client";

import { useState, useCallback } from "react";
import { Stepper } from "@/components/image-generator/stepper";
import { StepUnifiedInput } from "@/components/image-generator/step-unified-input";
import { StepGenerateSimplified } from "@/components/image-generator/step-generate-simplified";
import { StepEditImages } from "@/components/image-generator/step-edit-images";
import { 
  ProductInput,
  GeneratedImage, 
  EditedImage,
  AssetType,
  ImageGeneratorState,
  DEFAULT_UI_SETTINGS,
  GenerationMethod
} from "@/components/image-generator/types";
import { 
  validateImageUrl, 
  generateSafeFilename, 
  getDownloadErrorMessage,
  downloadWithRetry 
} from "@/lib/download-utils";

export default function GeneratePage() {
  const [state, setState] = useState<ImageGeneratorState>({
    currentStep: 1,
    generatedImages: [],
    editedImages: {},
    isGenerating: false,
    isEditing: false,
    errors: {},
  });

  const updateState = (updates: Partial<ImageGeneratorState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Step 1: Product Input Handlers
  const handleProductInputChange = useCallback((productInput: ProductInput) => {
    let configuration = state.productConfiguration;
    
    if (!configuration) {
      // Create new configuration
      configuration = {
        id: crypto.randomUUID(),
        productInput,
        uiSettings: DEFAULT_UI_SETTINGS,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Update existing configuration
      configuration = {
        ...configuration,
        productInput,
        updatedAt: new Date().toISOString(),
      };
    }

    updateState({ productConfiguration: configuration });
  }, [state.productConfiguration]);

  const handleProductInputComplete = () => {
    updateState({ currentStep: 2 });
  };

  const handleGenerationComplete = () => {
    updateState({ currentStep: 3 });
  };

  // Removed handleConfigurationChange - no longer needed in simplified workflow

  // Client-side file to base64 conversion
  const convertFileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result && typeof reader.result === 'string') {
          // Remove data URL prefix (data:image/jpeg;base64,) to get just the base64 string
          const base64Data = reader.result.split(',')[1];
          resolve({
            data: base64Data,
            mimeType: file.type
          });
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  // Generation Handlers
  const generateImages = async () => {
    if (!state.productConfiguration?.productInput) {
      updateState({ 
        errors: { ...state.errors, generation: 'No product input provided. Please complete the input form first.' }
      });
      return;
    }

    const { productInput } = state.productConfiguration;
    
    // Validate we have images and basic specs
    if (!productInput.images.length) {
      updateState({ 
        errors: { ...state.errors, generation: 'No images uploaded. Please upload product images.' }
      });
      return;
    }

    if (!productInput.specs.productName || !productInput.specs.productType) {
      updateState({ 
        errors: { ...state.errors, generation: 'Missing required specifications. Please provide product name and type.' }
      });
      return;
    }

    updateState({ 
      isGenerating: true, 
      generationProgress: { 
        current: 0, 
        total: state.productConfiguration.uiSettings.variations,
        stage: 'Converting images to base64 format...'
      },
      errors: { ...state.errors, generation: undefined }
    });

    try {
      // Convert all uploaded images to base64 for API transmission
      updateState({ 
        generationProgress: { 
          current: 1, 
          total: state.productConfiguration.uiSettings.variations,
          stage: 'Processing reference images...'
        }
      });

      const base64Images: Array<{ data: string; mimeType: string }> = [];
      for (const image of productInput.images) {
        try {
          const base64Result = await convertFileToBase64(image);
          base64Images.push(base64Result);
        } catch (error) {
          console.error(`Failed to convert image ${image.name} to base64:`, error);
          // Continue with other images
        }
      }

      if (base64Images.length === 0) {
        throw new Error('Failed to process any reference images. Please check your uploaded images.');
      }

      updateState({ 
        generationProgress: { 
          current: 2, 
          total: state.productConfiguration.uiSettings.variations,
          stage: 'Generating images using direct specification approach...'
        }
      });

      // Create API payload with base64 images instead of File objects
      const apiPayload = {
        productSpecs: productInput.specs,
        referenceImages: base64Images,
        generationParams: {
          contextPreset: state.productConfiguration.uiSettings.contextPreset,
          variations: state.productConfiguration.uiSettings.variations,
          quality: state.productConfiguration.uiSettings.quality
        }
      };

      // Use new direct generation approach
      const response = await fetch('/api/generate-images-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate images');
      }

      const result = await response.json();
      
      const newGeneratedImages: GeneratedImage[] = result.result.variations.map((variation: { 
        url: string; 
        prompt: string; 
        metadata: { model: string; timestamp: string; size: string; quality: string; variation: number; contextPreset: string; generationMethod?: string } 
      }) => ({
        id: `${state.productConfiguration!.id}_${Date.now()}_${variation.metadata.variation}`,
        url: variation.url,
        productConfigId: state.productConfiguration!.id,
        settings: state.productConfiguration!.uiSettings,
        specs: state.productConfiguration!.productInput.specs,
        prompt: variation.prompt,
        generationSource: {
          method: 'direct-generation' as GenerationMethod,
          model: variation.metadata.model,
          confidence: 1.0,
          referenceImageUsed: false
        },
        metadata: variation.metadata,
      }));

      updateState({ 
        generatedImages: [...state.generatedImages, ...newGeneratedImages],
        isGenerating: false,
        generationProgress: undefined
      });

      // Auto-advance to editing step if we have generated images
      if (newGeneratedImages.length > 0) {
        setTimeout(() => handleGenerationComplete(), 500);
      }

    } catch (error) {
      console.error('Image generation failed:', error);
      updateState({ 
        isGenerating: false,
        generationProgress: undefined,
        errors: { 
          ...state.errors, 
          generation: error instanceof Error ? error.message : 'Unknown error occurred' 
        }
      });
    }
  };

  const regenerateImage = async (imageId: string) => {
    const imageToRegenerate = state.generatedImages.find(img => img.id === imageId);
    if (!imageToRegenerate || !state.productConfiguration) return;

    try {
      // Use direct generation for regeneration
      const response = await fetch('/api/generate-images-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productConfiguration: state.productConfiguration,
          generationParams: {
            contextPreset: state.productConfiguration.uiSettings.contextPreset,
            variations: 1, // Single regeneration
            quality: state.productConfiguration.uiSettings.quality
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate image');
      }

      const result = await response.json();
      
      if (result.result?.variations?.[0]) {
        const variation = result.result.variations[0];
        const newImage: GeneratedImage = {
          id: `regenerated_${Date.now()}`,
          url: variation.url,
          productConfigId: state.productConfiguration.id,
          settings: state.productConfiguration.uiSettings,
          specs: state.productConfiguration.productInput.specs,
          prompt: variation.prompt,
          generationSource: {
            method: 'direct-generation' as GenerationMethod,
            model: variation.metadata.model,
            confidence: 1.0,
            referenceImageUsed: false
          },
          metadata: variation.metadata,
        };

        const updatedImages = state.generatedImages.map(img => 
          img.id === imageId ? newImage : img
        );

        updateState({ generatedImages: updatedImages });
      }
    } catch (error) {
      console.error('Regeneration failed:', error);
    }
  };

  // Image Editing Handlers
  const editImage = async (
    imageId: string, 
    imageUrl: string, 
    assetType: AssetType, 
    variations: number = 1, 
    customPrompt?: string
  ) => {
    if (!state.productConfiguration?.productInput?.specs?.productName) {
      updateState({ 
        errors: { ...state.errors, editing: 'Product name is required for editing' }
      });
      return;
    }

    updateState({ 
      isEditing: true, 
      editingProgress: { 
        current: 0, 
        total: variations,
        stage: `Creating ${assetType} asset...`,
        assetType
      },
      errors: { ...state.errors, editing: undefined }
    });

    try {
      const response = await fetch('/api/edit-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'single',
          sourceImageUrl: imageUrl,
          sourceImageId: imageId,
          productName: state.productConfiguration.productInput.specs.productName,
          assetType,
          variations,
          customPrompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to edit image');
      }

      const result = await response.json();
      
      if (result.result?.editedImages) {
        const newEditedImages = { ...state.editedImages };
        if (!newEditedImages[imageId]) {
          newEditedImages[imageId] = [];
        }
        newEditedImages[imageId].push(...result.result.editedImages);

        updateState({ 
          editedImages: newEditedImages,
          isEditing: false,
          editingProgress: undefined
        });
      }
    } catch (error) {
      console.error('Image editing failed:', error);
      updateState({ 
        isEditing: false,
        editingProgress: undefined,
        errors: { 
          ...state.errors, 
          editing: error instanceof Error ? error.message : 'Unknown editing error' 
        }
      });
    }
  };

  const batchEditImages = async (
    imageId: string,
    imageUrl: string, 
    assetTypes: AssetType[],
    customPrompts?: Record<AssetType, string>
  ) => {
    if (!state.productConfiguration?.productInput?.specs?.productName) {
      updateState({ 
        errors: { ...state.errors, editing: 'Product name is required for editing' }
      });
      return;
    }

    const requests = assetTypes.map(assetType => ({
      assetType,
      variations: 2, // Default to 2 variations for batch
      customPrompt: customPrompts?.[assetType]
    }));

    const totalVariations = requests.reduce((sum, req) => sum + req.variations, 0);

    updateState({ 
      isEditing: true, 
      editingProgress: { 
        current: 0, 
        total: totalVariations,
        stage: 'Starting batch edit...'
      },
      errors: { ...state.errors, editing: undefined }
    });

    try {
      const response = await fetch('/api/edit-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'batch',
          sourceImageUrl: imageUrl,
          sourceImageId: imageId,
          productName: state.productConfiguration.productInput.specs.productName,
          requests,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to batch edit images');
      }

      const result = await response.json();
      
      if (result.result?.editedImagesByAssetType) {
        const newEditedImages = { ...state.editedImages };
        if (!newEditedImages[imageId]) {
          newEditedImages[imageId] = [];
        }

        // Flatten all asset type results into a single array
        Object.values(result.result.editedImagesByAssetType).forEach((images) => {
          const typedImages = images as EditedImage[];
          newEditedImages[imageId].push(...typedImages);
        });

        updateState({ 
          editedImages: newEditedImages,
          isEditing: false,
          editingProgress: undefined
        });
      }
    } catch (error) {
      console.error('Batch editing failed:', error);
      updateState({ 
        isEditing: false,
        editingProgress: undefined,
        errors: { 
          ...state.errors, 
          editing: error instanceof Error ? error.message : 'Unknown batch editing error' 
        }
      });
    }
  };

  const [downloadingImages, setDownloadingImages] = useState<Set<string>>(new Set());
  const [downloadErrors, setDownloadErrors] = useState<Record<string, string>>({});

  const downloadImage = async (imageUrl: string, filename: string, imageId?: string) => {
    const downloadId = imageId || imageUrl;
    
    // Pre-validate the URL - using validateImageUrl instead of validateBFLImageUrl for data URL support
    const validation = validateImageUrl(imageUrl);
    if (!validation.isValid) {
      const errorMessage = `Invalid image URL: ${validation.issues.join(', ')}`;
      console.error('[Client] URL validation failed:', validation);
      setDownloadErrors(prev => ({
        ...prev,
        [downloadId]: errorMessage
      }));
      alert(`Download failed: ${errorMessage}`);
      return;
    }
    
    const downloadFn = async () => {
      // Set downloading state
      setDownloadingImages(prev => new Set([...prev, downloadId]));
      setDownloadErrors(prev => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [downloadId]: _, ...rest } = prev;
        return rest;
      });

      console.log(`[Client] Starting download for: ${filename}`);
      console.log(`[Client] Image URL type: ${imageUrl.startsWith('data:') ? 'data URL' : 'HTTP URL'}`);
      console.log(`[Client] Validation passed for domain: ${validation.domain}`);
      
      let blob: Blob;
      
      // Handle data URLs (from Gemini API) - can download directly
      if (imageUrl.startsWith('data:')) {
        console.log('[Client] Processing data URL for direct download');
        
        try {
          // Convert data URL to blob
          const response = await fetch(imageUrl);
          blob = await response.blob();
        } catch (error) {
          console.error('[Client] Failed to convert data URL to blob:', error);
          throw new Error('Failed to process image data for download');
        }
      } else {
        // Handle HTTP URLs - use proxy API (for CORS and compatibility)
        console.log('[Client] Using proxy API for HTTP URL download');
        
        const proxyUrl = `/api/download-image?url=${encodeURIComponent(imageUrl)}&filename=${encodeURIComponent(filename)}`;
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
          let errorMessage = `Download failed: HTTP ${response.status}`;
          
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
            
            if (errorData.details) {
              errorMessage += ` - ${errorData.details}`;
            }
            
            console.error('[Client] Download API error:', errorData);
            
          } catch (jsonError) {
            console.error('[Client] Could not parse error response:', jsonError);
            errorMessage += ` (Status: ${response.status} ${response.statusText})`;
          }
          
          throw new Error(errorMessage);
        }
        
        blob = await response.blob();
      }
      
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      console.log(`[Client] Downloaded blob size: ${blob.size} bytes`);
      
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log(`[Client] Download completed successfully: ${filename}`);
    };
    
    try {
      await downloadWithRetry(downloadFn, 3, 1000);
    } catch (error) {
      const errorMessage = getDownloadErrorMessage(error);
      console.error('[Client] Download failed after retries:', error);
      console.error('[Client] Error details:', {
        imageUrl,
        filename,
        downloadId,
        error: errorMessage,
        validation
      });
      
      setDownloadErrors(prev => ({
        ...prev,
        [downloadId]: errorMessage
      }));
      
      // Show user-friendly error notification
      alert(`Download failed: ${errorMessage}`);
      
    } finally {
      // Clear downloading state
      setDownloadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(downloadId);
        return newSet;
      });
    }
  };

  const [downloadingAll, setDownloadingAll] = useState(false);

  const downloadAll = async () => {
    if (!state.productConfiguration || state.generatedImages.length === 0) {
      alert('No images to download');
      return;
    }
    
    setDownloadingAll(true);
    let successCount = 0;
    let failureCount = 0;
    
    try {
      console.log(`[Client] Starting bulk download of ${state.generatedImages.length} images`);
      
      for (let i = 0; i < state.generatedImages.length; i++) {
        const image = state.generatedImages[i];
        const filename = generateSafeFilename(
          state.productConfiguration.productInput.specs.productName,
          state.productConfiguration.uiSettings.contextPreset,
          i + 1,
          'jpg'
        );
        
        try {
          await downloadImage(image.url, filename, `bulk_${image.id}`);
          successCount++;
          console.log(`[Client] Bulk download progress: ${successCount}/${state.generatedImages.length}`);
        } catch (error) {
          failureCount++;
          console.error(`[Client] Failed to download image ${i + 1}:`, error);
        }
        
        // Add delay between downloads to prevent overwhelming the server
        if (i < state.generatedImages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Show completion status
      if (failureCount === 0) {
        alert(`Successfully downloaded all ${successCount} images!`);
      } else {
        alert(`Download completed: ${successCount} successful, ${failureCount} failed`);
      }
      
    } catch (error) {
      console.error('[Client] Bulk download error:', error);
      alert(`Bulk download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDownloadingAll(false);
    }
  };

  const downloadAllEdited = async (sourceImageIds: string[]) => {
    if (sourceImageIds.length === 0 || Object.keys(state.editedImages).length === 0) {
      alert('No edited images to download');
      return;
    }
    
    setDownloadingAll(true);
    let successCount = 0;
    let failureCount = 0;
    
    try {
      console.log(`[Client] Starting bulk download of edited images`);
      
      for (const sourceImageId of sourceImageIds) {
        const images = state.editedImages[sourceImageId] || [];
        
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          const filename = generateSafeFilename(
            `${state.productConfiguration?.productInput.specs.productName}_${image.assetType}`,
            'edited',
            image.metadata.variation,
            'jpg'
          );
          
          try {
            await downloadImage(image.url, filename, `bulk_edited_${image.id}`);
            successCount++;
            console.log(`[Client] Bulk download progress: ${successCount} completed`);
          } catch (error) {
            failureCount++;
            console.error(`[Client] Failed to download edited image ${image.id}:`, error);
          }
          
          // Add delay between downloads
          if (i < images.length - 1 || sourceImageIds.indexOf(sourceImageId) < sourceImageIds.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      
      // Show completion status
      if (failureCount === 0) {
        alert(`Successfully downloaded all ${successCount} edited images!`);
      } else {
        alert(`Download completed: ${successCount} successful, ${failureCount} failed`);
      }
      
    } catch (error) {
      console.error('[Client] Bulk download error:', error);
      alert(`Bulk download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDownloadingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sophisticated-gray-50 via-white to-ocean-blue-50/30 dark:from-sophisticated-gray-950 dark:via-sophisticated-gray-900 dark:to-sophisticated-gray-800">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-screen-2xl">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-12 animate-fade-in">
            <div className="mb-4">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-ocean-blue-50 to-warm-gold-50 border border-ocean-blue-200 rounded-full text-sm font-medium text-ocean-blue-700 dark:from-ocean-blue-900/50 dark:to-warm-gold-900/50 dark:border-ocean-blue-700 dark:text-ocean-blue-300">
                <span className="w-2 h-2 bg-gradient-ocean-gold rounded-full mr-2 animate-pulse"></span>
                Complete Marketing Asset Creation Studio
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-br from-sophisticated-gray-900 via-ocean-blue-700 to-sophisticated-gray-700 bg-clip-text text-transparent dark:from-sophisticated-gray-100 dark:via-ocean-blue-300 dark:to-sophisticated-gray-300">
              Create & Transform Product Images
            </h1>
            <p className="text-lg text-sophisticated-gray-600 dark:text-sophisticated-gray-400 px-2 max-w-3xl mx-auto leading-relaxed">
              Upload your product photos, generate professional packshots, then transform them into lifestyle scenes, ad creatives, social media posts, and hero banners.
            </p>
          </div>

        <Stepper currentStep={state.currentStep} />

        <div className="space-y-4 md:space-y-8">
          {/* Step 1: Product Input */}
          <StepUnifiedInput
            productInput={state.productConfiguration?.productInput || null}
            onProductInputChange={handleProductInputChange}
            onComplete={handleProductInputComplete}
            isActive={state.currentStep === 1}
          />

          {/* Removed optional generation settings - simplified workflow */}

          {/* Step 2: Generate */}
          {state.currentStep >= 2 && state.productConfiguration && (
            <StepGenerateSimplified
              productConfiguration={state.productConfiguration}
              generatedImages={state.generatedImages}
              isGenerating={state.isGenerating}
              generationProgress={state.generationProgress}
              generationError={state.errors.generation}
              onGenerate={generateImages}
              onRegenerate={regenerateImage}
              onDownload={(imageUrl, filename, imageId) => downloadImage(imageUrl, filename, imageId)}
              onDownloadAll={downloadAll}
              downloadingImages={downloadingImages}
              downloadErrors={downloadErrors}
              downloadingAll={downloadingAll}
              isActive={state.currentStep === 2}
            />
          )}

          {/* Step 3: Edit Assets */}
          {state.currentStep >= 3 && (
            <StepEditImages
              generatedImages={state.generatedImages}
              editedImages={state.editedImages}
              isEditing={state.isEditing}
              editingProgress={state.editingProgress}
              editingError={state.errors.editing}
              onEdit={editImage}
              onBatchEdit={batchEditImages}
              onDownload={(imageUrl, filename, imageId) => downloadImage(imageUrl, filename, imageId)}
              onDownloadAll={downloadAllEdited}
              downloadingImages={downloadingImages}
              downloadErrors={downloadErrors}
              downloadingAll={downloadingAll}
              isActive={state.currentStep === 3}
              productName={state.productConfiguration?.productInput.specs.productName}
            />
          )}
        </div>
      </div>
    </div>
    </div>
  );
}