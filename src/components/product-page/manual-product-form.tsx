"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Save, ArrowLeft } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  features: string[];
  metaTitle: string;
  metaDescription: string;
  tags: string[];
}

interface ManualProductFormProps {
  onSave: (product: Omit<Product, 'id'>) => void;
  onCancel: () => void;
}

export function ManualProductForm({ onSave, onCancel }: ManualProductFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    features: [""],
    metaTitle: "",
    metaDescription: "",
    tags: [""]
  });

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ""]
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  const removeFeature = (index: number) => {
    if (formData.features.length > 1) {
      setFormData(prev => ({
        ...prev,
        features: prev.features.filter((_, i) => i !== index)
      }));
    }
  };

  const addTag = () => {
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, ""]
    }));
  };

  const updateTag = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.map((tag, i) => i === index ? value : tag)
    }));
  };

  const removeTag = (index: number) => {
    if (formData.tags.length > 1) {
      setFormData(prev => ({
        ...prev,
        tags: prev.tags.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onSave({
      name: formData.name,
      description: formData.description,
      features: formData.features.filter(f => f.trim()),
      metaTitle: formData.metaTitle || formData.name,
      metaDescription: formData.metaDescription || formData.description,
      tags: formData.tags.filter(t => t.trim())
    });
  };

  const generateAIContent = async () => {
    if (!formData.name.trim()) return;

    try {
      const response = await fetch('/api/generate-product-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName: formData.name,
          existingDescription: formData.description,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      
      if (data.success && data.content) {
        setFormData(prev => ({
          ...prev,
          name: data.content.name,
          description: data.content.description,
          features: data.content.features,
          metaTitle: data.content.metaTitle,
          metaDescription: data.content.metaDescription,
          tags: data.content.tags,
        }));
      }
    } catch (error) {
      console.error('Failed to generate AI content:', error);
      
      // Fallback to basic generation if API fails
      const generated = {
        metaTitle: `${formData.name} - Premium Quality Product`,
        metaDescription: `Discover our high-quality ${formData.name.toLowerCase()}. Perfect for your needs with excellent features and reliable performance.`,
        description: formData.description || `Experience the premium quality of our ${formData.name.toLowerCase()}. Designed with attention to detail and built to last.`,
        features: formData.features.some(f => f.trim()) ? formData.features : [
          "High-quality materials",
          "Durable construction", 
          "Easy to use",
          "Excellent value"
        ]
      };

      setFormData(prev => ({
        ...prev,
        ...generated
      }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Add Product Manually</CardTitle>
            <CardDescription>
              Fill out the product details or use AI to generate content
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-medium">Basic Information</h4>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-name">Product Name *</Label>
                <Input
                  id="product-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Ergonomic Office Chair"
                  required
                />
              </div>
              <div className="flex items-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={generateAIContent}
                  disabled={!formData.name.trim()}
                  className="w-full"
                >
                  Generate AI Content
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed product description..."
                rows={4}
              />
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Features & Benefits</h4>
              <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                <Plus className="w-4 h-4 mr-2" />
                Add Feature
              </Button>
            </div>
            
            <div className="space-y-2">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder="e.g., Adjustable height mechanism"
                  />
                  {formData.features.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFeature(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SEO Meta */}
          <div className="space-y-4">
            <h4 className="font-medium">SEO Meta Information</h4>
            
            <div>
              <Label htmlFor="meta-title">Meta Title</Label>
              <Input
                id="meta-title"
                value={formData.metaTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
                placeholder="SEO-friendly title for search engines"
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.metaTitle.length}/60 characters
              </p>
            </div>

            <div>
              <Label htmlFor="meta-description">Meta Description</Label>
              <Textarea
                id="meta-description"
                value={formData.metaDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                placeholder="Brief description for search engine results"
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.metaDescription.length}/160 characters
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Tags</h4>
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                <Plus className="w-4 h-4 mr-2" />
                Add Tag
              </Button>
            </div>
            
            <div className="space-y-2">
              {formData.tags.map((tag, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={tag}
                    onChange={(e) => updateTag(index, e.target.value)}
                    placeholder="e.g., office furniture"
                  />
                  {formData.tags.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTag(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={!formData.name.trim()}>
              <Save className="w-4 h-4 mr-2" />
              Save Product
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}