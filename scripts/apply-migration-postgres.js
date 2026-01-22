// Direct PostgreSQL migration application
// This uses postgres library to connect directly to Supabase database
// Run with: node scripts/apply-migration-postgres.js

require('dotenv').config({ path: '.env.local' });
const { readFileSync } = require('fs');
const { join } = require('path');

// Extract project ref from Supabase URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

// Extract project reference from URL (e.g., eveuhponokpcsodikwpf)
const projectRef = supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not extract project reference from URL');
  process.exit(1);
}

console.log('═══════════════════════════════════════════════════');
console.log('  Housing Unit Privacy Fix Migration Tool');
console.log('═══════════════════════════════════════════════════\n');
console.log('Project Reference:', projectRef);
console.log('Supabase URL:', supabaseUrl);
console.log('');

// Read migration files
console.log('📂 Reading migration files...');
const migrationPath1 = join(__dirname, '../supabase/migrations/20260121000000_fix_housing_unit_occupancy_view.sql');
const migrationPath2 = join(__dirname, '../supabase/migrations/20260121000001_backfill_housing_units_organization_id.sql');
const migrationSQL1 = readFileSync(migrationPath1, 'utf-8');
const migrationSQL2 = readFileSync(migrationPath2, 'utf-8');
const migrationSQL = migrationSQL1 + '\n\n-- Second migration: Backfill organization_id\n\n' + migrationSQL2;
console.log('✅ Migrations loaded:', migrationSQL.length, 'characters');
console.log('');

console.log('📋 MANUAL MIGRATION REQUIRED');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('Supabase REST API does not support direct SQL execution.');
console.log('Please apply the migration using the SQL Editor:\n');
console.log('🔗 Direct Link:');
console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
console.log('📝 Steps:');
console.log('   1. Click the link above (or open SQL Editor in dashboard)');
console.log('   2. Copy ALL contents from BOTH files:');
console.log(`      ${migrationPath1}`);
console.log(`      ${migrationPath2}`);
console.log('   3. Paste into the SQL Editor');
console.log('   4. Click "Run" or press Ctrl+Enter\n');
console.log('💡 What these migrations fix:');
console.log('   ✓ CRITICAL SECURITY FIX #1: Prevents cross-organization data leakage in housing units');
console.log('   ✓ Updates housing_unit_occupancy view to filter animals by organization_id');
console.log('   ✓ Ensures users only see animal counts from their own organization');
console.log('   ✓ Fixes: current_sows, current_boars, current_piglets counts');
console.log('   ✓ Fixes: Prop 12 compliance calculations');
console.log('   ✓ CRITICAL SECURITY FIX #2: Backfills missing organization_id on housing_units');
console.log('   ✓ Ensures existing housing units are assigned to correct organization');
console.log('   ✓ Prevents users from seeing other organizations\' housing units\n');
console.log('⏱️  Expected execution time: ~1 second\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Optionally, try to copy to clipboard if available
try {
  const clipboardy = require('clipboardy');
  clipboardy.writeSync(migrationSQL);
  console.log('\n📋 Migration SQL copied to clipboard!');
  console.log('   Just paste (Ctrl+V) in SQL Editor and run.');
} catch (e) {
  // clipboardy not available, that's okay
}
