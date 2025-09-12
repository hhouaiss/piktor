"use client";

import { useState, useEffect } from "react";
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
  Crown
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface ProjectStats {
  totalVisuals: number;
  thisMonth: number;
  downloads: number;
  views: number;
  creditsUsed: number;
  creditsRemaining: number;
}

interface RecentProject {
  id: string;
  name: string;
  thumbnail: string;
  createdAt: string;
  format: string;
  downloads: number;
}

// Mock data - replace with real API calls
const mockStats: ProjectStats = {
  totalVisuals: 48,
  thisMonth: 12,
  downloads: 156,
  views: 342,
  creditsUsed: 23,
  creditsRemaining: 27
};

const mockRecentProjects: RecentProject[] = [
  {
    id: "1",
    name: "Canapé Moderne Salon",
    thumbnail: "/api/placeholder/300/200",
    createdAt: "2024-09-10",
    format: "Instagram",
    downloads: 8
  },
  {
    id: "2", 
    name: "Chaise Design Bureau",
    thumbnail: "/api/placeholder/300/200",
    createdAt: "2024-09-09",
    format: "E-commerce",
    downloads: 12
  },
  {
    id: "3",
    name: "Table Basse Rustique",
    thumbnail: "/api/placeholder/300/200", 
    createdAt: "2024-09-08",
    format: "Print",
    downloads: 5
  }
];

export function DashboardHome() {
  const [stats] = useState<ProjectStats>(mockStats);
  const [recentProjects] = useState<RecentProject[]>(mockRecentProjects);

  useEffect(() => {
    // Track dashboard home view
    trackEvent('dashboard_home_viewed', {
      event_category: 'dashboard',
      event_label: 'home_page_view'
    });

    // TODO: Load real data from API
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // TODO: Replace with actual API calls
      // const [statsResponse, projectsResponse] = await Promise.all([
      //   fetch('/api/dashboard/stats'),
      //   fetch('/api/dashboard/recent-projects')
      // ]);
      
      // Mock loading delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

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
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short'
    });
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Bonjour ! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Prêt à créer de nouveaux visuels exceptionnels pour votre marque ?
          </p>
        </div>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Visuels créés</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalVisuals}</p>
              <p className="text-xs text-success-600">
                +{stats.thisMonth} ce mois-ci
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
              <p className="text-2xl font-bold text-foreground">{stats.downloads}</p>
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
              <p className="text-2xl font-bold text-foreground">{stats.views}</p>
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
              <p className="text-2xl font-bold text-primary">{stats.creditsRemaining}</p>
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
              <Card key={project.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewProject(project)}>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-sophisticated-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    <Image 
                      src={project.thumbnail} 
                      alt={project.name}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling!.classList.remove('hidden');
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
                      <span className="text-sm text-muted-foreground">{project.format}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Download className="h-4 w-4" />
                    <span>{project.downloads}</span>
                  </div>
                </div>
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
                  <span className="font-medium">{stats.creditsUsed}/50</span>
                </div>
                <div className="w-full bg-sophisticated-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(stats.creditsUsed / 50) * 100}%` }}
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