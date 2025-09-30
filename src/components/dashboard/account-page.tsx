"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Crown,
  CreditCard,
  Calendar,
  Download,
  FileText,
  Check,
  AlertTriangle,
  Edit,
  Save,
  X,
  Loader2
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useSimpleAuth } from "@/components/auth/simple-auth-provider";

interface UserProfile {
  displayName: string;
  email: string;
  company?: string;
  phone?: string;
}

interface Subscription {
  plan: "starter" | "pro" | "enterprise";
  status: "active" | "canceled" | "expired";
  currentPeriodEnd: string;
  creditsTotal: number;
  creditsUsed: number;
  billingCycle: "monthly" | "yearly";
  nextBillingAmount: number;
}

interface BillingHistory {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  invoice: string;
}


const mockBillingHistory: BillingHistory[] = [
  {
    id: "inv_001",
    date: "2024-09-15",
    amount: 49,
    status: "paid",
    invoice: "piktor_invoice_001.pdf"
  },
  {
    id: "inv_002", 
    date: "2024-08-15",
    amount: 49,
    status: "paid",
    invoice: "piktor_invoice_002.pdf"
  },
  {
    id: "inv_003",
    date: "2024-07-15", 
    amount: 49,
    status: "paid",
    invoice: "piktor_invoice_003.pdf"
  }
];

const planFeatures = {
  starter: {
    name: "Starter",
    credits: 50,
    price: 19,
    features: ["50 crédits/mois", "Tous les styles", "Formats standard", "Support email"]
  },
  pro: {
    name: "Pro",
    credits: 200,
    price: 49,
    features: ["200 crédits/mois", "Tous les styles", "Tous les formats", "Support prioritaire", "API access"]
  },
  enterprise: {
    name: "Enterprise",
    credits: 1000,
    price: 199,
    features: ["1000 crédits/mois", "Styles personnalisés", "Tous les formats", "Support dédié", "API access", "Formation équipe"]
  }
};

export function AccountPage() {
  const { user, loading: authLoading, updateProfile } = useSimpleAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>({
    displayName: '',
    email: '',
    company: '',
    phone: ''
  });

  // Initialize profile data from Supabase user
  useEffect(() => {
    if (user) {
      const profile: UserProfile = {
        displayName: user.display_name || '',
        email: user.email || '',
        company: '',
        phone: ''
      };
      setEditedProfile(profile);
    }
  }, [user]);

  // Mock subscription data for now (until billing is implemented)
  const subscription: Subscription = {
    plan: "pro",
    status: "active",
    currentPeriodEnd: "2024-10-15",
    creditsTotal: user?.usage?.creditsTotal || 50,
    creditsUsed: user?.usage?.creditsUsed || 0,
    billingCycle: "monthly",
    nextBillingAmount: 49
  };

  const [billingHistory] = useState<BillingHistory[]>(mockBillingHistory);

  useEffect(() => {
    trackEvent('account_viewed', {
      event_category: 'dashboard',
      event_label: 'account_page_view'
    });
  }, []);

  const handleProfileEdit = () => {
    setIsEditingProfile(true);

    trackEvent('profile_edit_started', {
      event_category: 'account',
      event_label: 'edit_profile'
    });
  };

  const handleProfileSave = async () => {
    if (!user) return;

    setIsSaving(true);

    try {
      await updateProfile({
        display_name: editedProfile.displayName
      });

      setIsEditingProfile(false);

      trackEvent('profile_saved', {
        event_category: 'account',
        event_label: 'profile_update'
      });

    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileCancel = () => {
    if (user) {
      setEditedProfile({
        displayName: user.display_name || '',
        email: user.email || '',
        company: '',
        phone: ''
      });
    }
    setIsEditingProfile(false);
  };

  const handlePlanChange = (newPlan: "starter" | "pro" | "enterprise") => {
    trackEvent('plan_change_clicked', {
      event_category: 'subscription',
      event_label: newPlan,
      custom_parameters: {
        current_plan: subscription.plan,
        target_plan: newPlan
      }
    });
    
    // TODO: Implement plan change logic
    console.log('Changing plan to:', newPlan);
  };

  const handleDownloadInvoice = (invoice: BillingHistory) => {
    trackEvent('invoice_downloaded', {
      event_category: 'billing',
      event_label: 'download_invoice',
      custom_parameters: {
        invoice_id: invoice.id
      }
    });
    
    // TODO: Download invoice
    console.log('Downloading invoice:', invoice.invoice);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case "active":
        return `${baseClasses} bg-success-100 text-success-700`;
      case "paid":
        return `${baseClasses} bg-success-100 text-success-700`;
      case "pending":
        return `${baseClasses} bg-warning-100 text-warning-700`;
      case "failed":
      case "canceled":
      case "expired":
        return `${baseClasses} bg-error-100 text-error-700`;
      default:
        return `${baseClasses} bg-sophisticated-gray-100 text-sophisticated-gray-700`;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "Actif";
      case "paid": return "Payé";
      case "pending": return "En attente";
      case "failed": return "Échec";
      case "canceled": return "Annulé";
      case "expired": return "Expiré";
      default: return status;
    }
  };


  // Loading state
  if (authLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement de votre compte...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <User className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Vous devez être connecté pour accéder à votre compte.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <User className="w-8 h-8 mr-3" />
            Mon compte
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre profil, abonnement et facturation
          </p>
        </div>
      </div>

      {/* Profile Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Informations personnelles
          </h2>
          {!isEditingProfile ? (
            <Button variant="outline" onClick={handleProfileEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleProfileCancel}>
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button onClick={handleProfileSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="displayName">Nom d'affichage</Label>
            <Input
              id="displayName"
              value={isEditingProfile ? editedProfile.displayName : (user?.display_name || '')}
              onChange={(e) => isEditingProfile && setEditedProfile(prev => ({ ...prev, displayName: e.target.value }))}
              disabled={!isEditingProfile}
              placeholder="Votre nom complet"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled={true}
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              L'adresse email ne peut pas être modifiée
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="company">Entreprise (optionnel)</Label>
            <Input
              id="company"
              value={isEditingProfile ? editedProfile.company : ''}
              onChange={(e) => isEditingProfile && setEditedProfile(prev => ({ ...prev, company: e.target.value }))}
              disabled={!isEditingProfile}
              placeholder="Nom de votre entreprise"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="phone">Téléphone (optionnel)</Label>
            <Input
              id="phone"
              value={isEditingProfile ? editedProfile.phone : ''}
              onChange={(e) => isEditingProfile && setEditedProfile(prev => ({ ...prev, phone: e.target.value }))}
              disabled={!isEditingProfile}
              placeholder="+33 1 23 45 67 89"
            />
          </div>

          <div className="md:col-span-2 mt-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Informations de compte</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID utilisateur :</span>
                  <span className="font-mono text-xs">{user?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Membre depuis :</span>
                  <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'Non disponible'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dernière connexion :</span>
                  <span>{user?.updated_at ? new Date(user.updated_at).toLocaleDateString('fr-FR') : 'Non disponible'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Subscription Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Abonnement actuel
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Plan */}
          <div className="lg:col-span-2">
            <div className="border border-primary/20 bg-primary/5 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Crown className="w-6 h-6 text-primary mr-2" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Plan {planFeatures[subscription.plan].name}
                  </h3>
                </div>
                <span className={getStatusBadge(subscription.status)}>
                  {getStatusText(subscription.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Crédits mensuels</p>
                  <p className="text-2xl font-bold text-foreground">
                    {planFeatures[subscription.plan].credits}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prix mensuel</p>
                  <p className="text-2xl font-bold text-foreground">
                    {planFeatures[subscription.plan].price}€
                  </p>
                </div>
              </div>

              {/* Credits Usage */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Crédits utilisés ce mois</span>
                  <span className="font-medium">
                    {subscription.creditsUsed} / {subscription.creditsTotal}
                  </span>
                </div>
                <div className="w-full bg-sophisticated-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(subscription.creditsUsed / subscription.creditsTotal) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Renouvellement le {formatDate(subscription.currentPeriodEnd)}
                </span>
                <span className="flex items-center">
                  <CreditCard className="w-4 h-4 mr-1" />
                  Prochain paiement: {subscription.nextBillingAmount}€
                </span>
              </div>
            </div>
          </div>

          {/* Plan Features */}
          <div>
            <h4 className="font-medium text-foreground mb-3">Fonctionnalités incluses</h4>
            <ul className="space-y-2">
              {planFeatures[subscription.plan].features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-success-600 mr-2 flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Plan Change Options */}
        <div className="mt-8 pt-6 border-t border-border">
          <h4 className="font-medium text-foreground mb-4">Changer d&apos;abonnement</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(planFeatures).map(([planKey, plan]) => (
              <Card key={planKey} className={`p-4 ${planKey === subscription.plan ? 'border-primary bg-primary/5' : ''}`}>
                <div className="text-center">
                  <h5 className="font-semibold text-foreground">{plan.name}</h5>
                  <p className="text-2xl font-bold text-primary my-2">{plan.price}€<span className="text-sm font-normal">/mois</span></p>
                  <p className="text-sm text-muted-foreground mb-4">{plan.credits} crédits/mois</p>
                  
                  {planKey === subscription.plan ? (
                    <Button variant="outline" disabled className="w-full">
                      Plan actuel
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handlePlanChange(planKey as "starter" | "pro" | "enterprise")}
                    >
                      {parseInt(planKey) > parseInt(subscription.plan) ? 'Upgrade' : 'Downgrade'}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>

      {/* Billing History */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Historique de facturation
        </h2>

        <div className="space-y-4">
          {billingHistory.map((bill) => (
            <div key={bill.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Facture #{bill.id}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(bill.date)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <span className={getStatusBadge(bill.status)}>
                  {getStatusText(bill.status)}
                </span>
                <span className="font-semibold text-foreground">{bill.amount}€</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDownloadInvoice(bill)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {billingHistory.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Aucune facture
            </h3>
            <p className="text-muted-foreground">
              Vos factures apparaîtront ici après votre premier paiement
            </p>
          </div>
        )}
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-error-200">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-error-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">Zone de danger</h3>
            <p className="text-muted-foreground mb-4">
              Actions irréversibles concernant votre compte.
            </p>
            <div className="space-y-3">
              <Button variant="outline" className="border-error-200 text-error-700 hover:bg-error-50">
                Annuler l&apos;abonnement
              </Button>
              <Button variant="outline" className="border-error-200 text-error-700 hover:bg-error-50">
                Supprimer le compte
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}