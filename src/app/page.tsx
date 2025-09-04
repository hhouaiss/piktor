"use client";

import Link from "next/link";
import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, X, CheckCircle, ArrowRight, Camera, Sparkles, Clock, Euro, Zap, Target, Package, Eye, Download } from "lucide-react";
import { ProductSpecs, UploadedImage, GeneratedImage } from "@/components/image-generator/types";
import { validateImageUrl, generateSafeFilename, getDownloadErrorMessage, downloadWithRetry } from "@/lib/download-utils";
import { cn } from "@/lib/utils";

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

export default function Home() {
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
      
    } catch (error) {
      console.error('Upload error:', error);
      updateGeneratorState({ 
        uploadError: error instanceof Error ? error.message : 'Upload failed',
        isUploading: false 
      });
    }
  }, [generatorState.uploadedImages]);

  // Generate images
  const generateImages = async () => {
    if (generatorState.uploadedImages.length === 0) {
      updateGeneratorState({ generationError: 'Veuillez uploader au moins une image produit.' });
      return;
    }

    updateGeneratorState({ isGenerating: true, generationError: null });

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

      const response = await fetch('/api/generate-images-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        metadata: any 
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

    } catch (error) {
      console.error('Image generation failed:', error);
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
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sophisticated-gray-50 via-white to-ocean-blue-50/30 dark:from-sophisticated-gray-950 dark:via-sophisticated-gray-900 dark:to-sophisticated-gray-800">
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 max-w-screen-2xl">
        <div className="text-center mb-12 animate-fade-in">
          <div className="mb-6">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-ocean-blue-50 to-warm-gold-50 border border-ocean-blue-200 rounded-full text-sm font-medium text-ocean-blue-700 dark:from-ocean-blue-900/50 dark:to-warm-gold-900/50 dark:border-ocean-blue-700 dark:text-ocean-blue-300">
              <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
              Utilisé par 500+ marques de mobilier
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-br from-sophisticated-gray-900 via-ocean-blue-800 to-sophisticated-gray-700 bg-clip-text text-transparent dark:from-sophisticated-gray-100 dark:via-ocean-blue-300 dark:to-sophisticated-gray-300 leading-tight">
            1 photo = 1 million 
            <span className="block bg-gradient-ocean-gold bg-clip-text text-transparent">de possibilités</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-sophisticated-gray-600 dark:text-sophisticated-gray-400 mb-8 max-w-4xl mx-auto leading-relaxed">
            Créez des dizaines de visuels professionnels à partir d'une seule photo produit. 
            <span className="font-semibold">Fini les shootings photo hors de prix.</span>
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-sophisticated-gray-600 dark:text-sophisticated-gray-400 mb-10">
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
              <span className="font-medium">Résultats en 60 secondes</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Button 
              onClick={scrollToGenerator}
              size="xl" 
              variant="primary" 
              className="shadow-premium animate-scale-in font-bold group"
            >
              Tester gratuitement maintenant
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          <p className="text-sm text-sophisticated-gray-500 dark:text-sophisticated-gray-400">
            Aucune inscription - Voir le résultat instantanément
          </p>
        </div>
      </section>

      {/* CTA Teaser Section */}
      <section className="container mx-auto px-4 py-12 max-w-screen-2xl">
        <div className="text-center bg-gradient-to-r from-ocean-blue-50 to-warm-gold-50 dark:from-sophisticated-gray-900 dark:to-sophisticated-gray-800 p-8 rounded-2xl border border-sophisticated-gray-200/50 dark:border-sophisticated-gray-700/50 animate-fade-in">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-sophisticated-gray-900 dark:text-sophisticated-gray-100">
            Voyez la différence sur <span className="bg-gradient-ocean-gold bg-clip-text text-transparent">VOS produits</span>
          </h2>
          <Button 
            onClick={scrollToGenerator}
            variant="outline" 
            size="lg" 
            className="font-semibold group hover:border-ocean-blue-500 hover:bg-ocean-blue-50 dark:hover:bg-ocean-blue-900/20"
          >
            Transformer ma photo
            <Camera className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
          </Button>
        </div>
      </section>

      {/* Before/After Gallery */}
      <section className="container mx-auto px-4 py-20 max-w-screen-2xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-br from-sophisticated-gray-900 to-ocean-blue-700 bg-clip-text text-transparent dark:from-sophisticated-gray-100 dark:to-ocean-blue-300">
            De la photo basique au visuel showroom
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Before/After cards would go here - using placeholder examples */}
          {[
            { name: 'Canapé moderne', before: 'Fond blanc basique', after: 'Salon moderne éclairé' },
            { name: 'Table basse', before: 'Photo brute produit', after: 'Mise en scène lifestyle' },
            { name: 'Fauteuil design', before: 'Image catalogue simple', after: 'Ambiance showroom premium' },
            { name: 'Armoire vintage', before: 'Photo d\'inventaire', after: 'Chambre design magazine' },
            { name: 'Commode scandinave', before: 'Cliché mobile basique', after: 'Décor nordique parfait' },
            { name: 'Bibliothèque', before: 'Vue produit standard', after: 'Bureau inspirant pro' }
          ].map((item, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className="aspect-[4/3] bg-gradient-to-br from-sophisticated-gray-100 to-sophisticated-gray-200 dark:from-sophisticated-gray-800 dark:to-sophisticated-gray-700 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Package className="w-12 h-12 mx-auto mb-2 text-sophisticated-gray-400" />
                    <p className="text-sm text-sophisticated-gray-500">Avant: {item.before}</p>
                  </div>
                </div>
                <div className="absolute top-2 right-2 bg-gradient-ocean-gold text-white px-2 py-1 rounded text-xs font-medium">
                  APRÈS IA
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100 mb-1">
                  {item.name}
                </h3>
                <p className="text-sm text-sophisticated-gray-600 dark:text-sophisticated-gray-400">
                  Transformé en: {item.after}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center">
          <p className="text-lg font-medium text-sophisticated-gray-700 dark:text-sophisticated-gray-300 bg-white/50 dark:bg-sophisticated-gray-800/50 px-6 py-3 rounded-lg border border-sophisticated-gray-200/50 dark:border-sophisticated-gray-700/50 inline-block">
            Même qualité professionnelle, même rapidité pour <span className="bg-gradient-ocean-gold bg-clip-text text-transparent font-bold">TOUS vos meubles</span>
          </p>
        </div>
      </section>

      {/* Image Generator Tool */}
      <section id="image-generator" className="container mx-auto px-4 py-20 max-w-screen-2xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-br from-sophisticated-gray-900 to-ocean-blue-700 bg-clip-text text-transparent dark:from-sophisticated-gray-100 dark:to-ocean-blue-300">
            Testez maintenant avec <span className="bg-gradient-ocean-gold bg-clip-text text-transparent">VOTRE produit</span>
          </h2>
        </div>

        <div className="max-w-4xl mx-auto">
          {generatorState.generatedImages.length === 0 ? (
            <Card className="p-8">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold mb-2">
                  UPLOADEZ VOTRE PHOTO MEUBLE
                </CardTitle>
                <CardDescription className="text-lg">
                  Transformation IA en temps réel
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Upload Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer",
                    generatorState.isDragging 
                      ? "border-ocean-blue-500 bg-ocean-blue-50 dark:bg-ocean-blue-900/20" 
                      : "border-sophisticated-gray-300 dark:border-sophisticated-gray-600 hover:border-ocean-blue-400 hover:bg-ocean-blue-50/50 dark:hover:bg-ocean-blue-900/10"
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
                    <Label htmlFor="productName">Nom du produit (optionnel)</Label>
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
                    <Label htmlFor="productType">Type (optionnel)</Label>
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
                <div className="bg-gradient-to-r from-ocean-blue-50 to-warm-gold-50 dark:from-sophisticated-gray-800 dark:to-sophisticated-gray-700 p-6 rounded-xl">
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-ocean-blue-600 text-white rounded-full flex items-center justify-center mx-auto font-bold">1</div>
                      <p className="text-sm font-medium">Uploadez votre photo produit</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-warm-gold-500 text-white rounded-full flex items-center justify-center mx-auto font-bold">2</div>
                      <p className="text-sm font-medium">Attendez 30 secondes (IA en action)</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-success text-white rounded-full flex items-center justify-center mx-auto font-bold">3</div>
                      <p className="text-sm font-medium">Découvrez votre visuel premium</p>
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <div className="text-center">
                  <Button
                    onClick={generateImages}
                    disabled={generatorState.uploadedImages.length === 0 || generatorState.isGenerating}
                    size="xl"
                    variant="primary"
                    className="shadow-premium font-bold"
                  >
                    {generatorState.isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Génération en cours...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        Générer mes visuels premium
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
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-ocean-gold text-white rounded-full text-sm font-medium shadow-lg mb-4">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Génération terminée !
                </div>
                <h3 className="text-2xl font-bold text-sophisticated-gray-900 dark:text-sophisticated-gray-100 mb-2">
                  Vos visuels premium sont prêts
                </h3>
                <p className="text-sophisticated-gray-600 dark:text-sophisticated-gray-400">
                  Impressionnant ? Imaginez avec 50 visuels par jour...
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
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
                        <Badge variant="outline" className="bg-gradient-ocean-gold text-white border-none">
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
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Demo CTA Section */}
      <section className="container mx-auto px-4 py-20 max-w-screen-2xl">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-sophisticated-gray-900 via-ocean-blue-900 to-sophisticated-gray-800"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(2,132,199,0.3),transparent_70%)]"></div>
          <div className="relative text-center p-16 rounded-2xl backdrop-blur-sm animate-fade-in">
            
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              Prêt à révolutionner vos 
              <span className="block bg-gradient-to-r from-warm-gold-400 to-warm-gold-200 bg-clip-text text-transparent">visuels mobilier ?</span>
            </h2>
            
            <p className="text-xl text-sophisticated-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed">
              Découvrez comment nos clients génèrent +40% de conversions avec des catalogues premium
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button asChild size="xl" variant="primary" className="shadow-premium font-bold">
                <Link href="/generate">Réserver ma démo personnalisée</Link>
              </Button>
              <Button 
                onClick={scrollToGenerator}
                variant="outline" 
                size="xl" 
                className="font-semibold border-white/30 text-white hover:bg-white/10"
              >
                Continuer à tester l'outil
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-sophisticated-gray-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-warm-gold-400" />
                <span>Démo sur VOS produits</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-warm-gold-400" />
                <span>Conseils personnalisés</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-warm-gold-400" />
                <span>Tarifs sur mesure</span>
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
                  <Badge variant="outline" className="bg-gradient-ocean-gold text-white border-none">
                    Premium
                  </Badge>
                </div>
                <div className="flex gap-3">
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
