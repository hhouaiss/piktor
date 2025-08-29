"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Wand2, Download, Loader2, AlertCircle, CheckCircle, Eye, Palette, 
  Image as ImageIcon, Share2, Monitor, Sparkles, Plus
} from "lucide-react";
import { 
  GeneratedImage, 
  EditedImage, 
  AssetType, 
  EditingProgress,
  ASSET_TYPE_CONFIG,
  getAssetTypeConfig
} from "./types";
import { cn } from "@/lib/utils";
import { generateSafeFilename } from "@/lib/download-utils";

interface StepEditImagesProps {
  generatedImages: GeneratedImage[];
  editedImages: Record<string, EditedImage[]>;
  isEditing: boolean;
  editingProgress?: EditingProgress;
  editingError?: string;
  onEdit: (imageId: string, imageUrl: string, assetType: AssetType, variations?: number, customPrompt?: string) => void;
  onBatchEdit: (imageId: string, imageUrl: string, assetTypes: AssetType[], customPrompts?: Record<AssetType, string>) => void;
  onDownload: (imageUrl: string, filename: string, imageId?: string) => void;
  onDownloadAll: (imageIds: string[]) => void;
  downloadingImages?: Set<string>;
  downloadErrors?: Record<string, string>;
  downloadingAll?: boolean;
  isActive: boolean;
  productName?: string;
}

interface AssetTypeSelection {
  assetType: AssetType;
  selected: boolean;
  variations: number;
  customPrompt: string;
}

const assetTypeIcons: Record<AssetType, React.ComponentType<{ className?: string }>> = {
  lifestyle: ImageIcon,
  ad: Sparkles,
  social: Share2,
  hero: Monitor,
  variation: Palette,
};

export function StepEditImages({
  generatedImages,
  editedImages,
  isEditing,
  editingProgress,
  editingError,
  onEdit,
  onBatchEdit,
  onDownload,
  onDownloadAll,
  downloadingImages = new Set(),
  downloadErrors = {},
  downloadingAll = false,
  isActive,
  productName = "Product",
}: StepEditImagesProps) {
  const [selectedSourceImage, setSelectedSourceImage] = useState<GeneratedImage | null>(null);
  const [selectedAssetTypes, setSelectedAssetTypes] = useState<AssetTypeSelection[]>(
    Object.keys(ASSET_TYPE_CONFIG).map(assetType => ({
      assetType: assetType as AssetType,
      selected: false,
      variations: ASSET_TYPE_CONFIG[assetType as AssetType].variations,
      customPrompt: '',
    }))
  );
  const [previewImage, setPreviewImage] = useState<EditedImage | null>(null);
  const [showBatchEdit, setShowBatchEdit] = useState(false);

  const hasGeneratedImages = generatedImages.length > 0;
  const hasEditedImages = editedImages ? Object.keys(editedImages).length > 0 : false;
  const totalEditedImages = editedImages ? Object.values(editedImages).reduce((sum, imgs) => sum + imgs.length, 0) : 0;

  const handleAssetTypeToggle = (assetType: AssetType) => {
    setSelectedAssetTypes(prev => 
      prev.map(item => 
        item.assetType === assetType 
          ? { ...item, selected: !item.selected }
          : item
      )
    );
  };

  const handleVariationsChange = (assetType: AssetType, variations: number) => {
    const clampedVariations = Math.min(Math.max(variations, 1), 4);
    setSelectedAssetTypes(prev => 
      prev.map(item => 
        item.assetType === assetType 
          ? { ...item, variations: clampedVariations }
          : item
      )
    );
  };

  const handleCustomPromptChange = (assetType: AssetType, prompt: string) => {
    setSelectedAssetTypes(prev => 
      prev.map(item => 
        item.assetType === assetType 
          ? { ...item, customPrompt: prompt }
          : item
      )
    );
  };

  const handleSingleEdit = (image: GeneratedImage, assetType: AssetType) => {
    const config = selectedAssetTypes.find(item => item.assetType === assetType);
    onEdit(
      image.id,
      image.url,
      assetType,
      config?.variations || 1,
      config?.customPrompt || undefined
    );
  };

  const handleBatchEdit = () => {
    if (!selectedSourceImage) return;

    const selectedTypes = selectedAssetTypes.filter(item => item.selected);
    if (selectedTypes.length === 0) {
      alert('Please select at least one asset type for batch editing.');
      return;
    }

    const assetTypes = selectedTypes.map(item => item.assetType);
    const customPrompts: Partial<Record<AssetType, string>> = {};
    
    selectedTypes.forEach(item => {
      if (item.customPrompt.trim()) {
        customPrompts[item.assetType] = item.customPrompt;
      }
    });

    onBatchEdit(
      selectedSourceImage.id,
      selectedSourceImage.url,
      assetTypes,
      Object.keys(customPrompts).length > 0 ? customPrompts as Record<AssetType, string> : undefined
    );

    setShowBatchEdit(false);
    setSelectedSourceImage(null);
  };

  const getImageFilename = (assetType: AssetType, variation?: number) => {
    return generateSafeFilename(
      `${productName}_${assetType}`,
      'edited',
      variation,
      'jpg'
    );
  };

  const downloadEditedImages = (sourceImageId: string) => {
    const images = editedImages[sourceImageId] || [];
    if (images.length === 0) return;

    images.forEach((image) => {
      const filename = getImageFilename(image.assetType, image.metadata.variation);
      onDownload(image.url, filename, image.id);
    });
  };

  if (!hasGeneratedImages) {
    return (
      <Card className={cn(isActive && "ring-2 ring-primary")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
              isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              3
            </span>
            Edit Images
          </CardTitle>
          <CardDescription>
            Transform your generated images into marketing assets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 bg-muted/20 rounded-lg">
            <Wand2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Images to Edit</h3>
            <p className="text-muted-foreground">
              Complete the previous steps to generate images first, then you can transform them into professional marketing assets.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(isActive && "ring-2 ring-primary")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
            isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            3
          </span>
          Edit Images
        </CardTitle>
        <CardDescription>
          Transform your generated images into professional marketing assets like lifestyle scenes, ad creatives, social media posts, and more.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        
        {/* Asset Type Selection Panel */}
        <div className="bg-muted/20 rounded-lg p-4">
          <h3 className="font-medium mb-3">Available Asset Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(ASSET_TYPE_CONFIG).map(([assetType, config]) => {
              const Icon = assetTypeIcons[assetType as AssetType];
              return (
                <div key={assetType} className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                  <Icon className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{config.name}</p>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Editing Progress */}
        {isEditing && editingProgress && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="font-medium">Creating Marketing Assets...</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {editingProgress.current} / {editingProgress.total}
              </span>
            </div>
            
            <Progress 
              value={(editingProgress.current / editingProgress.total) * 100} 
              className="h-2"
            />
            
            <p className="text-sm text-muted-foreground">
              {editingProgress.stage}
              {editingProgress.assetType && ` - ${getAssetTypeConfig(editingProgress.assetType).name}`}
            </p>
          </div>
        )}

        {/* Editing Error */}
        {editingError && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertCircle className="h-4 w-4" />
              <p className="font-medium">Editing Error</p>
            </div>
            <p className="text-sm text-destructive/80">{editingError}</p>
          </div>
        )}

        {/* Generated Images - Ready for Editing */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Source Images ({generatedImages.length})</h3>
            <Button
              variant="outline"
              onClick={() => setShowBatchEdit(true)}
              disabled={isEditing}
            >
              <Plus className="h-4 w-4 mr-2" />
              Batch Edit
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {generatedImages.map((image) => {
              const imageEditedCount = editedImages[image.id]?.length || 0;
              
              return (
                <div key={image.id} className="group border rounded-lg overflow-hidden">
                  <div className="relative bg-muted/50" style={{ aspectRatio: '1/1' }}>
                    <Image
                      src={image.url}
                      alt={`Generated image for editing`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    
                    {/* Quick Edit Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex gap-2 flex-wrap justify-center p-2">
                        {Object.keys(ASSET_TYPE_CONFIG).slice(0, 3).map((assetType) => {
                          const config = ASSET_TYPE_CONFIG[assetType as AssetType];
                          const Icon = assetTypeIcons[assetType as AssetType];
                          return (
                            <Button
                              key={assetType}
                              size="sm"
                              variant="secondary"
                              onClick={() => handleSingleEdit(image, assetType as AssetType)}
                              disabled={isEditing}
                              className="flex items-center gap-1 text-xs"
                            >
                              <Icon className="h-3 w-3" />
                              {config.name}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        Original
                      </Badge>
                      {imageEditedCount > 0 && (
                        <Badge variant="default" className="text-xs">
                          {imageEditedCount} edited
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedSourceImage(image);
                          setShowBatchEdit(true);
                        }}
                        disabled={isEditing}
                      >
                        <Wand2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      {imageEditedCount > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadEditedImages(image.id)}
                          disabled={downloadingImages.has(image.id)}
                        >
                          {downloadingImages.has(image.id) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Download className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Edited Images Gallery */}
        {hasEditedImages && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Edited Marketing Assets ({totalEditedImages})
              </h3>
              {totalEditedImages > 1 && (
                <Button 
                  variant="outline" 
                  onClick={() => onDownloadAll(Object.keys(editedImages))}
                  disabled={downloadingAll}
                >
                  {downloadingAll ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {downloadingAll ? 'Downloading...' : 'Download All'}
                </Button>
              )}
            </div>

            {Object.entries(editedImages).map(([sourceImageId, images]) => (
              <div key={sourceImageId} className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">
                  Edited from source image
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {images.map((image) => (
                    <div key={image.id} className="group border rounded-lg overflow-hidden">
                      <div className="relative bg-muted/50" style={{ aspectRatio: '1/1' }}>
                        <Image
                          src={image.url}
                          alt={`${image.assetType} asset`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        
                        {/* Preview Overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setPreviewImage(image)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onDownload(
                              image.url, 
                              getImageFilename(image.assetType, image.metadata.variation),
                              image.id
                            )}
                            disabled={downloadingImages.has(image.id)}
                          >
                            {downloadingImages.has(image.id) ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Download className="h-3 w-3 mr-1" />
                            )}
                            Download
                          </Button>
                        </div>
                      </div>
                      
                      <div className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {getAssetTypeConfig(image.assetType).name}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Var. {image.metadata.variation}
                          </span>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => onDownload(
                            image.url,
                            getImageFilename(image.assetType, image.metadata.variation),
                            image.id
                          )}
                          disabled={downloadingImages.has(image.id)}
                        >
                          {downloadingImages.has(image.id) ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </>
                          )}
                        </Button>

                        {downloadErrors[image.id] && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
                            <div className="flex items-start gap-1">
                              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span className="text-xs">{downloadErrors[image.id]}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Batch Edit Modal */}
        {showBatchEdit && (
          <div 
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowBatchEdit(false)}
          >
            <div 
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold mb-2">Batch Edit to Marketing Assets</h3>
                <p className="text-sm text-muted-foreground">
                  Select the asset types you want to create and customize the generation for each.
                </p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedAssetTypes.map((selection) => {
                    const config = ASSET_TYPE_CONFIG[selection.assetType];
                    const Icon = assetTypeIcons[selection.assetType];
                    
                    return (
                      <div
                        key={selection.assetType}
                        className={cn(
                          "p-4 border rounded-lg cursor-pointer transition-colors",
                          selection.selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                        )}
                        onClick={() => handleAssetTypeToggle(selection.assetType)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <input
                              type="checkbox"
                              checked={selection.selected}
                              onChange={() => handleAssetTypeToggle(selection.assetType)}
                              className="w-4 h-4"
                            />
                          </div>
                          <Icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <div className="flex-1 space-y-3">
                            <div>
                              <h4 className="font-medium">{config.name}</h4>
                              <p className="text-sm text-muted-foreground">{config.description}</p>
                            </div>
                            
                            {selection.selected && (
                              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground">
                                    Variations (1-4):
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="4"
                                    value={selection.variations}
                                    onChange={(e) => handleVariationsChange(
                                      selection.assetType,
                                      parseInt(e.target.value) || 1
                                    )}
                                    className="w-full mt-1 px-2 py-1 text-sm border rounded"
                                  />
                                </div>
                                
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground">
                                    Custom Prompt (optional):
                                  </label>
                                  <Textarea
                                    value={selection.customPrompt}
                                    onChange={(e) => handleCustomPromptChange(
                                      selection.assetType,
                                      e.target.value
                                    )}
                                    placeholder="Add specific instructions for this asset type..."
                                    className="mt-1 text-sm"
                                    rows={2}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="p-6 border-t flex justify-between">
                <Button variant="outline" onClick={() => setShowBatchEdit(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleBatchEdit}
                  disabled={selectedAssetTypes.filter(s => s.selected).length === 0 || isEditing}
                >
                  {isEditing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Create Assets ({selectedAssetTypes.filter(s => s.selected).length})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Image Preview Modal */}
        {previewImage && (
          <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <div 
              className="max-w-4xl max-h-full bg-white rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <Image
                  src={previewImage.url}
                  alt="Asset preview"
                  width={800}
                  height={800}
                  className="max-h-[80vh] w-auto"
                  unoptimized
                />
                <Button
                  className="absolute top-4 right-4"
                  variant="secondary"
                  onClick={() => setPreviewImage(null)}
                >
                  Close
                </Button>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge>{getAssetTypeConfig(previewImage.assetType).name}</Badge>
                  <span className="text-sm text-muted-foreground">
                    Variation {previewImage.metadata.variation}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {previewImage.prompt}
                </p>
                <Button
                  size="sm"
                  onClick={() => onDownload(
                    previewImage.url,
                    getImageFilename(
                      previewImage.assetType, 
                      previewImage.metadata.variation
                    ),
                    previewImage.id
                  )}
                  disabled={downloadingImages.has(previewImage.id)}
                >
                  {downloadingImages.has(previewImage.id) ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}