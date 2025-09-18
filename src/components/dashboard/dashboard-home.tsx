"use client";

import { useEffect } from "react";
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
import { useAuth } from "@/components/auth/auth-provider";
import { useDashboardStats, useRecentProjects, useActivityTracker } from "@/lib/firebase/realtime-service";
import type { RecentProject } from "@/lib/firebase";
import { debugUserData } from "@/lib/debug-firebase";
import { testFirebaseConnection } from "@/lib/firebase/test-connection";
import { getPlaceholderUrl } from "@/lib/image-placeholders";



export function DashboardHome() {
  const { user: authUser, loading: authLoading, firebaseUser } = useAuth();
  const { stats, loading: statsLoading, error: statsError } = useDashboardStats(authUser?.id || null);
  const { projects: recentProjects, loading: projectsLoading, error: projectsError } = useRecentProjects(authUser?.id || null, 3);
  const { trackView } = useActivityTracker(authUser?.id || null);

  const loading = authLoading || statsLoading || projectsLoading;
  const error = statsError || projectsError;
  const user = authUser;

  useEffect(() => {
    // Debug authentication state
    console.log('[DashboardHome] Auth state:', {
      authLoading,
      hasUser: !!user,
      hasFirebaseUser: !!firebaseUser,
      userId: user?.id,
      firebaseUid: firebaseUser?.uid
    });

    // Only run these effects once when we have a stable auth state
    if (!authLoading && firebaseUser && user) {
      // Debug user data
      debugUserData(user, 'DashboardHome');

      // Test Firebase connection (development only)
      if (process.env.NODE_ENV === 'development') {
        testFirebaseConnection();
      }

      // Track dashboard home view
      trackEvent('dashboard_home_viewed', {
        event_category: 'dashboard',
        event_label: 'home_page_view'
      });
    }
  }, [authLoading, !!firebaseUser, !!user]); // Fixed dependencies to prevent infinite loops

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
    
    // Track view activity
    if (project.visualsCount > 0) {
      trackView('', project.id);
    }
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
  const hasPermissionError = error?.includes?.('Permission denied') || statsError?.includes?.('Permission denied') || projectsError?.includes?.('Permission denied');

  // Show default state if no stats yet
  const displayStats = stats || {
    totalVisuals: 0,
    thisMonth: 0,
    downloads: 0,
    views: 0,
    creditsUsed: 0,
    creditsRemaining: 50,
    projects: 0
  };

  // Helper function to get display name
  const getDisplayName = () => {
    if (user?.displayName) {
      return user.displayName;
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
        <div className="flex gap-2">
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

      {/* Stats Cards */}
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Projets récents</h2>
            <Button variant="ghost" asChild className="text-primary hover:text-primary/80">
              <Link href="/dashboard/library">
                Voir tout
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>

          <div className="space-y-4">
            {recentProjects.map((project) => (
              <Card key={project.id} className="p-4 hover:shadow-md transition-shadow">
                <Link
                  href={`/dashboard/library?project=${project.id}`}
                  className="block cursor-pointer"
                  onClick={() => handleViewProject(project)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-sophisticated-gray-100 rounded-lg flex items-center justify-center overflow-hidden relative">
                      <Image
                        src={project.thumbnail}
                        alt={project.name}
                        fill
                        className="object-cover"
                        placeholder="blur"
                        blurDataURL={getPlaceholderUrl('small')}
                        onError={(e) => {
                          // Fallback to placeholder without causing additional requests
                          const target = e.currentTarget as HTMLImageElement;
                          target.src = getPlaceholderUrl('small');
                          target.style.display = 'block';
                          // Ensure we don't trigger the error again
                          target.onerror = null;
                        }}
                      />
                      <Sparkles className="h-6 w-6 text-sophisticated-gray-400 hidden" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">{project.name}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-muted-foreground flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(project.createdAt)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {Array.isArray(project.format) ? project.format.join(', ') : project.format}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {project.visualsCount} visuel{project.visualsCount > 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Download className="h-4 w-4" />
                      <span>{project.downloads}</span>
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>

          {recentProjects.length === 0 && (
            <Card className="p-12 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Aucun projet pour le moment
              </h3>
              <p className="text-muted-foreground mb-6">
                Commencez par créer votre premier visuel IA en quelques minutes
              </p>
              <Button asChild>
                <Link href="/dashboard/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer mon premier visuel
                </Link>
              </Button>
            </Card>
          )}
        </div>

        {/* Quick Actions & Tips */}
        <div className="space-y-6">
          {/* Quick Actions */}
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
        </div>
      </div>
    </div>
  );
}