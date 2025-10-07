"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Plus,
  Sparkles,
  TrendingUp,
  Download,
  Eye,
  Clock,
  ArrowRight,
  BarChart3,
  Calendar,
  Zap,
  Crown,
  Loader2,
  AlertCircle
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useSimpleAuth } from "@/components/auth/simple-auth-provider";
import { getPlaceholderUrl } from "@/lib/image-placeholders";
import { analyticsService } from "@/lib/supabase/analytics-service";
import type { DashboardStats as AnalyticsStats } from "@/lib/supabase/analytics-service";
import type { Visual } from "@/lib/supabase/types";
import { extractProductName, formatLabel } from "@/lib/product-name-extractor";
import { useSubscription } from "@/hooks/useSubscription";

interface DashboardStats {
  totalVisuals: number;
  thisMonth: number;
  downloads: number;
  views: number;
  creditsUsed: number;
  creditsRemaining: number;
  projects: number;
}

interface RecentProject {
  id: string;
  name: string;
  thumbnail: string;
  format: string | string[];
  createdAt: string;
  visualsCount: number;
  downloads: number;
}

export function DashboardHome() {
  const { user: authUser, loading: authLoading, supabaseUser } = useSimpleAuth();
  const { subscription, loading: subscriptionLoading, remainingGenerations } = useSubscription();

  // Real data state
  const [stats, setStats] = useState<DashboardStats>({
    totalVisuals: 0,
    thisMonth: 0,
    downloads: 0,
    views: 0,
    creditsUsed: 0,
    creditsRemaining: 50,
    projects: 0
  });
  const [recentImages, setRecentImages] = useState<Visual[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  const loading = authLoading || statsLoading || subscriptionLoading;
  const error = null;
  const user = authUser;

  // Fetch real stats and recent images
  useEffect(() => {
    async function fetchDashboardData() {
      if (!authUser?.id) {
        setStatsLoading(false);
        return;
      }

      try {
        setStatsLoading(true);

        // Fetch stats and recent images in parallel
        const [analyticsStats, visuals] = await Promise.all([
          analyticsService.getDashboardStats(authUser.id),
          analyticsService.getRecentVisuals(authUser.id, 6)
        ]);

        // Map analytics stats to dashboard stats
        // Use real subscription data for credits
        const creditsUsed = subscription?.generationsUsed || 0;
        const creditsTotal = subscription?.generationsLimit || 0;
        const creditsRemaining = Math.max(0, creditsTotal - creditsUsed);

        setStats({
          totalVisuals: analyticsStats.totalVisuals,
          thisMonth: analyticsStats.thisMonthVisuals,
          downloads: analyticsStats.totalDownloads,
          views: analyticsStats.totalViews,
          creditsUsed: creditsUsed,
          creditsRemaining: creditsRemaining,
          projects: 0 // Can add project count later
        });

        setRecentImages(visuals as Visual[]);

        // Track dashboard home view
        trackEvent('dashboard_home_viewed', {
          event_category: 'dashboard',
          event_label: 'home_page_view',
          custom_parameters: {
            total_visuals: analyticsStats.totalVisuals,
            total_views: analyticsStats.totalViews
          }
        });
      } catch (error) {
        console.error('[Dashboard] Error fetching data:', error);
      } finally {
        setStatsLoading(false);
      }
    }

    fetchDashboardData();
  }, [authUser, subscription]);

  const handleCreateNewVisual = () => {
    trackEvent('dashboard_create_new_clicked', {
      event_category: 'dashboard',
      event_label: 'create_cta_home'
    });
  };

  const handleViewProject = (project: RecentProject) => {
    trackEvent('dashboard_recent_project_viewed', {
      event_category: 'dashboard', 
      event_label: 'recent_project_click',
      custom_parameters: {
        project_id: project.id,
        project_name: project.name
      }
    });
    
    // Track view activity - placeholder for future implementation
    // if (project.visualsCount > 0) {
    //   trackView('', project.id);
    // }
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement de votre tableau de bord...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state - only for auth errors, not permission errors
  if (!user && !authLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Vous devez être connecté pour accéder au tableau de bord
            </p>
            <Button asChild>
              <Link href="/auth/signin">
                Se connecter
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle permission errors gracefully - show dashboard with default data
  const hasPermissionError = false; // No errors for now

  // Show default state if no stats yet
  const displayStats = stats;

  // Helper function to get display name
  const getDisplayName = () => {
    if (user?.display_name) {
      return user.display_name;
    }
    if (user?.email) {
      // Extract name from email (part before @)
      return user.email.split('@')[0];
    }
    return 'Utilisateur';
  };

  return (
    <div className="space-y-8">
      {/* Permission Error Notice - Show but don't block the UI */}
      {hasPermissionError && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Configuration en cours...
              </p>
              <p className="text-xs text-yellow-700">
                Votre compte est en cours de configuration. Certaines données peuvent ne pas encore être disponibles.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Bonjour {getDisplayName()} ! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Prêt à créer de nouveaux visuels exceptionnels pour votre marque ?
          </p>
        </div>
        {/* Show button on mobile only */}
        <div className="flex gap-2 lg:hidden">
          <Button
            asChild
            size="lg"
            className="bg-gradient-ocean-deep hover:opacity-90 text-white shadow-lg w-full md:w-auto"
            onClick={handleCreateNewVisual}
          >
            <Link href="/dashboard/create">
              <Plus className="w-5 h-5 mr-2" />
              Créer un nouveau visuel
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards - Hidden */}
      {false && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Visuels créés</p>
                <p className="text-2xl font-bold text-foreground">{displayStats.totalVisuals}</p>
                <p className="text-xs text-success-600">
                  +{displayStats.thisMonth} ce mois-ci
                </p>
              </div>
              <div className="h-12 w-12 bg-ocean-blue-100 rounded-lg flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-ocean-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Téléchargements</p>
                <p className="text-2xl font-bold text-foreground">{displayStats.downloads}</p>
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% vs mois dernier
                </p>
              </div>
              <div className="h-12 w-12 bg-warm-gold-100 rounded-lg flex items-center justify-center">
                <Download className="h-6 w-6 text-warm-gold-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vues totales</p>
                <p className="text-2xl font-bold text-foreground">{displayStats.views}</p>
                <p className="text-xs text-muted-foreground">Sur tous vos visuels</p>
              </div>
              <div className="h-12 w-12 bg-sophisticated-gray-100 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-sophisticated-gray-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-md transition-shadow border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Crédits restants</p>
                <p className="text-2xl font-bold text-primary">{displayStats.creditsRemaining}</p>
                <p className="text-xs text-muted-foreground">sur 50 ce mois-ci</p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Images */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Générations récentes</h2>
            <Button variant="ghost" asChild className="text-primary hover:text-primary/80">
              <Link href="/dashboard/library">
                Voir tout
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>

          {recentImages.length === 0 ? (
            <Card className="p-12 text-center">
              <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Aucun projet pour le moment</h3>
              <p className="text-muted-foreground mb-6">
                Commencez par créer votre premier visuel IA en quelques minutes
              </p>
              <Button asChild className="bg-gradient-to-r from-ocean-blue-600 to-ocean-blue-700 hover:from-ocean-blue-700 hover:to-ocean-blue-800">
                <Link href="/dashboard/create" onClick={handleCreateNewVisual}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer mon premier visuel
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <div className="flex md:grid md:grid-cols-3 gap-4 pb-4 md:pb-0" style={{ scrollSnapType: 'x mandatory' }}>
                {recentImages.map((visual, index) => (
                  <Card
                    key={visual.id}
                    className={`group hover:shadow-lg transition-all overflow-hidden flex-shrink-0 w-[280px] md:w-auto ${index >= 5 ? 'hidden md:block' : ''}`}
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <div
                      className="block cursor-pointer"
                      onClick={async () => {
                        // Track view
                        const newViewCount = await analyticsService.trackView(visual.id);
                        setRecentImages(prev => prev.map(v =>
                          v.id === visual.id ? { ...v, views: newViewCount } : v
                        ));

                        // Navigate to library
                        window.location.href = '/dashboard/library';
                      }}
                    >
                      <div className="aspect-square bg-sophisticated-gray-100 flex items-center justify-center overflow-hidden relative">
                        <Image
                          src={visual.originalImageUrl || visual.thumbnailUrl || getPlaceholderUrl('medium')}
                          alt={extractProductName(visual.metadata, visual.id)}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          placeholder="blur"
                          blurDataURL={getPlaceholderUrl('small')}
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.src = getPlaceholderUrl('medium');
                            target.onerror = null;
                          }}
                        />
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-800">
                        <h3 className="font-medium text-foreground truncate text-sm mb-1">
                          {extractProductName(visual.metadata, visual.id)}
                        </h3>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(visual.createdAt)}
                        </div>
                        {visual.metadata?.contextPreset && (
                          <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-ocean-blue-100 text-ocean-blue-700 rounded">
                            {formatLabel(visual.metadata.contextPreset)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions & Tips */}
        <div className="space-y-6">
          {/* Create New Visual CTA - Desktop Only */}
          <Button
            asChild
            size="lg"
            className="bg-gradient-ocean-deep hover:opacity-90 text-white shadow-lg w-full hidden lg:flex"
            onClick={handleCreateNewVisual}
          >
            <Link href="/dashboard/create">
              <Plus className="w-5 h-5 mr-2" />
              Créer un nouveau visuel
            </Link>
          </Button>

          {/* Quick Actions - Hidden */}
          {false && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Actions rapides</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau visuel
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/library">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Voir statistiques
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/tutorials">
                    <Clock className="w-4 h-4 mr-2" />
                    Tutoriels rapides
                  </Link>
                </Button>
              </div>
            </Card>
          )}

          {/* Usage Progress */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Utilisation mensuelle</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Crédits utilisés</span>
                  <span className="font-medium">{displayStats.creditsUsed}/{displayStats.creditsUsed + displayStats.creditsRemaining}</span>
                </div>
                <div className="w-full bg-sophisticated-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(displayStats.creditsUsed / (displayStats.creditsUsed + displayStats.creditsRemaining)) * 100}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Renouvellement le 15 octobre
              </p>
            </div>
          </Card>

          {/* Premium Tip */}
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-warm-gold-50 border-primary/20">
            <div className="flex items-start space-x-3">
              <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Conseil Pro</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Utilisez plusieurs angles de votre produit pour créer une bibliothèque complète
                  de visuels professionnels.
                </p>
                <Button variant="link" className="p-0 h-auto text-primary mt-2" asChild>
                  <Link href="/dashboard/tutorials">
                    En savoir plus →
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}