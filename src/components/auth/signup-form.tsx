"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useSimpleAuth } from './simple-auth-provider';
import { Eye, EyeOff, Loader2, Mail, Lock, User, Chrome, Check } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

interface SignUpFormData {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function SignUpForm() {
  const [formData, setFormData] = useState<SignUpFormData>({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signUp } = useSimpleAuth();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = 
    formData.displayName.trim() && 
    formData.email.trim() && 
    formData.password.length >= 6 && 
    formData.password === formData.confirmPassword &&
    acceptTerms;

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !isFormValid) return;

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signUp(formData.email, formData.password, formData.displayName);
      
      trackEvent('user_signup', {
        event_category: 'auth',
        event_label: 'email_signup',
        custom_parameters: {
          method: 'email'
        }
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message);
      trackEvent('signup_error', {
        event_category: 'auth',
        event_label: 'email_signup_error',
        custom_parameters: {
          error_code: error.code || 'unknown'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      // TODO: Implement Google sign-in later
      throw new Error('Google sign-in temporarily disabled');
      
      trackEvent('user_signup', {
        event_category: 'auth',
        event_label: 'google_signup',
        custom_parameters: {
          method: 'google'
        }
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message);
      trackEvent('signup_error', {
        event_category: 'auth',
        event_label: 'google_signup_error',
        custom_parameters: {
          error_code: error.code || 'unknown'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Créer un compte</h1>
          <p className="text-muted-foreground">
            Rejoignez Piktor pour créer des visuels IA professionnels
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mb-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleEmailSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Nom complet</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="displayName"
                name="displayName"
                type="text"
                value={formData.displayName}
                onChange={handleInputChange}
                placeholder="Votre nom complet"
                className="pl-10"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Adresse email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="votre@email.com"
                className="pl-10"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Au moins 6 caractères"
                className="pl-10 pr-10"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirmer votre mot de passe"
                className="pl-10 pr-10"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <button
              type="button"
              onClick={() => setAcceptTerms(!acceptTerms)}
              className="flex-shrink-0 mt-1"
              disabled={loading}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                acceptTerms 
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : 'border-muted-foreground'
              }`}>
                {acceptTerms && <Check className="h-3 w-3" />}
              </div>
            </button>
            <div className="text-sm text-muted-foreground leading-5">
              J'accepte les{' '}
              <Link href="/legal" className="text-primary hover:underline">
                conditions d'utilisation
              </Link>
              {' '}et la{' '}
              <Link href="/legal" className="text-primary hover:underline">
                politique de confidentialité
              </Link>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Création du compte...
              </>
            ) : (
              'Créer mon compte'
            )}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Ou continuer avec
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignUp}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Chrome className="w-4 h-4 mr-2" />
          )}
          Google
        </Button>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Vous avez déjà un compte ?{' '}
            <Link href="/auth/signin" className="text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}