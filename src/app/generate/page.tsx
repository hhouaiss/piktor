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
  generateSlug
} from "@/components/image-generator/types";

export default function GeneratePage() {
  const [state, setState] = useState<ImageGeneratorState>({
    currentStep: 1,
    generatedImages: [],
    isGenerating: false,
    errors: {},
  });

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
  const generateImages = async () => {
    if (!state.productConfiguration?.productImages.fusedProfile) {
      updateState({ 
        errors: { ...state.errors, generation: 'Product profile not analyzed. Please complete product specs first.' }
      });
      return;
    }

    const primaryImage = state.productConfiguration.productImages.images.find(
      img => img.id === state.productConfiguration?.productImages.primaryImageId
    );

    if (!primaryImage) {
      updateState({ 
        errors: { ...state.errors, generation: 'No primary reference image selected.' }
      });
      return;
    }

    updateState({ 
      isGenerating: true, 
      generationProgress: { 
        current: 0, 
        total: state.productConfiguration.uiSettings.variations,
        stage: 'Preparing generation...'
      },
      errors: { ...state.errors, generation: undefined }
    });

    try {
      const formData = new FormData();
      formData.append('configuration', JSON.stringify(state.productConfiguration));
      
      // Ensure we're sending the File object correctly
      console.log('Primary image object:', primaryImage);
      console.log('Primary image type:', typeof primaryImage);
      console.log('Primary image instanceof File:', primaryImage instanceof File);
      
      if (primaryImage instanceof File) {
        formData.append('primaryImage', primaryImage);
      } else if (primaryImage && 'arrayBuffer' in primaryImage) {
        // Create a new Blob/File from the UploadedImage data
        const blob = new Blob([await primaryImage.arrayBuffer()], { type: primaryImage.type });
        const file = new File([blob], primaryImage.name, { type: primaryImage.type });
        formData.append('primaryImage', file);
      } else {
        throw new Error('Primary image is not a valid File object');
      }

      updateState({ 
        generationProgress: { 
          current: 1, 
          total: state.productConfiguration.uiSettings.variations,
          stage: 'Calling OpenAI Images API...'
        }
      });

      const response = await fetch('/api/generate-images-batch', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate images');
      }

      const result = await response.json();
      
      const newGeneratedImages: GeneratedImage[] = result.result.variations.map((variation: { 
        url: string; 
        prompt: string; 
        metadata: { model: string; timestamp: string; size: string; quality: string; variation: number; contextPreset: string } 
      }) => ({
        id: `${state.productConfiguration!.id}_${Date.now()}_${variation.metadata.variation}`,
        url: variation.url,
        productConfigId: state.productConfiguration!.id,
        settings: state.productConfiguration!.uiSettings,
        profile: state.productConfiguration!.productImages.fusedProfile!,
        prompt: variation.prompt,
        metadata: variation.metadata,
      }));

      updateState({ 
        generatedImages: [...state.generatedImages, ...newGeneratedImages],
        isGenerating: false,
        generationProgress: undefined
      });

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

    const primaryImage = state.productConfiguration.productImages.images.find(
      img => img.id === state.productConfiguration?.productImages.primaryImageId
    );

    if (!primaryImage) return;

    try {
      const formData = new FormData();
      formData.append('configuration', JSON.stringify(state.productConfiguration));
      
      // Ensure we're sending the File object correctly for regeneration
      if (primaryImage instanceof File) {
        formData.append('primaryImage', primaryImage);
      } else if (primaryImage && 'arrayBuffer' in primaryImage) {
        // Create a new Blob/File from the UploadedImage data
        const blob = new Blob([await primaryImage.arrayBuffer()], { type: primaryImage.type });
        const file = new File([blob], primaryImage.name, { type: primaryImage.type });
        formData.append('primaryImage', file);
      } else {
        throw new Error('Primary image is not a valid File object');
      }

      const response = await fetch('/api/generate-images-batch', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate image');
      }

      const result = await response.json();
      
      if (result.result?.variations?.[0]) {
        const newImage: GeneratedImage = {
          id: `regenerated_${Date.now()}`,
          url: result.result.variations[0].url,
          productConfigId: state.productConfiguration.id,
          settings: state.productConfiguration.uiSettings,
          profile: state.productConfiguration.productImages.fusedProfile!,
          prompt: result.result.variations[0].prompt,
          metadata: result.result.variations[0].metadata,
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
          <h1 className="text-3xl font-bold mb-4">Piktor Image Generator v3</h1>
          <p className="text-muted-foreground">
            Multi-image product analysis with AI-powered generation using OpenAI Images API
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
              onGenerate={generateImages}
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