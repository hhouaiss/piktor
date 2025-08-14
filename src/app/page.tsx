"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrustSignals } from "@/components/ui/trust-signals";
import { ProductTour } from "@/components/ui/product-tour";

export default function Home() {
  const [showTour, setShowTour] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useState(false);

  useEffect(() => {
    // Check if user has seen the tour before
    const seenTour = localStorage.getItem('piktor-tour-completed');
    if (!seenTour) {
      // Show tour after a short delay for better UX
      const timer = setTimeout(() => setShowTour(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setHasSeenTour(true);
    }
  }, []);

  const handleTourComplete = () => {
    localStorage.setItem('piktor-tour-completed', 'true');
    setHasSeenTour(true);
  };

  const startTour = () => {
    setShowTour(true);
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-screen-2xl">
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Sell More Furniture with Studio-Quality Images
        </h1>
        <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
          Turn basic product photos into professional marketing assets in minutes. Generate lifestyle scenes, social media visuals, and catalog images that convert browsers into buyers.
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-8">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            No photography skills needed
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Results in under 5 minutes
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Consistent brand style
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Link href="/upload">Transform Your First Image - Free</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/templates">See Example Results</Link>
          </Button>
          {hasSeenTour && (
            <Button variant="ghost" size="lg" onClick={startTour}>
              Take Tour Again
            </Button>
          )}
        </div>
        
        {/* Trust Signals */}
        <div className="mt-12">
          <TrustSignals variant="compact" />
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8 mb-16">
        <Card className="border-2 hover:border-blue-200 transition-colors">
          <CardHeader>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <CardTitle>1. Upload Your Product Photos</CardTitle>
            <CardDescription>
              Drag and drop basic product images - even phone photos work perfectly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Our AI analyzes your furniture's style, materials, and dimensions to create the perfect marketing context.
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-blue-200 transition-colors">
          <CardHeader>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <CardTitle>2. AI Creates Perfect Scenes</CardTitle>
            <CardDescription>
              Choose from lifestyle, social media, or catalog styles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Generate multiple variations with proper lighting, staging, and context that make customers want to buy.
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-blue-200 transition-colors">
          <CardHeader>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <CardTitle>3. Download & Start Selling</CardTitle>
            <CardDescription>
              High-resolution images ready for your website, ads, and social media
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Save hours of photography and thousands in studio costs while maintaining consistent, professional quality.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="text-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-12 border border-blue-100">
        <h2 className="text-3xl font-bold mb-4">Transform Your Product Images Today</h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          Join 500+ furniture brands already using AI to create scroll-stopping product images that convert.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button size="lg" asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Link href="/upload">Start Your Free Trial</Link>
          </Button>
          <p className="text-sm text-muted-foreground">✨ No credit card required</p>
        </div>
      </section>

      {/* Product Tour */}
      <ProductTour 
        isOpen={showTour} 
        onClose={() => setShowTour(false)}
        onComplete={handleTourComplete}
      />
    </div>
  );
}
