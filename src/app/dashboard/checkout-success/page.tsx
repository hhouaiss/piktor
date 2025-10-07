"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function CheckoutSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Wait a moment for webhook to process, then redirect
    const timer = setTimeout(() => {
      router.push('/dashboard/account?payment=success');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-sophisticated-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-success-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-sophisticated-gray-900 mb-4">
          Paiement réussi !
        </h1>

        <p className="text-sophisticated-gray-600 mb-6">
          Votre abonnement a été activé avec succès. Vous allez être redirigé vers votre compte...
        </p>

        <div className="flex justify-center">
          <Loader2 className="w-6 h-6 text-sophisticated-gray-400 animate-spin" />
        </div>
      </Card>
    </div>
  );
}
