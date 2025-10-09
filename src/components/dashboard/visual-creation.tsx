"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FlexibleStepper } from "@/components/ui/flexible-stepper";
import { 
  Upload, 
  Sparkles, 
  Download,
  Eye,
  ArrowLeft,
  ArrowRight,
  Settings,
  Palette,
  Camera,
  Sun,
  Home,
  Briefcase,
  Coffee,
  Bed,
  Check,
  X,
  Loader2,
  Plus,
  AlertCircle
} from "lucide-react";
import { trackEvent, trackImageGeneration } from "@/lib/analytics";
import { authenticatedPost } from "@/lib/api-client";
import { ProductSpecs, GeneratedImage as GeneratedImageType } from "@/components/image-generator/types";
import { validateImageUrl, generateSafeFilename, getDownloadErrorMessage, downloadWithRetry } from "@/lib/download-utils";
import { cn } from "@/lib/utils";
import { UsageLimitProvider, useUsageLimit, useCanGenerate, useGenerationRecorder } from "@/contexts/UsageLimitContext";
import { UsageLimitReached } from "@/components/UsageLimitReached";
import { GenerationEvaluation } from "@/components/GenerationEvaluation";

interface UploadedImage {
  id: string;
  file: File;
  url: string;
  name: string;
}

interface GenerationSettings {
  style: string;
  environment: string;
  lighting: string;
  angle: string;
  format: string; // Changed to single format selection
  customPrompt?: string;
}

// Use the type from the main image generator types
type DashboardGeneratedImage = GeneratedImageType;

const styleOptions = [
  { value: "moderne", label: "Moderne", description: "Design épuré et contemporain" },
  { value: "rustique", label: "Rustique", description: "Style campagne et authentique" },
  { value: "industriel", label: "Industriel", description: "Béton, métal et esprit loft" },
  { value: "scandinave", label: "Scandinave", description: "Minimalisme nordique" },
  { value: "boheme", label: "Bohème", description: "Éclectique et artistique" }
];

const environmentOptions = [
  { value: "salon", label: "Salon", icon: Home },
  { value: "bureau", label: "Bureau", icon: Briefcase },
  { value: "cuisine", label: "Cuisine", icon: Coffee },
  { value: "chambre", label: "Chambre", icon: Bed },
  { value: "studio", label: "Studio photo", icon: Camera }
];

const lightingOptions = [
  { value: "naturelle", label: "Naturelle", description: "Lumière du jour douce" },
  { value: "chaleureuse", label: "Chaleureuse", description: "Ambiance cosy" },
  { value: "professionnelle", label: "Professionnelle", description: "Éclairage studio" }
];

const angleOptions = [
  { value: "face", label: "Face", description: "Vue frontale" },
  { value: "trois-quarts", label: "3/4", description: "Angle dynamique" },
  { value: "profile", label: "Profil", description: "Vue de côté" },
  { value: "plongee", label: "Plongée", description: "Vue du dessus" }
];

// Meilleurs formats pour les visuels meubles e-commerce
const formatOptions = [
  { value: "square-format", label: "Format carré", size: "1:1", aspectRatio: "1:1", description: "Packshot produit, post Instagram" },
  { value: "instagram-story", label: "Story Instagram", size: "9:16", aspectRatio: "9:16", description: "Format vertical mobile" },
  { value: "lifestyle-horizontal", label: "Lifestyle Horizontal", size: "3:2", aspectRatio: "3:2", description: "Catalogues et bannières" }
];

const steps = [
  {
    step: 1,
    title: "Téléchargement",
    description: "Ajoutez vos photos produit",
    icon: Upload,
    status: 'current' as const,
    isAccessible: true
  },
  {
    step: 2,
    title: "Personnalisation",
    description: "Configurez le style et l'ambiance",
    icon: Settings,
    status: 'pending' as const,
    isAccessible: false
  },
  {
    step: 3,
    title: "Génération",
    description: "Créez vos visuels IA",
    icon: Sparkles,
    status: 'pending' as const,
    isAccessible: false
  }
];

// Internal component that uses the usage limit hooks
function VisualCreationContent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [productName, setProductName] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [settings, setSettings] = useState<GenerationSettings>({
    style: "",
    environment: "",
    lighting: "",
    angle: "",
    format: "square-format" // Default format (single selection)
  });
  const [generatedImages, setGeneratedImages] = useState<DashboardGeneratedImage[]>([]);
  const [downloadingImages, setDownloadingImages] = useState<Set<string>>(new Set());
  const [viewingImage, setViewingImage] = useState<DashboardGeneratedImage | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState("");

  // Usage limiting hooks
  const { canGenerate, remainingGenerations, isLimitReached, environment, isAdminOverride } = useCanGenerate();
  const { recordGeneration } = useGenerationRecorder();
  const { resetUserUsage, usageData } = useUsageLimit();

  // Restore state from localStorage on mount
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    try {
      const savedState = localStorage.getItem('piktor_creation_state');
      if (savedState) {
        const parsed = JSON.parse(savedState);

        // Only restore if we have generated images
        if (parsed.generatedImages && parsed.generatedImages.length > 0) {
          setCurrentStep(3); // Go to generation step
          setProductName(parsed.productName || "");
          setProductCategory(parsed.productCategory || "");
          setSettings(parsed.settings || {
            style: "",
            environment: "",
            lighting: "",
            angle: "",
            format: "square-format"
          });
          setGeneratedImages(parsed.generatedImages || []);
        }
      }
    } catch (error) {
      console.error('Error restoring creation state:', error);
    }
  }, []);

  // Save state to localStorage whenever generated images change
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    if (generatedImages.length > 0) {
      try {
        const stateToSave = {
          productName,
          productCategory,
          settings,
          generatedImages,
          timestamp: Date.now()
        };
        localStorage.setItem('piktor_creation_state', JSON.stringify(stateToSave));
      } catch (error) {
        console.error('Error saving creation state:', error);
      }
    }
  }, [generatedImages, productName, productCategory, settings]);

  // Base64 conversion function
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

  // Helper function to map dashboard settings to context presets
  const determineContextFromSettings = (settings: GenerationSettings) => {
    // Map environment and format to appropriate context
    if (settings.environment === 'studio') return 'packshot';
    if (settings.format === 'square-format') return 'social_media_square';
    if (settings.format === 'instagram-story') return 'social_media_story';
    if (settings.format === 'lifestyle-horizontal') return 'hero';

    // Default based on environment
    if (settings.environment === 'salon' || settings.environment === 'chambre' || settings.environment === 'cuisine') {
      return 'lifestyle';
    }

    return 'lifestyle'; // Safe default
  };

  const handleFileUpload = useCallback((files: FileList) => {
    setUploadError(null);
    const newImages: UploadedImage[] = [];
    
    try {
      Array.from(files).forEach((file) => {
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} n'est pas un fichier image valide`);
        }
        
        const id = Math.random().toString(36).substr(2, 9);
        const url = URL.createObjectURL(file);
        
        newImages.push({
          id,
          file,
          url,
          name: file.name
        });
      });
      
      if (newImages.length > 0) {
        setUploadedImages(prev => [...prev, ...newImages]);
        
        trackImageGeneration.imageUploaded({
          imageCount: newImages.length,
          productType: productCategory || undefined,
          productName: productName || undefined
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    }
  }, [productCategory, productName]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeImage = (id: string) => {
    setUploadedImages(prev => {
      const updated = prev.filter(img => img.id !== id);
      const removedImage = prev.find(img => img.id === id);
      if (removedImage) {
        URL.revokeObjectURL(removedImage.url);
      }
      return updated;
    });
    
    trackEvent('image_removed', {
      event_category: 'generator',
      event_label: 'upload_step'
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      
      trackEvent('creation_step_next', {
        event_category: 'generator',
        event_label: `step_${currentStep}_to_${currentStep + 1}`
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      
      trackEvent('creation_step_back', {
        event_category: 'generator',
        event_label: `step_${currentStep}_to_${currentStep - 1}`
      });
    }
  };

  const handleGenerate = async () => {
    if (uploadedImages.length === 0) {
      setGenerationError('Veuillez uploader au moins une image produit.');
      return;
    }

    if (!productName.trim()) {
      setGenerationError('Veuillez saisir le nom du produit.');
      return;
    }

    // Check usage limits before generation
    if (!canGenerate) {
      setGenerationError('Limite de générations atteinte. Contactez-nous pour plus de générations.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationProgress(0);
    setGenerationMessage("Préparation de votre visuel...");

    // Animation progress
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 95) return 95; // Stop at 95% until real completion
        return prev + 1;
      });
    }, 100); // Update every 100ms for smooth animation (10 seconds to reach 95%)

    // Update messages based on progress
    const messageInterval = setInterval(() => {
      setGenerationProgress(curr => {
        if (curr < 30) setGenerationMessage("Analyse de vos images...");
        else if (curr < 60) setGenerationMessage("Création de votre visuel...");
        else if (curr < 90) setGenerationMessage("Application des paramètres...");
        else setGenerationMessage("Piktor applique les dernières touches...");
        return curr;
      });
    }, 3000); // Change message every 3 seconds

    const generationStartTime = Date.now();
    
    trackImageGeneration.generationStarted({
      referenceImageCount: uploadedImages.length,
      productType: productCategory || undefined,
      productName: productName || undefined
    });

    try {
      // Convert uploaded images to base64
      const base64Images: Array<{ data: string; mimeType: string }> = [];
      for (const image of uploadedImages) {
        try {
          const base64Result = await convertFileToBase64(image.file);
          base64Images.push(base64Result);
        } catch (error) {
          console.error(`Failed to convert image ${image.name}:`, error);
        }
      }

      if (base64Images.length === 0) {
        throw new Error('Impossible de traiter les images de référence.');
      }

      // Create enhanced product specs with dashboard personalization
      const productSpecs: ProductSpecs = {
        productName: productName || 'Meuble',
        productType: productCategory || settings.environment || 'Mobilier',
        materials: 'Divers', // Can be enhanced later
        additionalSpecs: settings.customPrompt || ''
      };

      // Create dashboard-specific payload that includes personalization
      const dashboardPayload = {
        productProfile: {
          productName: productName || 'Meuble',
          productCategory: productCategory || 'autre',
          uploadedImages: uploadedImages.map(img => ({
            id: img.id,
            file: img.file,
            url: img.url,
            name: img.name
          }))
        },
        settings: {
          style: settings.style || 'moderne',
          environment: settings.environment || 'salon',
          lighting: settings.lighting || 'naturelle',
          angle: settings.angle || 'trois-quarts',
          formats: [settings.format], // Single format wrapped in array for API compatibility
          customPrompt: settings.customPrompt
        },
        referenceImages: base64Images
      };

      // Try dashboard API first for enhanced personalization
      let response;
      try {
        // Build headers - only include admin override if explicitly enabled
        const headers: Record<string, string> = {
          'x-usage-count': (usageData?.generationCount || 0).toString(),
        };

        // Only send admin override header when explicitly enabled (not false)
        if (isAdminOverride) {
          headers['x-admin-override'] = 'true';
        }

        response = await authenticatedPost('/api/generate-dashboard-images', dashboardPayload, headers);

        if (!response.ok) {
          console.warn('Dashboard API failed, falling back to direct generation');
          throw new Error('Dashboard API not available');
        }
      } catch {
        console.log('Falling back to direct generation API with enhanced context');

        // Fallback to direct generation with enhanced context
        const fallbackPayload = {
          productSpecs,
          referenceImages: base64Images,
          generationParams: {
            contextPreset: determineContextFromSettings(settings),
            variations: 1, // Single format = single variation
            quality: 'high'
          }
        };

        // Build headers - only include admin override if explicitly enabled
        const fallbackHeaders: Record<string, string> = {
          'x-usage-count': (usageData?.generationCount || 0).toString(),
        };

        // Only send admin override header when explicitly enabled (not false)
        if (isAdminOverride) {
          fallbackHeaders['x-admin-override'] = 'true';
        }

        response = await authenticatedPost('/api/generate-images-direct', fallbackPayload, fallbackHeaders);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Échec de la génération d\'images');
      }

      const result = await response.json();
      
      // Check if this is a dashboard API response or direct API response
      const isDashboardResponse = result.success !== undefined;
      let variations, generationMethod = 'unknown';
      
      if (isDashboardResponse) {
        // Dashboard API response
        variations = result.result?.variations || [];
        generationMethod = result.result?.dashboardMetadata?.generationMethod || 'dashboard';
        
        // Log dashboard-specific feedback
        if (result.result?.feedback) {
          console.log('Dashboard generation feedback:', result.result.feedback);
          
          // Show warnings to user if any
          if (result.result.feedback.warnings?.length > 0) {
            console.warn('Generation warnings:', result.result.feedback.warnings);
          }
        }
      } else {
        // Direct API response (fallback)
        variations = result.result?.variations || [];
        generationMethod = 'direct-fallback';
      }
      
      // Transform API response to dashboard format
      const newGeneratedImages: DashboardGeneratedImage[] = variations.map((variation: { 
        url: string; 
        prompt: string; 
        metadata: Record<string, unknown>;
        format?: string;
      }, index: number) => ({
        id: `dashboard_${Date.now()}_${index}`,
        url: variation.url,
        productConfigId: 'dashboard-create',
        settings: {
          contextPreset: determineContextFromSettings(settings),
          backgroundStyle: settings.environment || 'lifestyle',
          productPosition: 'center' as const,
          lighting: 'studio_softbox' as const,
          strictMode: false,
          quality: 'high' as const,
          variations: 2 as const,
          props: []
        },
        specs: productSpecs,
        prompt: variation.prompt,
        generationSource: {
          method: generationMethod,
          model: variation.metadata?.model as string || 'google-nano-banana',
          confidence: 1.0,
          referenceImageUsed: true
        },
        metadata: {
          model: variation.metadata?.model as string || 'google-nano-banana',
          timestamp: new Date().toISOString(),
          size: '1536x1024',
          quality: 'high',
          variation: index + 1,
          contextPreset: determineContextFromSettings(settings),
          processingTime: (Date.now() - generationStartTime) / 1000,
          // Dashboard personalization metadata
          dashboardPersonalization: {
            style: settings.style,
            environment: settings.environment,
            lighting: settings.lighting,
            angle: settings.angle,
            format: variation.format || settings.format,
            customInstructions: settings.customPrompt,
            generationMethod: generationMethod,
            isDashboardEnhanced: isDashboardResponse
          }
        }
      }));

      // Complete the progress animation
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      setGenerationProgress(100);
      setGenerationMessage("Visuel créé avec succès !");

      setGeneratedImages(newGeneratedImages);

      // Record the successful generation
      recordGeneration();

      // Track successful generation
      const generationTime = (Date.now() - generationStartTime) / 1000;
      trackImageGeneration.generationCompleted({
        generatedImageCount: newGeneratedImages.length,
        generationTime,
        productType: productCategory || undefined,
        productName: productName || undefined
      });

    } catch (error) {
      console.error('Generation failed:', error);

      // Clear intervals on error
      clearInterval(progressInterval);
      clearInterval(messageInterval);

      trackImageGeneration.generationFailed({
        errorType: 'api_error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        productType: productCategory || undefined
      });

      setGenerationError(error instanceof Error ? error.message : 'Erreur inconnue');

    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationMessage("");
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
      setDownloadingImages(prev => new Set([...prev, imageId]));

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
      const imageIndex = generatedImages.findIndex(img => img.id === imageId);
      trackImageGeneration.imageDownloaded({
        imageIndex: imageIndex >= 0 ? imageIndex : 0,
        productType: productCategory || undefined,
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
      setDownloadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
    }
  };

  // Image view functions
  const viewImage = (image: DashboardGeneratedImage) => {
    setViewingImage(image);
    
    // Track image view
    const imageIndex = generatedImages.findIndex(img => img.id === image.id);
    trackImageGeneration.imageViewed({
      imageIndex: imageIndex >= 0 ? imageIndex : 0,
      productType: productCategory || undefined
    });
  };

  const closeImageView = () => {
    setViewingImage(null);
  };

  const canProceedFromStep1 = () => uploadedImages.length > 0 && productName.trim() !== "";
  const canProceedFromStep2 = () => settings.style && settings.environment && settings.lighting && settings.angle && settings.format;
  const canGenerateImages = () => canProceedFromStep1() && canProceedFromStep2() && canGenerate;

  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Téléchargez vos photos produit
        </h2>
        <p className="text-muted-foreground">
          Ajoutez une ou plusieurs photos de votre produit sous différents angles
        </p>
      </div>

      {/* Product Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-2">
          <Label htmlFor="productName">Nom du produit *</Label>
          <Input
            id="productName"
            placeholder="Ex: Canapé 3 places en cuir"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="productCategory">Catégorie</Label>
          <Select value={productCategory} onValueChange={setProductCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="canape">Canapé</SelectItem>
              <SelectItem value="chaise">Chaise</SelectItem>
              <SelectItem value="table">Table</SelectItem>
              <SelectItem value="lit">Lit</SelectItem>
              <SelectItem value="armoire">Armoire</SelectItem>
              <SelectItem value="decoration">Décoration</SelectItem>
              <SelectItem value="autre">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Upload Area */}
      <Card 
        className={`p-8 border-2 border-dashed transition-colors cursor-pointer ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-sophisticated-gray-300 hover:border-primary/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Glissez vos images ici
            </h3>
            <p className="text-muted-foreground">
              ou cliquez pour parcourir vos fichiers
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            JPG, PNG jusqu&apos;à 10MB chacune
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        />
      </Card>

      {/* Uploaded Images */}
      {uploadedImages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Images téléchargées ({uploadedImages.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {uploadedImages.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square bg-sophisticated-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={image.url}
                    alt={image.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(image.id);
                  }}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {image.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {uploadError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400 text-sm">
            {uploadError}
          </p>
        </div>
      )}

      {/* Usage Limit Info */}
      {environment === 'production' && !isAdminOverride && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm",
              canGenerate ? "bg-green-500" : "bg-gray-400"
            )}>
              {remainingGenerations}
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">
                {canGenerate 
                  ? `${remainingGenerations} génération${remainingGenerations > 1 ? 's' : ''} restante${remainingGenerations > 1 ? 's' : ''}`
                  : 'Limite atteinte'
                }
              </p>
              <p className="text-xs text-muted-foreground">
                Essai gratuit • {usageData?.generationCount || 0}/5 générations utilisées
              </p>
            </div>
            {!canGenerate && (
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 ml-auto">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Contactez-nous</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Personnalisez vos visuels
        </h2>
        <p className="text-muted-foreground">
          Définissez le style et l&apos;ambiance de vos futures créations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Style Selection */}
        <div className="space-y-4">
          <Label className="text-base font-semibold flex items-center">
            <Palette className="w-5 h-5 mr-2" />
            Style
          </Label>
          <div className="space-y-3">
            {styleOptions.map((option) => (
              <Card 
                key={option.value}
                className={`p-4 cursor-pointer transition-colors ${
                  settings.style === option.value 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSettings(prev => ({ ...prev, style: option.value }))}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">{option.label}</h4>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  {settings.style === option.value && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Environment Selection */}
        <div className="space-y-4">
          <Label className="text-base font-semibold flex items-center">
            <Home className="w-5 h-5 mr-2" />
            Environnement
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {environmentOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Card 
                  key={option.value}
                  className={`p-4 cursor-pointer transition-colors ${
                    settings.environment === option.value 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSettings(prev => ({ ...prev, environment: option.value }))}
                >
                  <div className="text-center space-y-2">
                    <Icon className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="font-medium text-foreground">{option.label}</p>
                    {settings.environment === option.value && (
                      <Check className="w-4 h-4 mx-auto text-primary" />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lighting & Angle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center">
            <Sun className="w-5 h-5 mr-2" />
            Éclairage
          </Label>
          <Select value={settings.lighting} onValueChange={(value) => 
            setSettings(prev => ({ ...prev, lighting: value }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Choisir l'éclairage" />
            </SelectTrigger>
            <SelectContent>
              {lightingOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Angle de vue
          </Label>
          <Select value={settings.angle} onValueChange={(value) => 
            setSettings(prev => ({ ...prev, angle: value }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Choisir l'angle" />
            </SelectTrigger>
            <SelectContent>
              {angleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Format Selection */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">
          Format de sortie *
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {formatOptions.map((format) => (
            <Card
              key={format.value}
              className={`p-4 cursor-pointer transition-colors ${
                settings.format === format.value
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => {
                setSettings(prev => ({
                  ...prev,
                  format: format.value
                }));
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      settings.format === format.value
                        ? 'border-primary'
                        : 'border-muted-foreground/30'
                    }`}>
                      {settings.format === format.value && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="font-medium text-sm">{format.label}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">{format.size}</p>
                  <p className="text-xs text-muted-foreground">{format.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Choisissez le format adapté à votre plateforme de diffusion
        </p>
      </div>

      {/* Custom Prompt */}
      <div className="space-y-3">
        <Label htmlFor="customPrompt">
          Instructions spéciales (optionnel)
        </Label>
        <Textarea
          id="customPrompt"
          placeholder="Ex: Ajouter des plantes vertes, lumière tamisée..."
          value={settings.customPrompt || ""}
          onChange={(e) => setSettings(prev => ({ ...prev, customPrompt: e.target.value }))}
        />
        <p className="text-xs text-muted-foreground">
          Décrivez des éléments spécifiques à ajouter dans la scène
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
          {isGenerating ? "Génération en cours..." :
           generatedImages.length > 0 ? "Vos visuels sont prêts !" : "Générer vos visuels"}
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          {isGenerating ? "L&apos;IA crée vos visuels personnalisés..." :
           generatedImages.length > 0 ? "Téléchargez et utilisez vos créations" : "Cliquez sur générer pour créer vos visuels IA"}
        </p>
      </div>

      {!isGenerating && generatedImages.length === 0 && (
        <div className="text-center">
          <Card className="p-4 md:p-8 lg:p-12 max-w-2xl mx-auto">
            <div className="space-y-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              </div>

              <div>
                <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">Configuration Personnalisée</h3>
                <div className="text-left bg-muted p-3 md:p-4 rounded-lg space-y-3 md:space-y-4 text-sm md:text-base">
                  {/* Product Information */}
                  <div className="space-y-1">
                    <p className="break-words"><strong>Produit:</strong> {productName}</p>
                    <p className="break-words"><strong>Catégorie:</strong> {productCategory ? productCategory.charAt(0).toUpperCase() + productCategory.slice(1) : 'Non spécifiée'}</p>
                    <p className="break-words"><strong>Images source:</strong> {uploadedImages.length} photo(s) de référence</p>
                  </div>

                  {/* Style Configuration */}
                  <div className="border-t pt-3 space-y-1">
                    <p className="break-words"><strong>Style artistique:</strong> {styleOptions.find(s => s.value === settings.style)?.label || 'Non sélectionné'}</p>
                    {styleOptions.find(s => s.value === settings.style)?.description && (
                      <p className="text-xs md:text-sm text-muted-foreground italic break-words">
                        {styleOptions.find(s => s.value === settings.style)?.description}
                      </p>
                    )}
                  </div>

                  {/* Environment Configuration */}
                  <div className="border-t pt-3 space-y-1">
                    <p className="break-words"><strong>Environnement:</strong> {environmentOptions.find(e => e.value === settings.environment)?.label || 'Non sélectionné'}</p>
                  </div>

                  {/* Technical Configuration */}
                  <div className="border-t pt-3 space-y-1">
                    <p className="break-words"><strong>Éclairage:</strong> {lightingOptions.find(l => l.value === settings.lighting)?.label || 'Non sélectionné'}</p>
                    <p className="break-words"><strong>Angle de vue:</strong> {angleOptions.find(a => a.value === settings.angle)?.label || 'Non sélectionné'}</p>
                  </div>

                  {/* Output Configuration */}
                  <div className="border-t pt-3 space-y-1">
                    <p className="break-words"><strong>Format de sortie:</strong> {formatOptions.find(f => f.value === settings.format)?.label || 'Non sélectionné'}</p>
                    <p className="text-xs md:text-sm text-muted-foreground break-words">
                      {formatOptions.find(f => f.value === settings.format)?.description}
                    </p>
                  </div>

                  {/* Custom Instructions */}
                  {settings.customPrompt && (
                    <div className="border-t pt-3 space-y-1">
                      <p className="break-words"><strong>Instructions personnalisées:</strong></p>
                      <p className="text-xs md:text-sm bg-background p-2 rounded border italic break-words">
                        &ldquo;{settings.customPrompt}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* AI Enhancement Notice */}
                  <div className="border-t pt-3">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-blue-600">
                      <Sparkles className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium">IA Personnalisée Activée</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 break-words">
                      Vos paramètres seront intégrés dans un prompt IA avancé pour générer exactement ce que vous avez configuré.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                size="lg" 
                className="bg-gradient-ocean-deep hover:opacity-90 text-white"
                onClick={handleGenerate}
                disabled={!canGenerateImages()}
              >
                {!canGenerate ? (
                  <>
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Limite atteinte - Nous contacter
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Générer mon visuel
                  </>
                )}
              </Button>
              
              <p className="text-sm text-muted-foreground">
                Génération estimée : 2-3 minutes
              </p>
            </div>
          </Card>
        </div>
      )}

      {isGenerating && (
        <div className="text-center">
          <Card className="p-12 max-w-md mx-auto">
            <div className="space-y-6">
              {/* Progress Circle */}
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted/20"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - generationProgress / 100)}`}
                    className="text-primary transition-all duration-300"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-foreground">{generationProgress}%</span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {generationMessage}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {generationProgress < 90
                    ? `Temps estimé : ${Math.max(1, Math.ceil((100 - generationProgress) / 10))} secondes`
                    : "Finalisation en cours..."
                  }
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Error Display */}
      {generationError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="font-semibold text-red-600 dark:text-red-400">
              Erreur de génération
            </p>
          </div>
          <p className="text-red-600 dark:text-red-400 text-sm">
            {generationError}
          </p>
        </div>
      )}

      {/* Show usage limit reached or results */}
      {isLimitReached && generatedImages.length === 0 && !isGenerating ? (
        <UsageLimitReached 
          generationCount={usageData?.generationCount || 5}
          maxGenerations={5}
          environment={environment}
          onReset={environment === 'development' ? resetUserUsage : undefined}
        />
      ) : generatedImages.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-foreground">
              {generatedImages.length} visuel(s) générés
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push('/dashboard/library')}>
                <Eye className="w-4 h-4 mr-2" />
                Voir dans la bibliothèque
              </Button>
              <Button
                onClick={() => {
                  // Clear localStorage
                  localStorage.removeItem('piktor_creation_state');

                  // Reset form for new creation
                  setCurrentStep(1);
                  setUploadedImages([]);
                  setProductName("");
                  setProductCategory("");
                  setSettings({
                    style: "",
                    environment: "",
                    lighting: "",
                    angle: "",
                    format: "square-format"
                  });
                  setGeneratedImages([]);
                  setGenerationError(null);
                }}
              >
                <Plus className="w-5 h-5 mr-2" />
                Créer un nouveau visuel
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {generatedImages.map((image, index) => (
              <Card key={image.id} className="overflow-hidden">
                <div className="relative aspect-square bg-sophisticated-gray-100 overflow-hidden flex items-center justify-center">
                  <Image
                    src={image.url}
                    alt={`Visuel généré ${index + 1}`}
                    fill
                    className="object-contain cursor-pointer hover:scale-105 transition-transform duration-300"
                    onClick={() => viewImage(image)}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="font-medium text-foreground">
                      Visuel {index + 1} - Style {settings.style || 'lifestyle'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Créé avec vos paramètres personnalisés
                    </p>
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
                          productName || 'Meuble',
                          'lifestyle',
                          index + 1,
                          'jpg'
                        );
                        downloadImage(image.url, filename, image.id);
                      }}
                      variant="default"
                      size="sm"
                      className="flex-1"
                      disabled={downloadingImages.has(image.id)}
                    >
                      {downloadingImages.has(image.id) ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      {downloadingImages.has(image.id) ? 'Téléchargement...' : 'Télécharger'}
                    </Button>
                  </div>
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <GenerationEvaluation
                      imageId={image.id}
                      productType={productCategory || settings.environment || 'Mobilier'}
                      productName={productName || 'Meuble'}
                      imageIndex={index}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center pt-6">
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                // Clear localStorage
                localStorage.removeItem('piktor_creation_state');

                // Reset form for new creation
                setCurrentStep(1);
                setUploadedImages([]);
                setProductName("");
                setProductCategory("");
                setSettings({
                  style: "",
                  environment: "",
                  lighting: "",
                  angle: "",
                  format: "square-format"
                });
                setGeneratedImages([]);
                setGenerationError(null);
              }}
            >
              <Plus className="w-5 h-5 mr-2" />
              Créer un nouveau visuel
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dashboard')}
          className="flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au tableau de bord
        </Button>
      </div>

      {/* Stepper */}
      <FlexibleStepper
        steps={steps.map(step => ({
          ...step,
          status: step.step < currentStep ? 'completed' as const :
                  step.step === currentStep ? 'current' as const :
                  'pending' as const,
          isAccessible: step.step <= currentStep || step.step === currentStep + 1
        }))}
        currentStep={currentStep}
        className="mb-8"
      />

      {/* Step Content */}
      <div className="min-h-96">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>

      {/* Navigation */}
      {!isGenerating && generatedImages.length === 0 && (
        <div className="flex justify-between pt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Précédent
          </Button>
          
          <Button
            onClick={currentStep === 3 ? handleGenerate : handleNext}
            disabled={
              (currentStep === 1 && !canProceedFromStep1()) ||
              (currentStep === 2 && !canProceedFromStep2()) ||
              (currentStep === 3 && !canGenerateImages())
            }
          >
            {currentStep === 3 ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Générer
              </>
            ) : (
              <>
                Suivant
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Image View Modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4" 
          onClick={closeImageView}
        >
          <div className="relative w-full max-w-4xl max-h-[90vh] mx-auto" onClick={(e) => e.stopPropagation()}>
            <Button
              onClick={closeImageView}
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white hover:text-gray-300 hover:bg-white/10"
            >
              <X className="w-6 h-6" />
            </Button>
            
            <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-premium">
              <div className="relative bg-sophisticated-gray-50 flex items-center justify-center min-h-[40vh] md:min-h-[60vh]">
                <Image
                  src={viewingImage.url}
                  alt="Visuel en taille réelle"
                  width={1200}
                  height={800}
                  className="w-full h-auto max-h-[60vh] md:max-h-[80vh] object-contain"
                  priority
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Visuel Premium - Style {settings.style || 'Lifestyle'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {productName || 'Meuble'} - Généré par IA
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                    Premium
                  </div>
                </div>
                <div className="flex gap-3 mb-4">
                  <Button
                    onClick={() => {
                      const imageIndex = generatedImages.findIndex(img => img.id === viewingImage.id);
                      const filename = generateSafeFilename(
                        productName || 'Meuble',
                        'lifestyle',
                        imageIndex + 1,
                        'jpg'
                      );
                      downloadImage(viewingImage.url, filename, viewingImage.id);
                    }}
                    variant="default"
                    className="flex-1"
                    disabled={downloadingImages.has(viewingImage.id)}
                  >
                    {downloadingImages.has(viewingImage.id) ? (
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
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <GenerationEvaluation
                    imageId={viewingImage.id}
                    productType={productCategory || settings.environment || 'Mobilier'}
                    productName={productName || 'Meuble'}
                    imageIndex={generatedImages.findIndex(img => img.id === viewingImage.id)}
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
export function VisualCreation() {
  return (
    <UsageLimitProvider 
      initialConfig={{
        maxGenerations: 5,
        trackingMethod: 'localStorage',
        storageKey: 'piktor_usage_data',
        adminBypassKey: 'piktor_admin_bypass'
      }}
    >
      <VisualCreationContent />
    </UsageLimitProvider>
  );
}