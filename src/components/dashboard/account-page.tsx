"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Loader2,
  Sparkles,
  Zap,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useSimpleAuth } from "@/components/auth/simple-auth-provider";
import { getActivePlans, calculateYearlySavings, type Plan, type BillingInterval } from "@/lib/pricing/plans";
import { formatPriceFromEuros, calculateSavingsPercentage, formatDate } from "@/lib/pricing/utils";
import { useSubscription } from "@/hooks/useSubscription";

interface UserProfile {
  displayName: string;
  email: string;
  company?: string;
  phone?: string;
}

interface Subscription {
  plan: "free" | "starter" | "pro" | "enterprise";
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


const mockBillingHistory: BillingHistory[] = [];

export function AccountPage() {
  const { user, loading: authLoading, updateProfile } = useSimpleAuth();
  const { subscription: userSubscription, loading: subscriptionLoading, refreshSubscription, remainingGenerations } = useSubscription();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('month');
  const [editedProfile, setEditedProfile] = useState<UserProfile>({
    displayName: '',
    email: '',
    company: '',
    phone: ''
  });

  // Get active plans for MVP stage
  const activePlans = getActivePlans(true); // true = MVP stage

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

  // Use real subscription data from database
  const subscription: Subscription = userSubscription ? {
    plan: userSubscription.planId as "free" | "starter" | "pro" | "enterprise",
    status: userSubscription.status === 'active' || userSubscription.status === 'trialing' ? "active" :
            userSubscription.status === 'canceled' ? "canceled" : "expired",
    currentPeriodEnd: new Date(userSubscription.currentPeriodEnd).toISOString().split('T')[0],
    creditsTotal: userSubscription.generationsLimit,
    creditsUsed: userSubscription.generationsUsed,
    billingCycle: userSubscription.billingInterval === 'month' ? "monthly" : "yearly",
    nextBillingAmount: userSubscription.amount / 100 // Convert cents to euros
  } : {
    plan: "free",
    status: "active",
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    creditsTotal: 25,
    creditsUsed: 0,
    billingCycle: "monthly",
    nextBillingAmount: 0
  };

  const [billingHistory] = useState<BillingHistory[]>(mockBillingHistory);

  // Get current plan details
  const currentPlan = activePlans.find(p => p.id === subscription.plan || p.id === userSubscription?.planId) || activePlans[0];

  useEffect(() => {
    trackEvent('account_viewed', {
      event_category: 'dashboard',
      event_label: 'account_page_view'
    });

    // Check if user just completed payment
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment') === 'success') {
        // Refresh subscription data after successful payment
        refreshSubscription();
        // Clean up URL
        window.history.replaceState({}, '', '/dashboard/account');
      }
    }
  }, [refreshSubscription]);

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

  const handlePlanChange = async (plan: Plan) => {
    trackEvent('plan_change_clicked', {
      event_category: 'subscription',
      event_label: plan.id,
      custom_parameters: {
        current_plan: subscription.plan,
        target_plan: plan.id,
        billing_interval: billingInterval
      }
    });

    // Initiate Stripe checkout
    setIsSaving(true);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: Include cookies for auth
        body: JSON.stringify({
          planId: plan.id,
          billingInterval: billingInterval,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      // Track checkout initiation
      trackEvent('checkout_initiated', {
        event_category: 'billing',
        event_label: plan.id,
        custom_parameters: {
          plan: plan.id,
          interval: billingInterval
        }
      });

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue lors de la création de la session de paiement.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        credentials: 'include', // Important: Include cookies for auth
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create portal session');
      }

      const { url } = await response.json();

      // Redirect to Stripe Customer Portal
      window.location.href = url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue lors de l\'accès au portail de gestion.'
      );
    } finally {
      setIsSaving(false);
    }
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Abonnement actuel
          </h2>
          {subscription.plan === 'free' && (
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              <Sparkles className="w-3 h-3 mr-1" />
              Phase Beta
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Plan */}
          <div className="lg:col-span-2">
            <div className="border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Crown className="w-6 h-6 text-primary mr-2" />
                  <h3 className="text-lg font-semibold text-foreground">
                    {currentPlan.name}
                  </h3>
                </div>
                <span className={getStatusBadge(subscription.status)}>
                  {getStatusText(subscription.status)}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {currentPlan.description}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Générations mensuelles</p>
                  <p className="text-2xl font-bold text-foreground">
                    {currentPlan.limits.generations === -1 ? 'Illimité' : currentPlan.limits.generations}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prix mensuel</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatPriceFromEuros(currentPlan.price.monthly)}
                  </p>
                </div>
              </div>

              {/* Credits Usage */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Générations utilisées ce mois</span>
                  <span className="font-medium">
                    {subscription.creditsUsed} / {subscription.creditsTotal}
                  </span>
                </div>
                <div className="w-full bg-sophisticated-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-gradient-ocean-deep h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (subscription.creditsUsed / subscription.creditsTotal) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {subscription.creditsTotal - subscription.creditsUsed} générations restantes
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 text-sm text-muted-foreground mb-4">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Renouvellement le {formatDate(subscription.currentPeriodEnd)}
                </span>
                {subscription.nextBillingAmount > 0 && (
                  <span className="flex items-center">
                    <CreditCard className="w-4 h-4 mr-1" />
                    Prochain paiement: {formatPriceFromEuros(subscription.nextBillingAmount)}
                  </span>
                )}
              </div>

              {/* Manage Subscription Button for paid users */}
              {subscription.plan !== 'free' && subscription.nextBillingAmount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageSubscription}
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Gérer mon abonnement
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* MVP Beta Notice */}
            {subscription.plan === 'free' && (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Vous êtes un beta tester !
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Merci de tester Piktor pendant la phase beta. Vos retours sont précieux !
                      Passez au plan Early Adopter pour obtenir le tarif fondateur à vie (50% de réduction).
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Plan Features */}
          <div>
            <h4 className="font-medium text-foreground mb-3">Fonctionnalités incluses</h4>
            <ul className="space-y-2.5">
              {currentPlan.features.map((feature, index) => (
                <li key={index} className="flex items-start text-sm">
                  {feature.included ? (
                    <Check className="w-4 h-4 text-success-600 mr-2 flex-shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={feature.included ? 'text-foreground' : 'text-muted-foreground line-through'}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Upgrade Section - MVP Stage */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-foreground">Passer à un plan supérieur</h4>

            {/* Billing Toggle */}
            <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
              <button
                onClick={() => setBillingInterval('month')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  billingInterval === 'month'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBillingInterval('year')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  billingInterval === 'year'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Annuel
                <span className="ml-1 text-xs text-success-600">-17%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activePlans.map((plan) => {
              const isCurrentPlan = plan.id === subscription.plan;
              const price = billingInterval === 'month' ? plan.price.monthly : plan.price.yearly;
              const effectiveMonthlyPrice = billingInterval === 'year' ? Math.round(plan.price.yearly / 12) : plan.price.monthly;
              const savingsPercent = billingInterval === 'year' ? calculateSavingsPercentage(plan.price.monthly, plan.price.yearly) : 0;

              return (
                <Card
                  key={plan.id}
                  className={`relative overflow-hidden ${
                    plan.highlighted
                      ? 'border-primary shadow-lg scale-105'
                      : isCurrentPlan
                      ? 'border-primary/50 bg-primary/5'
                      : ''
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute top-0 right-0 bg-gradient-ocean-deep text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      {plan.badge}
                    </div>
                  )}

                  <div className="p-6">
                    <div className="mb-4">
                      <h5 className="text-lg font-bold text-foreground mb-1">{plan.name}</h5>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-foreground">
                          {formatPriceFromEuros(price)}
                        </span>
                        {billingInterval === 'year' && (
                          <span className="text-muted-foreground text-sm">/an</span>
                        )}
                        {billingInterval === 'month' && (
                          <span className="text-muted-foreground text-sm">/mois</span>
                        )}
                      </div>
                      {billingInterval === 'year' && (
                        <p className="text-xs text-success-600 mt-1">
                          Soit {formatPriceFromEuros(effectiveMonthlyPrice)}/mois • Économisez {savingsPercent}%
                        </p>
                      )}
                      {plan.savings && (
                        <p className="text-xs text-warm-gold-600 dark:text-warm-gold-400 font-semibold mt-1">
                          {plan.savings}
                        </p>
                      )}
                    </div>

                    <div className="mb-6 space-y-2">
                      {plan.features.slice(0, 4).map((feature, idx) => (
                        <div key={idx} className="flex items-center text-sm">
                          <Check className="w-4 h-4 text-success-600 mr-2 flex-shrink-0" />
                          <span className="text-muted-foreground">{feature.text}</span>
                        </div>
                      ))}
                    </div>

                    {isCurrentPlan ? (
                      <Button variant="outline" disabled className="w-full">
                        <Check className="w-4 h-4 mr-2" />
                        Plan actuel
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handlePlanChange(plan)}
                        className={`w-full ${
                          plan.highlighted
                            ? 'bg-gradient-ocean-deep hover:opacity-90'
                            : ''
                        }`}
                        variant={plan.highlighted ? 'default' : 'outline'}
                      >
                        {plan.ctaText}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Enterprise CTA */}
          <div className="mt-6 bg-gradient-to-r from-sophisticated-gray-50 to-ocean-blue-50/30 dark:from-sophisticated-gray-800 dark:to-ocean-blue-900/20 rounded-lg p-6 border border-border">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-6 h-6 text-ocean-blue-600 flex-shrink-0" />
                <div>
                  <h5 className="font-semibold text-foreground mb-1">
                    Besoin d&apos;un plan sur mesure ?
                  </h5>
                  <p className="text-sm text-muted-foreground">
                    Générations illimitées, environnements personnalisés, support dédié et plus encore.
                  </p>
                </div>
              </div>
              <Button variant="outline" asChild className="whitespace-nowrap">
                <a href="https://calendar.notion.so/meet/hassanhouaiss/piktor" target="_blank" rel="noopener noreferrer">
                  Nous contacter
                </a>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Billing History */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Historique de facturation
        </h2>

        {subscription.plan === 'free' || subscription.nextBillingAmount === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Aucune facture disponible
            </h3>
            <p className="text-muted-foreground">
              Vos factures apparaîtront ici après votre premier paiement
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {billingHistory.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Aucune facture disponible
                </h3>
                <p className="text-muted-foreground">
                  Vos factures seront disponibles ici prochainement
                </p>
              </div>
            ) : (
              billingHistory.map((bill) => (
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
              ))
            )}
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
              Action irréversible : cette opération supprimera définitivement votre compte et toutes vos données.
            </p>
            <Button
              variant="outline"
              className="border-error-200 text-error-700 hover:bg-error-50"
              onClick={async () => {
                if (window.confirm('Êtes-vous absolument sûr de vouloir supprimer votre compte ? Cette action est irréversible et supprimera toutes vos données, visuels et abonnements.')) {
                  try {
                    setIsSaving(true);
                    const response = await fetch('/api/auth/delete-account', {
                      method: 'DELETE',
                      credentials: 'include'
                    });

                    if (!response.ok) {
                      const error = await response.json();
                      throw new Error(error.error || 'Échec de la suppression du compte');
                    }

                    // Redirect to home page after successful deletion
                    window.location.href = '/';
                  } catch (error) {
                    console.error('Error deleting account:', error);
                    alert(error instanceof Error ? error.message : 'Une erreur est survenue lors de la suppression du compte.');
                  } finally {
                    setIsSaving(false);
                  }
                }
              }}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer le compte'
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}