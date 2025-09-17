import { Metadata } from 'next';
import { SignUpForm } from '@/components/auth/signup-form';

export const metadata: Metadata = {
  title: 'Créer un compte | Piktor',
  description: 'Rejoignez Piktor et commencez à créer des visuels produits IA professionnels en quelques minutes.'
};

export default function SignUpPage() {
  return <SignUpForm />;
}