"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";

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

interface USPControlsProps {
  config: USPTextConfig;
  onChange: (config: Partial<USPTextConfig>) => void;
  onGenerateJSON: () => void;
  disabled: boolean;
}

export function USPControls({ config, onChange, onGenerateJSON, disabled }: USPControlsProps) {

  return (
    <div className="space-y-6">
      {/* USP Text Content */}
      <div>
        <Label htmlFor="usp_content">USP Text Content</Label>
        <Textarea
          id="usp_content"
          placeholder="Enter your compelling marketing message...&#10;&#10;✨ Supports basic formatting:&#10;• Use line breaks for multiple lines&#10;• Add emojis: 🚀 💪 ⭐ 🔥&#10;• UPPERCASE for emphasis&#10;• Mix different styles"
          value={config.content}
          onChange={(e) => onChange({ content: e.target.value })}
          className="mt-1 min-h-[120px] font-mono text-sm"
        />
        <div className="mt-2 space-y-2">
          <p className="text-xs text-muted-foreground">
            <strong>Formatting Tips:</strong>
          </p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Use line breaks to create multi-line text</p>
            <p>• Add emojis for visual appeal: 🚀 💪 ⭐ 🔥 💡 ✨</p>
            <p>• Use UPPERCASE for strong emphasis</p>
            <p>• Mix fonts and weights using the controls below</p>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            <span className="text-xs text-muted-foreground">Quick emojis:</span>
            {['🚀', '💪', '⭐', '🔥', '💡', '✨', '🎯', '💰', '⚡', '🏆'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onChange({ content: config.content + emoji })}
                className="text-sm hover:bg-muted px-1 py-0.5 rounded transition-colors"
                title={`Add ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Position */}
      <div>
        <Label htmlFor="position">Position</Label>
        <select
          id="position"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
          value={config.position}
          onChange={(e) => onChange({ position: e.target.value as USPTextConfig["position"] })}
        >
          <option value="top-left">Top Left</option>
          <option value="top-center">Top Center</option>
          <option value="top-right">Top Right</option>
          <option value="center-left">Center Left</option>
          <option value="center">Center</option>
          <option value="center-right">Center Right</option>
          <option value="bottom-left">Bottom Left</option>
          <option value="bottom-center">Bottom Center</option>
          <option value="bottom-right">Bottom Right</option>
        </select>
      </div>

      {/* Font Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="font_family">Font Family</Label>
          <select
            id="font_family"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
            value={config.font_family}
            onChange={(e) => onChange({ font_family: e.target.value })}
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
          <Label htmlFor="font_size">Font Size (px)</Label>
          <Input
            id="font_size"
            type="number"
            min="8"
            max="200"
            placeholder="24"
            value={parseInt(config.font_size.replace('px', '')) || 24}
            onChange={(e) => onChange({ font_size: e.target.value })}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Enter size in pixels (8-200px)
          </p>
        </div>

        <div>
          <Label htmlFor="font_weight">Font Weight</Label>
          <select
            id="font_weight"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
            value={config.font_weight}
            onChange={(e) => onChange({ font_weight: e.target.value })}
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
      </div>

      {/* Color Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="text_color">Text Color</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="text_color"
              type="color"
              value={config.color}
              onChange={(e) => onChange({ color: e.target.value })}
              className="w-16 h-10 p-1"
            />
            <Input
              placeholder="#FFFFFF"
              value={config.color}
              onChange={(e) => onChange({ color: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="bg_color">Background Color (Optional)</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="bg_color"
              type="color"
              value={config.background_color || "#000000"}
              onChange={(e) => onChange({ background_color: e.target.value })}
              className="w-16 h-10 p-1"
            />
            <Input
              placeholder="#000000 (optional)"
              value={config.background_color || ""}
              onChange={(e) => onChange({ background_color: e.target.value || "" })}
              className="flex-1"
            />
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <input
              type="checkbox"
              id="enable_background"
              checked={!!config.background_color}
              onChange={(e) => onChange({ 
                background_color: e.target.checked ? "#000000" : "" 
              })}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <Label htmlFor="enable_background" className="text-sm">
              Enable background color
            </Label>
          </div>
        </div>
      </div>

      {/* Opacity */}
      <div>
        <Label htmlFor="opacity">Opacity</Label>
        <div className="flex items-center gap-4 mt-1">
          <input
            type="range"
            id="opacity"
            min="0"
            max="1"
            step="0.1"
            value={config.opacity}
            onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground w-12">
            {Math.round(config.opacity * 100)}%
          </span>
        </div>
      </div>

      {/* Preview Section */}
      {config.content && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Live Preview Settings:</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Text:</strong> &quot;{config.content}&quot;</p>
            <p><strong>Position:</strong> {config.position.replace(/-/g, ' ')}</p>
            <p><strong>Font:</strong> {config.font_family} {config.font_size}px {config.font_weight}</p>
            <p><strong>Color:</strong> {config.color}</p>
            {config.background_color && (
              <p><strong>Background:</strong> {config.background_color}</p>
            )}
            <p><strong>Opacity:</strong> {Math.round(config.opacity * 100)}%</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button 
          onClick={onGenerateJSON}
          disabled={disabled}
          size="lg"
          className="w-full"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Generate JSON & Prompt
        </Button>
        
      </div>

      {/* Instructions */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>Tips:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Keep your USP text concise and impactful</li>
          <li>Choose high contrast colors for better readability</li>
          <li>Position text where it won&apos;t obscure important product features</li>
          <li>Use background colors for better text visibility</li>
        </ul>
      </div>
    </div>
  );
}