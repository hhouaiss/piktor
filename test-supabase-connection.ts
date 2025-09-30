import { supabase, supabaseAdmin } from './src/lib/supabase/config'

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase Connection...\n')

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...')
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (testError && !testError.message.includes('relation "users" does not exist')) {
      console.error('❌ Connection failed:', testError.message)
      return false
    }
    console.log('✅ Connection successful')

    // Test 2: Check if tables exist
    console.log('\n2️⃣ Checking if tables exist...')
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')

    if (tablesError) {
      console.error('❌ Failed to check tables:', tablesError.message)
      return false
    }

    const tableNames = tables?.map((t: any) => t.table_name) || []
    const requiredTables = ['users', 'projects', 'visuals']
    const missingTables = requiredTables.filter(table => !tableNames.includes(table))

    if (missingTables.length > 0) {
      console.log('⚠️ Missing tables:', missingTables)
      console.log('📝 Please run the SQL migration script in your Supabase dashboard:')
      console.log('   - Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql')
      console.log('   - Copy and paste the contents of supabase_migration.sql')
      console.log('   - Click "Run"')
      return false
    } else {
      console.log('✅ All required tables exist:', requiredTables)
    }

    // Test 3: Test environment variables
    console.log('\n3️⃣ Testing environment variables...')
    const requiredEnvs = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ]

    const missingEnvs = requiredEnvs.filter(env => !process.env[env])
    if (missingEnvs.length > 0) {
      console.log('❌ Missing environment variables:', missingEnvs)
      return false
    }
    console.log('✅ All environment variables configured')

    console.log('\n🎉 Supabase setup is ready!')
    console.log('📋 Summary:')
    console.log('   - Database connection: ✅')
    console.log('   - Tables created: ✅')
    console.log('   - Environment variables: ✅')
    console.log('   - Ready for Phase 2 migration: ✅')

    return true

  } catch (error) {
    console.error('❌ Test failed:', error)
    return false
  }
}

// Run if called directly
if (require.main === module) {
  testSupabaseConnection().then(success => {
    process.exit(success ? 0 : 1)
  })
}

export { testSupabaseConnection }