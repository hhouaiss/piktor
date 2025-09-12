"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageCircle,
  Mail,
  Phone,
  Clock,
  Send,
  Plus,
  Search,
  Filter,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  XCircle,
  MessageSquare,
  Headphones,
  Zap
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  category: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  createdAt: string;
  updatedAt: string;
  responses: TicketResponse[];
}

interface TicketResponse {
  id: string;
  message: string;
  isFromSupport: boolean;
  createdAt: string;
  author: string;
}

const mockTickets: SupportTicket[] = [
  {
    id: "TICK-001",
    subject: "Problème de génération d'images",
    message: "Les images générées ne correspondent pas au style sélectionné...",
    category: "technique",
    priority: "normal",
    status: "in_progress",
    createdAt: "2024-09-10",
    updatedAt: "2024-09-11",
    responses: [
      {
        id: "resp-1",
        message: "Bonjour, nous avons bien reçu votre demande. Notre équipe technique va examiner ce problème.",
        isFromSupport: true,
        createdAt: "2024-09-10",
        author: "Sarah - Support Piktor"
      }
    ]
  },
  {
    id: "TICK-002", 
    subject: "Question sur l'abonnement Pro",
    message: "Je souhaiterais savoir si je peux changer d'abonnement en cours de mois...",
    category: "facturation",
    priority: "low",
    status: "resolved",
    createdAt: "2024-09-08",
    updatedAt: "2024-09-09",
    responses: [
      {
        id: "resp-2",
        message: "Bien sûr ! Vous pouvez changer d'abonnement à tout moment. Le changement sera effectif immédiatement et vous serez facturé au prorata.",
        isFromSupport: true,
        createdAt: "2024-09-08",
        author: "Marc - Support Piktor"
      }
    ]
  }
];

const categories = [
  { value: "technique", label: "Problème technique" },
  { value: "facturation", label: "Facturation" },
  { value: "compte", label: "Gestion de compte" },
  { value: "fonctionnalite", label: "Demande de fonctionnalité" },
  { value: "autre", label: "Autre" }
];

const priorities = [
  { value: "low", label: "Faible", color: "text-sophisticated-gray-600" },
  { value: "normal", label: "Normal", color: "text-ocean-blue-600" },
  { value: "high", label: "Élevée", color: "text-warning-600" },
  { value: "urgent", label: "Urgent", color: "text-error-600" }
];

export function SupportPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "tickets" | "new">("overview");
  const [tickets, setTickets] = useState<SupportTicket[]>(mockTickets);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>(mockTickets);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());
  
  // New ticket form
  const [newTicket, setNewTicket] = useState({
    subject: "",
    message: "",
    category: "",
    priority: "normal" as "low" | "normal" | "high" | "urgent"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    trackEvent('support_viewed', {
      event_category: 'dashboard',
      event_label: 'support_page_view'
    });
  }, []);

  useEffect(() => {
    let filtered = [...tickets];

    if (searchQuery) {
      filtered = filtered.filter(ticket => 
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    setFilteredTickets(filtered);
  }, [tickets, searchQuery, statusFilter]);

  const handleTabChange = (tab: "overview" | "tickets" | "new") => {
    setActiveTab(tab);
    
    trackEvent('support_tab_changed', {
      event_category: 'support',
      event_label: tab
    });
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTicket.subject || !newTicket.message || !newTicket.category) {
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Submit to API
      await new Promise(resolve => setTimeout(resolve, 1500));

      const ticket: SupportTicket = {
        id: `TICK-${String(tickets.length + 1).padStart(3, '0')}`,
        subject: newTicket.subject,
        message: newTicket.message,
        category: newTicket.category,
        priority: newTicket.priority,
        status: "open",
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        responses: []
      };

      setTickets(prev => [ticket, ...prev]);
      setNewTicket({
        subject: "",
        message: "",
        category: "",
        priority: "normal"
      });
      setActiveTab("tickets");

      trackEvent('support_ticket_submitted', {
        event_category: 'support',
        event_label: 'ticket_created',
        custom_parameters: {
          category: newTicket.category,
          priority: newTicket.priority
        }
      });

    } catch (error) {
      console.error('Error submitting ticket:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTicketExpanded = (ticketId: string) => {
    setExpandedTickets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });

    trackEvent('support_ticket_expanded', {
      event_category: 'support',
      event_label: expandedTickets.has(ticketId) ? 'collapsed' : 'expanded'
    });
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case "open":
        return `${baseClasses} bg-ocean-blue-100 text-ocean-blue-700`;
      case "in_progress":
        return `${baseClasses} bg-warning-100 text-warning-700`;
      case "resolved":
        return `${baseClasses} bg-success-100 text-success-700`;
      case "closed":
        return `${baseClasses} bg-sophisticated-gray-100 text-sophisticated-gray-700`;
      default:
        return `${baseClasses} bg-sophisticated-gray-100 text-sophisticated-gray-700`;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open": return "Ouvert";
      case "in_progress": return "En cours";
      case "resolved": return "Résolu";
      case "closed": return "Fermé";
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <AlertCircle className="w-4 h-4" />;
      case "in_progress": return <Clock className="w-4 h-4" />;
      case "resolved": return <CheckCircle className="w-4 h-4" />;
      case "closed": return <XCircle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    const priorityItem = priorities.find(p => p.value === priority);
    return priorityItem?.color || "text-sophisticated-gray-600";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Contact Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 text-center hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setActiveTab("new")}>
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <MessageCircle className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Créer un ticket</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Décrivez votre problème en détail pour un support personnalisé
          </p>
          <Button className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau ticket
          </Button>
        </Card>

        <Card className="p-6 text-center">
          <div className="w-12 h-12 bg-warm-gold-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Mail className="w-6 h-6 text-warm-gold-600" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Email</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Contactez-nous directement par email
          </p>
          <Button variant="outline" className="w-full">
            support@piktor.fr
          </Button>
        </Card>

        <Card className="p-6 text-center">
          <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Headphones className="w-6 h-6 text-success-600" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Chat en direct</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Assistance instantanée pendant les heures d'ouverture
          </p>
          <Button variant="outline" className="w-full">
            Démarrer un chat
          </Button>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{tickets.length}</p>
          <p className="text-sm text-muted-foreground">Tickets totaux</p>
        </Card>
        
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-warning-600">
            {tickets.filter(t => t.status === 'in_progress').length}
          </p>
          <p className="text-sm text-muted-foreground">En cours</p>
        </Card>
        
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-success-600">
            {tickets.filter(t => t.status === 'resolved').length}
          </p>
          <p className="text-sm text-muted-foreground">Résolus</p>
        </Card>
        
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">2h</p>
          <p className="text-sm text-muted-foreground">Temps de réponse moyen</p>
        </Card>
      </div>

      {/* Support Hours */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Horaires de support
          </h3>
          <div className="flex items-center text-success-600">
            <div className="w-2 h-2 bg-success-600 rounded-full mr-2"></div>
            <span className="text-sm font-medium">En ligne</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-foreground mb-2">Support Chat & Téléphone</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Lundi - Vendredi: 9h00 - 18h00</li>
              <li>Samedi: 10h00 - 16h00</li>
              <li>Dimanche: Fermé</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-foreground mb-2">Support Email & Tickets</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>24h/24, 7j/7</li>
              <li>Réponse sous 2h en moyenne</li>
              <li>Réponse sous 24h garantie</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderTickets = () => (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher dans vos tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="open">Ouverts</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="resolved">Résolus</SelectItem>
              <SelectItem value="closed">Fermés</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.map((ticket) => (
          <Card key={ticket.id} className="overflow-hidden">
            <div 
              className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => toggleTicketExpanded(ticket.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {getStatusIcon(ticket.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-foreground truncate">{ticket.subject}</h3>
                      <span className="text-xs text-muted-foreground">#{ticket.id}</span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{formatDate(ticket.createdAt)}</span>
                      <span className="capitalize">
                        {categories.find(c => c.value === ticket.category)?.label}
                      </span>
                      <span className={getPriorityColor(ticket.priority)}>
                        {priorities.find(p => p.value === ticket.priority)?.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={getStatusBadge(ticket.status)}>
                    {getStatusText(ticket.status)}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${
                    expandedTickets.has(ticket.id) ? 'rotate-180' : ''
                  }`} />
                </div>
              </div>
            </div>

            {expandedTickets.has(ticket.id) && (
              <div className="border-t border-border">
                <div className="p-4 bg-muted/20">
                  <p className="text-sm text-muted-foreground mb-4">
                    {ticket.message}
                  </p>
                  
                  {ticket.responses.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-foreground">Réponses</h4>
                      {ticket.responses.map((response) => (
                        <div key={response.id} className="bg-white p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-primary">
                              {response.author}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(response.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">{response.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {filteredTickets.length === 0 && (
        <Card className="p-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {tickets.length === 0 ? "Aucun ticket" : "Aucun résultat"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {tickets.length === 0 
              ? "Vous n'avez pas encore créé de ticket de support"
              : "Aucun ticket ne correspond à vos critères de recherche"
            }
          </p>
          {tickets.length === 0 && (
            <Button onClick={() => setActiveTab("new")}>
              <Plus className="w-4 h-4 mr-2" />
              Créer votre premier ticket
            </Button>
          )}
        </Card>
      )}
    </div>
  );

  const renderNewTicket = () => (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Créer un nouveau ticket
        </h2>

        <form onSubmit={handleTicketSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label htmlFor="category">Catégorie *</Label>
              <Select 
                value={newTicket.category} 
                onValueChange={(value) => setNewTicket(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="priority">Priorité</Label>
              <Select 
                value={newTicket.priority} 
                onValueChange={(value) => setNewTicket(prev => ({ 
                  ...prev, 
                  priority: value as "low" | "normal" | "high" | "urgent" 
                }))}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      <span className={priority.color}>{priority.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="subject">Sujet *</Label>
            <Input
              id="subject"
              placeholder="Décrivez brièvement votre problème..."
              value={newTicket.subject}
              onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Décrivez votre problème en détail. Plus vous donnerez d'informations, plus nous pourrons vous aider efficacement."
              rows={6}
              value={newTicket.message}
              onChange={(e) => setNewTicket(prev => ({ ...prev, message: e.target.value }))}
              required
            />
            <p className="text-xs text-muted-foreground">
              Incluez des détails comme les messages d'erreur, les étapes que vous avez suivies, etc.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("overview")}
            >
              Annuler
            </Button>
            
            <Button
              type="submit"
              disabled={isSubmitting || !newTicket.subject || !newTicket.message || !newTicket.category}
              className="bg-gradient-ocean-deep hover:opacity-90 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer le ticket
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground flex items-center justify-center">
          <MessageCircle className="w-8 h-8 mr-3" />
          Support client
        </h1>
        <p className="text-muted-foreground mt-1">
          Notre équipe est là pour vous accompagner dans votre utilisation de Piktor
        </p>
      </div>

      {/* Tabs */}
      <Card className="p-1">
        <div className="flex space-x-1">
          <Button
            variant={activeTab === "overview" ? "default" : "ghost"}
            onClick={() => handleTabChange("overview")}
            className="flex-1"
          >
            <Zap className="w-4 h-4 mr-2" />
            Vue d'ensemble
          </Button>
          <Button
            variant={activeTab === "tickets" ? "default" : "ghost"}
            onClick={() => handleTabChange("tickets")}
            className="flex-1"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Mes tickets ({tickets.length})
          </Button>
          <Button
            variant={activeTab === "new" ? "default" : "ghost"}
            onClick={() => handleTabChange("new")}
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau ticket
          </Button>
        </div>
      </Card>

      {/* Tab Content */}
      {activeTab === "overview" && renderOverview()}
      {activeTab === "tickets" && renderTickets()}
      {activeTab === "new" && renderNewTicket()}
    </div>
  );
}