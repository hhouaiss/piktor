import { Metadata } from 'next';
import { Suspense } from 'react';
import { SignInForm } from '@/components/auth/signin-form';

export const metadata: Metadata = {
  title: 'Connexion | Piktor',
  description: 'Connectez-vous à votre compte Piktor pour créer des visuels IA professionnels.'
};

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <SignInForm />
    </Suspense>
  );
}