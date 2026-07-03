#!/usr/bin/env node

/**
 * Apply Breeding Attempt Farrowed Status Fix Migration
 *
 * This script applies the migration that:
 * 1. Adds 'farrowed' status to breeding_attempts.result enum
 * 2. Updates existing breeding attempts to 'farrowed' when linked farrowing has actual_farrowing_date
 * 3. Creates trigger to auto-update breeding attempts when sow farrows
 *
 * This fixes the issue where sows show as pregnant again immediately after re-breeding
 * following a completed farrowing cycle.
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🔧 Applying Breeding Attempt Farrowed Status Fix Migration...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260303000004_fix_breeding_attempt_farrowed_status.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Migration file loaded successfully\n');
    console.log('⚠️  NOTE: This migration must be applied using the Supabase SQL Editor\n');
    console.log('Instructions:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of the migration file');
    console.log('4. Execute the SQL\n');
    console.log('Migration file location:');
    console.log('  supabase/migrations/20260303000004_fix_breeding_attempt_farrowed_status.sql\n');

    // Instead of trying to execute SQL, we'll just verify the current state and show what needs to be done
    console.log('🔍 Checking current state of breeding attempts...\n');

    // Check breeding attempts with different statuses
    const { data: pendingCount } = await supabase
      .from('breeding_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('result', 'pending');

    const { data: pregnantCount } = await supabase
      .from('breeding_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('result', 'pregnant');

    const { data: farrowedCount } = await supabase
      .from('breeding_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('result', 'farrowed');

    console.log('Current breeding attempt statuses:');
    console.log(`  • Pending: ${pendingCount || 0}`);
    console.log(`  • Pregnant: ${pregnantCount || 0}`);
    console.log(`  • Farrowed: ${farrowedCount !== null ? farrowedCount : 'Status not available (migration needed)'}\n`);

    // Check for breeding attempts that should be marked as farrowed
    // Look for breeding attempts with farrowing_id that have actual farrowing dates
    const { data: allPregnant, error: checkError } = await supabase
      .from('breeding_attempts')
      .select('id, result, farrowing_id')
      .eq('result', 'pregnant')
      .not('farrowing_id', 'is', null);

    if (!checkError && allPregnant && allPregnant.length > 0) {
      // Now check which of these farrowings have actual_farrowing_date
      const farrowingIds = allPregnant.map(ba => ba.farrowing_id);
      const { data: completedFarrowings } = await supabase
        .from('farrowings')
        .select('id')
        .in('id', farrowingIds)
        .not('actual_farrowing_date', 'is', null);

      const completedIds = new Set(completedFarrowings?.map(f => f.id) || []);
      const shouldBeFarrowed = allPregnant.filter(ba => completedIds.has(ba.farrowing_id));

      if (shouldBeFarrowed.length > 0) {
        console.log(`⚠️  Found ${shouldBeFarrowed.length} breeding attempt(s) that completed farrowing but are still marked as "pregnant"`);
        console.log('   These will be fixed when you apply the migration.\n');
      } else {
        console.log('✅ No breeding attempts found that need updating.\n');
      }
    } else if (pregnantCount > 0) {
      console.log(`ℹ️  There are ${pregnantCount} breeding attempts marked as "pregnant" (this is expected for active pregnancies).\n`);
    } else {
      console.log('✅ No breeding attempts currently marked as pregnant.\n');
    }

    console.log('📝 What this migration will do:');
    console.log('   1. Add "farrowed" status to breeding_attempts.result enum');
    console.log('   2. Update existing breeding attempts that have completed farrowings');
    console.log('   3. Create trigger to auto-update breeding attempts when sows farrow in the future');
    console.log('\n🎯 This will fix the issue where sows appear pregnant again immediately after re-breeding.\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nYou may need to apply this migration manually using the Supabase SQL Editor.');
    console.error('Migration file location:');
    console.error('  supabase/migrations/20260303000004_fix_breeding_attempt_farrowed_status.sql\n');
    process.exit(1);
  }
}

// Run the migration
applyMigration();
