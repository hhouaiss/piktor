"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FlexibleStepper } from "@/components/ui/flexible-stepper";
import { 
  Upload, 
  Image as ImageIcon, 
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
  Plus
} from "lucide-react";
import { trackEvent, trackImageGeneration } from "@/lib/analytics";

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
  formats: string[];
  customPrompt?: string;
}

interface GeneratedImage {
  id: string;
  url: string;
  format: string;
  prompt: string;
  downloadUrl?: string;
}

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

const formatOptions = [
  { value: "instagram-post", label: "Instagram Post", size: "1:1" },
  { value: "instagram-story", label: "Instagram Story", size: "9:16" },
  { value: "facebook", label: "Facebook", size: "16:9" },
  { value: "ecommerce", label: "E-commerce", size: "4:3" },
  { value: "print", label: "Print", size: "A4" },
  { value: "web-banner", label: "Bannière Web", size: "728x90" }
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

export function VisualCreation() {
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
    formats: []
  });
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileUpload = useCallback((files: FileList) => {
    const newImages: UploadedImage[] = [];
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const id = Math.random().toString(36).substr(2, 9);
        const url = URL.createObjectURL(file);
        
        newImages.push({
          id,
          file,
          url,
          name: file.name
        });
      }
    });
    
    if (newImages.length > 0) {
      setUploadedImages(prev => [...prev, ...newImages]);
      
      trackImageGeneration.imageUploaded({
        imageCount: newImages.length,
        productType: productCategory || undefined,
        productName: productName || undefined
      });
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
    if (!canGenerate()) return;

    setIsGenerating(true);
    
    trackImageGeneration.generationStarted({
      referenceImageCount: uploadedImages.length,
      productType: productCategory || undefined,
      productName: productName || undefined
    });

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 3000)); // Mock generation time
      
      // Mock generated images
      const mockResults: GeneratedImage[] = settings.formats.map((format, index) => ({
        id: `gen_${index}`,
        url: `/api/placeholder/400/400?text=${format}`,
        format,
        prompt: `${settings.style} ${productName} dans un ${settings.environment} avec éclairage ${settings.lighting}`,
        downloadUrl: `/api/placeholder/400/400?text=${format}`
      }));
      
      setGeneratedImages(mockResults);
      
      trackImageGeneration.generationCompleted({
        generatedImageCount: mockResults.length,
        generationTime: 3,
        productType: productCategory || undefined,
        productName: productName || undefined
      });
      
    } catch (error) {
      console.error('Generation failed:', error);
      
      trackImageGeneration.generationFailed({
        errorType: 'api_error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        productType: productCategory || undefined
      });
      
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (image: GeneratedImage) => {
    // TODO: Implement actual download
    console.log('Downloading:', image);
    
    trackImageGeneration.imageDownloaded({
      imageIndex: generatedImages.indexOf(image),
      productType: productCategory || undefined,
      filename: `${productName}_${image.format}.jpg`
    });
  };

  const canProceedFromStep1 = () => uploadedImages.length > 0 && productName.trim() !== "";
  const canProceedFromStep2 = () => settings.style && settings.environment && settings.lighting && settings.angle && settings.formats.length > 0;
  const canGenerate = () => canProceedFromStep1() && canProceedFromStep2();

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
            JPG, PNG jusqu'à 10MB chacune
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
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
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
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Personnalisez vos visuels
        </h2>
        <p className="text-muted-foreground">
          Définissez le style et l'ambiance de vos futures créations
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
          Formats de sortie (sélectionner au moins un)
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {formatOptions.map((format) => (
            <Card 
              key={format.value}
              className={`p-3 cursor-pointer transition-colors ${
                settings.formats.includes(format.value) 
                  ? 'border-primary bg-primary/5' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => {
                setSettings(prev => ({
                  ...prev,
                  formats: prev.formats.includes(format.value)
                    ? prev.formats.filter(f => f !== format.value)
                    : [...prev.formats, format.value]
                }));
              }}
            >
              <div className="text-center space-y-1">
                <p className="font-medium text-sm">{format.label}</p>
                <p className="text-xs text-muted-foreground">{format.size}</p>
                {settings.formats.includes(format.value) && (
                  <Check className="w-4 h-4 mx-auto text-primary" />
                )}
              </div>
            </Card>
          ))}
        </div>
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
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {isGenerating ? "Génération en cours..." : 
           generatedImages.length > 0 ? "Vos visuels sont prêts !" : "Générer vos visuels"}
        </h2>
        <p className="text-muted-foreground">
          {isGenerating ? "L'IA crée vos visuels personnalisés..." :
           generatedImages.length > 0 ? "Téléchargez et utilisez vos créations" : "Cliquez sur générer pour créer vos visuels IA"}
        </p>
      </div>

      {!isGenerating && generatedImages.length === 0 && (
        <div className="text-center">
          <Card className="p-12 max-w-2xl mx-auto">
            <div className="space-y-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Récapitulatif</h3>
                <div className="text-left bg-muted p-4 rounded-lg space-y-2">
                  <p><strong>Produit:</strong> {productName}</p>
                  <p><strong>Style:</strong> {styleOptions.find(s => s.value === settings.style)?.label}</p>
                  <p><strong>Environnement:</strong> {environmentOptions.find(e => e.value === settings.environment)?.label}</p>
                  <p><strong>Images source:</strong> {uploadedImages.length}</p>
                  <p><strong>Formats:</strong> {settings.formats.length} format(s)</p>
                </div>
              </div>

              <Button 
                size="lg" 
                className="bg-gradient-ocean-deep hover:opacity-90 text-white"
                onClick={handleGenerate}
                disabled={!canGenerate()}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Générer mes visuels ({settings.formats.length} crédits)
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
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Création en cours...
                </h3>
                <p className="text-muted-foreground">
                  L'IA analyse vos photos et génère vos visuels personnalisés
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {generatedImages.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-foreground">
              {generatedImages.length} visuel(s) générés
            </h3>
            <Button variant="outline" onClick={() => router.push('/dashboard/library')}>
              <Eye className="w-4 h-4 mr-2" />
              Voir dans la bibliothèque
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatedImages.map((image) => (
              <Card key={image.id} className="overflow-hidden">
                <div className="aspect-square bg-sophisticated-gray-100">
                  <img
                    src={image.url}
                    alt={`${productName} - ${image.format}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="font-medium text-foreground">{image.format}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {image.prompt}
                    </p>
                  </div>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => handleDownload(image)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center pt-6">
            <Button 
              size="lg" 
              onClick={() => {
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
                  formats: []
                });
                setGeneratedImages([]);
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
        steps={steps} 
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
              (currentStep === 3 && !canGenerate())
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
    </div>
  );
}