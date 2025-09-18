"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageModal } from "@/components/ui/image-modal";
import {
  Search,
  Download,
  Eye,
  Trash2,
  Calendar,
  Grid3X3,
  List,
  Plus,
  Star,
  Images,
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { trackEvent, trackImageGeneration } from "@/lib/analytics";
import { authService, firestoreService } from "@/lib/firebase";
import type { Visual, VisualFilters, VisualSort, PaginationOptions } from "@/lib/firebase";
import Link from "next/link";



type ViewMode = "grid" | "list";
type SortBy = "date" | "name" | "downloads" | "views";
type SortOrder = "asc" | "desc";

export function VisualLibrary() {
  const searchParams = useSearchParams();
  const projectFilter = searchParams.get('project');

  const [visuals, setVisuals] = useState<Visual[]>([]);
  const [filteredVisuals, setFilteredVisuals] = useState<Visual[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedVisual, setSelectedVisual] = useState<Visual | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Get unique formats and tags for filters
  const availableFormats = Array.from(new Set(visuals.flatMap(v => Array.isArray(v.format) ? v.format : [v.format])));
  const availableTags = Array.from(new Set(visuals.flatMap(v => v.tags)));

  useEffect(() => {
    // Check authentication and load data
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      loadVisuals(currentUser.uid);
    } else {
      // Listen for auth state changes
      const unsubscribe = authService.onAuthStateChange((firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          loadVisuals(firebaseUser.uid);
        } else {
          setLoading(false);
          setError('Utilisateur non authentifié');
        }
      });
      
      return () => unsubscribe();
    }
  }, []);

  const loadVisuals = useCallback(async (userId: string, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }


      // Build filters
      const filters: VisualFilters = {};
      if (projectFilter) filters.projectId = projectFilter;
      if (selectedFormat !== "all") filters.format = selectedFormat;
      if (selectedTag !== "all") filters.tags = [selectedTag];
      if (searchQuery) filters.search = searchQuery;


      // Build sort
      const sort: VisualSort = {
        field: sortBy === "date" ? "createdAt" : sortBy as any,
        direction: sortOrder
      };

      // Build pagination
      const pagination: PaginationOptions = {
        limit: 20,
        startAfter: append ? visuals[visuals.length - 1] : undefined
      };

      const result = await firestoreService.getUserVisuals(userId, filters, sort, pagination);



      if (append) {
        setVisuals(prev => [...prev, ...result.data]);
      } else {
        setVisuals(result.data);
      }

      setHasMore(result.hasMore);

      // Track library viewed event
      if (!append) {
        trackEvent('library_viewed', {
          event_category: 'dashboard',
          event_label: 'library_page_view',
          custom_parameters: {
            total_visuals: result.data.length,
            projectFilter: projectFilter || 'none'
          }
        });
      }
    } catch (error) {
      console.error('Error loading visuals:', error);
      setError('Erreur lors du chargement de la bibliothèque');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [projectFilter, selectedFormat, selectedTag, searchQuery, sortBy, sortOrder, visuals]);

  // Re-filter visuals when filters change
  useEffect(() => {
    if (user) {
      loadVisuals(user.uid);
    }
  }, [selectedFormat, selectedTag, sortBy, sortOrder]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user && searchQuery !== undefined) {
        loadVisuals(user.uid);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Set filtered visuals to all visuals (filtering is now done server-side)
  useEffect(() => {
    setFilteredVisuals(visuals);
  }, [visuals]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query) {
      trackEvent('library_search', {
        event_category: 'dashboard',
        event_label: 'search_query',
        custom_parameters: {
          search_term: query
        }
      });
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    trackEvent('library_view_mode_changed', {
      event_category: 'dashboard',
      event_label: mode
    });
  };

  const handleVisualClick = async (visual: Visual) => {
    setSelectedVisual(visual);
    
    // Increment view count
    try {
      await firestoreService.incrementVisualStats(visual.id, { views: 1 });
      
      // Update local state
      setVisuals(prev => prev.map(v => 
        v.id === visual.id ? { ...v, views: v.views + 1 } : v
      ));
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
    
    trackImageGeneration.imageViewed({
      imageIndex: visuals.indexOf(visual),
      productType: visual.name
    });
  };

  const handleDownload = async (visual: Visual) => {
    try {
      // Increment download count in Firebase
      await firestoreService.incrementVisualStats(visual.id, { downloads: 1 });

      // Track download analytics
      trackImageGeneration.imageDownloaded({
        imageIndex: visuals.indexOf(visual),
        productType: visual.name,
        filename: visual.name
      });

      // Update local state
      setVisuals(prev => prev.map(v =>
        v.id === visual.id ? { ...v, downloads: v.downloads + 1 } : v
      ));

      // Use the download API to handle Firebase Storage URLs properly
      const filename = `${visual.name}.jpg`;
      const proxyUrl = `/api/download-image?url=${encodeURIComponent(visual.originalImageUrl)}&filename=${encodeURIComponent(filename)}`;

      const response = await fetch(proxyUrl);
      if (!response.ok) {
        let errorMessage = `Download failed: HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          if (errorData.details) {
            errorMessage += ` - ${errorData.details}`;
          }
        } catch (jsonError) {
          console.error('Could not parse error response:', jsonError);
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the object URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);

      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown download error';
      alert(`Download failed: ${errorMessage}`);

      // Fallback: open image in new tab if available
      try {
        window.open(visual.originalImageUrl, '_blank');
      } catch (fallbackError) {
        console.error('Fallback download also failed:', fallbackError);
      }
    }
  };

  const handleToggleFavorite = async (visual: Visual) => {
    try {
      const newFavoriteStatus = await firestoreService.toggleVisualFavorite(visual.id);
      
      // Update local state
      setVisuals(prev => prev.map(v => 
        v.id === visual.id ? { ...v, isFavorite: newFavoriteStatus } : v
      ));

      trackEvent('library_favorite_toggled', {
        event_category: 'dashboard',
        event_label: newFavoriteStatus ? 'favorited' : 'unfavorited',
        custom_parameters: {
          visual_id: visual.id
        }
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDeleteVisual = async (visual: Visual) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${visual.name}" ?`)) {
      try {
        await firestoreService.deleteVisual(visual.id);
        
        // Update local state
        setVisuals(prev => prev.filter(v => v.id !== visual.id));
        
        trackEvent('library_visual_deleted', {
          event_category: 'dashboard',
          event_label: 'visual_deleted',
          custom_parameters: {
            visual_id: visual.id
          }
        });
      } catch (error) {
        console.error('Error deleting visual:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const formatDate = (dateString: string | Date | any) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString.toDate ? dateString.toDate() : dateString;
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const loadMoreVisuals = () => {
    if (user && hasMore && !loadingMore) {
      loadVisuals(user.uid, true);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement de votre bibliothèque...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {error || 'Vous devez être connecté pour accéder à la bibliothèque'}
            </p>
            <div className="flex gap-2 justify-center">
              {error && (
                <Button variant="outline" onClick={() => user && loadVisuals(user.uid)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réessayer
                </Button>
              )}
              {!user && (
                <Button asChild>
                  <Link href="/auth/signin">
                    Se connecter
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredVisuals.map((visual) => (
        <Card key={visual.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
          <div className="relative aspect-square bg-sophisticated-gray-100 overflow-hidden">
            <Image
              src={visual.thumbnailUrl || visual.originalImageUrl}
              alt={visual.name}
              fill
              className="object-cover cursor-pointer transition-transform group-hover:scale-105"
              onClick={() => handleVisualClick(visual)}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling!.classList.remove('hidden');
              }}
            />
            <Images className="absolute inset-0 w-16 h-16 m-auto text-sophisticated-gray-400 hidden" />
            
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => handleVisualClick(visual)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => handleDownload(visual)}
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => handleToggleFavorite(visual)}
              >
                <Star className={`w-4 h-4 ${visual.isFavorite ? 'fill-current' : ''}`} />
              </Button>
            </div>

            {/* Favorite indicator */}
            {visual.isFavorite && (
              <div className="absolute top-2 right-2">
                <Star className="w-5 h-5 text-warm-gold-500 fill-current" />
              </div>
            )}

            {/* Format badge */}
            <div className="absolute top-2 left-2">
              <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                {Array.isArray(visual.format) ? visual.format[0] : visual.format}
              </span>
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-medium text-foreground line-clamp-2 mb-2">
              {visual.name}
            </h3>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
              <span className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(visual.createdAt)}
              </span>
              <div className="flex items-center space-x-3">
                <span className="flex items-center">
                  <Eye className="w-3 h-3 mr-1" />
                  {visual.views}
                </span>
                <span className="flex items-center">
                  <Download className="w-3 h-3 mr-1" />
                  {visual.downloads}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {visual.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
              {visual.tags.length > 2 && (
                <span className="text-xs text-muted-foreground">
                  +{visual.tags.length - 2}
                </span>
              )}
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => handleDownload(visual)}
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-3">
      {filteredVisuals.map((visual) => (
        <Card key={visual.id} className="p-4 hover:shadow-md transition-all duration-200">
          <div className="flex items-start gap-4">
            {/* Image thumbnail - fixed size */}
            <div className="relative w-20 h-20 bg-sophisticated-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={visual.thumbnailUrl || visual.originalImageUrl}
                alt={visual.name}
                width={80}
                height={80}
                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                onClick={() => handleVisualClick(visual)}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
              <Images className="fallback-icon w-8 h-8 absolute inset-0 m-auto text-sophisticated-gray-400 hidden" />
            </div>

            {/* Content - flexible */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{visual.name}</h3>
                  {visual.isFavorite && (
                    <Star className="w-4 h-4 text-warm-gold-500 fill-current flex-shrink-0" />
                  )}
                </div>

                {/* Actions - moved to top right for better mobile layout */}
                <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVisualClick(visual)}
                    title="Voir l'image"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(visual)}
                    title="Télécharger"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleFavorite(visual)}
                    title={visual.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                  >
                    <Star className={`w-4 h-4 ${visual.isFavorite ? 'fill-current text-warm-gold-500' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteVisual(visual)}
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-muted-foreground mb-3">
                <div className="flex items-center">
                  <span className="font-medium">Format:</span>
                  <span className="ml-1 truncate">
                    {Array.isArray(visual.format) ? visual.format.join(', ') : visual.format}
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{formatDate(visual.createdAt)}</span>
                </div>
                <div className="flex items-center">
                  <Eye className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span>{visual.views} vues</span>
                </div>
                <div className="flex items-center">
                  <Download className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span>{visual.downloads} téléchargements</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {visual.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-md">
                    {tag}
                  </span>
                ))}
                {visual.tags.length > 4 && (
                  <span className="text-xs text-muted-foreground self-center">
                    +{visual.tags.length - 4} plus
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {projectFilter ? 'Visuels du projet' : 'Bibliothèque de visuels'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {filteredVisuals.length} visuel(s) • {visuals.reduce((sum, v) => sum + v.downloads, 0)} téléchargements
            {projectFilter && (
              <span className="ml-2 px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                Filtré par projet
              </span>
            )}
          </p>
        </div>

        <div className="flex gap-2">
          {projectFilter && (
            <Button variant="outline" asChild>
              <Link href="/dashboard/library">
                Voir tous les visuels
              </Link>
            </Button>
          )}


          <Button asChild size="lg" className="bg-gradient-ocean-deep hover:opacity-90 text-white">
            <Link href="/dashboard/create">
              <Plus className="w-5 h-5 mr-2" />
              Créer un nouveau visuel
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters and Controls */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher par nom, projet ou tag..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les formats</SelectItem>
                {availableFormats.map((format) => (
                  <SelectItem key={format} value={format}>{format}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les tags</SelectItem>
                {availableTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [sort, order] = value.split('-');
              setSortBy(sort as SortBy);
              setSortOrder(order as SortOrder);
            }}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Plus récent</SelectItem>
                <SelectItem value="date-asc">Plus ancien</SelectItem>
                <SelectItem value="name-asc">Nom A-Z</SelectItem>
                <SelectItem value="name-desc">Nom Z-A</SelectItem>
                <SelectItem value="downloads-desc">Plus téléchargés</SelectItem>
                <SelectItem value="views-desc">Plus vus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Mode */}
          <div className="flex border border-border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewModeChange("grid")}
              className="h-8 px-3"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewModeChange("list")}
              className="h-8 px-3"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Content */}
      {filteredVisuals.length === 0 ? (
        <Card className="p-12 text-center">
          <Images className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {visuals.length === 0 ? "Aucun visuel créé" : "Aucun résultat"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {visuals.length === 0 
              ? "Commencez par créer votre premier visuel IA"
              : "Essayez de modifier vos critères de recherche"
            }
          </p>
          {visuals.length === 0 && (
            <Button asChild>
              <Link href="/dashboard/create">
                <Plus className="w-4 h-4 mr-2" />
                Créer mon premier visuel
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <>
          {viewMode === "grid" ? renderGridView() : renderListView()}
          
          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button 
                variant="outline" 
                onClick={loadMoreVisuals}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {loadingMore ? 'Chargement...' : 'Charger plus'}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Image Modal */}
      {selectedVisual && (
        <ImageModal
          isOpen={true}
          onClose={() => setSelectedVisual(null)}
          imageUrl={selectedVisual.originalImageUrl}
          imageAlt={selectedVisual.name}
          onDownload={() => handleDownload(selectedVisual)}
        />
      )}
    </div>
  );
}