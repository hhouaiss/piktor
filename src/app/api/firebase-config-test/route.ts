import { NextResponse } from 'next/server';

/**
 * Simple Firebase Configuration Test
 * This endpoint tests if Firebase environment variables are properly loaded
 */
export async function GET() {
  try {
    // Test environment variable access
    const envVars = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    };

    // Check if all required vars are present
    const requiredVars = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const missingVars = requiredVars.filter(key => !envVars[key as keyof typeof envVars]);

    // Test Firebase config creation
    let configTest = null;
    try {
      // Dynamic import to test if Firebase config loads properly
      const { getFirebaseConfig } = await import('@/lib/firebase/config');
      configTest = 'Firebase config imported successfully';
    } catch (error) {
      configTest = `Firebase config import failed: ${error}`;
    }

    return NextResponse.json({
      success: missingVars.length === 0,
      environment: process.env.NODE_ENV,
      envVarsLoaded: {
        apiKey: !!envVars.apiKey,
        authDomain: !!envVars.authDomain,
        projectId: !!envVars.projectId,
        storageBucket: !!envVars.storageBucket,
        messagingSenderId: !!envVars.messagingSenderId,
        appId: !!envVars.appId,
        measurementId: !!envVars.measurementId
      },
      missingVars,
      configTest,
      values: {
        apiKey: envVars.apiKey ? `${envVars.apiKey.slice(0, 10)}...` : 'NOT_SET',
        authDomain: envVars.authDomain || 'NOT_SET',
        projectId: envVars.projectId || 'NOT_SET',
        storageBucket: envVars.storageBucket || 'NOT_SET',
        messagingSenderId: envVars.messagingSenderId || 'NOT_SET',
        appId: envVars.appId ? `${envVars.appId.slice(0, 20)}...` : 'NOT_SET'
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to test Firebase configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}