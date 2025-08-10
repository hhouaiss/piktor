"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Save, Copy, CheckCircle } from "lucide-react";
import { UiSettings, ProductConfiguration, CONTEXT_PRESET_SETTINGS, DEFAULT_UI_SETTINGS } from "./types";
import { cn } from "@/lib/utils";

interface StepGenerationSettingsProps {
  productConfiguration: ProductConfiguration | null;
  onConfigurationChange: (config: ProductConfiguration) => void;
  onComplete: () => void;
  isActive: boolean;
}

const BACKGROUND_STYLES = [
  { value: 'plain', label: 'Plain' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'gradient', label: 'Gradient' },
] as const;

const PRODUCT_POSITIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
] as const;

const TEXT_ZONES = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
] as const;

const PROPS_OPTIONS = [
  { value: 'plant', label: 'Plant' },
  { value: 'lamp', label: 'Lamp' },
  { value: 'rug', label: 'Rug' },
  { value: 'chair', label: 'Chair' },
  { value: 'artwork', label: 'Artwork' },
] as const;

const LIGHTING_OPTIONS = [
  { value: 'soft_daylight', label: 'Soft Daylight' },
  { value: 'studio_softbox', label: 'Studio Softbox' },
  { value: 'warm_ambient', label: 'Warm Ambient' },
] as const;

const QUALITY_OPTIONS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
] as const;

const VARIATION_OPTIONS = [1, 2, 3, 4] as const;

export function StepGenerationSettings({ productConfiguration, onConfigurationChange, onComplete, isActive }: StepGenerationSettingsProps) {
  const [configurationName, setConfigurationName] = useState(productConfiguration?.name || '');
  
  if (!productConfiguration) return null;

  const settings = productConfiguration.uiSettings;

  const updateSettings = (field: keyof UiSettings, value: UiSettings[keyof UiSettings]) => {
    const updatedConfig: ProductConfiguration = {
      ...productConfiguration,
      uiSettings: {
        ...settings,
        [field]: value,
      },
      updatedAt: new Date().toISOString(),
    };
    onConfigurationChange(updatedConfig);
  };

  const toggleProp = (prop: 'plant' | 'lamp' | 'rug' | 'chair' | 'artwork') => {
    const currentProps = settings.props;
    const newProps = currentProps.includes(prop)
      ? currentProps.filter(p => p !== prop)
      : [...currentProps, prop];
    
    updateSettings('props', newProps);
  };

  const saveConfiguration = () => {
    // TODO: Implement localStorage save logic
    console.log('Save configuration:', productConfiguration);
  };

  const duplicateConfiguration = () => {
    // TODO: Implement configuration duplication
    console.log('Duplicate configuration:', productConfiguration);
  };

  const isPositionRelevant = settings.contextPreset === 'hero' || settings.contextPreset === 'packshot';

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
          Generation Settings
        </CardTitle>
        <CardDescription>
          Configure how your product images will be generated with different contexts and visual settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Configuration Management */}
        <div className="flex items-center gap-2 pb-4 border-b">
          <Input
            placeholder="Configuration name"
            value={configurationName}
            onChange={(e) => setConfigurationName(e.target.value)}
            className="flex-1"
          />
          <Button variant="outline" size="sm" onClick={saveConfiguration}>
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={duplicateConfiguration}>
            <Copy className="w-4 h-4 mr-1" />
            Duplicate
          </Button>
        </div>

        {/* Context Presets */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Context Preset</Label>
          <div className="grid grid-cols-1 gap-2">
            {(Object.entries(CONTEXT_PRESET_SETTINGS) as [keyof typeof CONTEXT_PRESET_SETTINGS, typeof CONTEXT_PRESET_SETTINGS[keyof typeof CONTEXT_PRESET_SETTINGS]][]).map(([preset, config]) => (
              <label
                key={preset}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-md border cursor-pointer transition-colors",
                  settings.contextPreset === preset
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/50"
                )}
              >
                <input
                  type="radio"
                  name="contextPreset"
                  value={preset}
                  checked={settings.contextPreset === preset}
                  onChange={(e) => updateSettings('contextPreset', e.target.value as any)}
                  className="sr-only"
                />
                <div className={cn(
                  "w-4 h-4 rounded-full border-2",
                  settings.contextPreset === preset
                    ? "border-primary bg-primary"
                    : "border-muted-foreground"
                )}>
                  {settings.contextPreset === preset && (
                    <div className="w-full h-full rounded-full bg-white scale-50" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium capitalize">{preset}</p>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Background Style */}
          <div className="space-y-2">
            <Label>Background Style</Label>
            <Select
              value={settings.backgroundStyle}
              onValueChange={(value) => updateSettings('backgroundStyle', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BACKGROUND_STYLES.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product Position */}
          {isPositionRelevant && (
            <div className="space-y-2">
              <Label>Product Position</Label>
              <Select
                value={settings.productPosition}
                onValueChange={(value) => updateSettings('productPosition', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_POSITIONS.map((position) => (
                    <SelectItem key={position.value} value={position.value}>
                      {position.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Reserved Text Zone */}
          <div className="space-y-2">
            <Label>Reserved Text Zone (Optional)</Label>
            <Select
              value={settings.reservedTextZone || 'none'}
              onValueChange={(value) => updateSettings('reservedTextZone', value === 'none' ? undefined : value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {TEXT_ZONES.map((zone) => (
                  <SelectItem key={zone.value} value={zone.value}>
                    {zone.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Reserve space for text overlay to be added later
            </p>
          </div>

          {/* Lighting */}
          <div className="space-y-2">
            <Label>Lighting</Label>
            <Select
              value={settings.lighting}
              onValueChange={(value) => updateSettings('lighting', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LIGHTING_OPTIONS.map((lighting) => (
                  <SelectItem key={lighting.value} value={lighting.value}>
                    {lighting.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quality */}
          <div className="space-y-2">
            <Label>Quality</Label>
            <Select
              value={settings.quality}
              onValueChange={(value) => updateSettings('quality', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUALITY_OPTIONS.map((quality) => (
                  <SelectItem key={quality.value} value={quality.value}>
                    {quality.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Variations */}
          <div className="space-y-2">
            <Label>Variations</Label>
            <Select
              value={settings.variations.toString()}
              onValueChange={(value) => updateSettings('variations', parseInt(value) as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VARIATION_OPTIONS.map((variation) => (
                  <SelectItem key={variation} value={variation.toString()}>
                    {variation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Props (Multi-select chips) */}
        <div className="space-y-2">
          <Label>Props (Optional)</Label>
          <div className="flex flex-wrap gap-2">
            {PROPS_OPTIONS.map((prop) => (
              <Badge
                key={prop.value}
                variant={settings.props.includes(prop.value as any) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleProp(prop.value as any)}
              >
                {prop.label}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Click to add/remove props from your generated images
          </p>
        </div>

        {/* Strict Mode Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Strict Mode</Label>
            <p className="text-xs text-muted-foreground">
              Enforces no text, no extra furniture, proper wall-mounting, and strict product fidelity
            </p>
          </div>
          <Switch
            checked={settings.strictMode}
            onCheckedChange={(checked) => updateSettings('strictMode', checked)}
          />
        </div>

        {/* Continue Button */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-600 font-medium">
              Ready to generate with {settings.variations} variation{settings.variations !== 1 ? 's' : ''}
            </span>
          </div>
          
          <Button onClick={onComplete} size="lg">
            Continue to Generate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}