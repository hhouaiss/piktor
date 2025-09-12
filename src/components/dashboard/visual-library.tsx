"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageModal } from "@/components/ui/image-modal";
import { 
  Search, 
  Filter,
  Download,
  Eye,
  Trash2,
  Calendar,
  Grid3X3,
  List,
  Plus,
  SortAsc,
  SortDesc,
  Tag,
  Share,
  Edit,
  Star,
  MoreHorizontal,
  Images
} from "lucide-react";
import { trackEvent, trackImageGeneration } from "@/lib/analytics";
import Link from "next/link";

interface Visual {
  id: string;
  name: string;
  thumbnail: string;
  fullSizeUrl: string;
  format: string;
  createdAt: string;
  downloads: number;
  views: number;
  tags: string[];
  isFavorite: boolean;
  projectName: string;
  style: string;
  environment: string;
}

const mockVisuals: Visual[] = [
  {
    id: "1",
    name: "Canapé Moderne - Instagram Post",
    thumbnail: "/api/placeholder/300/300",
    fullSizeUrl: "/api/placeholder/1080/1080",
    format: "Instagram Post",
    createdAt: "2024-09-10",
    downloads: 8,
    views: 24,
    tags: ["moderne", "salon", "canapé"],
    isFavorite: true,
    projectName: "Canapé Moderne Salon",
    style: "Moderne",
    environment: "Salon"
  },
  {
    id: "2", 
    name: "Canapé Moderne - E-commerce",
    thumbnail: "/api/placeholder/300/300",
    fullSizeUrl: "/api/placeholder/800/600",
    format: "E-commerce",
    createdAt: "2024-09-10",
    downloads: 12,
    views: 31,
    tags: ["moderne", "salon", "canapé"],
    isFavorite: false,
    projectName: "Canapé Moderne Salon",
    style: "Moderne",
    environment: "Salon"
  },
  {
    id: "3",
    name: "Chaise Design - Instagram Story",
    thumbnail: "/api/placeholder/300/533",
    fullSizeUrl: "/api/placeholder/1080/1920",
    format: "Instagram Story",
    createdAt: "2024-09-09",
    downloads: 5,
    views: 18,
    tags: ["design", "bureau", "chaise"],
    isFavorite: false,
    projectName: "Chaise Design Bureau",
    style: "Moderne",
    environment: "Bureau"
  },
  {
    id: "4",
    name: "Table Basse - Print",
    thumbnail: "/api/placeholder/300/400",
    fullSizeUrl: "/api/placeholder/2480/3508",
    format: "Print A4",
    createdAt: "2024-09-08",
    downloads: 3,
    views: 12,
    tags: ["rustique", "salon", "table"],
    isFavorite: true,
    projectName: "Table Basse Rustique",
    style: "Rustique", 
    environment: "Salon"
  }
];

type ViewMode = "grid" | "list";
type SortBy = "date" | "name" | "downloads" | "views";
type SortOrder = "asc" | "desc";

export function VisualLibrary() {
  const [visuals, setVisuals] = useState<Visual[]>(mockVisuals);
  const [filteredVisuals, setFilteredVisuals] = useState<Visual[]>(mockVisuals);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedVisual, setSelectedVisual] = useState<Visual | null>(null);
  const [selectedVisuals, setSelectedVisuals] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Get unique formats and tags for filters
  const availableFormats = Array.from(new Set(visuals.map(v => v.format)));
  const availableTags = Array.from(new Set(visuals.flatMap(v => v.tags)));

  useEffect(() => {
    trackEvent('library_viewed', {
      event_category: 'dashboard',
      event_label: 'library_page_view',
      custom_parameters: {
        total_visuals: visuals.length
      }
    });
  }, [visuals.length]);

  useEffect(() => {
    let filtered = [...visuals];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(visual => 
        visual.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visual.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visual.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply format filter
    if (selectedFormat !== "all") {
      filtered = filtered.filter(visual => visual.format === selectedFormat);
    }

    // Apply tag filter
    if (selectedTag !== "all") {
      filtered = filtered.filter(visual => visual.tags.includes(selectedTag));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "date":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "downloads":
          comparison = a.downloads - b.downloads;
          break;
        case "views":
          comparison = a.views - b.views;
          break;
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    setFilteredVisuals(filtered);
  }, [visuals, searchQuery, selectedFormat, selectedTag, sortBy, sortOrder]);

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

  const handleVisualClick = (visual: Visual) => {
    setSelectedVisual(visual);
    
    trackImageGeneration.imageViewed({
      imageIndex: visuals.indexOf(visual),
      productType: visual.projectName
    });
  };

  const handleDownload = (visual: Visual) => {
    // TODO: Implement actual download
    console.log('Downloading:', visual);
    
    trackImageGeneration.imageDownloaded({
      imageIndex: visuals.indexOf(visual),
      productType: visual.projectName,
      filename: visual.name
    });
    
    // Update download count
    setVisuals(prev => prev.map(v => 
      v.id === visual.id ? { ...v, downloads: v.downloads + 1 } : v
    ));
  };

  const handleToggleFavorite = (visual: Visual) => {
    setVisuals(prev => prev.map(v => 
      v.id === visual.id ? { ...v, isFavorite: !v.isFavorite } : v
    ));

    trackEvent('library_favorite_toggled', {
      event_category: 'dashboard',
      event_label: visual.isFavorite ? 'unfavorited' : 'favorited',
      custom_parameters: {
        visual_id: visual.id
      }
    });
  };

  const handleDeleteVisual = (visual: Visual) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${visual.name}" ?`)) {
      setVisuals(prev => prev.filter(v => v.id !== visual.id));
      
      trackEvent('library_visual_deleted', {
        event_category: 'dashboard',
        event_label: 'visual_deleted',
        custom_parameters: {
          visual_id: visual.id
        }
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredVisuals.map((visual) => (
        <Card key={visual.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
          <div className="relative aspect-square bg-sophisticated-gray-100 overflow-hidden">
            <img
              src={visual.thumbnail}
              alt={visual.name}
              className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
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
                {visual.format}
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
    <div className="space-y-4">
      {filteredVisuals.map((visual) => (
        <Card key={visual.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-sophisticated-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={visual.thumbnail}
                alt={visual.name}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => handleVisualClick(visual)}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling!.classList.remove('hidden');
                }}
              />
              <Images className="w-8 h-8 m-auto text-sophisticated-gray-400 hidden" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-medium text-foreground truncate">{visual.name}</h3>
                {visual.isFavorite && (
                  <Star className="w-4 h-4 text-warm-gold-500 fill-current flex-shrink-0" />
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                <span>{visual.format}</span>
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(visual.createdAt)}
                </span>
                <span className="flex items-center">
                  <Eye className="w-3 h-3 mr-1" />
                  {visual.views} vues
                </span>
                <span className="flex items-center">
                  <Download className="w-3 h-3 mr-1" />
                  {visual.downloads} téléchargements
                </span>
              </div>

              <div className="flex flex-wrap gap-1">
                {visual.tags.map((tag) => (
                  <span key={tag} className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={() => handleVisualClick(visual)}>
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDownload(visual)}>
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleToggleFavorite(visual)}>
                <Star className={`w-4 h-4 ${visual.isFavorite ? 'fill-current text-warm-gold-500' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDeleteVisual(visual)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
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
            Bibliothèque de visuels
          </h1>
          <p className="text-muted-foreground mt-1">
            {filteredVisuals.length} visuel(s) • {visuals.reduce((sum, v) => sum + v.downloads, 0)} téléchargements
          </p>
        </div>
        
        <Button asChild size="lg" className="bg-gradient-ocean-deep hover:opacity-90 text-white">
          <Link href="/dashboard/create">
            <Plus className="w-5 h-5 mr-2" />
            Créer un nouveau visuel
          </Link>
        </Button>
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
        </>
      )}

      {/* Image Modal */}
      {selectedVisual && (
        <ImageModal
          isOpen={true}
          onClose={() => setSelectedVisual(null)}
          images={[{
            url: selectedVisual.fullSizeUrl,
            alt: selectedVisual.name,
            title: selectedVisual.name,
            description: `${selectedVisual.format} • ${formatDate(selectedVisual.createdAt)}`
          }]}
          currentIndex={0}
          onDownload={() => handleDownload(selectedVisual)}
        />
      )}
    </div>
  );
}