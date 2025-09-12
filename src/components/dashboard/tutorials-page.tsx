"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  BookOpen,
  Search,
  Play,
  FileText,
  HelpCircle,
  Lightbulb,
  Video,
  Clock,
  Star,
  CheckCircle,
  ArrowRight,
  Download,
  Users,
  Zap
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { Badge } from "@/components/ui/badge";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  type: "video" | "guide" | "tip";
  category: string;
  duration: string;
  difficulty: "débutant" | "intermédiaire" | "avancé";
  thumbnail: string;
  url?: string;
  isCompleted?: boolean;
  isPopular?: boolean;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  isExpanded?: boolean;
}

const tutorials: Tutorial[] = [
  {
    id: "1",
    title: "Premiers pas avec Piktor",
    description: "Découvrez comment créer votre premier visuel IA en moins de 5 minutes",
    type: "video",
    category: "Démarrage",
    duration: "4 min",
    difficulty: "débutant",
    thumbnail: "/api/placeholder/400/225",
    url: "#",
    isPopular: true
  },
  {
    id: "2",
    title: "Optimiser la qualité de vos photos",
    description: "Conseils pour obtenir les meilleurs résultats avec vos images produit",
    type: "guide",
    category: "Photo",
    duration: "8 min",
    difficulty: "débutant",
    thumbnail: "/api/placeholder/400/225",
    url: "#"
  },
  {
    id: "3",
    title: "Choisir le bon style pour votre marque",
    description: "Guide complet des styles disponibles et comment les utiliser",
    type: "guide",
    category: "Design",
    duration: "12 min",
    difficulty: "intermédiaire",
    thumbnail: "/api/placeholder/400/225",
    url: "#"
  },
  {
    id: "4",
    title: "Créer des visuels pour les réseaux sociaux",
    description: "Formats, dimensions et bonnes pratiques pour Instagram, Facebook...",
    type: "video",
    category: "Marketing",
    duration: "15 min",
    difficulty: "intermédiaire",
    thumbnail: "/api/placeholder/400/225",
    url: "#",
    isPopular: true
  },
  {
    id: "5",
    title: "Utiliser les instructions personnalisées",
    description: "Comment guider l'IA avec des prompts efficaces",
    type: "tip",
    category: "Avancé",
    duration: "6 min",
    difficulty: "avancé",
    thumbnail: "/api/placeholder/400/225",
    url: "#"
  },
  {
    id: "6",
    title: "Organiser votre bibliothèque",
    description: "Système de tags et organisation pour retrouver vos visuels",
    type: "guide",
    category: "Organisation",
    duration: "7 min",
    difficulty: "débutant",
    thumbnail: "/api/placeholder/400/225",
    url: "#"
  }
];

const faqItems: FAQItem[] = [
  {
    id: "1",
    question: "Quels formats d'images puis-je télécharger ?",
    answer: "Piktor accepte les formats JPG, PNG et WebP. Pour de meilleurs résultats, utilisez des images haute résolution (minimum 1024x1024 pixels) avec un bon éclairage et un arrière-plan neutre.",
    category: "Technique"
  },
  {
    id: "2",
    question: "Combien de temps prend la génération d'un visuel ?",
    answer: "La génération d'un visuel prend généralement entre 30 secondes et 3 minutes selon la complexité de la demande et la charge du serveur. Vous recevrez une notification dès que vos visuels sont prêts.",
    category: "Génération"
  },
  {
    id: "3",
    question: "Puis-je modifier un visuel après génération ?",
    answer: "Actuellement, il n'est pas possible de modifier directement un visuel généré. Cependant, vous pouvez relancer une génération avec des paramètres ajustés pour obtenir de nouvelles variations.",
    category: "Génération"
  },
  {
    id: "4",
    question: "Combien de crédits ai-je par mois ?",
    answer: "Selon votre abonnement, vous disposez de 50 à 500 crédits par mois. Un crédit = un format généré. Les crédits non utilisés ne sont pas reportés au mois suivant.",
    category: "Abonnement"
  },
  {
    id: "5",
    question: "Comment obtenir de meilleurs résultats ?",
    answer: "Pour des résultats optimaux : utilisez des photos nettes et bien éclairées, choisissez le style adapté à votre marque, soyez précis dans vos instructions personnalisées, et testez différents environnements.",
    category: "Conseils"
  },
  {
    id: "6",
    question: "Les visuels générés sont-ils libres de droits ?",
    answer: "Oui, tous les visuels générés avec Piktor vous appartiennent et peuvent être utilisés librement pour votre activité commerciale, réseaux sociaux, site web, etc.",
    category: "Légal"
  }
];

const categories = ["Tous", "Démarrage", "Photo", "Design", "Marketing", "Avancé", "Organisation"];
const faqCategories = ["Toutes", "Technique", "Génération", "Abonnement", "Conseils", "Légal"];

export function TutorialsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [selectedFAQCategory, setSelectedFAQCategory] = useState("Toutes");
  const [filteredTutorials, setFilteredTutorials] = useState(tutorials);
  const [filteredFAQ, setFilteredFAQ] = useState(faqItems);
  const [expandedFAQ, setExpandedFAQ] = useState<Set<string>>(new Set());

  useEffect(() => {
    trackEvent('tutorials_viewed', {
      event_category: 'dashboard',
      event_label: 'tutorials_page_view'
    });
  }, []);

  useEffect(() => {
    let filtered = [...tutorials];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(tutorial => 
        tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutorial.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutorial.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== "Tous") {
      filtered = filtered.filter(tutorial => tutorial.category === selectedCategory);
    }

    setFilteredTutorials(filtered);
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    let filtered = [...faqItems];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedFAQCategory !== "Toutes") {
      filtered = filtered.filter(item => item.category === selectedFAQCategory);
    }

    setFilteredFAQ(filtered);
  }, [searchQuery, selectedFAQCategory]);

  const handleTutorialClick = (tutorial: Tutorial) => {
    trackEvent('tutorial_clicked', {
      event_category: 'tutorials',
      event_label: tutorial.type,
      custom_parameters: {
        tutorial_id: tutorial.id,
        tutorial_title: tutorial.title,
        category: tutorial.category
      }
    });

    // TODO: Open tutorial modal or navigate to tutorial page
    console.log('Opening tutorial:', tutorial);
  };

  const handleFAQToggle = (faqId: string) => {
    setExpandedFAQ(prev => {
      const newSet = new Set(prev);
      if (newSet.has(faqId)) {
        newSet.delete(faqId);
      } else {
        newSet.add(faqId);
      }
      return newSet;
    });

    trackEvent('faq_toggled', {
      event_category: 'tutorials',
      event_label: expandedFAQ.has(faqId) ? 'collapsed' : 'expanded',
      custom_parameters: {
        faq_id: faqId
      }
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "débutant": return "bg-success-100 text-success-700";
      case "intermédiaire": return "bg-warning-100 text-warning-700";
      case "avancé": return "bg-error-100 text-error-700";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video": return <Play className="w-4 h-4" />;
      case "guide": return <FileText className="w-4 h-4" />;
      case "tip": return <Lightbulb className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground flex items-center justify-center">
          <BookOpen className="w-8 h-8 mr-3" />
          Centre d'aide et tutoriels
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Apprenez à créer des visuels professionnels avec nos guides pas-à-pas, 
          vidéos explicatives et conseils d'experts.
        </p>
      </div>

      {/* Search Bar */}
      <Card className="p-6">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            placeholder="Rechercher dans les tutoriels et FAQ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Video className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">6 Tutoriels</h3>
          <p className="text-sm text-muted-foreground">Guides et vidéos</p>
        </Card>
        
        <Card className="p-6 text-center">
          <div className="w-12 h-12 bg-warm-gold-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <HelpCircle className="w-6 h-6 text-warm-gold-600" />
          </div>
          <h3 className="font-semibold text-foreground">6 Questions</h3>
          <p className="text-sm text-muted-foreground">FAQ détaillée</p>
        </Card>
        
        <Card className="p-6 text-center">
          <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-success-600" />
          </div>
          <h3 className="font-semibold text-foreground">Support 24/7</h3>
          <p className="text-sm text-muted-foreground">Assistance dédiée</p>
        </Card>
      </div>

      {/* Tutorials Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-foreground">Tutoriels</h2>
          
          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutorials.map((tutorial) => (
            <Card key={tutorial.id} className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleTutorialClick(tutorial)}>
              <div className="relative aspect-video bg-sophisticated-gray-100">
                <img 
                  src={tutorial.thumbnail} 
                  alt={tutorial.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling!.classList.remove('hidden');
                  }}
                />
                <div className="absolute inset-0 bg-sophisticated-gray-200 flex items-center justify-center hidden">
                  {getTypeIcon(tutorial.type)}
                </div>
                
                {/* Overlay with play button for videos */}
                {tutorial.type === "video" && (
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-primary ml-1" />
                    </div>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  {tutorial.isPopular && (
                    <Badge className="bg-warm-gold-500 text-white">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Populaire
                    </Badge>
                  )}
                  <Badge variant="secondary" className={getDifficultyColor(tutorial.difficulty)}>
                    {tutorial.difficulty}
                  </Badge>
                </div>

                {/* Duration */}
                <div className="absolute bottom-3 right-3">
                  <span className="bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {tutorial.duration}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-primary font-medium">{tutorial.category}</span>
                  <div className="flex items-center text-muted-foreground">
                    {getTypeIcon(tutorial.type)}
                  </div>
                </div>
                
                <h3 className="font-semibold text-foreground line-clamp-2 mb-2">
                  {tutorial.title}
                </h3>
                
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {tutorial.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{tutorial.duration}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredTutorials.length === 0 && (
          <Card className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Aucun tutoriel trouvé
            </h3>
            <p className="text-muted-foreground">
              Essayez de modifier vos critères de recherche
            </p>
          </Card>
        )}
      </div>

      {/* FAQ Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-foreground">Questions fréquentes</h2>
          
          {/* FAQ Category filters */}
          <div className="flex flex-wrap gap-2">
            {faqCategories.map((category) => (
              <Button
                key={category}
                variant={selectedFAQCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFAQCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredFAQ.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <button
                className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                onClick={() => handleFAQToggle(item.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-primary font-medium">{item.category}</span>
                    </div>
                    <h3 className="font-medium text-foreground">{item.question}</h3>
                  </div>
                  <div className="flex-shrink-0">
                    {expandedFAQ.has(item.id) ? (
                      <CheckCircle className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <HelpCircle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>
              
              {expandedFAQ.has(item.id) && (
                <div className="px-4 pb-4 border-t border-border">
                  <p className="text-muted-foreground pt-3 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>

        {filteredFAQ.length === 0 && (
          <Card className="p-12 text-center">
            <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Aucune question trouvée
            </h3>
            <p className="text-muted-foreground">
              Essayez de modifier vos critères de recherche
            </p>
          </Card>
        )}
      </div>

      {/* Contact Support */}
      <Card className="p-8 text-center bg-gradient-to-br from-primary/5 to-warm-gold-50 border-primary/20">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Une question spécifique ?
        </h3>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Notre équipe d'experts est là pour vous accompagner. 
          Posez vos questions et obtenez une réponse personnalisée.
        </p>
        <Button size="lg" className="bg-gradient-ocean-deep hover:opacity-90 text-white">
          Contacter le support
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Card>
    </div>
  );
}