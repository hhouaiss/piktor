"use client";

import Link from "next/link";
import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, X, CheckCircle, ArrowRight, Sparkles, Zap, Package, Eye, Download, AlertCircle } from "lucide-react";
import { ProductSpecs, UploadedImage, GeneratedImage } from "@/components/image-generator/types";
import { validateImageUrl, generateSafeFilename, getDownloadErrorMessage, downloadWithRetry } from "@/lib/download-utils";
import { cn } from "@/lib/utils";
import { UsageLimitProvider, useUsageLimit, useCanGenerate, useGenerationRecorder } from "@/contexts/UsageLimitContext";
import { UsageLimitReached } from "@/components/UsageLimitReached";
import { GenerationEvaluation } from "@/components/GenerationEvaluation";
import { trackImageGeneration, trackConversion, trackNavigation } from "@/lib/analytics";
import { getAuthHeaders } from "@/lib/api-client";
import { useSimpleAuth } from "@/components/auth/simple-auth-provider";
import { useRouter } from "next/navigation";

// Import admin utils for testing (only in development)
if (process.env.NODE_ENV === 'development') {
  import('@/lib/admin-utils');
}

// Types for the landing page image generator
interface LandingPageGeneratorState {
  uploadedImages: UploadedImage[];
  generatedImages: GeneratedImage[];
  isGenerating: boolean;
  isDragging: boolean;
  isUploading: boolean;
  uploadError: string | null;
  generationError: string | null;
  specs: ProductSpecs;
  viewingImage: GeneratedImage | null;
  downloadingImages: Set<string>;
}

// Internal component that uses the usage limit hooks
function HomeContent() {
  const router = useRouter();
  const { user } = useSimpleAuth();

  const [generatorState, setGeneratorState] = useState<LandingPageGeneratorState>({
    uploadedImages: [],
    generatedImages: [],
    isGenerating: false,
    isDragging: false,
    isUploading: false,
    uploadError: null,
    generationError: null,
    specs: {
      productName: '',
      productType: '',
      materials: '',
      additionalSpecs: '',
    },
    viewingImage: null,
    downloadingImages: new Set()
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const generatedResultsRef = useRef<HTMLDivElement>(null);

  // Handle hash navigation (for deep links from other pages)
  useEffect(() => {
    const handleHashNavigation = () => {
      if (window.location.hash === '#image-generator') {
        setTimeout(() => {
          const generatorSection = document.getElementById('image-generator');
          if (generatorSection) {
            generatorSection.scrollIntoView({ behavior: 'smooth' });
            
            // Track hash navigation to generator
            trackNavigation.scrollToGenerator({
              source: 'hash_navigation',
              currentPage: 'home'
            });
          }
        }, 100); // Small delay to ensure DOM is ready
      }
    };

    // Check on mount
    handleHashNavigation();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashNavigation);
    
    return () => {
      window.removeEventListener('hashchange', handleHashNavigation);
    };
  }, []);

  const updateGeneratorState = (updates: Partial<LandingPageGeneratorState>) => {
    setGeneratorState(prev => ({ ...prev, ...updates }));
  };

  // Image upload and generation functions
  const convertFileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result && typeof reader.result === 'string') {
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

  // Handle file upload
  const handleFileSelect = useCallback(async (files: FileList) => {
    if (!files.length) return;
    
    updateGeneratorState({ isUploading: true, uploadError: null });

    try {
      const newImages: UploadedImage[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} n'est pas un fichier image valide`);
        }
        
        const preview = URL.createObjectURL(file);
        const uploadedImage = Object.assign(file, {
          id: `${Date.now()}-${i}-${file.name}`,
          preview,
        }) as UploadedImage;
        
        newImages.push(uploadedImage);
      }
      
      updateGeneratorState({ 
        uploadedImages: [...generatorState.uploadedImages, ...newImages],
        isUploading: false 
      });

      // Track image upload
      trackImageGeneration.imageUploaded({
        imageCount: newImages.length,
        productType: generatorState.specs.productType,
        productName: generatorState.specs.productName
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      updateGeneratorState({ 
        uploadError: error instanceof Error ? error.message : 'Upload failed',
        isUploading: false 
      });
    }
  }, [generatorState.uploadedImages, generatorState.specs.productName, generatorState.specs.productType]);

  // Usage limiting hooks
  const { canGenerate, remainingGenerations, isLimitReached, environment, isAdminOverride } = useCanGenerate();
  const { recordGeneration } = useGenerationRecorder();
  const { resetUserUsage, usageData } = useUsageLimit();


  // Generate images
  const generateImages = async () => {
    if (generatorState.uploadedImages.length === 0) {
      updateGeneratorState({ generationError: 'Veuillez uploader au moins une image produit.' });
      return;
    }

    // Check usage limits before generation
    if (!canGenerate) {
      updateGeneratorState({ 
        generationError: 'Limite de générations atteinte. Contactez-nous pour plus de générations.' 
      });
      return;
    }

    updateGeneratorState({ isGenerating: true, generationError: null });

    const generationStartTime = Date.now();
    
    // Track generation start
    trackImageGeneration.generationStarted({
      referenceImageCount: generatorState.uploadedImages.length,
      productType: generatorState.specs.productType,
      productName: generatorState.specs.productName
    });

    try {
      const base64Images: Array<{ data: string; mimeType: string }> = [];
      for (const image of generatorState.uploadedImages) {
        try {
          const base64Result = await convertFileToBase64(image);
          base64Images.push(base64Result);
        } catch (error) {
          console.error(`Failed to convert image ${image.name}:`, error);
        }
      }

      if (base64Images.length === 0) {
        throw new Error('Impossible de traiter les images de référence.');
      }

      const apiPayload = {
        productSpecs: {
          productName: generatorState.specs.productName || 'Meuble',
          productType: generatorState.specs.productType || 'Mobilier',
          materials: generatorState.specs.materials || 'Bois',
          additionalSpecs: generatorState.specs.additionalSpecs || ''
        },
        referenceImages: base64Images,
        generationParams: {
          contextPreset: 'lifestyle',
          variations: 2,
          quality: 'high'
        }
      };

      const authHeaders = await getAuthHeaders();
      const response = await fetch('/api/generate-images-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-usage-count': (usageData?.generationCount || 0).toString(),
          'x-admin-override': isAdminOverride ? 'true' : 'false',
          ...authHeaders
        },
        body: JSON.stringify(apiPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Échec de la génération d\'images');
      }

      const result = await response.json();
      
      const newGeneratedImages: GeneratedImage[] = result.result.variations.map((variation: { 
        url: string; 
        prompt: string; 
        metadata: Record<string, unknown>
      }) => ({
        id: `landing_${Date.now()}_${variation.metadata.variation}`,
        url: variation.url,
        productConfigId: 'landing-page',
        settings: {
          contextPreset: 'lifestyle',
          variations: 2,
          quality: 'high'
        },
        specs: generatorState.specs,
        prompt: variation.prompt,
        generationSource: {
          method: 'direct-generation',
          model: variation.metadata.model,
          confidence: 1.0,
          referenceImageUsed: false
        },
        metadata: variation.metadata,
      }));

      updateGeneratorState({ 
        generatedImages: newGeneratedImages,
        isGenerating: false 
      });

      // Record the successful generation
      recordGeneration();

      // Track successful generation
      const generationTime = (Date.now() - generationStartTime) / 1000;
      trackImageGeneration.generationCompleted({
        generatedImageCount: newGeneratedImages.length,
        generationTime,
        productType: generatorState.specs.productType,
        productName: generatorState.specs.productName
      });

      // Auto-scroll to results after a brief delay to ensure DOM updates
      setTimeout(() => {
        if (generatedResultsRef.current) {
          generatedResultsRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);

    } catch (error) {
      console.error('Image generation failed:', error);
      
      // Track generation failure
      trackImageGeneration.generationFailed({
        errorType: 'generation_error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        productType: generatorState.specs.productType
      });
      
      updateGeneratorState({ 
        isGenerating: false,
        generationError: error instanceof Error ? error.message : 'Erreur inconnue' 
      });
    }
  };

  // Image download function
  const downloadImage = async (imageUrl: string, filename: string, imageId: string) => {
    // Pre-validate the URL
    const validation = validateImageUrl(imageUrl);
    if (!validation.isValid) {
      const errorMessage = `URL d'image invalide: ${validation.issues.join(', ')}`;
      console.error('[Client] URL validation failed:', validation);
      alert(`Échec du téléchargement: ${errorMessage}`);
      return;
    }
    
    const downloadFn = async () => {
      // Set downloading state
      updateGeneratorState({
        downloadingImages: new Set([...generatorState.downloadingImages, imageId])
      });

      console.log(`[Client] Starting download for: ${filename}`);
      console.log(`[Client] Image URL type: ${imageUrl.startsWith('data:') ? 'data URL' : 'HTTP URL'}`);
      
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
          throw new Error('Échec du traitement des données d\'image pour le téléchargement');
        }
      } else {
        // Handle HTTP URLs - use proxy API
        console.log('[Client] Using proxy API for HTTP URL download');
        
        const proxyUrl = `/api/download-image?url=${encodeURIComponent(imageUrl)}&filename=${encodeURIComponent(filename)}`;
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
          let errorMessage = `Échec du téléchargement: HTTP ${response.status}`;
          
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
            if (errorData.details) {
              errorMessage += ` - ${errorData.details}`;
            }
          } catch (jsonError) {
            console.error('[Client] Could not parse error response:', jsonError);
          }
          
          throw new Error(errorMessage);
        }
        
        blob = await response.blob();
      }
      
      if (blob.size === 0) {
        throw new Error('Le fichier téléchargé est vide');
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
      
      // Track successful download
      const imageIndex = generatorState.generatedImages.findIndex(img => img.id === imageId);
      trackImageGeneration.imageDownloaded({
        imageIndex: imageIndex >= 0 ? imageIndex : 0,
        productType: generatorState.specs.productType,
        filename
      });
    };
    
    try {
      await downloadWithRetry(downloadFn, 3, 1000);
    } catch (error) {
      const errorMessage = getDownloadErrorMessage(error);
      console.error('[Client] Download failed after retries:', error);
      
      // Show user-friendly error notification
      alert(`Échec du téléchargement: ${errorMessage}`);
      
    } finally {
      // Clear downloading state
      const newDownloadingImages = new Set(generatorState.downloadingImages);
      newDownloadingImages.delete(imageId);
      updateGeneratorState({ downloadingImages: newDownloadingImages });
    }
  };

  // Image view functions
  const viewImage = (image: GeneratedImage) => {
    updateGeneratorState({ viewingImage: image });
    
    // Track image view
    const imageIndex = generatorState.generatedImages.findIndex(img => img.id === image.id);
    trackImageGeneration.imageViewed({
      imageIndex: imageIndex >= 0 ? imageIndex : 0,
      productType: generatorState.specs.productType
    });
  };

  const closeImageView = () => {
    updateGeneratorState({ viewingImage: null });
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    updateGeneratorState({ isDragging: true });
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    updateGeneratorState({ isDragging: false });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    updateGeneratorState({ isDragging: false });
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  // Scroll to generator function
  const scrollToGenerator = () => {
    const generatorSection = document.getElementById('image-generator');
    if (generatorSection) {
      generatorSection.scrollIntoView({ behavior: 'smooth' });
      
      // Track scroll to generator
      trackNavigation.scrollToGenerator({
        source: 'hero_cta',
        currentPage: 'home'
      });
    }
  };

  // Dynamic Sliding Gallery Component
  const DynamicGallery = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    
    const furnitureData = [
      {
        name: 'Canapé moderne',
        category: 'Salon',
        beforeDescription: 'Photo basique fond blanc',
        afterDescription: 'Salon moderne éclairé premium',
        beforeImage: '/gallery/before/canape-moderne-before.jpg',
        afterImage: '/gallery/after/canape-moderne-after.jpg',
        slug: 'canape-moderne'
      },
      {
        name: 'Canapé cosy design',
        category: 'Salon',
        beforeDescription: 'Photo brute produit simple',
        afterDescription: 'Mise en scène dans un décor different',
        beforeImage: '/gallery/before/canape-cosy-before.jpg',
        afterImage: '/gallery/after/canape-cosy-design-after.jpg',
        slug: 'canape-cosy-design'
      },
      {
        name: 'Chaise de cuisine design',
        category: 'Chaise',
        beforeDescription: 'Image catalogue basique',
        afterDescription: 'Ambiance showroom moderne',
        beforeImage: '/gallery/before/chaise-moderne-before.jpg',
        afterImage: '/gallery/after/chaise-moderne-after.jpg',
        slug: 'fauteuil-scandinave'
      },
      {
        name: 'Lit',
        category: 'Lit',
        beforeDescription: 'Photo standard',
        afterDescription: 'Chambre design magazine premium',
        beforeImage: '/gallery/before/lit-before.jpg',
        afterImage: '/gallery/after/lit-after.jpg',
        slug: 'armoire-vintage'
      },
      {
        name: 'Caisson de bureau',
        category: 'Rangement',
        beforeDescription: 'Photo produit basique',
        afterDescription: 'Décor de bureau',
        beforeImage: '/gallery/before/caisson-bureau-before.jpg',
        afterImage: '/gallery/after/caisson-bureau-after.jpg',
        slug: 'commode-contemporaine'
      }
    ];

    const nextSlide = useCallback(() => {
      setCurrentSlide((prev) => (prev + 1) % furnitureData.length);
    }, [furnitureData.length]);

    const prevSlide = () => {
      setCurrentSlide((prev) => (prev - 1 + furnitureData.length) % furnitureData.length);
    };

    const goToSlide = (index: number) => {
      setCurrentSlide(index);
    };

    // Auto-play functionality
    useEffect(() => {
      if (!isAutoPlaying) return;
      
      const interval = setInterval(() => {
        nextSlide();
      }, 4000);

      return () => clearInterval(interval);
    }, [isAutoPlaying, currentSlide, nextSlide]);

    return (
      <div 
        className="relative w-full max-w-5xl mx-auto"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {/* Main Carousel Container */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-sophisticated-gray-900 shadow-premium">
          {/* Slides Container */}
          <div 
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {furnitureData.map((item, index) => (
              <div key={index} className="w-full flex-shrink-0">
                <div className="grid md:grid-cols-2 gap-0">
                  {/* Before Section */}
                  <div className="relative bg-sophisticated-gray-100 dark:bg-sophisticated-gray-800 aspect-[4/3] overflow-hidden">
                    <div className="absolute top-4 left-4 z-10">
                      <div className="bg-sophisticated-gray-600 text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
                        AVANT
                      </div>
                    </div>
                    {item.beforeImage ? (
                      <>
                        <Image
                          src={item.beforeImage}
                          alt={`${item.name} - Photo avant transformation`}
                          width={600}
                          height={450}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                          <h4 className="text-lg font-semibold text-white mb-1">
                            {item.name}
                          </h4>
                          <p className="text-sm text-white/80">
                            {item.beforeDescription}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center p-8">
                          <Package className="w-16 h-16 mx-auto mb-4 text-sophisticated-gray-400" />
                          <h4 className="text-lg font-semibold text-sophisticated-gray-700 dark:text-sophisticated-gray-300 mb-2">
                            {item.name}
                          </h4>
                          <p className="text-sm text-sophisticated-gray-500 dark:text-sophisticated-gray-400">
                            {item.beforeDescription}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* After Section */}
                  <div className="relative bg-sophisticated-gray-50 dark:from-sophisticated-gray-700 dark:via-sophisticated-gray-600 dark:to-sophisticated-gray-700 aspect-[4/3] overflow-hidden">
                    <div className="absolute top-4 right-4 z-10">
                      <div className="bg-gradient-ocean-deep text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide shadow-lg">
                        AVEC PIKTOR
                      </div>
                    </div>
                    {item.afterImage ? (
                      <>
                        <Image
                          src={item.afterImage}
                          alt={`${item.name} - Photo après transformation avec Piktor`}
                          width={600}
                          height={450}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-gradient-ocean-deep rounded-lg flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <h4 className="text-lg font-semibold text-white">
                              {item.name} Premium
                            </h4>
                          </div>
                          <p className="text-sm text-white/80 font-medium">
                            {item.afterDescription}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center p-8">
                          <div className="relative">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-ocean-deep rounded-xl flex items-center justify-center">
                              <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-4 h-4 bg-warm-gold-400 rounded-full animate-ping"></div>
                          </div>
                          <h4 className="text-lg font-semibold text-sophisticated-gray-800 dark:text-sophisticated-gray-200 mb-2">
                            {item.name} Premium
                          </h4>
                          <p className="text-sm text-ocean-blue-700 dark:text-ocean-blue-300 font-medium">
                            {item.afterDescription}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 dark:bg-sophisticated-gray-800/90 rounded-full shadow-lg flex items-center justify-center text-sophisticated-gray-700 dark:text-sophisticated-gray-300 hover:bg-white dark:hover:bg-sophisticated-gray-700 transition-all duration-200 backdrop-blur-sm"
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 dark:bg-sophisticated-gray-800/90 rounded-full shadow-lg flex items-center justify-center text-sophisticated-gray-700 dark:text-sophisticated-gray-300 hover:bg-white dark:hover:bg-sophisticated-gray-700 transition-all duration-200 backdrop-blur-sm"
            aria-label="Next slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Slide Indicators */}
        <div className="flex justify-center mt-6 space-x-2">
          {furnitureData.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                index === currentSlide
                  ? "bg-gradient-ocean-deep scale-125"
                  : "bg-sophisticated-gray-300 dark:bg-sophisticated-gray-600 hover:bg-ocean-blue-400 dark:hover:bg-ocean-blue-500"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sophisticated-gray-50 via-white to-ocean-blue-50/30 dark:from-sophisticated-gray-950 dark:via-sophisticated-gray-900 dark:to-sophisticated-gray-800 overflow-x-hidden">
      
      {/* Hero Section */}
      <section className="w-full px-4 py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 animate-fade-in">
          <div className="mb-6">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-ocean-blue-100 to-warm-gold-100 border border-ocean-blue-300 rounded-full text-sm font-medium text-ocean-blue-800 dark:from-ocean-blue-900/70 dark:to-warm-gold-900/70 dark:border-ocean-blue-600 dark:text-ocean-blue-200 shadow-sm">
              <Sparkles className="w-4 h-4 mr-2 animate-pulse text-warm-gold-600 dark:text-warm-gold-400" />
              Créez. Déclinez. Publiez.
            </div>
          </div>
          
          <h1 className="text-4xl md:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-br from-sophisticated-gray-900 via-ocean-blue-800 to-sophisticated-gray-700 bg-clip-text text-transparent dark:from-sophisticated-gray-100 dark:via-ocean-blue-300 dark:to-sophisticated-gray-300 leading-tight">
            Vos visuels produit
            <span className="block text-ocean-blue-600 dark:text-ocean-blue-400 font-bold">ultra-réalistes en 10 secondes&nbsp;!</span>
          </h1>
          
          <p className="text-xl font-semibold md:text-2xl text-sophisticated-gray-600 dark:text-sophisticated-gray-400 mb-8 max-w-4xl mx-auto leading-relaxed">
          Sans studio. Sans shooting. Illimité.
          </p>
          
          {/* <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-sophisticated-gray-600 dark:text-sophisticated-gray-400 mb-10">
            <div className="flex items-center gap-2 bg-white/80 dark:bg-sophisticated-gray-800/80 px-4 py-3 rounded-lg backdrop-blur border border-sophisticated-gray-200/50 dark:border-sophisticated-gray-700/50 shadow-sm">
              <Euro className="w-4 h-4 text-success" />
              <span className="font-medium">0€ de shooting</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 dark:bg-sophisticated-gray-800/80 px-4 py-3 rounded-lg backdrop-blur border border-sophisticated-gray-200/50 dark:border-sophisticated-gray-700/50 shadow-sm">
              <Target className="w-4 h-4 text-ocean-blue-600" />
              <span className="font-medium">Visuels illimités</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 dark:bg-sophisticated-gray-800/80 px-4 py-3 rounded-lg backdrop-blur border border-sophisticated-gray-200/50 dark:border-sophisticated-gray-700/50 shadow-sm">
              <Clock className="w-4 h-4 text-warm-gold-600" />
              <span className="font-medium">Résultats en moins de 10 secondes</span>
            </div>
          </div> */}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Button
              onClick={() => {
                if (user) {
                  router.push('/dashboard');
                } else {
                  router.push('/auth/signup');
                }
              }}
              size="xl"
              className="bg-gradient-ocean-deep hover:opacity-90 text-white shadow-premium animate-scale-in font-bold group w-full sm:w-auto max-w-sm transition-all duration-200 hover:scale-105"
            >
              {user ? 'Accéder au dashboard' : 'Tester gratuitement maintenant'}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <p className="text-sm text-sophisticated-gray-500 dark:text-sophisticated-gray-400">
            {user ? 'Créez vos visuels en quelques clics' : 'Inscription gratuite - Aucune carte bancaire requise'}
          </p>
          </div>
        </div>
      </section>

      {/* CTA Teaser Section 
      <section className="w-full px-4 py-8 sm:py-12">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center bg-gradient-to-r from-ocean-blue-50 to-warm-gold-50 dark:from-sophisticated-gray-900 dark:to-sophisticated-gray-800 p-6 sm:p-8 rounded-2xl border border-sophisticated-gray-200/50 dark:border-sophisticated-gray-700/50 animate-fade-in">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 text-sophisticated-gray-900 dark:text-sophisticated-gray-100">
              Voyez la différence sur <span className="text-ocean-blue-600 dark:text-ocean-blue-400 font-semibold">VOS produits</span>
            </h2>
            <Button 
              onClick={scrollToGenerator}
              variant="outline" 
              size="lg" 
              className="font-semibold group hover:border-ocean-blue-500 hover:bg-ocean-blue-50 dark:hover:bg-ocean-blue-900/20 w-full sm:w-auto max-w-xs"
            >
              Transformer ma photo
              <Camera className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
            </Button>
          </div>
        </div>
      </section> */}

      {/* Dynamic Before/After Gallery */}
      <section className="w-full px-4 py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-br from-ocean-blue-800 via-ocean-blue-600 to-warm-gold-600 bg-clip-text text-transparent dark:from-ocean-blue-300 dark:via-ocean-blue-400 dark:to-warm-gold-400 px-2">
              De la photo basique au visuel showroom
            </h2>
          </div>
          
          {/* Dynamic Sliding Gallery */}
          <DynamicGallery />
          
          {/* <div className="text-center mt-12">
            <div className="inline-block">
              <p className="text-base sm:text-lg font-medium text-sophisticated-gray-700 dark:text-sophisticated-gray-300 bg-white/50 dark:bg-sophisticated-gray-800/50 px-4 sm:px-6 py-3 rounded-lg border border-sophisticated-gray-200/50 dark:border-sophisticated-gray-700/50">
                Même qualité professionnelle, même rapidité pour <span className="text-ocean-blue-600 dark:text-ocean-blue-400 font-bold">TOUS vos meubles</span>
              </p>
            </div>
          </div> */}
        </div>
      </section>

      {/* Image Generator Tool - Hidden */}
      {false && (
        <section id="image-generator" className="w-full px-4 py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-br from-ocean-blue-800 via-ocean-blue-600 to-warm-gold-600 bg-clip-text text-transparent dark:from-ocean-blue-300 dark:via-ocean-blue-400 dark:to-warm-gold-400 px-2">
              Testez maintenant avec <span className="text-ocean-blue-600 dark:text-ocean-blue-400 font-semibold">VOTRE produit</span>
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
          {/* Usage Information Display */}
          {environment === 'production' && !isAdminOverride && (
            <div className="mb-6">
              <div className="bg-white dark:bg-sophisticated-gray-800 p-4 rounded-lg border border-ocean-blue-200 dark:border-ocean-blue-700 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold",
                      canGenerate ? "bg-success-500" : "bg-sophisticated-gray-400"
                    )}>
                      {remainingGenerations}
                    </div>
                    <div>
                      <p className="font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100">
                        {canGenerate 
                          ? `${remainingGenerations} génération${remainingGenerations > 1 ? 's' : ''} restante${remainingGenerations > 1 ? 's' : ''}`
                          : 'Limite atteinte'
                        }
                      </p>
                      <p className="text-sm text-sophisticated-gray-600 dark:text-sophisticated-gray-400">
                        Essai gratuit • {usageData?.generationCount || 0}/5 générations utilisées
                      </p>
                    </div>
                  </div>
                  {!canGenerate && (
                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Contactez-nous</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Show usage limit reached component or generator */}
          {isLimitReached && generatorState.generatedImages.length === 0 ? (
            <UsageLimitReached 
              generationCount={usageData?.generationCount || 5}
              maxGenerations={5}
              environment={environment}
              onReset={environment === 'development' ? resetUserUsage : undefined}
            />
          ) : generatorState.generatedImages.length === 0 ? (
            <Card className="p-8 border-ocean-blue-200/50 dark:border-ocean-blue-800/50 shadow-lg">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold mb-2">
                  Glissez vos photos ICI
                </CardTitle>
                <CardDescription className="text-lg">
                  <span className="font-bold">Astuce</span>&nbsp;: choisissez une image claire, produit entier et bien visible, de préférence sur un fond uni.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Upload Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer hover:shadow-md",
                    generatorState.isDragging 
                      ? "border-ocean-blue-500 bg-gradient-to-br from-ocean-blue-50 to-warm-gold-50 dark:bg-gradient-to-br dark:from-ocean-blue-900/30 dark:to-warm-gold-900/30 shadow-md" 
                      : "border-sophisticated-gray-300 dark:border-sophisticated-gray-600 hover:border-ocean-blue-400 hover:bg-gradient-to-br hover:from-ocean-blue-50/70 hover:to-warm-gold-50/70 dark:hover:bg-gradient-to-br dark:hover:from-ocean-blue-900/20 dark:hover:to-warm-gold-900/20"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-sophisticated-gray-400" />
                  <p className="text-lg font-medium text-sophisticated-gray-700 dark:text-sophisticated-gray-300 mb-2">
                    Glissez votre photo ici ou cliquez pour sélectionner
                  </p>
                  <p className="text-sm text-sophisticated-gray-500 dark:text-sophisticated-gray-400">
                    JPG, PNG, HEIC acceptés
                  </p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                    className="hidden"
                  />
                </div>

                {/* Uploaded Images */}
                {generatorState.uploadedImages.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100">
                      Images uploadées:
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {generatorState.uploadedImages.map((image) => (
                        <div key={image.id} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-sophisticated-gray-100 dark:bg-sophisticated-gray-800">
                            <Image
                              src={image.preview}
                              alt={image.name}
                              width={200}
                              height={200}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            onClick={() => {
                              URL.revokeObjectURL(image.preview);
                              updateGeneratorState({
                                uploadedImages: generatorState.uploadedImages.filter(img => img.id !== image.id)
                              });
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Specs */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="productName">Nom du produit</Label>
                    <Input
                      id="productName"
                      placeholder="ex: Canapé 3 places"
                      value={generatorState.specs.productName}
                      onChange={(e) => updateGeneratorState({
                        specs: { ...generatorState.specs, productName: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="productType">Type du produit</Label>
                    <Input
                      id="productType"
                      placeholder="ex: Canapé, Chaise, Table..."
                      value={generatorState.specs.productType}
                      onChange={(e) => updateGeneratorState({
                        specs: { ...generatorState.specs, productType: e.target.value }
                      })}
                    />
                  </div>
                </div>

                {/* Generation Process Steps */}
                <div className="bg-white dark:bg-sophisticated-gray-800 p-6 rounded-xl border border-ocean-blue-200/50 dark:border-ocean-blue-800/50 shadow-sm">
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-gradient-ocean-deep text-white rounded-full flex items-center justify-center mx-auto font-bold shadow-lg">1</div>
                      <p className="text-sm font-medium">Uploadez votre photo produit</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-gradient-ocean-deep text-white rounded-full flex items-center justify-center mx-auto font-bold shadow-lg">2</div>
                      <p className="text-sm font-medium">Attendez 10 secondes</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-gradient-ocean-deep text-white rounded-full flex items-center justify-center mx-auto font-bold shadow-lg">3</div>
                      <p className="text-sm font-medium">Découvrez votre visuel</p>
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <div className="text-center">
                  <Button
                    onClick={generateImages}
                    disabled={generatorState.uploadedImages.length === 0 || generatorState.isGenerating || !canGenerate}
                    size="xl"
                    className="bg-gradient-ocean-deep hover:opacity-90 text-white shadow-premium font-bold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {generatorState.isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Magie en cours...
                      </>
                    ) : !canGenerate ? (
                      <>
                        <AlertCircle className="w-5 h-5 mr-2" />
                        Limite atteinte - Nous contacter
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        Découvrir mon visuel
                      </>
                    )}
                  </Button>
                </div>

                {/* Errors */}
                {(generatorState.uploadError || generatorState.generationError) && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
                    <p className="text-red-600 dark:text-red-400">
                      {generatorState.uploadError || generatorState.generationError}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Generated Results */
            <div ref={generatedResultsRef} className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-ocean-deep text-white rounded-full text-sm font-medium shadow-lg mb-4">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Génération terminée !
                </div>
                <h3 className="text-2xl font-bold text-sophisticated-gray-900 dark:text-sophisticated-gray-100 mb-2">
                  Votre visuel est prêt !
                </h3>
                <p className="text-sophisticated-gray-600 dark:text-sophisticated-gray-400">
                  Bluffant, non ? Et ce n’est qu’un aperçu.
                </p>
              </div>

              <div className={cn(
                "grid gap-6 justify-items-center",
                generatorState.generatedImages.length === 1 ? "grid-cols-1 max-w-md mx-auto" : "md:grid-cols-2"
              )}>
                {generatorState.generatedImages.map((image, index) => (
                  <Card key={image.id} className="overflow-hidden">
                    <div className="aspect-square bg-sophisticated-gray-100 dark:bg-sophisticated-gray-800">
                      <Image
                        src={image.url}
                        alt={`Visuel généré ${index + 1}`}
                        width={600}
                        height={600}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100">
                            Visuel {index + 1}
                          </p>
                          <p className="text-sm text-sophisticated-gray-600 dark:text-sophisticated-gray-400">
                            Style lifestyle moderne
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-gradient-ocean-deep text-white border-none">
                          Premium
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => viewImage(image)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Voir
                        </Button>
                        <Button
                          onClick={() => {
                            const filename = generateSafeFilename(
                              generatorState.specs.productName || 'Meuble',
                              'lifestyle',
                              index + 1,
                              'jpg'
                            );
                            downloadImage(image.url, filename, image.id);
                          }}
                          variant="default"
                          size="sm"
                          className="flex-1"
                          disabled={generatorState.downloadingImages.has(image.id)}
                        >
                          {generatorState.downloadingImages.has(image.id) ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4 mr-2" />
                          )}
                          {generatorState.downloadingImages.has(image.id) ? 'Téléchargement...' : 'Télécharger'}
                        </Button>
                      </div>
                      <div className="mt-3 pt-3 border-t border-sophisticated-gray-200 dark:border-sophisticated-gray-700">
                        <GenerationEvaluation
                          imageId={image.id}
                          productType={generatorState.specs.productType}
                          productName={generatorState.specs.productName}
                          imageIndex={index}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center space-y-4">
                <Button
                  onClick={() => updateGeneratorState({
                    uploadedImages: [],
                    generatedImages: [],
                    specs: { productName: '', productType: '', materials: '', additionalSpecs: '' },
                    viewingImage: null,
                    downloadingImages: new Set(),
                    generationError: null,
                    uploadError: null
                  })}
                  variant="outline"
                  size="lg"
                >
                  Tester avec une autre photo
                </Button>
                <Button asChild size="lg" className="bg-gradient-ocean-deep hover:opacity-90 text-white shadow-premium ml-2 font-bold w-full sm:w-auto max-w-xs transition-all duration-200 hover:scale-105">
                  <Link 
                    href="https://calendar.notion.so/meet/hassanhouaiss/piktor"
                    onClick={() => trackConversion.demoBookingClicked({
                      location: 'generator_result',
                      hasGeneratedImages: true,
                      generationCount: generatorState.generatedImages.length
                    })}
                  >
                    Réserver ma démo
                  </Link>
                </Button>
              </div>
            </div>
          )}
          </div>
        </div>
      </section>
      )}

      {/* Demo CTA Section */}
      <section className="w-full px-4 py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto max-w-7xl">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-ocean-blue-900 via-ocean-blue-800 to-sophisticated-gray-900"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(2,132,199,0.3),transparent_70%)]"></div>
            <div className="relative text-center p-8 sm:p-12 lg:p-16 rounded-2xl backdrop-blur-sm animate-fade-in">
              
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-6 text-white">
                Prêt à révolutionner vos 
                <span className="block bg-gradient-to-r from-warm-gold-400 via-warm-gold-300 to-ocean-blue-300 bg-clip-text text-transparent">visuels mobilier ?</span>
              </h2>
              
              <p className="text-lg sm:text-xl text-sophisticated-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed">
                Découvrez comment nos clients <span className="text-warm-gold-400 font-semibold">génèrent +40% de conversions</span> avec des catalogues premium
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Button asChild size="xl" className="bg-gradient-ocean-deep hover:opacity-90 text-white shadow-premium font-bold w-full sm:w-auto max-w-xs transition-all duration-200 hover:scale-105">
                  <Link 
                    href="https://calendar.notion.so/meet/hassanhouaiss/piktor"
                    onClick={() => trackConversion.demoBookingClicked({
                      location: 'cta_section',
                      hasGeneratedImages: generatorState.generatedImages.length > 0,
                      generationCount: generatorState.generatedImages.length
                    })}
                  >
                    Réserver ma démo
                  </Link>
                </Button>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-sophisticated-gray-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-warm-gold-300" />
                  <span>Démo sur VOS produits</span>
                </div>
                <span className="hidden sm:block">•</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-warm-gold-300" />
                  <span>Conseils personnalisés</span>
                </div>
                <span className="hidden sm:block">•</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-warm-gold-300" />
                  <span>Tarifs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Image View Modal */}
      {generatorState.viewingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in" onClick={closeImageView}>
          <div className="relative max-w-4xl max-h-[90vh] mx-4" onClick={(e) => e.stopPropagation()}>
            <Button
              onClick={closeImageView}
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white hover:text-sophisticated-gray-300 hover:bg-white/10"
            >
              <X className="w-6 h-6" />
            </Button>
            
            <div className="bg-white dark:bg-sophisticated-gray-900 rounded-lg overflow-hidden shadow-premium">
              <div className="aspect-auto">
                <Image
                  src={generatorState.viewingImage.url}
                  alt="Visuel en taille réelle"
                  width={1200}
                  height={800}
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100">
                      Visuel Premium - Style Lifestyle
                    </h3>
                    <p className="text-sm text-sophisticated-gray-600 dark:text-sophisticated-gray-400">
                      {generatorState.specs.productName || 'Meuble'} - Généré par IA
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-gradient-ocean-deep text-white border-none">
                    Premium
                  </Badge>
                </div>
                <div className="flex gap-3 mb-4">
                  <Button
                    onClick={() => {
                      const filename = generateSafeFilename(
                        generatorState.specs.productName || 'Meuble',
                        'lifestyle',
                        1,
                        'jpg'
                      );
                      downloadImage(generatorState.viewingImage!.url, filename, generatorState.viewingImage!.id);
                    }}
                    variant="default"
                    className="flex-1"
                    disabled={generatorState.downloadingImages.has(generatorState.viewingImage.id)}
                  >
                    {generatorState.downloadingImages.has(generatorState.viewingImage.id) ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Téléchargement...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger en haute qualité
                      </>
                    )}
                  </Button>
                  <Button onClick={closeImageView} variant="outline">
                    Fermer
                  </Button>
                </div>
                <div className="pt-3 border-t border-sophisticated-gray-200 dark:border-sophisticated-gray-700">
                  <GenerationEvaluation
                    imageId={generatorState.viewingImage.id}
                    productType={generatorState.specs.productType}
                    productName={generatorState.specs.productName}
                    imageIndex={generatorState.generatedImages.findIndex(img => img.id === generatorState.viewingImage!.id)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main component with usage limit provider
export default function Home() {
  return (
    <UsageLimitProvider 
      initialConfig={{
        maxGenerations: 5,
        trackingMethod: 'localStorage',
        storageKey: 'piktor_usage_data',
        adminBypassKey: 'piktor_admin_bypass'
      }}
    >
      <HomeContent />
    </UsageLimitProvider>
  );
}
