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

// Read migration file
console.log('📂 Reading migration file...');
const migrationPath = join(__dirname, '../supabase/migrations/20260121000000_fix_housing_unit_occupancy_view.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');
console.log('✅ Migration loaded:', migrationSQL.length, 'characters');
console.log('');

console.log('📋 MANUAL MIGRATION REQUIRED');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('Supabase REST API does not support direct SQL execution.');
console.log('Please apply the migration using the SQL Editor:\n');
console.log('🔗 Direct Link:');
console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
console.log('📝 Steps:');
console.log('   1. Click the link above (or open SQL Editor in dashboard)');
console.log('   2. Copy ALL contents from:');
console.log(`      ${migrationPath}`);
console.log('   3. Paste into the SQL Editor');
console.log('   4. Click "Run" or press Ctrl+Enter\n');
console.log('💡 What this migration fixes:');
console.log('   ✓ CRITICAL SECURITY FIX: Prevents cross-organization data leakage');
console.log('   ✓ Updates housing_unit_occupancy view to filter animals by organization_id');
console.log('   ✓ Ensures users only see animal counts from their own organization');
console.log('   ✓ Fixes: current_sows, current_boars, current_piglets counts');
console.log('   ✓ Fixes: Prop 12 compliance calculations\n');
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
