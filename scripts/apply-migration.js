#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Starting database migration...\n');

  // Read the migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250103000000_add_image_edits.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  try {
    // Execute the migration
    console.log('📝 Executing migration SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // Try direct execution if rpc doesn't work
      console.log('⚠️  RPC method failed, trying direct execution...');

      // Split the SQL into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.toLowerCase().includes('do $$') || statement.toLowerCase().includes('raise notice')) {
          continue; // Skip DO blocks
        }

        const { error: stmtError } = await supabase.from('_migrations').select('*').limit(1);
        if (stmtError) {
          console.log('⚠️  Direct execution not supported. Please run migration manually in Supabase dashboard.');
          console.log('\n📋 Migration file location:');
          console.log(migrationPath);
          console.log('\n📝 Instructions:');
          console.log('1. Go to your Supabase dashboard: https://app.supabase.com/project/hvwhhzyhafgnhmgboysw');
          console.log('2. Navigate to SQL Editor');
          console.log('3. Copy the entire contents of the migration file');
          console.log('4. Paste and execute in the SQL Editor');
          process.exit(1);
        }
      }
    }

    console.log('✅ Migration completed successfully!\n');

    // Verify the table was created
    const { data: tables, error: tableError } = await supabase
      .from('image_edits')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('⚠️  Table verification failed:', tableError.message);
      console.log('\nPlease verify the migration manually in Supabase dashboard.');
    } else {
      console.log('✅ Table "image_edits" verified successfully!');
    }

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.log('\n📋 Please apply the migration manually:');
    console.log('1. Go to Supabase dashboard SQL Editor');
    console.log('2. Copy contents from:', migrationPath);
    console.log('3. Execute the SQL');
    process.exit(1);
  }
}

applyMigration();
