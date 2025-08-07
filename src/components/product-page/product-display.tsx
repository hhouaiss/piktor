"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, Download, Edit, Check } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  features: string[];
  metaTitle: string;
  metaDescription: string;
  tags: string[];
}

interface ProductDisplayProps {
  products: Product[];
}

export function ProductDisplay({ products }: ProductDisplayProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const exportProductJSON = (product: Product) => {
    const dataStr = JSON.stringify(product, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${product.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const exportAllProducts = () => {
    const dataStr = JSON.stringify(products, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'products.json');
    linkElement.click();
  };

  const CopyButton = ({ text, fieldId }: { text: string; fieldId: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => copyToClipboard(text, fieldId)}
      className="h-8 w-8 p-0"
    >
      {copiedField === fieldId ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </Button>
  );

  if (products.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Generated Products</CardTitle>
            <CardDescription>
              {products.length} product{products.length !== 1 ? 's' : ''} ready for export
            </CardDescription>
          </div>
          {products.length > 1 && (
            <Button variant="outline" onClick={exportAllProducts}>
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {products.map((product, index) => (
          <div key={product.id}>
            {index > 0 && <Separator className="my-6" />}
            
            <div className="space-y-4">
              {/* Product Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {product.tags.map((tag, tagIndex) => (
                      <Badge key={tagIndex} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportProductJSON(product)}>
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Content Blocks */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Product Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Product Description</h4>
                    <CopyButton text={product.description} fieldId={`desc-${product.id}`} />
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    {product.description}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Features & Benefits</h4>
                    <CopyButton 
                      text={product.features.map(f => `• ${f}`).join('\n')} 
                      fieldId={`features-${product.id}`} 
                    />
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <ul className="space-y-1">
                      {product.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="text-sm flex items-start">
                          <span className="mr-2">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Meta Title */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Meta Title</h4>
                    <CopyButton text={product.metaTitle} fieldId={`title-${product.id}`} />
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                    {product.metaTitle}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {product.metaTitle.length}/60 characters
                  </p>
                </div>

                {/* Meta Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Meta Description</h4>
                    <CopyButton text={product.metaDescription} fieldId={`meta-${product.id}`} />
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                    {product.metaDescription}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {product.metaDescription.length}/160 characters
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}