"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Instagram, Facebook, Camera, Home, Package, Smartphone } from "lucide-react";
import { 
  ContextSelection, 
  ContextType, 
  SocialMediaFormat,
  CONTEXT_TYPE_CONFIG,
  createContextSelection 
} from "./types";
import { cn } from "@/lib/utils";

interface StepContextSelectionProps {
  contextSelection: ContextSelection | null;
  onContextSelectionChange: (selection: ContextSelection) => void;
  onComplete: () => void;
  isActive: boolean;
}

export function StepContextSelection({
  contextSelection,
  onContextSelectionChange,
  onComplete,
  isActive
}: StepContextSelectionProps) {
  const [selectedContextType, setSelectedContextType] = useState<ContextType | null>(
    contextSelection?.contextType || null
  );
  const [selectedSocialFormat, setSelectedSocialFormat] = useState<SocialMediaFormat | null>(
    contextSelection?.socialMediaFormat || null
  );
  const [showSocialFormats, setShowSocialFormats] = useState(
    contextSelection?.contextType === 'social-media'
  );

  const handleContextTypeSelect = (contextType: ContextType) => {
    setSelectedContextType(contextType);
    
    if (contextType === 'social-media') {
      setShowSocialFormats(true);
      setSelectedSocialFormat(null);
    } else {
      setShowSocialFormats(false);
      setSelectedSocialFormat(null);
      
      // Immediately create and emit selection for non-social-media types
      const selection = createContextSelection(contextType);
      onContextSelectionChange(selection);
    }
  };

  const handleSocialFormatSelect = (format: SocialMediaFormat) => {
    setSelectedSocialFormat(format);
    
    // Create and emit selection for social media with format
    const selection = createContextSelection('social-media', format);
    onContextSelectionChange(selection);
  };

  const handleComplete = () => {
    if (contextSelection) {
      onComplete();
    }
  };

  const isSelectionComplete = () => {
    return contextSelection && (
      contextSelection.contextType !== 'social-media' || 
      (contextSelection.contextType === 'social-media' && contextSelection.socialMediaFormat)
    );
  };

  const getContextIcon = (contextType: ContextType) => {
    switch (contextType) {
      case 'packshot':
        return Package;
      case 'social-media':
        return Smartphone;
      case 'lifestyle':
        return Home;
      default:
        return Camera;
    }
  };

  if (!isActive) {
    return (
      <Card variant="ghost" className="opacity-60">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs text-muted-foreground">1</span>
            </div>
            <CardTitle className="text-lg">Choose Image Context</CardTitle>
          </div>
          <CardDescription>
            {contextSelection ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>
                  {CONTEXT_TYPE_CONFIG[contextSelection.contextType].name}
                  {contextSelection.socialMediaFormat && 
                    ` - ${CONTEXT_TYPE_CONFIG['social-media'].formats[contextSelection.socialMediaFormat].name}`
                  }
                </span>
              </div>
            ) : (
              'Select the type of images you want to create'
            )}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card variant="gradient" className="shadow-lg">
      <CardHeader className="pb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-ocean-gold text-white flex items-center justify-center font-semibold">
            1
          </div>
          <CardTitle className="text-xl">Choose Image Context</CardTitle>
        </div>
        <CardDescription className="text-base">
          Select the type of images you want to create for your product
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Context Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(CONTEXT_TYPE_CONFIG) as ContextType[]).map((contextType) => {
            const config = CONTEXT_TYPE_CONFIG[contextType];
            const IconComponent = getContextIcon(contextType);
            const isSelected = selectedContextType === contextType;
            
            return (
              <Card
                key={contextType}
                variant={isSelected ? "premium" : "outlined"}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:scale-105",
                  isSelected && "ring-2 ring-ocean-blue-500 shadow-lg"
                )}
                onClick={() => handleContextTypeSelect(contextType)}
              >
                <CardContent className="p-6 text-center">
                  <div className="mb-4">
                    <div className={cn(
                      "w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-colors",
                      isSelected 
                        ? "bg-gradient-ocean-gold text-white" 
                        : "bg-sophisticated-gray-100 text-sophisticated-gray-600 dark:bg-sophisticated-gray-800 dark:text-sophisticated-gray-400"
                    )}>
                      <IconComponent className="w-8 h-8" />
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-2">{config.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                    {config.description}
                  </p>
                  
                  <div className="space-y-2">
                    <Badge variant="secondary" className="text-xs">
                      {config.size}
                    </Badge>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {config.examples.map((example, index) => (
                        <Badge 
                          key={index}
                          variant="outline" 
                          className="text-xs"
                        >
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="mt-4">
                      <CheckCircle className="w-6 h-6 mx-auto text-ocean-blue-600" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Social Media Format Selection */}
        {showSocialFormats && selectedContextType === 'social-media' && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center">
              <h4 className="text-lg font-semibold mb-2">Choose Social Media Format</h4>
              <p className="text-sm text-muted-foreground">
                Select the format that best fits your social media strategy
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {(Object.keys(CONTEXT_TYPE_CONFIG['social-media'].formats) as SocialMediaFormat[]).map((format) => {
                const formatConfig = CONTEXT_TYPE_CONFIG['social-media'].formats[format];
                const isSelected = selectedSocialFormat === format;
                const IconComponent = format === 'square' ? Instagram : Facebook;
                
                return (
                  <Card
                    key={format}
                    variant={isSelected ? "premium" : "outlined"}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:scale-105",
                      isSelected && "ring-2 ring-ocean-blue-500 shadow-lg"
                    )}
                    onClick={() => handleSocialFormatSelect(format)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="mb-4">
                        <div className={cn(
                          "w-12 h-12 mx-auto rounded-full flex items-center justify-center transition-colors",
                          isSelected 
                            ? "bg-gradient-ocean-gold text-white" 
                            : "bg-sophisticated-gray-100 text-sophisticated-gray-600 dark:bg-sophisticated-gray-800 dark:text-sophisticated-gray-400"
                        )}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                      </div>
                      
                      <h4 className="font-semibold mb-2">{formatConfig.name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {formatConfig.description}
                      </p>
                      
                      <Badge variant="secondary" className="text-xs">
                        {formatConfig.size}
                      </Badge>
                      
                      {isSelected && (
                        <div className="mt-4">
                          <CheckCircle className="w-5 h-5 mx-auto text-ocean-blue-600" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Continue Button */}
        {isSelectionComplete() && (
          <div className="flex justify-center pt-6 animate-fade-in">
            <Button 
              size="lg" 
              onClick={handleComplete}
              className="px-8"
            >
              Continue to Product Input
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}