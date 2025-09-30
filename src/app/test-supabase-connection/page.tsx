'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/config';

export default function TestSupabasePage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    async function testConnection() {
      try {
        console.log('[Test] Testing Supabase connection...');
        console.log('[Test] Supabase client:', {
          hasClient: !!supabase,
          supabaseKeys: Object.keys(supabase || {})
        });

        // Test 1: Check if client is initialized
        if (!supabase) {
          throw new Error('Supabase client is not initialized');
        }

        // Test 2: Try a simple query
        const { data, error } = await supabase
          .from('users')
          .select('count')
          .limit(1);

        console.log('[Test] Query result:', { data, error });

        if (error) {
          throw error;
        }

        setStatus('success');
        setMessage('✅ Supabase connection successful!');
        setDetails({
          clientInitialized: true,
          querySuccessful: true,
          data
        });
      } catch (error: any) {
        console.error('[Test] Connection test failed:', error);
        setStatus('error');
        setMessage(`❌ Supabase connection failed: ${error.message}`);
        setDetails({
          error: error.message,
          hint: error.hint,
          details: error.details,
          code: error.code
        });
      }
    }

    testConnection();
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Supabase Connection Test</h1>

        <div className={`p-6 rounded-lg ${
          status === 'loading' ? 'bg-blue-50' :
          status === 'success' ? 'bg-green-50' :
          'bg-red-50'
        }`}>
          <div className="mb-4">
            <strong>Status:</strong> {status}
          </div>
          <div className="mb-4">
            <strong>Message:</strong> {message}
          </div>
          {details && (
            <div>
              <strong>Details:</strong>
              <pre className="mt-2 p-4 bg-white rounded overflow-auto">
                {JSON.stringify(details, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-white rounded-lg">
          <h2 className="font-semibold mb-2">Environment Variables Check:</h2>
          <ul className="space-y-1 text-sm font-mono">
            <li>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}