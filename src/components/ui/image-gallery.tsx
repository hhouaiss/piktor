"use client";

import { useState } from "react";
import { Download, RotateCcw, Star, ZoomIn, Share2, Heart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ImageData {
  id: string;
  url: string;
  prompt: string;
  qualityScore?: number;
  style: string;
  isLoading?: boolean;
  metadata?: {
    model: string;
    timestamp: string;
    size: string;
    quality: string;
    variation: number;
    contextPreset: string;
  };
}

interface ImageGalleryProps {
  images: ImageData[];
  onDownload: (imageUrl: string, filename: string, imageId: string) => void;
  onRegenerate: (imageId: string) => void;
  downloadingImages: Set<string>;
  downloadErrors: Record<string, string>;
  className?: string;
}

export function ImageGallery({ 
  images, 
  onDownload, 
  onRegenerate, 
  downloadingImages,
  downloadErrors,
  className = "" 
}: ImageGalleryProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'newest' | 'quality' | 'style'>('newest');

  const toggleFavorite = (imageId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(imageId)) {
      newFavorites.delete(imageId);
    } else {
      newFavorites.add(imageId);
    }
    setFavorites(newFavorites);
  };

  const getQualityScoreColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-600';
    if (score >= 90) return 'bg-green-100 text-green-700';
    if (score >= 75) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getQualityLabel = (score?: number) => {
    if (!score) return 'Unrated';
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  const sortedImages = [...images].sort((a, b) => {
    switch (sortBy) {
      case 'quality':
        return (b.qualityScore || 0) - (a.qualityScore || 0);
      case 'style':
        return a.style.localeCompare(b.style);
      default:
        return new Date(b.metadata?.timestamp || 0).getTime() - new Date(a.metadata?.timestamp || 0).getTime();
    }
  });

  if (images.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Eye className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg mb-2">No images generated yet</h3>
        <p className="text-muted-foreground">
          Complete the previous steps to generate your first images
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Gallery Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{images.length} images</span>
          {favorites.size > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {favorites.size} favorited
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'quality' | 'style')}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="newest">Newest</option>
            <option value="quality">Quality Score</option>
            <option value="style">Style</option>
          </select>
        </div>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedImages.map((image) => (
          <Card key={image.id} className="group overflow-hidden transition-all hover:shadow-lg">
            <CardContent className="p-0">
              {/* Image Container */}
              <div className="relative aspect-square bg-muted overflow-hidden">
                {image.isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    <img
                      src={image.url}
                      alt={`Generated image - ${image.style}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    
                    {/* Overlay Controls */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
                      <div className="absolute top-2 right-2 flex gap-1">
                        {/* Favorite Button */}
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => toggleFavorite(image.id)}
                        >
                          <Heart 
                            className={cn(
                              "w-4 h-4",
                              favorites.has(image.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"
                            )}
                          />
                        </Button>
                        
                        {/* Zoom Button */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ZoomIn className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <img src={image.url} alt="Full size image" className="w-full rounded-lg" />
                          </DialogContent>
                        </Dialog>
                      </div>
                      
                      {/* Quality Score */}
                      {image.qualityScore && (
                        <div className="absolute top-2 left-2">
                          <Badge className={cn("text-xs", getQualityScoreColor(image.qualityScore))}>
                            <Star className="w-3 h-3 mr-1" />
                            {image.qualityScore}/100
                          </Badge>
                        </div>
                      )}
                      
                      {/* Favorite Indicator */}
                      {favorites.has(image.id) && (
                        <div className="absolute bottom-2 left-2">
                          <Badge className="bg-red-100 text-red-700">
                            <Heart className="w-3 h-3 mr-1 fill-current" />
                            Favorite
                          </Badge>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Image Info */}
              <div className="p-4 space-y-3">
                {/* Style and Quality */}
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{image.style}</Badge>
                  {image.qualityScore && (
                    <span className="text-sm text-muted-foreground">
                      {getQualityLabel(image.qualityScore)}
                    </span>
                  )}
                </div>
                
                {/* Prompt Preview */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {image.prompt}
                </p>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => onDownload(
                      image.url, 
                      `piktor-${image.style.toLowerCase()}-${image.id}.jpg`,
                      image.id
                    )}
                    disabled={downloadingImages.has(image.id)}
                  >
                    {downloadingImages.has(image.id) ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Downloading
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRegenerate(image.id)}
                    disabled={image.isLoading}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Share functionality
                      if (navigator.share) {
                        navigator.share({
                          title: `AI Generated Image - ${image.style}`,
                          url: image.url
                        });
                      }
                    }}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Download Error */}
                {downloadErrors[image.id] && (
                  <div className="text-sm text-red-600 p-2 bg-red-50 rounded">
                    {downloadErrors[image.id]}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Bulk Actions */}
      {images.length > 1 && (
        <div className="flex justify-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              // Bulk download logic would go here
              images.forEach((image, index) => {
                setTimeout(() => {
                  onDownload(
                    image.url,
                    `piktor-bulk-${index + 1}-${image.id}.jpg`,
                    `bulk-${image.id}`
                  );
                }, index * 1000); // Stagger downloads
              });
            }}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download All ({images.length} images)
          </Button>
        </div>
      )}
    </div>
  );
}