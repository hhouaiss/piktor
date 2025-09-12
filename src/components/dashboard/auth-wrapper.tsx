"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface AuthWrapperProps {
  children: React.ReactNode;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAuthenticated: boolean;
}

// Mock authentication - replace with your actual auth implementation
const mockUser: User = {
  id: "user_123",
  email: "user@example.com",
  firstName: "Jean",
  lastName: "Dupont",
  isAuthenticated: true
};

export function AuthWrapper({ children }: AuthWrapperProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleAuthenticationFailure = useCallback((error: string) => {
    setAuthError(error);
    setUser(null);
    
    trackEvent('dashboard_auth_failed', {
      event_category: 'auth',
      event_label: 'dashboard_access_denied',
      custom_parameters: {
        error_message: error
      }
    });
    
    // Redirect to login page after a delay
    setTimeout(() => {
      router.push('/login?redirect=/dashboard');
    }, 3000);
  }, [router]);

  const checkAuthentication = useCallback(async () => {
    try {
      // TODO: Replace with actual authentication check
      // const response = await fetch('/api/auth/me', {
      //   credentials: 'include',
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      //   }
      // });

      // if (!response.ok) {
      //   throw new Error('Authentication failed');
      // }

      // const userData = await response.json();
      
      // Mock authentication check
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, always authenticate the user
      // In production, check actual auth status
      const isAuthenticated = true; // Replace with actual auth check
      
      if (isAuthenticated) {
        setUser(mockUser);
        
        trackEvent('dashboard_authenticated', {
          event_category: 'auth',
          event_label: 'dashboard_access_granted',
          custom_parameters: {
            user_id: mockUser.id
          }
        });
      } else {
        handleAuthenticationFailure('User not authenticated');
      }
      
    } catch (error) {
      console.error('Authentication error:', error);
      handleAuthenticationFailure(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthenticationFailure]);

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  const handleLoginClick = () => {
    trackEvent('dashboard_login_clicked', {
      event_category: 'auth',
      event_label: 'login_cta'
    });
    
    router.push('/login?redirect=/dashboard');
  };

  const handleSignupClick = () => {
    trackEvent('dashboard_signup_clicked', {
      event_category: 'auth',
      event_label: 'signup_cta'
    });
    
    router.push('/signup?redirect=/dashboard');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Vérification en cours...
          </h2>
          <p className="text-muted-foreground">
            Nous vérifions votre authentification
          </p>
        </Card>
      </div>
    );
  }

  // Authentication error state
  if (authError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-12 text-center max-w-lg">
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-error-500" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Accès non autorisé
          </h2>
          <p className="text-muted-foreground mb-6">
            Vous devez vous connecter pour accéder au tableau de bord Piktor.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleLoginClick} className="bg-gradient-ocean-deep hover:opacity-90 text-white">
              Se connecter
            </Button>
            <Button variant="outline" onClick={handleSignupClick}>
              Créer un compte
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Redirection automatique dans quelques secondes...
          </p>
        </Card>
      </div>
    );
  }

  // User not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-12 text-center max-w-lg">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Bienvenue sur Piktor
          </h2>
          <p className="text-muted-foreground mb-6">
            Connectez-vous pour accéder à votre tableau de bord et créer des visuels IA exceptionnels.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleLoginClick} className="bg-gradient-ocean-deep hover:opacity-90 text-white">
              Se connecter
            </Button>
            <Button variant="outline" onClick={handleSignupClick}>
              Créer un compte
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // User authenticated - render the dashboard
  return <>{children}</>;
}