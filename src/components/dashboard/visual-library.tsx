"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageModal } from "@/components/ui/image-modal";
import { FullscreenImageViewer } from "@/components/ui/fullscreen-image-viewer";
import { ImageEditorModal } from "@/components/visual-library/image-editor-modal";
import { VariationsViewerModal } from "@/components/visual-library/variations-viewer-modal";
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
  RefreshCw,
  Edit,
  Layers
} from "lucide-react";
import { trackEvent, trackImageGeneration } from "@/lib/analytics";
import { useSimpleAuth } from "@/components/auth/simple-auth-provider";
import { supabaseService } from "@/lib/supabase/database";
import type { Visual, VisualFilters, VisualSort, PaginationOptions } from "@/lib/supabase/types";
import { getPlaceholderUrl } from "@/lib/image-placeholders";
import { extractProductName, formatLabel } from "@/lib/product-name-extractor";
import { analyticsService } from "@/lib/supabase/analytics-service";
import Link from "next/link";
import { useSubscription } from "@/hooks/useSubscription";
import { canAccessImageEditing, canAccessVariations } from "@/lib/feature-gating";
import { useUpgradePrompt } from "@/hooks/use-upgrade-prompt";
import { UpgradePromptModal } from "@/components/dashboard/upgrade-prompt-modal";
import { Lock } from "lucide-react";



type ViewMode = "grid" | "list";
type SortBy = "date" | "name" | "downloads" | "views";
type SortOrder = "asc" | "desc";

export function VisualLibrary() {
  const searchParams = useSearchParams();
  const projectFilter = searchParams?.get('project');
  const { user: authUser } = useSimpleAuth(); // Get user from auth context
  const { subscription } = useSubscription();
  const userPlan = subscription?.planId || 'free';
  const { promptState, showUpgradePrompt, hideUpgradePrompt } = useUpgradePrompt();

  const [visuals, setVisuals] = useState<Visual[]>([]);
  const [filteredVisuals, setFilteredVisuals] = useState<Visual[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedVisual, setSelectedVisual] = useState<Visual | null>(null);
  const [fullscreenVisual, setFullscreenVisual] = useState<Visual | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const hasLoadedInitially = useRef(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [visualToEdit, setVisualToEdit] = useState<Visual | null>(null);
  const [isVariationsOpen, setIsVariationsOpen] = useState(false);
  const [variationsVisual, setVariationsVisual] = useState<Visual | null>(null);
  const [variations, setVariations] = useState<any[]>([]);
  const [loadingVariations, setLoadingVariations] = useState(false);

  // Get unique formats and tags for filters
  const availableFormats = Array.from(new Set(visuals.flatMap(v => Array.isArray(v.format) ? v.format : [v.format])));
  const availableTags = Array.from(new Set(visuals.flatMap(v => v.tags)));

  useEffect(() => {
    // Only load visuals on initial mount when user is available
    if (authUser && !hasLoadedInitially.current) {
      hasLoadedInitially.current = true;
      loadVisuals(authUser.id);
    } else if (!authUser) {
      setLoading(false);
      setError('Utilisateur non authentifié');
    }
  }, [authUser]); // Re-run when authUser changes

  const loadVisuals = useCallback(async (userId: string, append: boolean = false) => {
    try {
      console.log('[VisualLibrary] Loading visuals for user:', userId);

      if (!append) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      // Build filters (removed search since we do client-side filtering by product name)
      const filters: VisualFilters = {};
      if (projectFilter) filters.projectId = projectFilter;

      // Build sort
      const sort: VisualSort = {
        field: sortBy === "date" ? "created_at" : sortBy as any,
        direction: sortOrder
      };

      // Build pagination
      const pagination: PaginationOptions = {
        limit: 20
      };

      const result = await supabaseService.getUserVisuals(userId, filters, sort, pagination);
      console.log('[VisualLibrary] Loaded visuals:', result.data.length, 'items');



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
  }, [projectFilter, sortBy, sortOrder]);

  // Re-filter visuals when filters change
  useEffect(() => {
    if (authUser) {
      loadVisuals(authUser.id);
    }
  }, [sortBy, sortOrder, authUser]);

  // Filter visuals by product name search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVisuals(visuals);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = visuals.filter((visual) => {
      const productName = extractProductName(visual.metadata, visual.id).toLowerCase();
      return productName.includes(query);
    });

    setFilteredVisuals(filtered);
  }, [visuals, searchQuery]);

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


  const handleFullscreenView = async (visual: Visual) => {
    setFullscreenVisual(visual);

    // Track view asynchronously (don't block UI)
    analyticsService.trackView(visual.id).then(newViewCount => {
      // Update local state with new view count
      setVisuals(prev => prev.map(v =>
        v.id === visual.id ? { ...v, views: newViewCount } : v
      ));
    }).catch(error => {
      console.error('Error tracking view:', error);
    });

    trackImageGeneration.imageViewed({
      imageIndex: visuals.indexOf(visual),
      productType: extractProductName(visual.metadata, visual.id)
    });
  };

  const handleDownload = async (visual: Visual) => {
    try {
      // Track download before downloading (ensures it's counted)
      const newDownloadCount = await analyticsService.trackDownload(visual.id);

      // Update local state with the actual count from database
      setVisuals(prev => prev.map(v =>
        v.id === visual.id ? { ...v, downloads: newDownloadCount } : v
      ));

      // Track download analytics
      trackImageGeneration.imageDownloaded({
        imageIndex: visuals.indexOf(visual),
        productType: extractProductName(visual.metadata, visual.id),
        filename: extractProductName(visual.metadata, visual.id)
      });

      // Use the download API to handle Supabase Storage URLs properly
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

  const handleViewVariations = async (visual: Visual) => {
    setVariationsVisual(visual);
    setLoadingVariations(true);
    setIsVariationsOpen(true);

    try {
      const response = await fetch(`/api/get-variations?visualId=${visual.visualId}`);
      const data = await response.json();

      if (data.success) {
        setVariations(data.variations || []);
      } else {
        setVariations([]);
        console.error('Failed to fetch variations:', data.error);
      }
    } catch (err) {
      console.error('Error fetching variations:', err);
      setVariations([]);
    } finally {
      setLoadingVariations(false);
    }
  };

  const handleToggleFavorite = async (visual: Visual) => {
    try {
      const newFavoriteStatus = await supabaseService.toggleVisualFavorite(visual.id);

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
        await supabaseService.deleteVisual(visual.id);
        
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
    if (authUser && hasMore && !loadingMore) {
      loadVisuals(authUser.id, true);
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
  if (error || !authUser) {
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
                <Button variant="outline" onClick={() => {
                  if (authUser) {
                    loadVisuals(authUser.id);
                  }
                }}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réessayer
                </Button>
              )}
              {!authUser && (
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

  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredVisuals.map((visual) => {
          // Get valid image URL, fallback to placeholder if empty
          const imageUrl = visual.thumbnailUrl || visual.originalImageUrl || getPlaceholderUrl('small');
          const hasValidUrl = imageUrl && imageUrl.trim() !== '';

          return (
          <Card key={visual.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
          <div className="relative aspect-square bg-sophisticated-gray-100 overflow-hidden">
            {hasValidUrl ? (
              <Image
                src={imageUrl}
                alt={visual.name}
                fill
                className="object-cover cursor-pointer transition-transform group-hover:scale-105"
                onClick={() => handleFullscreenView(visual)}
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
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-sophisticated-gray-200">
                <Images className="w-16 h-16 text-sophisticated-gray-400" />
              </div>
            )}
            <Images className="absolute inset-0 w-16 h-16 m-auto text-sophisticated-gray-400 hidden" />
            
            {/* Favorite indicator - Hidden */}
            {false && visual.isFavorite && (
              <div className="absolute top-2 right-2">
                <Star className="w-5 h-5 text-warm-gold-500 fill-current" />
              </div>
            )}

            {/* Format badge */}
            <div className="absolute top-2 left-2">
              <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                {formatLabel(visual.metadata?.contextPreset) || (Array.isArray(visual.format) ? visual.format[0] : visual.format)}
              </span>
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-medium text-foreground line-clamp-2 mb-2">
              {extractProductName(visual.metadata, visual.id)}
            </h3>

            <div className="flex items-center text-sm text-muted-foreground mb-3">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(visual.createdAt)}
            </div>

            {/* Action buttons below date - Icons only */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleFullscreenView(visual)}
                title="Voir en plein écran"
                className="px-2"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const editAccess = canAccessImageEditing(userPlan);
                  if (!editAccess.hasAccess) {
                    showUpgradePrompt('feature_locked', userPlan);
                    return;
                  }
                  setVisualToEdit(visual);
                  setIsEditorOpen(true);
                }}
                title={canAccessImageEditing(userPlan).hasAccess ? "Modifier l'image" : "Fonctionnalité Premium"}
                className={`px-2 ${!canAccessImageEditing(userPlan).hasAccess ? 'opacity-60' : ''}`}
              >
                <Edit className="w-4 h-4" />
                {!canAccessImageEditing(userPlan).hasAccess && <Lock className="w-3 h-3 ml-1" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(visual)}
                title="Télécharger"
                className="px-2"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>

            {/* Variations button */}
            <Button
              size="sm"
              variant="default"
              onClick={() => {
                const variationsAccess = canAccessVariations(userPlan);
                if (!variationsAccess.hasAccess) {
                  showUpgradePrompt('feature_locked', userPlan);
                  return;
                }
                handleViewVariations(visual);
              }}
              title={canAccessVariations(userPlan).hasAccess ? "Voir les variations" : "Fonctionnalité Premium"}
              className={`w-full gap-1 ${canAccessVariations(userPlan).hasAccess ? 'bg-ocean-blue-600 hover:bg-ocean-blue-700' : 'bg-gray-400 hover:bg-gray-500 opacity-60'}`}
              disabled={!canAccessVariations(userPlan).hasAccess}
            >
              <Layers className="w-4 h-4" />
              Variations
              {!canAccessVariations(userPlan).hasAccess && <Lock className="w-3 h-3 ml-1" />}
            </Button>

            <div className="flex flex-wrap gap-1">
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
          </div>
          </Card>
          );
        })}
      </div>
    );
  };

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
                onClick={() => handleFullscreenView(visual)}
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
                    onClick={() => handleFullscreenView(visual)}
                    title="View in full screen"
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
            {filteredVisuals.length} visuel(s)
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

      {/* Search Bar Only */}
      <Card className="p-6">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            placeholder="Rechercher par nom de produit..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
      </Card>

      {/* Content */}
      {filteredVisuals.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2">
          <div className="bg-primary/5 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <Images className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-2xl font-semibold text-foreground mb-3">
            {visuals.length === 0 ? "Votre bibliothèque est vide" : "Aucun résultat"}
          </h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {visuals.length === 0
              ? "Créez votre premier visuel IA en quelques clics et commencez à constituer votre collection de designs uniques."
              : "Essayez de modifier vos critères de recherche ou de supprimer certains filtres."
            }
          </p>
          {visuals.length === 0 && (
            <div className="space-y-4">
              <Button asChild size="lg" className="bg-gradient-ocean-deep hover:opacity-90 text-white">
                <Link href="/dashboard/create">
                  <Plus className="w-5 h-5 mr-2" />
                  Créer mon premier visuel
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Générez des images avec l'IA en décrivant simplement ce que vous voulez
              </p>
            </div>
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

      {/* Full-screen Image Viewer */}
      {fullscreenVisual && (
        <FullscreenImageViewer
          isOpen={true}
          onClose={() => setFullscreenVisual(null)}
          imageUrl={fullscreenVisual.originalImageUrl}
          imageAlt={fullscreenVisual.name}
        />
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

      {/* Image Editor Modal */}
      {visualToEdit && (
        <ImageEditorModal
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setVisualToEdit(null);
          }}
          visual={{
            id: visualToEdit.id,
            visualId: visualToEdit.id,
            originalImageUrl: visualToEdit.originalImageUrl,
            metadata: visualToEdit.metadata,
            name: visualToEdit.name,
          }}
          onEditComplete={() => {
            // Refresh visual library after successful edit
            if (authUser) {
              loadVisuals(authUser.id);
            }
          }}
        />
      )}

      {/* Variations Viewer Modal */}
      {variationsVisual && (
        <VariationsViewerModal
          isOpen={isVariationsOpen}
          onClose={() => {
            setIsVariationsOpen(false);
            setVariationsVisual(null);
            setVariations([]);
          }}
          originalImageUrl={variationsVisual.originalImageUrl}
          originalImageName={extractProductName(variationsVisual.metadata, variationsVisual.id)}
          variations={variations}
        />
      )}

      {/* Upgrade Prompt Modal */}
      <UpgradePromptModal
        isOpen={promptState.isOpen}
        onClose={hideUpgradePrompt}
        currentPlan={promptState.currentPlan}
        trigger={promptState.trigger}
        remainingCredits={promptState.remainingCredits}
        totalCredits={promptState.totalCredits}
      />
    </div>
  );
}