"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';

export default function FirebaseTestPage() {
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user, firebaseUser, loading: authLoading, error: authError } = useAuth();

  useEffect(() => {
    const testFirebaseConfig = async () => {
      try {
        // Test 1: Check environment variables in browser
        const envVars = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
        };

        console.log('Browser environment variables:', envVars);

        // Test 2: Try to import Firebase config
        const { getFirebaseAuth } = await import('@/lib/firebase/config');
        const auth = getFirebaseAuth();

        setConfigStatus({
          success: true,
          envVarsPresent: Object.entries(envVars).map(([key, value]) => ({
            key,
            present: !!value,
            value: value ? `${String(value).slice(0, 10)}...` : 'NOT_SET'
          })),
          firebaseAuthInitialized: !!auth
        });

      } catch (error) {
        console.error('Firebase config test failed:', error);
        setConfigStatus({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      } finally {
        setLoading(false);
      }
    };

    testFirebaseConfig();
  }, []);

  useEffect(() => {
    setAuthStatus({
      user: !!user,
      firebaseUser: !!firebaseUser,
      authLoading,
      authError,
      userId: user?.id || firebaseUser?.uid,
      userEmail: user?.email || firebaseUser?.email
    });
  }, [user, firebaseUser, authLoading, authError]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Testing Firebase configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold mb-8">Firebase Configuration Test</h1>

        {/* Configuration Status */}
        <div className="bg-card rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            Firebase Configuration
            <span className={`ml-2 px-2 py-1 rounded text-sm ${
              configStatus?.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {configStatus?.success ? 'SUCCESS' : 'FAILED'}
            </span>
          </h2>

          {configStatus?.success ? (
            <div className="space-y-3">
              <p className="text-green-600">✅ Firebase configuration loaded successfully</p>
              <p className="text-green-600">✅ Firebase Auth initialized: {configStatus.firebaseAuthInitialized ? 'Yes' : 'No'}</p>

              <div className="mt-4">
                <h3 className="font-medium mb-2">Environment Variables:</h3>
                <div className="space-y-1 text-sm">
                  {configStatus.envVarsPresent.map((env: any) => (
                    <div key={env.key} className="flex justify-between">
                      <span className={env.present ? 'text-green-600' : 'text-red-600'}>
                        {env.key}: {env.present ? '✅' : '❌'}
                      </span>
                      <span className="text-muted-foreground">{env.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-red-600">
              <p>❌ Firebase configuration failed</p>
              <p className="text-sm mt-2 font-mono bg-red-50 p-2 rounded">
                {configStatus?.error}
              </p>
            </div>
          )}
        </div>

        {/* Auth Status */}
        <div className="bg-card rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            Authentication Status
            <span className={`ml-2 px-2 py-1 rounded text-sm ${
              authStatus?.user ? 'bg-green-100 text-green-800' :
              authStatus?.authError ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {authStatus?.user ? 'AUTHENTICATED' :
               authStatus?.authError ? 'ERROR' :
               authStatus?.authLoading ? 'LOADING' : 'NOT_AUTHENTICATED'}
            </span>
          </h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>User object:</span>
              <span className={authStatus?.user ? 'text-green-600' : 'text-red-600'}>
                {authStatus?.user ? '✅' : '❌'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Firebase user:</span>
              <span className={authStatus?.firebaseUser ? 'text-green-600' : 'text-red-600'}>
                {authStatus?.firebaseUser ? '✅' : '❌'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Auth loading:</span>
              <span>{authStatus?.authLoading ? 'Yes' : 'No'}</span>
            </div>
            {authStatus?.userId && (
              <div className="flex justify-between">
                <span>User ID:</span>
                <span className="font-mono text-xs">{authStatus.userId}</span>
              </div>
            )}
            {authStatus?.userEmail && (
              <div className="flex justify-between">
                <span>Email:</span>
                <span>{authStatus.userEmail}</span>
              </div>
            )}
            {authStatus?.authError && (
              <div className="mt-4 p-3 bg-red-50 rounded border border-red-200">
                <p className="text-red-800 font-medium">Auth Error:</p>
                <p className="text-red-600 text-sm font-mono">{authStatus.authError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-muted/50 rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
          <div className="space-y-2 text-sm">
            <p>1. Check the console for detailed Firebase initialization logs</p>
            <p>2. If configuration is successful, try navigating to <a href="/auth/signin" className="text-primary hover:underline">/auth/signin</a></p>
            <p>3. If authentication works, try accessing <a href="/dashboard" className="text-primary hover:underline">/dashboard</a></p>
            <p>4. Open browser DevTools to see any client-side errors</p>
          </div>
        </div>
      </div>
    </div>
  );
}