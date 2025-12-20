// Script to apply financial tracking migration to Supabase
// Run with: node scripts/apply-financial-migration.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');
const { join } = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('🔄 Reading migration file...');
    const migrationPath = join(__dirname, '../supabase/migrations/20251220000000_financial_tracking.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📊 Migration file loaded:', migrationSQL.length, 'characters\n');

    console.log('🚀 Applying migration to Supabase...');
    console.log('Project:', supabaseUrl);
    console.log('');

    // Execute the entire SQL file
    // Note: Supabase REST API doesn't support direct SQL execution
    // We need to use the Postgres connection or Management API

    // Try using the raw SQL execution (this works with service role key)
    const { data, error } = await supabase.rpc('exec', { sql: migrationSQL });

    if (error) {
      // If rpc fails, we need to guide user to use SQL Editor
      console.error('⚠️  Cannot execute SQL directly via REST API');
      console.error('Error:', error.message);
      console.log('\n📋 Please apply the migration manually:');
      console.log('1. Go to: https://supabase.com/dashboard/project/eveuhponokpcsodikwpf/sql');
      console.log('2. Copy the contents of: supabase/migrations/20251220000000_financial_tracking.sql');
      console.log('3. Paste into SQL Editor');
      console.log('4. Click "Run"');
      console.log('\n💡 The migration will create:');
      console.log('   - feed_records table');
      console.log('   - income_records table');
      console.log('   - expense_records table');
      console.log('   - budgets table');
      console.log('   - cost_allocations table');
      console.log('   - RLS policies for all tables');
      console.log('   - Financial analytics functions');
      return;
    }

    console.log('✅ Migration applied successfully!');
    console.log('Data:', data);

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    console.log('\n📋 Manual migration steps:');
    console.log('1. Go to Supabase Dashboard SQL Editor');
    console.log('2. Run the migration file: supabase/migrations/20251220000000_financial_tracking.sql');
    process.exit(1);
  }
}

console.log('═══════════════════════════════════════════════════');
console.log('  Financial Tracking Migration Application Tool');
console.log('═══════════════════════════════════════════════════\n');

applyMigration();
