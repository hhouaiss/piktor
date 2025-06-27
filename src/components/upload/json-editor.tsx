"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Copy, Download, Camera, Eye, RotateCcw, RotateCw, MoveUp, MoveDown, Move3D } from "lucide-react";

interface PromptData {
  product: {
    name: string;
    category: string;
    material: string;
    color: string;
    dimensions: string;
    style: string;
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
  dimensions?: string | DimensionsObject;
  style?: string;
}

interface InitialOutput {
  type?: "packshot" | "lifestyle" | "instagram";
  aspect_ratio?: string;
  camera_angle?: string;
}

interface InitialData {
  product?: InitialProduct;
  output?: InitialOutput;
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
    dimensions: "120x60x75 cm",
    style: "modern minimalist",
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
};

export function JsonEditor({ initialData, onDataChange }: JsonEditorProps) {
  const [promptData, setPromptData] = useState<PromptData>(defaultPromptData);
  const [jsonString, setJsonString] = useState("");
  const [isJsonMode, setIsJsonMode] = useState(false);

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
          dimensions: (initialData.product.dimensions && typeof initialData.product.dimensions === 'object')
            ? `${(initialData.product.dimensions as DimensionsObject).width}x${(initialData.product.dimensions as DimensionsObject).depth}x${(initialData.product.dimensions as DimensionsObject).height}`
            : (typeof initialData.product.dimensions === 'string' ? initialData.product.dimensions : defaultPromptData.product.dimensions),
          style: initialData.product.style || defaultPromptData.product.style,
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
- Dimensions: ${promptData.product.dimensions}

Image Settings:
- Background: ${promptData.output.background}
- Lighting: ${promptData.output.lighting}
- Aspect Ratio: ${promptData.output.aspectRatio}
- Camera Angle: ${promptData.output.cameraAngle}

Brand Aesthetic: ${promptData.branding.aesthetic}
Mood: ${promptData.branding.moodKeywords.join(", ")}

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
                <Label className="text-base font-medium">Product Details</Label>
                <Separator className="my-2" />
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
                  <div>
                    <Label htmlFor="dimensions">Dimensions</Label>
                    <Input
                      id="dimensions"
                      value={promptData.product.dimensions}
                      onChange={(e) => updateProduct("dimensions", e.target.value)}
                    />
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

              <div>
                <Label className="text-base font-medium">Output Settings</Label>
                <Separator className="my-2" />
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

              <div>
                <Label className="text-base font-medium">Brand Settings</Label>
                <Separator className="my-2" />
                <div className="space-y-4">
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