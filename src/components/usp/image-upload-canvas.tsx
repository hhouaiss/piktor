"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Canvas } from "fabric";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

// Type declarations for Fabric.js
interface FabricObject {
  left?: number;
  top?: number;
  scaleX?: number;
  scaleY?: number;
  selectable?: boolean;
  evented?: boolean;
  fill?: string;
  opacity?: number;
  width?: number;
  height?: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: string;
  originX?: string;
  originY?: string;
}

interface FabricWindow extends Window {
  fabric: {
    Image: new (element: HTMLImageElement, options?: FabricObject) => FabricObject;
    Text: new (text: string, options?: FabricObject) => FabricObject;
    Rect: new (options?: FabricObject) => FabricObject;
  };
}

declare const window: FabricWindow;

interface USPTextConfig {
  content: string;
  position: "top-left" | "top-center" | "top-right" | "center-left" | "center" | "center-right" | "bottom-left" | "bottom-center" | "bottom-right";
  font_family: string;
  font_size: string;
  font_weight: string;
  color: string;
  background_color?: string;
  opacity: number;
}

interface UploadedImage {
  file: File;
  url: string;
}

interface ImageUploadCanvasProps {
  onImageUpload: (image: UploadedImage) => void;
  uspConfig: USPTextConfig;
}

export function ImageUploadCanvas({ onImageUpload, uspConfig }: ImageUploadCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      const canvas = new Canvas(canvasRef.current, {
        width: 600,
        height: 400,
        backgroundColor: "#f8f9fa",
        selection: false,
      });
      
      fabricCanvasRef.current = canvas;

      return () => {
        canvas.dispose();
        fabricCanvasRef.current = null;
      };
    }
  }, []);

  // Handle image upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    const newImage = { file, url: imageUrl };
    
    setUploadedImage(newImage);
    onImageUpload(newImage);
  }, [onImageUpload]);

  // Load image into canvas
  useEffect(() => {
    if (uploadedImage && fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      
      // Clear canvas
      canvas.clear();
      setImageLoaded(false);
      
      // Create image element
      const imgElement = new Image();
      imgElement.crossOrigin = "anonymous";
      
      imgElement.onload = () => {
        try {
          // Calculate dimensions to fit canvas while maintaining aspect ratio
          const maxWidth = 600;
          const maxHeight = 400;
          const aspectRatio = imgElement.width / imgElement.height;
          
          let canvasWidth = maxWidth;
          let canvasHeight = maxWidth / aspectRatio;
          
          if (canvasHeight > maxHeight) {
            canvasHeight = maxHeight;
            canvasWidth = maxHeight * aspectRatio;
          }
          
          // Resize canvas
          canvas.setDimensions({ width: canvasWidth, height: canvasHeight });
          
          // Add image to canvas using Fabric.js Image.fromURL method
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).fabric.Image.fromURL(uploadedImage.url, (fabricImage: any) => {
            fabricImage.set({
              left: 0,
              top: 0,
              scaleX: canvasWidth / fabricImage.width,
              scaleY: canvasHeight / fabricImage.height,
              selectable: false,
              evented: false,
            });
            
            canvas.add(fabricImage);
            canvas.renderAll();
            setImageLoaded(true);
          }, {
            crossOrigin: 'anonymous'
          });
        } catch (error) {
          console.error('Error loading image into canvas:', error);
          setImageLoaded(false);
        }
      };
      
      imgElement.onerror = () => {
        console.error('Failed to load image');
        setImageLoaded(false);
      };
      
      imgElement.src = uploadedImage.url;
    }
  }, [uploadedImage]);

  // Update text overlay when config changes
  useEffect(() => {
    if (!imageLoaded || !fabricCanvasRef.current || !uspConfig.content.trim()) {
      return;
    }

    const canvas = fabricCanvasRef.current;
    
    // Remove existing text objects
    const objects = canvas.getObjects();
    const textObjects = objects.filter(obj => obj.type === "text");
    textObjects.forEach(obj => canvas.remove(obj));

    // Calculate position
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    
    let left = 0;
    let top = 0;
    let textAlign = "left";
    let originX = "left";
    let originY = "top";

    switch (uspConfig.position) {
      case "top-left":
        left = 20;
        top = 20;
        break;
      case "top-center":
        left = canvasWidth / 2;
        top = 20;
        textAlign = "center";
        originX = "center";
        break;
      case "top-right":
        left = canvasWidth - 20;
        top = 20;
        textAlign = "right";
        originX = "right";
        break;
      case "center-left":
        left = 20;
        top = canvasHeight / 2;
        originY = "center";
        break;
      case "center":
        left = canvasWidth / 2;
        top = canvasHeight / 2;
        textAlign = "center";
        originX = "center";
        originY = "center";
        break;
      case "center-right":
        left = canvasWidth - 20;
        top = canvasHeight / 2;
        textAlign = "right";
        originX = "right";
        originY = "center";
        break;
      case "bottom-left":
        left = 20;
        top = canvasHeight - 20;
        originY = "bottom";
        break;
      case "bottom-center":
        left = canvasWidth / 2;
        top = canvasHeight - 20;
        textAlign = "center";
        originX = "center";
        originY = "bottom";
        break;
      case "bottom-right":
        left = canvasWidth - 20;
        top = canvasHeight - 20;
        textAlign = "right";
        originX = "right";
        originY = "bottom";
        break;
    }

    // Create text with background if specified
    if (uspConfig.background_color) {
      // Create background rectangle
      const fontSize = parseInt(uspConfig.font_size.replace('px', ''));
      const textWidth = uspConfig.content.length * fontSize * 0.6;
      const textHeight = fontSize * 1.2;
      
      let bgLeft = left;
      let bgTop = top;
      
      if (originX === "center") bgLeft -= textWidth / 2;
      if (originX === "right") bgLeft -= textWidth;
      if (originY === "center") bgTop -= textHeight / 2;
      if (originY === "bottom") bgTop -= textHeight;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const background = new (window as any).fabric.Rect({
        left: bgLeft - 10,
        top: bgTop - 5,
        width: textWidth + 20,
        height: textHeight + 10,
        fill: uspConfig.background_color,
        opacity: uspConfig.opacity,
        selectable: false,
        evented: false,
      });
      
      canvas.add(background);
    }

    // Create text object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const text = new (window as any).fabric.Text(uspConfig.content, {
      left,
      top,
      fontFamily: uspConfig.font_family,
      fontSize: parseInt(uspConfig.font_size.replace('px', '')),
      fontWeight: uspConfig.font_weight,
      fill: uspConfig.color,
      opacity: uspConfig.background_color ? 1 : uspConfig.opacity,
      textAlign,
      originX,
      originY,
      selectable: false,
      evented: false,
    });

    canvas.add(text);
    canvas.renderAll();
  }, [uspConfig, imageLoaded]);

  const removeImage = () => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage.url);
      setUploadedImage(null);
      setImageLoaded(false);
      onImageUpload({ file: new File([], ""), url: "" });
      
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.clear();
        fabricCanvasRef.current.setDimensions({ width: 600, height: 400 });
        fabricCanvasRef.current.renderAll();
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    multiple: false,
  });

  return (
    <div className="space-y-4">
      {!uploadedImage ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          {isDragActive ? (
            <p className="text-lg font-medium">Drop your product image here...</p>
          ) : (
            <div>
              <p className="text-lg font-medium mb-2">
                Drag & drop your product image here, or click to select
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Support for JPG and PNG images
              </p>
              <Button variant="outline">Browse Image</Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{uploadedImage.file.name}</h3>
              <p className="text-sm text-muted-foreground">
                {(uploadedImage.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={removeImage}>
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
          
          <div className="border rounded-lg p-4 bg-gray-50">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto border rounded"
            />
          </div>
          
          {uspConfig.content && (
            <div className="text-sm text-muted-foreground text-center">
              Live preview: &quot;{uspConfig.content}&quot; positioned at {uspConfig.position.replace(/-/g, ' ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}