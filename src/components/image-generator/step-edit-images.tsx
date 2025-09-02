"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageModal } from "@/components/ui/image-modal";
import { 
  Download, Loader2, Edit3, Images, Eye
} from "lucide-react";
import { 
  GeneratedImage, 
  EditedImage
} from "./types";
import { cn } from "@/lib/utils";
import { generateSafeFilename } from "@/lib/download-utils";
import { LoadingCards } from "./loading-cards";

interface StepEditImagesProps {
  generatedImages: GeneratedImage[];
  editedImages: Record<string, EditedImage[]>;
  isEditing: boolean;
  isGenerating?: boolean;
  onDownload: (imageUrl: string, filename: string, imageId?: string) => void;
  onDownloadAll: (imageIds: string[]) => void;
  downloadingImages?: Set<string>;
  downloadingAll?: boolean;
  isActive: boolean;
  productName?: string;
}

interface ImageCardProps {
  image: GeneratedImage | EditedImage;
  filename: string;
  onDownload: (imageUrl: string, filename: string, imageId?: string) => void;
  onViewModal: (image: GeneratedImage | EditedImage) => void;
  isDownloading: boolean;
}

function ImageCard({ image, filename, onDownload, onViewModal, isDownloading }: ImageCardProps) {
  const handleEdit = () => {
    // Placeholder for future implementation
    alert('Edit functionality will be available in a future update!');
  };

  const handleDownload = () => {
    onDownload(image.url, filename, image.id);
  };

  const handleView = () => {
    onViewModal(image);
  };

  return (
    <div className="group">
      {/* Clean image card with no text/badges/metadata */}
      <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
        <div className="relative aspect-square bg-muted/20 overflow-hidden">
          <Image
            src={image.url}
            alt="Generated image"
            fill
            className="object-cover transition-transform group-hover:scale-105 duration-200"
            unoptimized
          />
        </div>
      </Card>
      
      {/* Three small buttons below the card */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleView}
          className="flex-1 text-xs h-8"
        >
          <Eye className="h-3 w-3 mr-1" />
          View
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleEdit}
          className="flex-1 text-xs h-8"
        >
          <Edit3 className="h-3 w-3 mr-1" />
          Edit
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex-1 text-xs h-8"
        >
          {isDownloading ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Download className="h-3 w-3 mr-1" />
          )}
          {isDownloading ? "..." : "Download"}
        </Button>
      </div>
    </div>
  );
}

export function StepEditImages({
  generatedImages,
  editedImages,
  isGenerating = false,
  onDownload,
  onDownloadAll,
  downloadingImages = new Set(),
  downloadingAll = false,
  isActive,
  productName = "Product",
}: StepEditImagesProps) {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | EditedImage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const hasGeneratedImages = generatedImages.length > 0;
  const hasEditedImages = editedImages ? Object.keys(editedImages).length > 0 : false;
  const totalImages = generatedImages.length + (editedImages ? Object.values(editedImages).reduce((sum, imgs) => sum + imgs.length, 0) : 0);
  
  const handleViewModal = (image: GeneratedImage | EditedImage) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };
  
  const handleModalDownload = () => {
    if (selectedImage) {
      const filename = getImageFilename(selectedImage);
      onDownload(selectedImage.url, filename, selectedImage.id);
    }
  };
  
  const handleModalEdit = () => {
    alert('Edit functionality will be available in a future update!');
  };

  // Helper function to get appropriate filename for image
  const getImageFilename = (image: GeneratedImage | EditedImage, index?: number) => {
    if ('assetType' in image) {
      // EditedImage
      return generateSafeFilename(
        `${productName}_${image.assetType}`,
        'edited',
        image.metadata.variation,
        'jpg'
      );
    } else {
      // GeneratedImage  
      return generateSafeFilename(
        productName,
        'generated',
        index || image.metadata.variation || 1,
        'jpg'
      );
    }
  };

  // If generating and no existing images, show loading cards instead of "no images" message
  if (!hasGeneratedImages && !hasEditedImages && !isGenerating) {
    return (
      <Card className={cn(isActive && "ring-2 ring-primary")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
              isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              2
            </span>
            Image Gallery
          </CardTitle>
          <CardDescription>
            View, download, and manage your generated images.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 bg-muted/20 rounded-lg">
            <Images className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Images Generated Yet</h3>
            <p className="text-muted-foreground">
              Complete the previous step to generate images first, then you can view and download them here.
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
            2
          </span>
          Image Gallery
        </CardTitle>
        <CardDescription>
          View, download, and manage your generated images. Click the three-dot menu on each image for more options.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Gallery Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-medium">Your Images ({totalImages})</h3>
            {hasGeneratedImages && hasEditedImages && (
              <div className="flex gap-2">
                <Badge variant="secondary">{generatedImages.length} Generated</Badge>
                <Badge variant="secondary">{Object.values(editedImages).reduce((sum, imgs) => sum + imgs.length, 0)} Edited</Badge>
              </div>
            )}
          </div>
          {totalImages > 1 && (
            <Button 
              variant="outline" 
              onClick={() => {
                const allImageIds = [
                  ...generatedImages.map(img => img.id),
                  ...Object.keys(editedImages)
                ];
                onDownloadAll(allImageIds);
              }}
              disabled={downloadingAll}
            >
              {downloadingAll ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {downloadingAll ? 'Downloading...' : `Download All (${totalImages})`}
            </Button>
          )}
        </div>

        {/* Show loading cards if generating, otherwise show images */}
        {isGenerating ? (
          <div className="space-y-6">
            {(hasGeneratedImages || hasEditedImages) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Show existing images while generating new ones */}
                {generatedImages.map((image, index) => {
                  const filename = getImageFilename(image, index + 1);
                  
                  return (
                    <ImageCard
                      key={image.id}
                      image={image}
                      filename={filename}
                      onDownload={onDownload}
                      onViewModal={handleViewModal}
                      isDownloading={downloadingImages.has(image.id)}
                    />
                  );
                })}
                
                {/* Show edited images if any */}
                {Object.entries(editedImages).map(([, images]) => 
                  images.map((image) => {
                    const filename = getImageFilename(image);
                    
                    return (
                      <ImageCard
                        key={image.id}
                        image={image}
                        filename={filename}
                        onDownload={onDownload}
                        onViewModal={handleViewModal}
                        isDownloading={downloadingImages.has(image.id)}
                      />
                    );
                  })
                )}
              </div>
            )}
            <LoadingCards count={4} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Generated Images */}
            {generatedImages.map((image, index) => {
              const filename = getImageFilename(image, index + 1);
              
              return (
                <ImageCard
                  key={image.id}
                  image={image}
                  filename={filename}
                  onDownload={onDownload}
                  onViewModal={handleViewModal}
                  isDownloading={downloadingImages.has(image.id)}
                />
              );
            })}
            
            {/* Edited Images */}
            {Object.entries(editedImages).map(([, images]) => 
              images.map((image) => {
                const filename = getImageFilename(image);
                
                return (
                  <ImageCard
                    key={image.id}
                    image={image}
                    filename={filename}
                    onDownload={onDownload}
                    onViewModal={handleViewModal}
                    isDownloading={downloadingImages.has(image.id)}
                  />
                );
              })
            )}
          </div>
        )}
        
        {/* Image Modal */}
        {selectedImage && (
          <ImageModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            imageUrl={selectedImage.url}
            imageAlt="Generated image full view"
            onDownload={handleModalDownload}
            onEdit={handleModalEdit}
            isDownloading={selectedImage ? downloadingImages.has(selectedImage.id) : false}
          />
        )}

        {/* Empty State */}
        {totalImages === 0 && (
          <div className="text-center py-12">
            <Images className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No images yet</h3>
            <p className="text-gray-500">
              Your generated images will appear here once you complete the previous step.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}