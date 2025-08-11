"use client";

import { useState, useCallback } from "react";
import { Stepper } from "@/components/image-generator/stepper";
import { StepProductBlock } from "@/components/image-generator/step-upload";
import { StepProductSpecs } from "@/components/image-generator/step-product-specs";
import { StepGenerationSettings } from "@/components/image-generator/step-settings";
import { StepGenerate } from "@/components/image-generator/step-generate";
import { 
  ProductImages,
  ProductConfiguration, 
  GeneratedImage, 
  ImageGeneratorState,
  DEFAULT_UI_SETTINGS,
  generateSlug,
  GenerationMethod
} from "@/components/image-generator/types";

export default function GeneratePage() {
  const [state, setState] = useState<ImageGeneratorState>({
    currentStep: 1,
    generatedImages: [],
    isGenerating: false,
    errors: {},
  });
  const [generationApproach, setGenerationApproach] = useState<'reference' | 'text'>('reference');

  const updateState = (updates: Partial<ImageGeneratorState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Step 1: Product Block Handlers
  const handleProductImagesChange = useCallback((productImages: ProductImages | null) => {
    if (!productImages) {
      updateState({ productConfiguration: undefined });
      return;
    }

    let configuration = state.productConfiguration;
    
    if (!configuration) {
      // Create new configuration
      const slug = generateSlug(productImages.productName);
      configuration = {
        id: crypto.randomUUID(),
        name: productImages.productName,
        slug,
        productImages,
        uiSettings: DEFAULT_UI_SETTINGS,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Update existing configuration
      configuration = {
        ...configuration,
        name: productImages.productName,
        slug: generateSlug(productImages.productName),
        productImages,
        updatedAt: new Date().toISOString(),
      };
    }

    updateState({ productConfiguration: configuration });
  }, [state.productConfiguration]);

  const handleProductBlockComplete = () => {
    updateState({ currentStep: 2 });
  };

  // Step 2: Product Specs Handlers
  const handleProductSpecsComplete = () => {
    updateState({ currentStep: 3 });
  };

  // Step 3: Generation Settings Handlers
  const handleConfigurationChange = (config: ProductConfiguration) => {
    updateState({ productConfiguration: config });
  };

  const handleGenerationSettingsComplete = () => {
    updateState({ currentStep: 4 });
  };

  // Step 4: Generation Handlers
  const generateImages = async (useReferenceApproach: boolean = true) => {
    if (!state.productConfiguration?.productImages.fusedProfile) {
      updateState({ 
        errors: { ...state.errors, generation: 'Product profile not analyzed. Please complete product specs first.' }
      });
      return;
    }

    // For reference-based approach, we need a primary image
    if (useReferenceApproach && !state.productConfiguration.productImages.primaryImageId) {
      updateState({ 
        errors: { ...state.errors, generation: 'No primary reference image selected. Please select a primary image in Step 2.' }
      });
      return;
    }

    // Validate that we have the enhanced textToImagePrompts from GPT-4o analysis
    const profile = state.productConfiguration.productImages.fusedProfile;
    if (!profile?.textToImagePrompts && !useReferenceApproach) {
      updateState({ 
        errors: { ...state.errors, generation: 'Enhanced product analysis required. Please go back to Step 2 and re-analyze your product images with the updated system.' }
      });
      return;
    }

    if (!profile.textToImagePrompts?.baseDescription && !useReferenceApproach) {
      updateState({ 
        errors: { ...state.errors, generation: 'Incomplete analysis data. Please go back to Step 2 and re-analyze your product images.' }
      });
      return;
    }

    updateState({ 
      isGenerating: true, 
      generationProgress: { 
        current: 0, 
        total: state.productConfiguration.uiSettings.variations,
        stage: useReferenceApproach ? 'Preparing images.edits with reference image...' : 'Preparing GPT-image-1 generation...'
      },
      errors: { ...state.errors, generation: undefined }
    });

    try {
      updateState({ 
        generationProgress: { 
          current: 1, 
          total: state.productConfiguration.uiSettings.variations,
          stage: useReferenceApproach ? 'Using images.edits API with JSON profile...' : 'Calling GPT-image-1 for text-to-image generation...'
        }
      });

      if (useReferenceApproach) {
        // Use new reference-based approach with images.edits
        const primaryImage = state.productConfiguration.productImages.images.find(
          img => img.id === state.productConfiguration!.productImages.primaryImageId
        );
        
        if (!primaryImage) {
          throw new Error('Primary reference image not found');
        }

        const formData = new FormData();
        formData.append('configuration', JSON.stringify(state.productConfiguration));
        formData.append('generationParams', JSON.stringify({
          contextPreset: state.productConfiguration.uiSettings.contextPreset,
          variations: state.productConfiguration.uiSettings.variations,
          quality: state.productConfiguration.uiSettings.quality
        }));
        
        // Convert the primary image to a File object for the API
        const imageResponse = await fetch(primaryImage.preview);
        const imageBlob = await imageResponse.blob();
        const imageFile = new File([imageBlob], primaryImage.name, { type: imageBlob.type });
        formData.append('primaryImage', imageFile);

        const response = await fetch('/api/generate-images-edits', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate images using reference approach');
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
          profile: state.productConfiguration!.productImages.fusedProfile!,
          prompt: variation.prompt,
          generationSource: {
            method: 'reference-based' as GenerationMethod,
            model: variation.metadata.model,
            confidence: 0.95,
            referenceImageUsed: true
          },
          metadata: variation.metadata,
        }));

        updateState({ 
          generatedImages: [...state.generatedImages, ...newGeneratedImages],
          isGenerating: false,
          generationProgress: undefined
        });
        
      } else {
        // Use original text-to-image approach
        const response = await fetch('/api/generate-images-gpt-4o', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productConfiguration: state.productConfiguration,
            generationParams: {
              contextPreset: state.productConfiguration.uiSettings.contextPreset,
              variations: state.productConfiguration.uiSettings.variations,
              quality: state.productConfiguration.uiSettings.quality
            }
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          
          // Handle image format errors specifically
          if (errorData.error?.includes('Image format') || 
              errorData.error?.includes('Unable to process the uploaded image') ||
              errorData.supportedFormats) {
            let imageError = `Image format issue: ${errorData.error}

${errorData.details || 'The uploaded image could not be processed.'}`;

            if (errorData.supportedFormats) {
              imageError += `

Supported formats: ${errorData.supportedFormats.join(', ')}`;
            }

            if (errorData.troubleshooting) {
              imageError += `

Troubleshooting: ${errorData.troubleshooting}`;
            }

            if (errorData.solution) {
              imageError += `

Solution: ${errorData.solution}`;
            }
            
            throw new Error(imageError);
          }
          
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
          profile: state.productConfiguration!.productImages.fusedProfile!,
          prompt: variation.prompt,
          generationSource: {
            method: (variation.metadata.generationMethod as GenerationMethod) || 'text-to-image',
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

    // Determine if the original image was generated with reference approach
    const useReferenceApproach = imageToRegenerate.generationSource.referenceImageUsed;

    if (useReferenceApproach && !state.productConfiguration.productImages.primaryImageId) {
      console.error('No primary reference image selected for regeneration.');
      return;
    }

    // Validate analysis data for text-to-image approach
    const profile = state.productConfiguration.productImages.fusedProfile;
    if (!useReferenceApproach && !profile?.textToImagePrompts?.baseDescription) {
      console.error('Enhanced product analysis required for regeneration. Please re-analyze product images.');
      return;
    }

    try {
      if (useReferenceApproach) {
        // Use reference-based regeneration
        const primaryImage = state.productConfiguration.productImages.images.find(
          img => img.id === state.productConfiguration!.productImages.primaryImageId
        );
        
        if (!primaryImage) {
          throw new Error('Primary reference image not found for regeneration');
        }

        const formData = new FormData();
        formData.append('configuration', JSON.stringify(state.productConfiguration));
        formData.append('generationParams', JSON.stringify({
          contextPreset: state.productConfiguration.uiSettings.contextPreset,
          variations: 1, // Single regeneration
          quality: state.productConfiguration.uiSettings.quality
        }));
        
        // Convert the primary image to a File object for the API
        const imageResponse = await fetch(primaryImage.preview);
        const imageBlob = await imageResponse.blob();
        const imageFile = new File([imageBlob], primaryImage.name, { type: imageBlob.type });
        formData.append('primaryImage', imageFile);

        const response = await fetch('/api/generate-images-edits', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to regenerate image using reference approach');
        }

        const result = await response.json();
        
        if (result.result?.variations?.[0]) {
          const variation = result.result.variations[0];
          const newImage: GeneratedImage = {
            id: `regenerated_${Date.now()}`,
            url: variation.url,
            productConfigId: state.productConfiguration.id,
            settings: state.productConfiguration.uiSettings,
            profile: state.productConfiguration.productImages.fusedProfile!,
            prompt: variation.prompt,
            generationSource: {
              method: 'reference-based' as GenerationMethod,
              model: variation.metadata.model,
              confidence: 0.95,
              referenceImageUsed: true
            },
            metadata: variation.metadata,
          };

          const updatedImages = state.generatedImages.map(img => 
            img.id === imageId ? newImage : img
          );

          updateState({ generatedImages: updatedImages });
        }
      } else {
        // Use text-to-image regeneration
        const response = await fetch('/api/generate-images-gpt-4o', {
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
            profile: state.productConfiguration.productImages.fusedProfile!,
            prompt: variation.prompt,
            generationSource: {
              method: (variation.metadata.generationMethod as GenerationMethod) || 'text-to-image',
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
      }
    } catch (error) {
      console.error('Regeneration failed:', error);
    }
  };

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const downloadAll = async () => {
    if (!state.productConfiguration) return;
    
    for (const image of state.generatedImages) {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const productName = state.productConfiguration.productImages.productName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const filename = `piktor-${productName}-${state.productConfiguration.uiSettings.contextPreset}-${timestamp}.png`;
      
      await downloadImage(image.url, filename);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-2xl">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Piktor Image Generator v4</h1>
          <p className="text-muted-foreground">
            Multi-image product analysis with GPT-4o and reference-based image generation using images.edits API
          </p>
        </div>

        <Stepper currentStep={state.currentStep} />

        <div className="space-y-8">
          {/* Step 1: Product Block */}
          <StepProductBlock
            productImages={state.productConfiguration?.productImages || null}
            onProductImagesChange={handleProductImagesChange}
            onComplete={handleProductBlockComplete}
            isActive={state.currentStep === 1}
          />

          {/* Step 2: Product Specs */}
          {state.currentStep >= 2 && state.productConfiguration && (
            <StepProductSpecs
              productImages={state.productConfiguration.productImages}
              onProductImagesChange={(productImages) => {
                handleConfigurationChange({
                  ...state.productConfiguration!,
                  productImages,
                  updatedAt: new Date().toISOString(),
                });
              }}
              onComplete={handleProductSpecsComplete}
              isActive={state.currentStep === 2}
            />
          )}

          {/* Step 3: Generation Settings */}
          {state.currentStep >= 3 && state.productConfiguration && (
            <StepGenerationSettings
              productConfiguration={state.productConfiguration}
              onConfigurationChange={handleConfigurationChange}
              onComplete={handleGenerationSettingsComplete}
              isActive={state.currentStep === 3}
            />
          )}

          {/* Step 4: Generate */}
          {state.currentStep >= 4 && state.productConfiguration && (
            <StepGenerate
              productConfiguration={state.productConfiguration}
              generatedImages={state.generatedImages}
              isGenerating={state.isGenerating}
              generationProgress={state.generationProgress}
              generationError={state.errors.generation}
              generationApproach={generationApproach}
              onGenerate={(useReferenceApproach) => {
                 const shouldUseReference = useReferenceApproach ?? (generationApproach === 'reference');
                 generateImages(shouldUseReference);
                 // Toggle approach for next generation
                 setGenerationApproach(prev => prev === 'reference' ? 'text' : 'reference');
               }}
              onRegenerate={regenerateImage}
              onDownload={downloadImage}
              onDownloadAll={downloadAll}
              isActive={state.currentStep === 4}
            />
          )}
        </div>
      </div>
    </div>
  );
}