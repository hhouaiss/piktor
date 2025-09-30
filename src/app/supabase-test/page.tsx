"use client";

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase/config';

export default function SupabaseTestPage() {
  const [status, setStatus] = useState<string>('Testing connection...');
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    async function testConnection() {
      try {
        // Test 1: Basic connection
        setStatus('🔄 Testing basic connection...');

        // Test 2: Auth client
        setStatus('🔄 Testing auth client...');
        const { data: session, error: sessionError } = await supabaseClient.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
        }

        // Test 3: Database query (simple table check)
        setStatus('🔄 Testing database connection...');
        const { data: tables, error: dbError } = await supabaseClient
          .from('users')
          .select('count')
          .limit(0);

        if (dbError) {
          console.error('Database error:', dbError);
        }

        // Test 4: RPC function call
        setStatus('🔄 Testing functions...');
        const { data: validation, error: rpcError } = await supabaseClient
          .rpc('validate_user_registration', {
            user_email: 'test@example.com',
            user_password: 'TestPassword123',
            user_display_name: 'Test User'
          } as any);

        const results = {
          session: {
            success: !sessionError,
            error: sessionError?.message,
            data: session ? 'Session object exists' : 'No session'
          },
          database: {
            success: !dbError,
            error: dbError?.message,
            data: tables ? 'Query executed' : 'No data'
          },
          functions: {
            success: !rpcError,
            error: rpcError?.message,
            data: validation
          }
        };

        setDetails(results);

        if (!sessionError && !dbError && !rpcError) {
          setStatus('✅ All tests passed! Supabase is working correctly.');
        } else {
          setStatus('⚠️ Some tests failed. Check details below.');
        }

      } catch (error: any) {
        console.error('Connection test failed:', error);
        setStatus(`❌ Connection failed: ${error.message}`);
        setDetails({ error: error.message, stack: error.stack });
      }
    }

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-center mb-8">
            Supabase Connection Test
          </h1>

          {/* Status */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-lg text-blue-800">{status}</p>
          </div>

          {/* Environment Variables */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
            <div className="grid gap-2">
              <div className="flex justify-between">
                <span>NEXT_PUBLIC_SUPABASE_URL:</span>
                <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}>
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
                <span className={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}>
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>NEXT_PUBLIC_USE_SUPABASE:</span>
                <span className={process.env.NEXT_PUBLIC_USE_SUPABASE === 'true' ? 'text-green-600' : 'text-orange-600'}>
                  {process.env.NEXT_PUBLIC_USE_SUPABASE === 'true' ? '✅ Enabled' : '⚠️ Disabled'}
                </span>
              </div>
            </div>
          </div>

          {/* Test Results */}
          {details && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Test Results</h2>
              <div className="space-y-4">
                {/* Session Test */}
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium flex items-center gap-2">
                    {details.session?.success ? '✅' : '❌'} Auth Session
                  </h3>
                  <p className="text-sm text-gray-600">{details.session?.data}</p>
                  {details.session?.error && (
                    <p className="text-sm text-red-600">Error: {details.session.error}</p>
                  )}
                </div>

                {/* Database Test */}
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium flex items-center gap-2">
                    {details.database?.success ? '✅' : '❌'} Database Query
                  </h3>
                  <p className="text-sm text-gray-600">{details.database?.data}</p>
                  {details.database?.error && (
                    <p className="text-sm text-red-600">Error: {details.database.error}</p>
                  )}
                </div>

                {/* Functions Test */}
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium flex items-center gap-2">
                    {details.functions?.success ? '✅' : '❌'} RPC Functions
                  </h3>
                  {details.functions?.data && (
                    <p className="text-sm text-gray-600">
                      Validation result: {JSON.stringify(details.functions.data)}
                    </p>
                  )}
                  {details.functions?.error && (
                    <p className="text-sm text-red-600">Error: {details.functions.error}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Raw Details */}
          {details && (
            <details className="mt-8">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                Raw Test Results
              </summary>
              <pre className="mt-2 p-4 bg-gray-100 rounded-md text-xs overflow-auto">
                {JSON.stringify(details, null, 2)}
              </pre>
            </details>
          )}

          <div className="mt-8 text-center">
            <a
              href="/auth-test"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Auth Test Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}