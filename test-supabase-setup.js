// Simple Node.js test to validate Supabase setup
// Run with: node test-supabase-setup.js

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function testSetup() {
  console.log('Testing Supabase setup...');
  console.log('='.repeat(50));

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Environment variables:');
  console.log('SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  console.log('SUPABASE_SERVICE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
  console.log();

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing required environment variables');
    return;
  }

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase client created successfully');

    // Test basic connection
    const { data, error } = await supabase.from('users').select('count');

    if (error) {
      if (error.code === 'PGRST204' || error.message.includes('relation "users" does not exist')) {
        console.log('⚠️  Users table does not exist yet - this is expected before running the migration');
        console.log('   Run the SQL migration file to create the database schema');
      } else {
        console.error('❌ Database connection error:', error.message);
        return;
      }
    } else {
      console.log('✅ Database connection successful');
    }

    console.log();
    console.log('Setup validation completed!');
    console.log('='.repeat(50));
    console.log('Next steps:');
    console.log('1. Apply the SQL migration: supabase_migration.sql');
    console.log('2. Run the TypeScript test: import and use the Supabase service');
    console.log('3. Begin migrating your application code');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSetup();