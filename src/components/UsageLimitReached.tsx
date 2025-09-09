"use client";

import React from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  CheckCircle, 
  ArrowRight, 
  MessageCircle, 
  Calendar, 
  Star,
  Sparkles,
  Target,
  Clock,
  Package
} from "lucide-react";

interface UsageLimitReachedProps {
  generationCount?: number;
  maxGenerations?: number;
  environment?: 'preview' | 'production' | 'development';
  onReset?: () => void;
  className?: string;
}

export function UsageLimitReached({ 
  generationCount = 5, 
  maxGenerations = 5,
  environment = 'production',
  onReset,
  className = ""
}: UsageLimitReachedProps) {
  
  return (
    <div className={`w-full max-w-4xl mx-auto space-y-8 ${className}`}>
      {/* Main Limit Reached Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-sophisticated-gray-50 to-ocean-blue-50/50 dark:from-sophisticated-gray-900 dark:to-ocean-blue-900/20 border-2 border-ocean-blue-200 dark:border-ocean-blue-700">
        <div className="absolute top-4 right-4">
          <Badge variant="outline" className="bg-gradient-ocean-gold text-white border-none font-semibold">
            Limite atteinte
          </Badge>
        </div>
        
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-gradient-ocean-gold rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-br from-sophisticated-gray-900 to-ocean-blue-700 bg-clip-text text-transparent dark:from-sophisticated-gray-100 dark:to-ocean-blue-300">
            Vous avez utilisé vos {maxGenerations} générations gratuites !
          </CardTitle>
          <CardDescription className="text-lg text-sophisticated-gray-600 dark:text-sophisticated-gray-400">
            Impressionnant, non ? C&apos;est juste un aperçu de ce que Piktor peut faire pour votre business.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Success Indicators */}
          <div className="grid sm:grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-success-500 text-white rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-sophisticated-gray-700 dark:text-sophisticated-gray-300">
                {generationCount} visuels créés
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-ocean-blue-600 text-white rounded-full flex items-center justify-center mx-auto">
                <Star className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-sophisticated-gray-700 dark:text-sophisticated-gray-300">
                Qualité professionnelle
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-warm-gold-500 text-white rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-sophisticated-gray-700 dark:text-sophisticated-gray-300">
                En moins de 10 secondes
              </p>
            </div>
          </div>
          
          {/* CTA Section */}
          <div className="bg-gradient-to-r from-ocean-blue-50 to-warm-gold-50 dark:from-sophisticated-gray-800 dark:to-sophisticated-gray-700 p-6 rounded-xl">
            <h3 className="text-xl font-bold text-center mb-4 text-sophisticated-gray-900 dark:text-sophisticated-gray-100">
              Prêt à débloquer tout le potentiel de Piktor ?
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
              <Button asChild size="xl" variant="primary" className="shadow-premium font-bold w-full sm:w-auto">
                <Link href="https://calendar.notion.so/meet/hassanhouaiss/piktor">
                  <Calendar className="w-5 h-5 mr-2" />
                  Réserver ma démo personnalisée
                </Link>
              </Button>
              
              <Button asChild size="xl" variant="outline" className="w-full sm:w-auto border-ocean-blue-300 hover:bg-ocean-blue-50 dark:border-ocean-blue-600 dark:hover:bg-ocean-blue-900/20">
                <Link href="mailto:hello@piktorapp.com">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Nous contacter
                </Link>
              </Button>
            </div>
            
            <p className="text-sm text-center text-sophisticated-gray-600 dark:text-sophisticated-gray-400">
              Démo sur VOS produits • Conseils personnalisés • Tarifs
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Features Showcase */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-gradient-to-br from-ocean-blue-500 to-ocean-blue-600 text-white rounded-lg flex items-center justify-center mx-auto mb-4">
              <Package className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100 mb-2">
              Catalogue complet
            </h4>
            <p className="text-sm text-sophisticated-gray-600 dark:text-sophisticated-gray-400">
              Générez des milliers d&apos;images pour tout votre catalogue produit
            </p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-gradient-to-br from-warm-gold-500 to-warm-gold-600 text-white rounded-lg flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100 mb-2">
              Multi-contextes
            </h4>
            <p className="text-sm text-sophisticated-gray-600 dark:text-sophisticated-gray-400">
              Lifestyle, studio, showroom, saisonniers et plus encore
            </p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 text-white rounded-lg flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100 mb-2">
              API & intégration
            </h4>
            <p className="text-sm text-sophisticated-gray-600 dark:text-sophisticated-gray-400">
              Intégrez Piktor directement dans vos workflows existants
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Testimonial/Social Proof Section */}
      <Card className="bg-gradient-to-r from-sophisticated-gray-900 via-ocean-blue-900 to-sophisticated-gray-800 text-white">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="flex justify-center space-x-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-warm-gold-400 text-warm-gold-400" />
              ))}
            </div>
            <blockquote className="text-lg sm:text-xl italic mb-4">
              &ldquo;Piktor a révolutionné notre catalogue e-commerce. +40% de conversions en 3 mois.&rdquo;
            </blockquote>
            <cite className="text-warm-gold-200 font-medium">
              — Client Piktor, Mobilier Design
            </cite>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-warm-gold-400" />
              <span>100+ entreprises nous font confiance</span>
            </div>
            <span className="hidden sm:block">•</span>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-warm-gold-400" />
              <span>1M+ images générées</span>
            </div>
            <span className="hidden sm:block">•</span>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-warm-gold-400" />
              <span>Support 24/7</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug/Reset Section (only in development) */}
      {environment === 'development' && onReset && (
        <Card className="border-dashed border-2 border-sophisticated-gray-300 dark:border-sophisticated-gray-600">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-sophisticated-gray-600 dark:text-sophisticated-gray-400 mb-2">
              Mode développement - Actions de débogage
            </p>
            <Button onClick={onReset} variant="outline" size="sm">
              Réinitialiser le compteur de générations
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Simplified version for inline usage
export function UsageLimitReachedInline({ 
  className = ""
}: {
  className?: string;
}) {
  return (
    <div className={`bg-gradient-to-r from-ocean-blue-50 to-warm-gold-50 dark:from-sophisticated-gray-800 dark:to-sophisticated-gray-700 p-4 rounded-lg border border-ocean-blue-200 dark:border-ocean-blue-700 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-ocean-gold rounded-full flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sophisticated-gray-900 dark:text-sophisticated-gray-100">
              Limite atteinte
            </p>
            <p className="text-sm text-sophisticated-gray-600 dark:text-sophisticated-gray-400">
              Découvrez la version complète
            </p>
          </div>
        </div>
        <Button asChild size="sm" variant="primary">
          <Link href="https://calendar.notion.so/meet/hassanhouaiss/piktor">
            Démo
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}