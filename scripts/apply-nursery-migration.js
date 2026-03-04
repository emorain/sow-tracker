// Apply nursery housing type migration
// Run with: node scripts/apply-nursery-migration.js

require('dotenv').config({ path: '.env.local' });
const { readFileSync } = require('fs');
const { join } = require('path');

// Extract project ref from Supabase URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable!');
  process.exit(1);
}

// Extract project reference from URL
const projectRef = supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not extract project reference from URL');
  process.exit(1);
}

console.log('═══════════════════════════════════════════════════');
console.log('  Add Nursery Housing Type Migration Tool');
console.log('═══════════════════════════════════════════════════\n');
console.log('Project Reference:', projectRef);
console.log('');

// Read migration file
console.log('📂 Reading migration file...');
const migrationPath = join(__dirname, '../supabase/migrations/20260303000000_add_nursery_housing_type.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');
console.log('✅ Migration loaded:', migrationSQL.length, 'characters');
console.log('');

console.log('📋 MANUAL MIGRATION REQUIRED');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('Please apply the migration using the SQL Editor:\n');
console.log('🔗 Direct Link:');
console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
console.log('📝 Steps:');
console.log('   1. Click the link above (or open SQL Editor in dashboard)');
console.log('   2. Copy the migration SQL below');
console.log('   3. Paste into the SQL Editor');
console.log('   4. Click "Run" or press Ctrl+Enter\n');
console.log('💡 What this migration does:');
console.log('   ✓ Adds "nursery" as a valid housing type');
console.log('   ✓ Updates the CHECK constraint on housing_units table\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('SQL to run:\n');
console.log(migrationSQL);
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Try to copy to clipboard if available
try {
  const clipboardy = require('clipboardy');
  clipboardy.writeSync(migrationSQL);
  console.log('\n📋 Migration SQL copied to clipboard!');
  console.log('   Just paste (Ctrl+V) in SQL Editor and run.');
} catch (e) {
  // clipboardy not available, that's okay
}
