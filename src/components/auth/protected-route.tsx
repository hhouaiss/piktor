"use client";

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useSimpleAuth } from './simple-auth-provider';
import { Loader2, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requirePro?: boolean;
  fallbackPath?: string;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requirePro = false,
  fallbackPath = '/auth/signin',
  loadingComponent,
  errorComponent
}: ProtectedRouteProps) {
  const { user, loading, error } = useSimpleAuth();
  const router = useRouter();

  // Show loading state
  if (loading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Erreur d'authentification</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href={fallbackPath}>
                Se connecter
              </Link>
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
              Réessayer
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Connexion requise</h2>
          <p className="text-muted-foreground mb-6">
            Vous devez être connecté pour accéder à cette page.
          </p>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`${fallbackPath}?redirect=${encodeURIComponent(window.location.pathname)}`}>
                Se connecter
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/auth/signup">
                Créer un compte
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Check Pro subscription requirement
  if (requirePro && user && user.subscription?.plan !== 'pro' && user.subscription?.plan !== 'business') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <Shield className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Abonnement Pro requis</h2>
          <p className="text-muted-foreground mb-6">
            Cette fonctionnalité est réservée aux abonnés Pro. Découvrez nos plans pour débloquer toutes les fonctionnalités.
          </p>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/pricing">
                Voir les plans
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard">
                Retour au tableau de bord
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // User is authenticated and authorized
  return <>{children}</>;
}

// Higher-order component version
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Hook for programmatic auth checks
export function useAuthGuard() {
  const { user, loading } = useSimpleAuth();
  const router = useRouter();

  const requireAuth = (redirectPath = '/auth/signin') => {
    if (!loading && !user) {
      router.push(`${redirectPath}?redirect=${encodeURIComponent(window.location.pathname)}`);
      return false;
    }
    return !!user;
  };

  const requirePro = (redirectPath = '/pricing') => {
    if (!user) return false;
    
    const isPro = user.subscription?.plan === 'pro' || user.subscription?.plan === 'business';
    if (!isPro) {
      router.push(redirectPath);
      return false;
    }
    return true;
  };

  return {
    user,
    loading,
    requireAuth,
    requirePro,
    isAuthenticated: !!user,
    isPro: user?.subscription?.plan === 'pro' || user?.subscription?.plan === 'business'
  };
}