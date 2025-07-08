"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Copy, Download, Camera, Eye, RotateCcw, RotateCw, MoveUp, MoveDown, Move3D, Plus, Trash2, Settings, Ruler, ChevronDown, ChevronRight, Shield, Type } from "lucide-react";

interface Feature {
  name: string;
  description: string;
  location: string;
  visibility: string;
}

interface Dimension {
  name: string;
  value: string;
  unit: string;
}

interface Constraints {
  strict_mode: boolean;
  must_be_wall_mounted: boolean;
  no_furniture_on_floor: boolean;
  no_extra_objects: boolean;
  respect_all_dimensions: boolean;
  no_text_in_image: boolean;
  no_labels: boolean;
}

interface TextOverlay {
  enabled: boolean;
  content: string;
  position: "top" | "bottom" | "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  style: {
    font_family: string;
    font_size: string;
    font_weight: string;
    color: string;
    background_color?: string;
    opacity?: number;
  };
}

interface PromptData {
  product: {
    name: string;
    category: string;
    material: string;
    color: string;
    dimensions: Dimension[];
    style: string;
    features: Feature[];
  };
  output: {
    type: "packshot" | "lifestyle" | "instagram";
    background: string;
    lighting: string;
    aspectRatio: string;
    cameraAngle: string;
  };
  branding: {
    aesthetic: string;
    moodKeywords: string[];
  };
  constraints: Constraints;
  text_overlay?: TextOverlay;
}

interface DimensionsObject {
  width?: string | number;
  depth?: string | number;
  height?: string | number;
}

interface InitialProduct {
  name?: string;
  material?: string;
  color?: string;
  dimensions?: string | DimensionsObject | Dimension[];
  style?: string;
  features?: Feature[];
}

interface InitialOutput {
  type?: "packshot" | "lifestyle" | "instagram";
  aspect_ratio?: string;
  camera_angle?: string;
}

interface InitialData {
  product?: InitialProduct;
  output?: InitialOutput;
  constraints?: Constraints;
}

interface JsonEditorProps {
  initialData?: InitialData;
  onDataChange?: (data: PromptData) => void;
}

const defaultPromptData: PromptData = {
  product: {
    name: "Modern Oak Desk",
    category: "office furniture",
    material: "oak wood",
    color: "#DEB887",
    dimensions: [
      { name: "width", value: "120", unit: "cm" },
      { name: "depth", value: "60", unit: "cm" },
      { name: "height", value: "75", unit: "cm" }
    ],
    style: "modern minimalist",
    features: [],
  },
  output: {
    type: "packshot",
    background: "white studio",
    lighting: "soft professional lighting",
    aspectRatio: "16:9",
    cameraAngle: "front_center",
  },
  branding: {
    aesthetic: "modern, cozy, professional",
    moodKeywords: ["clean", "organized", "productive", "home office"],
  },
  constraints: {
    strict_mode: true,
    must_be_wall_mounted: true,
    no_furniture_on_floor: true,
    no_extra_objects: true,
    respect_all_dimensions: true,
    no_text_in_image: true,
    no_labels: true,
  },
  text_overlay: {
    enabled: false,
    content: "",
    position: "bottom",
    style: {
      font_family: "Arial",
      font_size: "20px",
      font_weight: "bold",
      color: "#333333",
      background_color: "#FFFFFF",
      opacity: 0.9,
    },
  },
};

export function JsonEditor({ initialData, onDataChange }: JsonEditorProps) {
  const [promptData, setPromptData] = useState<PromptData>(defaultPromptData);
  const [jsonString, setJsonString] = useState("");
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    product: true,
    dimensions: true,
    features: false,
    output: true,
    branding: false,
    constraints: false,
    textOverlay: false
  });

  useEffect(() => {
    setJsonString(JSON.stringify(promptData, null, 2));
    onDataChange?.(promptData);
  }, [promptData, onDataChange]);

  useEffect(() => {
    if (initialData) {
      // Map the OpenAI analysis result to our prompt data structure
      const mappedData: Partial<PromptData> = {};
      
      if (initialData.product) {
        mappedData.product = {
          name: initialData.product.name || defaultPromptData.product.name,
          category: "office furniture",
          material: initialData.product.material || defaultPromptData.product.material,
          color: initialData.product.color || defaultPromptData.product.color,
          dimensions: (() => {
            if (Array.isArray(initialData.product.dimensions)) {
              return initialData.product.dimensions as Dimension[];
            } else if (initialData.product.dimensions && typeof initialData.product.dimensions === 'object') {
              const dimObj = initialData.product.dimensions as DimensionsObject;
              return [
                { name: "width", value: String(dimObj.width || "0").replace(/\D/g, ""), unit: "cm" },
                { name: "depth", value: String(dimObj.depth || "0").replace(/\D/g, ""), unit: "cm" },
                { name: "height", value: String(dimObj.height || "0").replace(/\D/g, ""), unit: "cm" }
              ];
            } else if (typeof initialData.product.dimensions === 'string') {
              const parts = initialData.product.dimensions.split('x');
              return [
                { name: "width", value: parts[0]?.replace(/\D/g, "") || "0", unit: "cm" },
                { name: "depth", value: parts[1]?.replace(/\D/g, "") || "0", unit: "cm" },
                { name: "height", value: parts[2]?.replace(/\D/g, "") || "0", unit: "cm" }
              ];
            }
            return defaultPromptData.product.dimensions;
          })(),
          style: initialData.product.style || defaultPromptData.product.style,
          features: initialData.product.features || defaultPromptData.product.features,
        };
      }

      if (initialData.output) {
        mappedData.output = {
          type: initialData.output.type || defaultPromptData.output.type,
          background: "white studio background",
          lighting: "soft professional lighting",
          aspectRatio: initialData.output.aspect_ratio || defaultPromptData.output.aspectRatio,
          cameraAngle: initialData.output.camera_angle || defaultPromptData.output.cameraAngle,
        };
      }

      if (initialData.constraints) {
        mappedData.constraints = {
          ...defaultPromptData.constraints,
          ...initialData.constraints,
        };
      }

      setPromptData({
        ...defaultPromptData,
        ...mappedData,
      });
    }
  }, [initialData]);

  const updateProduct = (field: keyof PromptData["product"], value: string) => {
    setPromptData((prev) => ({
      ...prev,
      product: { ...prev.product, [field]: value },
    }));
  };

  const updateOutput = (field: keyof PromptData["output"], value: string) => {
    setPromptData((prev) => ({
      ...prev,
      output: { ...prev.output, [field]: value },
    }));
  };

  const updateBranding = (field: keyof PromptData["branding"], value: string | string[]) => {
    setPromptData((prev) => ({
      ...prev,
      branding: { ...prev.branding, [field]: value },
    }));
  };

  const updateConstraints = (field: keyof PromptData["constraints"], value: boolean) => {
    setPromptData((prev) => ({
      ...prev,
      constraints: { ...prev.constraints, [field]: value },
    }));
  };

  const updateTextOverlay = (field: keyof TextOverlay, value: string | boolean) => {
    setPromptData((prev) => ({
      ...prev,
      text_overlay: { ...prev.text_overlay!, [field]: value },
    }));
  };

  const updateTextOverlayStyle = (field: keyof TextOverlay["style"], value: string | number) => {
    setPromptData((prev) => ({
      ...prev,
      text_overlay: {
        ...prev.text_overlay!,
        style: { ...prev.text_overlay!.style, [field]: value },
      },
    }));
  };

  const toggleTextOverlay = () => {
    setPromptData((prev) => {
      const newEnabled = !prev.text_overlay?.enabled;
      // Automatically update no_text_in_image constraint
      return {
        ...prev,
        text_overlay: { ...prev.text_overlay!, enabled: newEnabled },
        constraints: { ...prev.constraints, no_text_in_image: !newEnabled },
      };
    });
  };

  const addFeature = () => {
    const newFeature: Feature = {
      name: "",
      description: "",
      location: "",
      visibility: "visible"
    };
    setPromptData((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        features: [...prev.product.features, newFeature]
      }
    }));
  };

  const updateFeature = (index: number, field: keyof Feature, value: string) => {
    setPromptData((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        features: prev.product.features.map((feature, i) =>
          i === index ? { ...feature, [field]: value } : feature
        )
      }
    }));
  };

  const removeFeature = (index: number) => {
    setPromptData((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        features: prev.product.features.filter((_, i) => i !== index)
      }
    }));
  };

  const addDimension = () => {
    const newDimension: Dimension = {
      name: "",
      value: "",
      unit: "cm"
    };
    setPromptData((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        dimensions: [...prev.product.dimensions, newDimension]
      }
    }));
  };

  const updateDimension = (index: number, field: keyof Dimension, value: string) => {
    setPromptData((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        dimensions: prev.product.dimensions.map((dimension, i) =>
          i === index ? { ...dimension, [field]: value } : dimension
        )
      }
    }));
  };

  const removeDimension = (index: number) => {
    setPromptData((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        dimensions: prev.product.dimensions.filter((_, i) => i !== index)
      }
    }));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const copyPromptAndJson = async () => {
    try {
      const combinedContent = `Generated Prompt:
${generatePromptText()}

JSON Profile:
${jsonString}`;
      
      await navigator.clipboard.writeText(combinedContent);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const downloadJson = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "piktor-prompt.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generatePromptText = () => {
    return `Create a ${promptData.output.type} image of a ${promptData.product.name}. 

Product Details:
- Material: ${promptData.product.material}
- Color: ${promptData.product.color}
- Style: ${promptData.product.style}
- Dimensions: ${promptData.product.dimensions.map(d => `${d.name}: ${d.value}${d.unit}`).join(", ")}
${promptData.product.features.length > 0 ? `- Features: ${promptData.product.features.map(f => f.name).join(", ")}` : ""}

Image Settings:
- Background: ${promptData.output.background}
- Lighting: ${promptData.output.lighting}
- Aspect Ratio: ${promptData.output.aspectRatio}
- Camera Angle: ${promptData.output.cameraAngle}

Brand Aesthetic: ${promptData.branding.aesthetic}
Mood: ${promptData.branding.moodKeywords.join(", ")}

Constraints:
- Strict Mode: ${promptData.constraints.strict_mode ? 'Enabled' : 'Disabled'}
- Wall Mounted Only: ${promptData.constraints.must_be_wall_mounted ? 'Required' : 'Optional'}
- No Floor Furniture: ${promptData.constraints.no_furniture_on_floor ? 'Enforced' : 'Allowed'}
- No Extra Objects: ${promptData.constraints.no_extra_objects ? 'Prohibited' : 'Allowed'}
- Respect Dimensions: ${promptData.constraints.respect_all_dimensions ? 'Strict' : 'Flexible'}
- No Text in Image: ${promptData.constraints.no_text_in_image ? 'Prohibited' : 'Allowed'}
- No Labels: ${promptData.constraints.no_labels ? 'Prohibited' : 'Allowed'}

Please create a high-quality, professional image that emphasizes the furniture's craftsmanship and fits a home office environment.`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>JSON Prompt Editor</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsJsonMode(!isJsonMode)}
              >
                {isJsonMode ? "Form View" : "JSON View"}
              </Button>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={downloadJson}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isJsonMode ? (
            <Textarea
              value={jsonString}
              onChange={(e) => setJsonString(e.target.value)}
              className="font-mono text-sm min-h-[400px]"
              placeholder="JSON prompt data..."
            />
          ) : (
            <div className="space-y-6">
              <div>
                <button
                  type="button"
                  onClick={() => toggleSection('product')}
                  className="flex items-center justify-between w-full p-3 text-left bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <Label className="text-base font-medium cursor-pointer">Product Details</Label>
                  {expandedSections.product ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedSections.product && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Product Name</Label>
                        <Input
                          id="name"
                          value={promptData.product.name}
                          onChange={(e) => updateProduct("name", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Input
                          id="category"
                          value={promptData.product.category}
                          onChange={(e) => updateProduct("category", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="material">Material</Label>
                        <Input
                          id="material"
                          value={promptData.product.material}
                          onChange={(e) => updateProduct("material", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="color">Color</Label>
                        <Input
                          id="color"
                          value={promptData.product.color}
                          onChange={(e) => updateProduct("color", e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-medium flex items-center gap-2">
                            <Ruler className="h-4 w-4" />
                            Dimensions
                          </Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addDimension}
                            className="flex items-center gap-1"
                          >
                            <Plus className="h-4 w-4" />
                            Add Dimension
                          </Button>
                        </div>
                        {promptData.product.dimensions.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground border rounded-lg mt-2">
                            <Ruler className="h-6 w-6 mx-auto mb-2 opacity-50" />
                            <p>No dimensions added yet</p>
                            <p className="text-sm">Click &quot;Add Dimension&quot; to specify measurements</p>
                          </div>
                        ) : (
                          <div className="space-y-2 mt-2">
                            {promptData.product.dimensions.map((dimension, index) => (
                              <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                                <div className="flex-1">
                                  <Input
                                    placeholder="e.g., width, height, depth"
                                    value={dimension.name}
                                    onChange={(e) => updateDimension(index, "name", e.target.value)}
                                    className="text-sm"
                                  />
                                </div>
                                <div className="w-20">
                                  <Input
                                    placeholder="Value"
                                    value={dimension.value}
                                    onChange={(e) => updateDimension(index, "value", e.target.value)}
                                    className="text-sm"
                                    type="number"
                                  />
                                </div>
                                <div className="w-16">
                                  <select
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={dimension.unit}
                                    onChange={(e) => updateDimension(index, "unit", e.target.value)}
                                  >
                                    <option value="cm">cm</option>
                                    <option value="mm">mm</option>
                                    <option value="m">m</option>
                                    <option value="in">in</option>
                                    <option value="ft">ft</option>
                                  </select>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeDimension(index)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="style">Style</Label>
                        <Input
                          id="style"
                          value={promptData.product.style}
                          onChange={(e) => updateProduct("style", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => toggleSection('features')}
                  className="flex items-center justify-between w-full p-3 text-left bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <Label className="text-base font-medium cursor-pointer flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Product Features
                    {promptData.product.features.length > 0 && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                        {promptData.product.features.length}
                      </span>
                    )}
                  </Label>
                  {expandedSections.features ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedSections.features && (
                  <div className="mt-4 space-y-4">
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addFeature}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Add Feature
                      </Button>
                    </div>
                {promptData.product.features.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No features added yet</p>
                    <p className="text-sm">Click &quot;Add Feature&quot; to describe special features of your furniture</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {promptData.product.features.map((feature, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Feature {index + 1}</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFeature(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`feature-name-${index}`}>Name</Label>
                            <Input
                              id={`feature-name-${index}`}
                              placeholder="e.g., Integrated LED strip"
                              value={feature.name}
                              onChange={(e) => updateFeature(index, "name", e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`feature-location-${index}`}>Location</Label>
                            <Input
                              id={`feature-location-${index}`}
                              placeholder="e.g., inside top panel"
                              value={feature.location}
                              onChange={(e) => updateFeature(index, "location", e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`feature-visibility-${index}`}>Visibility</Label>
                            <select
                              id={`feature-visibility-${index}`}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              value={feature.visibility}
                              onChange={(e) => updateFeature(index, "visibility", e.target.value)}
                            >
                              <option value="visible">Visible</option>
                              <option value="subtle">Subtle</option>
                              <option value="discreet">Discreet</option>
                              <option value="hidden">Hidden</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor={`feature-description-${index}`}>Description</Label>
                            <Textarea
                              id={`feature-description-${index}`}
                              placeholder="e.g., Subtle, warm-white LED lighting embedded along the top interior edge..."
                              value={feature.description}
                              onChange={(e) => updateFeature(index, "description", e.target.value)}
                              className="min-h-[80px]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                  </div>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => toggleSection('output')}
                  className="flex items-center justify-between w-full p-3 text-left bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <Label className="text-base font-medium cursor-pointer">Output Settings</Label>
                  {expandedSections.output ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedSections.output && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="type">Output Type</Label>
                        <select
                          id="type"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={promptData.output.type}
                          onChange={(e) => updateOutput("type", e.target.value as "packshot" | "lifestyle" | "instagram")}
                        >
                          <option value="packshot">Packshot</option>
                          <option value="lifestyle">Lifestyle</option>
                          <option value="instagram">Instagram</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="background">Background</Label>
                        <Input
                          id="background"
                          value={promptData.output.background}
                          onChange={(e) => updateOutput("background", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lighting">Lighting</Label>
                        <Input
                          id="lighting"
                          value={promptData.output.lighting}
                          onChange={(e) => updateOutput("lighting", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                        <select
                          id="aspectRatio"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={promptData.output.aspectRatio}
                          onChange={(e) => updateOutput("aspectRatio", e.target.value)}
                        >
                          <option value="16:9">16:9</option>
                          <option value="4:3">4:3</option>
                          <option value="1:1">1:1 (Square)</option>
                          <option value="9:16">9:16 (Portrait)</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="cameraAngle" className="flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          Camera Angle
                        </Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                          {[
                            { value: "front_center", label: "Front Center", icon: Eye, description: "Direct front view" },
                            { value: "front_left", label: "Front Left", icon: RotateCcw, description: "Front view from left" },
                            { value: "front_right", label: "Front Right", icon: RotateCw, description: "Front view from right" },
                            { value: "three_quarter_left", label: "3/4 Left", icon: Move3D, description: "Three-quarter left angle" },
                            { value: "three_quarter_right", label: "3/4 Right", icon: Move3D, description: "Three-quarter right angle" },
                            { value: "side_left", label: "Side Left", icon: MoveDown, description: "Full left side view" },
                            { value: "side_right", label: "Side Right", icon: MoveUp, description: "Full right side view" },
                            { value: "back", label: "Back", icon: RotateCcw, description: "Rear view" },
                          ].map((angle) => {
                            const IconComponent = angle.icon;
                            return (
                              <button
                                key={angle.value}
                                type="button"
                                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all hover:bg-muted/50 ${
                                  promptData.output.cameraAngle === angle.value
                                    ? "border-primary bg-primary/10"
                                    : "border-border"
                                }`}
                                onClick={() => updateOutput("cameraAngle", angle.value)}
                                title={angle.description}
                              >
                                <IconComponent className="h-5 w-5" />
                                <span className="text-xs text-center font-medium">{angle.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => toggleSection('branding')}
                  className="flex items-center justify-between w-full p-3 text-left bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <Label className="text-base font-medium cursor-pointer">Brand Settings</Label>
                  {expandedSections.branding ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedSections.branding && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <Label htmlFor="aesthetic">Brand Aesthetic</Label>
                      <Input
                        id="aesthetic"
                        value={promptData.branding.aesthetic}
                        onChange={(e) => updateBranding("aesthetic", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="keywords">Mood Keywords (comma-separated)</Label>
                      <Input
                        id="keywords"
                        value={promptData.branding.moodKeywords.join(", ")}
                        onChange={(e) =>
                          updateBranding(
                            "moodKeywords",
                            e.target.value.split(",").map((k) => k.trim())
                          )
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => toggleSection('constraints')}
                  className="flex items-center justify-between w-full p-3 text-left bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <Label className="text-base font-medium cursor-pointer flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Generation Constraints
                  </Label>
                  {expandedSections.constraints ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedSections.constraints && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="strict_mode"
                          checked={promptData.constraints.strict_mode}
                          onChange={(e) => updateConstraints("strict_mode", e.target.checked)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <Label htmlFor="strict_mode" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Strict Mode
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="must_be_wall_mounted"
                          checked={promptData.constraints.must_be_wall_mounted}
                          onChange={(e) => updateConstraints("must_be_wall_mounted", e.target.checked)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <Label htmlFor="must_be_wall_mounted" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Must Be Wall Mounted
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="no_furniture_on_floor"
                          checked={promptData.constraints.no_furniture_on_floor}
                          onChange={(e) => updateConstraints("no_furniture_on_floor", e.target.checked)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <Label htmlFor="no_furniture_on_floor" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          No Furniture on Floor
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="no_extra_objects"
                          checked={promptData.constraints.no_extra_objects}
                          onChange={(e) => updateConstraints("no_extra_objects", e.target.checked)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <Label htmlFor="no_extra_objects" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          No Extra Objects
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="respect_all_dimensions"
                          checked={promptData.constraints.respect_all_dimensions}
                          onChange={(e) => updateConstraints("respect_all_dimensions", e.target.checked)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <Label htmlFor="respect_all_dimensions" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Respect All Dimensions
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="no_text_in_image"
                          checked={promptData.constraints.no_text_in_image}
                          onChange={(e) => updateConstraints("no_text_in_image", e.target.checked)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <Label htmlFor="no_text_in_image" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          No Text in Image
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 md:col-span-2">
                        <input
                          type="checkbox"
                          id="no_labels"
                          checked={promptData.constraints.no_labels}
                          onChange={(e) => updateConstraints("no_labels", e.target.checked)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <Label htmlFor="no_labels" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          No Labels
                        </Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => toggleSection('textOverlay')}
                  className="flex items-center justify-between w-full p-3 text-left bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <Label className="text-base font-medium cursor-pointer flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Text Overlay
                    {promptData.text_overlay?.enabled && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                        Enabled
                      </span>
                    )}
                  </Label>
                  {expandedSections.textOverlay ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedSections.textOverlay && (
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="text_overlay_enabled"
                          checked={promptData.text_overlay?.enabled || false}
                          onChange={toggleTextOverlay}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <Label htmlFor="text_overlay_enabled" className="text-sm font-medium">
                          Enable Text Overlay
                        </Label>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {promptData.text_overlay?.enabled ? "Text will be added to your image" : "No text overlay"}
                      </div>
                    </div>

                    {promptData.text_overlay?.enabled && (
                      <div className="space-y-4 p-4 border rounded-lg bg-background">
                        <div>
                          <Label htmlFor="text_content">Text Content</Label>
                          <Input
                            id="text_content"
                            placeholder="Enter the exact text you want to appear..."
                            value={promptData.text_overlay.content}
                            onChange={(e) => updateTextOverlay("content", e.target.value)}
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            This exact text will appear on your image
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="text_position">Position</Label>
                            <select
                              id="text_position"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              value={promptData.text_overlay.position}
                              onChange={(e) => updateTextOverlay("position", e.target.value)}
                            >
                              <option value="top">Top Center</option>
                              <option value="top-left">Top Left</option>
                              <option value="top-right">Top Right</option>
                              <option value="center">Center</option>
                              <option value="bottom-left">Bottom Left</option>
                              <option value="bottom">Bottom Center</option>
                              <option value="bottom-right">Bottom Right</option>
                            </select>
                          </div>

                          <div>
                            <Label htmlFor="font_family">Font Family</Label>
                            <select
                              id="font_family"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              value={promptData.text_overlay.style.font_family}
                              onChange={(e) => updateTextOverlayStyle("font_family", e.target.value)}
                            >
                              <option value="Arial">Arial</option>
                              <option value="Helvetica">Helvetica</option>
                              <option value="Times New Roman">Times New Roman</option>
                              <option value="Georgia">Georgia</option>
                              <option value="Roboto">Roboto</option>
                              <option value="Open Sans">Open Sans</option>
                              <option value="Lato">Lato</option>
                              <option value="Montserrat">Montserrat</option>
                              <option value="Poppins">Poppins</option>
                              <option value="Inter">Inter</option>
                            </select>
                          </div>

                          <div>
                            <Label htmlFor="font_size">Font Size</Label>
                            <select
                              id="font_size"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              value={promptData.text_overlay.style.font_size}
                              onChange={(e) => updateTextOverlayStyle("font_size", e.target.value)}
                            >
                              <option value="12px">12px - Small</option>
                              <option value="14px">14px - Small</option>
                              <option value="16px">16px - Medium</option>
                              <option value="18px">18px - Medium</option>
                              <option value="20px">20px - Large</option>
                              <option value="24px">24px - Large</option>
                              <option value="28px">28px - Extra Large</option>
                              <option value="32px">32px - Extra Large</option>
                              <option value="36px">36px - Huge</option>
                              <option value="48px">48px - Huge</option>
                            </select>
                          </div>

                          <div>
                            <Label htmlFor="font_weight">Font Weight</Label>
                            <select
                              id="font_weight"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              value={promptData.text_overlay.style.font_weight}
                              onChange={(e) => updateTextOverlayStyle("font_weight", e.target.value)}
                            >
                              <option value="normal">Normal</option>
                              <option value="bold">Bold</option>
                              <option value="100">100 - Thin</option>
                              <option value="300">300 - Light</option>
                              <option value="400">400 - Regular</option>
                              <option value="500">500 - Medium</option>
                              <option value="600">600 - Semi Bold</option>
                              <option value="700">700 - Bold</option>
                              <option value="800">800 - Extra Bold</option>
                              <option value="900">900 - Black</option>
                            </select>
                          </div>

                          <div>
                            <Label htmlFor="text_color">Text Color</Label>
                            <div className="flex gap-2">
                              <Input
                                id="text_color"
                                type="color"
                                value={promptData.text_overlay.style.color}
                                onChange={(e) => updateTextOverlayStyle("color", e.target.value)}
                                className="w-16 h-10 p-1"
                              />
                              <Input
                                placeholder="#333333"
                                value={promptData.text_overlay.style.color}
                                onChange={(e) => updateTextOverlayStyle("color", e.target.value)}
                                className="flex-1"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="bg_color">Background Color (Optional)</Label>
                            <div className="flex gap-2">
                              <Input
                                id="bg_color"
                                type="color"
                                value={promptData.text_overlay.style.background_color || "#FFFFFF"}
                                onChange={(e) => updateTextOverlayStyle("background_color", e.target.value)}
                                className="w-16 h-10 p-1"
                              />
                              <Input
                                placeholder="#FFFFFF (optional)"
                                value={promptData.text_overlay.style.background_color || ""}
                                onChange={(e) => updateTextOverlayStyle("background_color", e.target.value || "")}
                                className="flex-1"
                              />
                            </div>
                          </div>

                          <div className="md:col-span-2">
                            <Label htmlFor="opacity">Opacity</Label>
                            <div className="flex items-center gap-4">
                              <input
                                type="range"
                                id="opacity"
                                min="0"
                                max="1"
                                step="0.1"
                                value={promptData.text_overlay.style.opacity || 1}
                                onChange={(e) => updateTextOverlayStyle("opacity", parseFloat(e.target.value))}
                                className="flex-1"
                              />
                              <span className="text-sm text-muted-foreground w-12">
                                {Math.round((promptData.text_overlay.style.opacity || 1) * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Preview:</strong> &quot;{promptData.text_overlay.content || "Your text here"}&quot; will appear in {promptData.text_overlay.position.replace(/-/g, ' ')} position using {promptData.text_overlay.style.font_family} font.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Generated Prompt</CardTitle>
            <Button variant="outline" size="sm" onClick={copyPromptAndJson}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Prompt + JSON
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={generatePromptText()}
            readOnly
            className="min-h-[200px] text-sm"
          />
        </CardContent>
      </Card>
    </div>
  );
}