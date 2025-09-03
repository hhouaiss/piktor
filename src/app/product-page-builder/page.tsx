"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Upload, FileText, Image, FileSpreadsheet } from "lucide-react";
import { ManualProductForm } from "@/components/product-page/manual-product-form";
import { ProductDisplay } from "@/components/product-page/product-display";
import { FileUpload } from "@/components/product-page/file-upload";

interface Collection {
  id: string;
  name: string;
  description: string;
  products: Product[];
}

interface Product {
  id: string;
  name: string;
  description: string;
  features: string[];
  metaTitle: string;
  metaDescription: string;
  tags: string[];
}

export default function ProductPageBuilderPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);

  // Load collections from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('piktor-collections');
    if (stored) {
      try {
        const parsedCollections = JSON.parse(stored);
        setCollections(parsedCollections);
        
        // Auto-select the last selected collection if it exists
        const lastSelected = localStorage.getItem('piktor-selected-collection');
        if (lastSelected && parsedCollections.find((c: Collection) => c.id === lastSelected)) {
          setSelectedCollection(lastSelected);
        }
      } catch (error) {
        console.error('Failed to load collections from localStorage:', error);
      }
    }
  }, []);

  // Save collections to localStorage whenever collections change
  useEffect(() => {
    if (collections.length > 0) {
      localStorage.setItem('piktor-collections', JSON.stringify(collections));
    }
  }, [collections]);

  // Save selected collection to localStorage
  useEffect(() => {
    if (selectedCollection) {
      localStorage.setItem('piktor-selected-collection', selectedCollection);
    }
  }, [selectedCollection]);

  const createCollection = () => {
    if (!newCollectionName.trim()) return;
    
    const newCollection: Collection = {
      id: Date.now().toString(),
      name: newCollectionName,
      description: newCollectionDescription,
      products: []
    };
    
    setCollections([...collections, newCollection]);
    setNewCollectionName("");
    setNewCollectionDescription("");
    setIsCreatingCollection(false);
    setSelectedCollection(newCollection.id);
  };

  const addProductToCollection = (productData: Omit<Product, 'id'>) => {
    if (!selectedCollection) return;

    const newProduct: Product = {
      ...productData,
      id: Date.now().toString()
    };

    setCollections(prev => prev.map(collection => 
      collection.id === selectedCollection 
        ? { ...collection, products: [...collection.products, newProduct] }
        : collection
    ));

    setShowManualForm(false);
  };

  const addMultipleProductsToCollection = (productsData: Omit<Product, 'id'>[]) => {
    if (!selectedCollection) return;

    const newProducts: Product[] = productsData.map((productData, index) => ({
      ...productData,
      id: `${Date.now()}-${index}`
    }));

    setCollections(prev => prev.map(collection => 
      collection.id === selectedCollection 
        ? { ...collection, products: [...collection.products, ...newProducts] }
        : collection
    ));

    setShowFileUpload(false);
  };

  const selectedCollectionData = collections.find(c => c.id === selectedCollection);

  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-2xl">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Product Page Builder</h1>
          <p className="text-muted-foreground">
            Generate SEO-optimized product pages for your e-commerce brand with AI-powered content generation
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Collections Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Collections
                  <Button 
                    size="sm" 
                    onClick={() => setIsCreatingCollection(true)}
                    disabled={isCreatingCollection}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New
                  </Button>
                </CardTitle>
                <CardDescription>
                  Organize your products into collections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isCreatingCollection && (
                  <div className="space-y-3 p-4 border border-dashed rounded-lg">
                    <div>
                      <Label htmlFor="collection-name">Collection Name</Label>
                      <Input
                        id="collection-name"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        placeholder="e.g., Seating Balls"
                      />
                    </div>
                    <div>
                      <Label htmlFor="collection-description">Description</Label>
                      <Textarea
                        id="collection-description"
                        value={newCollectionDescription}
                        onChange={(e) => setNewCollectionDescription(e.target.value)}
                        placeholder="Brief description of the collection"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={createCollection}>
                        Create
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setIsCreatingCollection(false);
                          setNewCollectionName("");
                          setNewCollectionDescription("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {collections.length === 0 && !isCreatingCollection && (
                  <p className="text-muted-foreground text-sm">
                    No collections yet. Create your first collection to get started.
                  </p>
                )}

                {collections.map((collection) => (
                  <div 
                    key={collection.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedCollection === collection.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedCollection(collection.id)}
                  >
                    <h4 className="font-medium">{collection.name}</h4>
                    <p className="text-sm text-muted-foreground">{collection.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {collection.products.length} products
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {!selectedCollection ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <h3 className="text-lg font-medium mb-2">Select a Collection</h3>
                  <p className="text-muted-foreground">
                    Choose a collection from the sidebar or create a new one to start adding products.
                  </p>
                </CardContent>
              </Card>
            ) : showManualForm ? (
              <ManualProductForm 
                onSave={addProductToCollection}
                onCancel={() => setShowManualForm(false)}
              />
            ) : showFileUpload ? (
              <FileUpload
                onProductsGenerated={addMultipleProductsToCollection}
                onCancel={() => setShowFileUpload(false)}
              />
            ) : (
              <div className="space-y-6">
                {/* Collection Header */}
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedCollectionData?.name}</CardTitle>
                    <CardDescription>{selectedCollectionData?.description}</CardDescription>
                  </CardHeader>
                </Card>

                {/* Add Products Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Add Products</CardTitle>
                    <CardDescription>
                      Add products manually or upload files to generate product data with AI
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Manual Entry */}
                      <div className="border border-dashed rounded-lg p-6">
                        <div className="text-center">
                          <FileText className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                          <h4 className="font-medium mb-2">Manual Entry</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            Fill out product details manually
                          </p>
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => setShowManualForm(true)}
                          >
                            Add Product Manually
                          </Button>
                        </div>
                      </div>

                      {/* File Upload */}
                      <div className="border border-dashed rounded-lg p-6">
                        <div className="text-center">
                          <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                          <h4 className="font-medium mb-2">Upload Files</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            CSV, PDF, or images with AI extraction
                          </p>
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => setShowFileUpload(true)}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Files
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Supported File Types */}
                    <div className="mt-6 pt-6 border-t">
                      <h5 className="font-medium mb-3">Supported File Types</h5>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-green-600" />
                          <span>CSV Files</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-red-600" />
                          <span>PDF Documents</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Image className="w-4 h-4 text-blue-600" alt="Product images icon" />
                          <span>Product Images</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Products Display */}
                {selectedCollectionData && selectedCollectionData.products.length > 0 && (
                  <ProductDisplay products={selectedCollectionData.products} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}