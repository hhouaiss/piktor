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
    <div className="container mx-auto px-4 py-20 max-w-screen-2xl">
      <section className="text-center mb-20 animate-fade-in">
        <div className="mb-6">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-ocean-blue-50 to-warm-gold-50 border border-ocean-blue-200 rounded-full text-sm font-medium text-ocean-blue-700 dark:from-ocean-blue-900/50 dark:to-warm-gold-900/50 dark:border-ocean-blue-700 dark:text-ocean-blue-300">
            <span className="w-2 h-2 bg-gradient-ocean-gold rounded-full mr-2 animate-pulse"></span>
            Trusted by 500+ furniture brands worldwide
          </div>
        </div>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-br from-sophisticated-gray-900 via-ocean-blue-800 to-sophisticated-gray-700 bg-clip-text text-transparent dark:from-sophisticated-gray-100 dark:via-ocean-blue-300 dark:to-sophisticated-gray-300 leading-tight">
          Elevate Your Furniture Photos into
          <span className="block bg-gradient-ocean-gold bg-clip-text text-transparent">Sales-Driving Visuals</span>
        </h1>
        <p className="text-xl md:text-2xl text-sophisticated-gray-600 dark:text-sophisticated-gray-400 mb-6 max-w-3xl mx-auto leading-relaxed">
          Instantly transform basic product shots into stunning, photorealistic lifestyle scenes, social media assets, and catalog images that captivate and convert.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-sophisticated-gray-600 dark:text-sophisticated-gray-400 mb-10">
          <div className="flex items-center gap-2 bg-white/50 dark:bg-sophisticated-gray-800/50 px-3 py-2 rounded-lg backdrop-blur border border-sophisticated-gray-200/50 dark:border-sophisticated-gray-700/50">
            <div className="w-4 h-4 bg-success rounded-full flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-medium">No photography skills needed</span>
          </div>
          <div className="flex items-center gap-2 bg-white/50 dark:bg-sophisticated-gray-800/50 px-3 py-2 rounded-lg backdrop-blur border border-sophisticated-gray-200/50 dark:border-sophisticated-gray-700/50">
            <div className="w-4 h-4 bg-success rounded-full flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-medium">Results in under 5 minutes</span>
          </div>
          <div className="flex items-center gap-2 bg-white/50 dark:bg-sophisticated-gray-800/50 px-3 py-2 rounded-lg backdrop-blur border border-sophisticated-gray-200/50 dark:border-sophisticated-gray-700/50">
            <div className="w-4 h-4 bg-success rounded-full flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-medium">Consistent brand style</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
          <Button asChild size="xl" variant="primary" className="shadow-premium animate-scale-in font-bold">
            <Link href="/generate">Transform Your First Image - Free</Link>
          </Button>
          {/* <Button variant="outline" size="xl" asChild className="font-semibold">
            <Link href="/templates">See Example Results</Link>
          </Button> */}
        </div>
        <p className="text-sm text-sophisticated-gray-500 dark:text-sophisticated-gray-400">
          ✨ No credit card required • Start creating in seconds
        </p>
        
        {/* Trust Signals */}
        <div className="mt-12">
          <TrustSignals variant="compact" />
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8 mb-20 animate-fade-in">
        <Card variant="elevated" className="group hover:scale-105 transition-all duration-300 animate-slide-in">
          <CardHeader>
            <div className="relative w-16 h-16 bg-gradient-to-br from-ocean-blue-100 to-ocean-blue-200 rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:shadow-lg transition-shadow">
              <svg className="w-8 h-8 text-ocean-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-warm-gold-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
            </div>
            <CardTitle className="text-xl mb-3">Upload Your Product Photos</CardTitle>
            <CardDescription className="text-base">
              Drag and drop basic product images - even phone photos work perfectly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sophisticated-gray-600 dark:text-sophisticated-gray-400 leading-relaxed">
              Our advanced AI analyzes your furniture&apos;s style, materials, and dimensions to create the perfect marketing context automatically.
            </p>
          </CardContent>
        </Card>

        <Card variant="elevated" className="group hover:scale-105 transition-all duration-300 animate-slide-in" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <div className="relative w-16 h-16 bg-gradient-to-br from-warm-gold-100 to-warm-gold-200 rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:shadow-lg transition-shadow">
              <svg className="w-8 h-8 text-warm-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-ocean-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
            </div>
            <CardTitle className="text-xl mb-3">AI Creates Perfect Scenes</CardTitle>
            <CardDescription className="text-base">
              Choose from lifestyle, social media, or catalog styles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sophisticated-gray-600 dark:text-sophisticated-gray-400 leading-relaxed">
              Generate multiple variations with proper lighting, staging, and context that make customers want to buy immediately.
            </p>
          </CardContent>
        </Card>

        <Card variant="elevated" className="group hover:scale-105 transition-all duration-300 animate-slide-in" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <div className="relative w-16 h-16 bg-gradient-to-br from-success-100 to-success-200 rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:shadow-lg transition-shadow">
              <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-sophisticated-gray-700 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
            </div>
            <CardTitle className="text-xl mb-3">Download & Start Selling</CardTitle>
            <CardDescription className="text-base">
              High-resolution images ready for your website, ads, and social media
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sophisticated-gray-600 dark:text-sophisticated-gray-400 leading-relaxed">
              Save hours of photography and thousands in studio costs while maintaining consistent, professional quality across all channels.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-ocean-blue-50 via-white to-warm-gold-50 dark:from-sophisticated-gray-900 dark:via-sophisticated-gray-800 dark:to-sophisticated-gray-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(2,132,199,0.1),transparent_70%)]"></div>
        <div className="relative text-center p-16 rounded-2xl border border-sophisticated-gray-200/50 dark:border-sophisticated-gray-700/50 backdrop-blur-sm shadow-premium animate-fade-in">
          <div className="mb-6">
            <div className="inline-flex items-center px-3 py-1 bg-gradient-ocean-gold text-white rounded-full text-sm font-medium shadow-lg">
              <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
              Limited Time: Free Pro Features
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-br from-sophisticated-gray-900 via-ocean-blue-700 to-sophisticated-gray-800 bg-clip-text text-transparent dark:from-sophisticated-gray-100 dark:via-ocean-blue-300 dark:to-sophisticated-gray-200">
            Ready to Transform Your 
            <span className="block bg-gradient-ocean-gold bg-clip-text text-transparent">Business Growth?</span>
          </h2>
          <p className="text-xl text-sophisticated-gray-600 dark:text-sophisticated-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join 500+ furniture brands already using AI to create scroll-stopping product images that convert browsers into loyal customers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Button size="xl" variant="primary" asChild className="shadow-premium font-bold animate-scale-in">
              <Link href="/generate">Start Your Free Transformation</Link>
            </Button>
            <div className="flex items-center space-x-4 text-sm text-sophisticated-gray-600 dark:text-sophisticated-gray-400">
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span>No credit card required</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span>Results in 5 minutes</span>
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-sophisticated-gray-200/50 dark:border-sophisticated-gray-700/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-ocean-blue-600 dark:text-ocean-blue-400">500+</div>
              <div className="text-sm text-sophisticated-gray-600 dark:text-sophisticated-gray-400">Happy Brands</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-ocean-blue-600 dark:text-ocean-blue-400">50K+</div>
              <div className="text-sm text-sophisticated-gray-600 dark:text-sophisticated-gray-400">Images Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-ocean-blue-600 dark:text-ocean-blue-400">95%</div>
              <div className="text-sm text-sophisticated-gray-600 dark:text-sophisticated-gray-400">Satisfaction Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-ocean-blue-600 dark:text-ocean-blue-400">4.9★</div>
              <div className="text-sm text-sophisticated-gray-600 dark:text-sophisticated-gray-400">Average Rating</div>
            </div>
          </div>
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
