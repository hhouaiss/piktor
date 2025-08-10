"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, CheckCircle, Image, Settings, FileJson } from "lucide-react";

interface ProductProfile {
  type: string;
  material: string;
  dimensions: {
    width: string;
    depth: string;
    height: string;
  };
  color: string;
  style: string;
  features: string[];
  brand: string;
  condition: string;
}

interface HeroImageConfig {
  use_case: string;
  text_overlay: {
    included: boolean;
    reserved_zone: string;
  };
  layout: {
    main_focus: string;
    position: string;
    background_style: string;
    props: string[];
    lighting: string;
  };
  aspect_ratio: string;
  resolution: string;
  strict_mode: boolean;
}

interface MergedConfig {
  product: ProductProfile;
  hero_image: HeroImageConfig & {
    enabled: boolean;
    prompt: string;
  };
}

const USE_CASES = [
  { value: "homepage", label: "Homepage" },
  { value: "landing", label: "Landing Page" },
  { value: "campaign", label: "Campaign" },
  { value: "social", label: "Social Media" },
  { value: "email", label: "Email Marketing" }
];

const POSITIONS = [
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "center", label: "Center" }
];

const RESERVED_ZONES = [
  { value: "none", label: "None" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" }
];

const BACKGROUND_STYLES = [
  { value: "plain", label: "Plain" },
  { value: "minimal", label: "Minimal" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "gradient", label: "Gradient" }
];

const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 (Standard)" },
  { value: "21:9", label: "21:9 (Ultra Wide)" },
  { value: "4:3", label: "4:3 (Classic)" },
  { value: "1:1", label: "1:1 (Square)" }
];

const RESOLUTION_PRESETS = [
  { value: "2048x1024", label: "2048×1024 (16:9)" },
  { value: "3000x1300", label: "3000×1300 (21:9)" },
  { value: "2560x1440", label: "2560×1440 (16:9 QHD)" },
  { value: "1200x1200", label: "1200×1200 (1:1)" },
  { value: "1600x1200", label: "1600×1200 (4:3)" },
  { value: "custom", label: "Custom Resolution" }
];

const AVAILABLE_PROPS = [
  "plant", "lamp", "rug", "book", "candle", "vase", "pillow", 
  "blanket", "artwork", "mirror", "table", "chair", "basket"
];

export default function AdvancedHeroImageGeneratorPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [productProfile, setProductProfile] = useState<ProductProfile | null>(null);
  
  // Hero image configuration state
  const [useCase, setUseCase] = useState("homepage");
  const [position, setPosition] = useState("right");
  const [reservedZone, setReservedZone] = useState("left");
  const [backgroundStyle, setBackgroundStyle] = useState("minimal");
  const [selectedProps, setSelectedProps] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState("21:9");
  const [resolution, setResolution] = useState("3000x1300");
  const [customResolution, setCustomResolution] = useState("");
  const [strictMode, setStrictMode] = useState(false);
  
  const [finalConfig, setFinalConfig] = useState<MergedConfig | null>(null);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      // Create preview URL
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);

      // Move to step 2 and start analysis
      setCurrentStep(2);
      setIsAnalyzing(true);

      // Extract product profile using API
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract-product-profile', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        setProductProfile(result.product);
        setTimeout(() => {
          setCurrentStep(3);
          setIsAnalyzing(false);
        }, 1000);
      } else {
        throw new Error(result.error || 'Failed to analyze image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setIsAnalyzing(false);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const generatePrompt = (): string => {
    if (!productProfile) return "";
    
    let prompt = `Generate a ${backgroundStyle} hero image for ${useCase}`;
    
    prompt += ` featuring a ${productProfile.style} ${productProfile.type}`;
    
    if (productProfile.material !== "unknown") {
      prompt += ` made of ${productProfile.material}`;
    }
    
    if (productProfile.color !== "unknown") {
      prompt += ` in ${productProfile.color}`;
    }
    
    prompt += ` positioned on the ${position}`;
    
    if (reservedZone !== "none") {
      prompt += `. Leave space on the ${reservedZone} for text overlay`;
    }
    
    if (selectedProps.length > 0) {
      prompt += ` with ${selectedProps.join(", ")} as decorative elements`;
    }
    
    prompt += `. Use soft daylight lighting and a ${backgroundStyle} background`;
    
    if (reservedZone !== "none") {
      prompt += `. No text should appear in the image`;
    }
    
    return prompt + ".";
  };

  const createMergedConfig = (): MergedConfig | null => {
    if (!productProfile) return null;

    return {
      product: productProfile,
      hero_image: {
        enabled: true,
        use_case: useCase,
        text_overlay: {
          included: reservedZone !== "none",
          reserved_zone: reservedZone
        },
        layout: {
          main_focus: "product",
          position: position,
          background_style: backgroundStyle,
          props: selectedProps,
          lighting: "soft daylight"
        },
        aspect_ratio: aspectRatio,
        resolution: resolution === "custom" ? customResolution : resolution,
        strict_mode: strictMode,
        prompt: generatePrompt()
      }
    };
  };

  const handleGenerateFinal = () => {
    const config = createMergedConfig();
    if (config) {
      setFinalConfig(config);
      setCurrentStep(4);
    }
  };

  const toggleProp = (prop: string) => {
    setSelectedProps(prev => 
      prev.includes(prop) 
        ? prev.filter(p => p !== prop)
        : [...prev, prop]
    );
  };

  const copyToClipboard = () => {
    if (finalConfig) {
      navigator.clipboard.writeText(JSON.stringify(finalConfig, null, 2));
    }
  };

  const resetProcess = () => {
    setCurrentStep(1);
    setUploadedImage(null);
    setProductProfile(null);
    setFinalConfig(null);
    setSelectedProps([]);
    setUseCase("homepage");
    setPosition("right");
    setReservedZone("left");
    setBackgroundStyle("minimal");
    setAspectRatio("21:9");
    setResolution("3000x1300");
    setStrictMode(false);
  };

  const livePreview = createMergedConfig();

  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-2xl">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Advanced Hero Image Generator</h1>
          <p className="text-muted-foreground">
            Upload a product image, let AI analyze it, then configure hero image settings for a complete JSON profile
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-8">
              <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-white' : 'bg-muted'}`}>
                  {currentStep > 1 ? <CheckCircle className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                </div>
                <span className="text-sm font-medium">Upload</span>
              </div>
              
              <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-white' : 'bg-muted'}`}>
                  {currentStep > 2 ? <CheckCircle className="w-4 h-4" /> : <Image className="w-4 h-4" />}
                </div>
                <span className="text-sm font-medium">Analysis</span>
              </div>
              
              <div className={`flex items-center space-x-2 ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-primary text-white' : 'bg-muted'}`}>
                  {currentStep > 3 ? <CheckCircle className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                </div>
                <span className="text-sm font-medium">Configure</span>
              </div>
              
              <div className={`flex items-center space-x-2 ${currentStep >= 4 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 4 ? 'bg-primary text-white' : 'bg-muted'}`}>
                  <FileJson className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Result</span>
              </div>
            </div>
          </div>
          <Progress value={currentStep * 25} className="w-full max-w-md mx-auto" />
        </div>

        {/* Step 1: Upload */}
        {currentStep === 1 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Upload Product Image</CardTitle>
              <CardDescription>
                Upload a JPG, PNG, or WebP image of your product for AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Choose product image</p>
                <p className="text-muted-foreground mb-6">Drag & drop or click to browse</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={isUploading}
                />
                <label htmlFor="image-upload">
                  <Button asChild disabled={isUploading}>
                    <span>{isUploading ? "Uploading..." : "Select Image"}</span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Analysis */}
        {currentStep === 2 && uploadedImage && (
          <div className="grid lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Image</CardTitle>
                <CardDescription>Your product image is being analyzed</CardDescription>
              </CardHeader>
              <CardContent>
                <img 
                  src={uploadedImage} 
                  alt="Uploaded product"
                  className="w-full h-64 object-cover rounded-lg"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Analysis</CardTitle>
                <CardDescription>
                  {isAnalyzing ? "Extracting product information..." : "Analysis complete!"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isAnalyzing ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
                      <span className="text-sm">Analyzing image composition...</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
                      <span className="text-sm">Identifying materials and colors...</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
                      <span className="text-sm">Extracting product details...</span>
                    </div>
                  </div>
                ) : productProfile && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Type:</span>
                      <span className="text-sm text-muted-foreground">{productProfile.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Material:</span>
                      <span className="text-sm text-muted-foreground">{productProfile.material}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Style:</span>
                      <span className="text-sm text-muted-foreground">{productProfile.style}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Color:</span>
                      <span className="text-sm text-muted-foreground">{productProfile.color}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Configuration */}
        {currentStep === 3 && productProfile && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Configuration Form */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hero Image Settings</CardTitle>
                  <CardDescription>
                    Configure how your product should appear in the hero image
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Use Case */}
                  <div className="space-y-2">
                    <Label htmlFor="use-case">Use Case</Label>
                    <Select
                      value={useCase}
                      onValueChange={setUseCase}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {USE_CASES.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Product Position */}
                  <div className="space-y-2">
                    <Label htmlFor="position">Product Position</Label>
                    <Select
                      value={position}
                      onValueChange={setPosition}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {POSITIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Text Overlay Zone */}
                  <div className="space-y-2">
                    <Label htmlFor="reserved-zone">Text Reserved Zone</Label>
                    <Select
                      value={reservedZone}
                      onValueChange={setReservedZone}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RESERVED_ZONES.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Background Style */}
                  <div className="space-y-2">
                    <Label htmlFor="background-style">Background Style</Label>
                    <Select
                      value={backgroundStyle}
                      onValueChange={setBackgroundStyle}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BACKGROUND_STYLES.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Optional Props</CardTitle>
                  <CardDescription>
                    Select decorative elements to include
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_PROPS.map((prop) => (
                      <Badge
                        key={prop}
                        variant={selectedProps.includes(prop) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleProp(prop)}
                      >
                        {prop}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Image Dimensions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
                    <Select
                      value={aspectRatio}
                      onValueChange={setAspectRatio}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASPECT_RATIOS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resolution">Resolution</Label>
                    <Select
                      value={resolution}
                      onValueChange={setResolution}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RESOLUTION_PRESETS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {resolution === "custom" && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-resolution">Custom Resolution</Label>
                      <Input
                        id="custom-resolution"
                        value={customResolution}
                        onChange={(e) => setCustomResolution(e.target.value)}
                        placeholder="e.g., 2560x1440"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="strict-mode"
                      checked={strictMode}
                      onChange={(e) => setStrictMode(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="strict-mode">Strict Mode</Label>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleGenerateFinal} className="w-full">
                Generate Final JSON
              </Button>
            </div>

            {/* Live Preview */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Profile</CardTitle>
                  <CardDescription>Extracted from your image</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(productProfile, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              {livePreview && (
                <Card>
                  <CardHeader>
                    <CardTitle>Live Preview</CardTitle>
                    <CardDescription>Combined configuration preview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(livePreview, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Final Result */}
        {currentStep === 4 && finalConfig && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">🎉 Your Hero Image JSON is Ready!</h2>
              <p className="text-muted-foreground">Complete product profile merged with hero image configuration</p>
            </div>

            <div className="grid lg:grid-cols-1 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Final Merged Configuration
                    <div className="space-x-2">
                      <Button variant="outline" onClick={copyToClipboard}>
                        Copy JSON
                      </Button>
                      <Button variant="outline" onClick={resetProcess}>
                        Start Over
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Ready to use for image generation systems
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-6 rounded-md text-sm overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(finalConfig, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}