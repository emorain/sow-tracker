#!/usr/bin/env node

/**
 * Apply Migration Via Supabase JS Client
 * Executes migration SQL statements using the Supabase JavaScript client
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

    // Step 1: Drop the existing constraint
    console.log('📋 Step 1: Updating result constraint to include "farrowed" status...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE breeding_attempts DROP CONSTRAINT IF EXISTS breeding_attempts_result_check;`
    });

    if (dropError && !dropError.message.includes('does not exist')) {
      console.error('   ⚠️  Issue with dropping constraint:', dropError.message);
    } else {
      console.log('   ✅ Constraint preparation complete\n');
    }

    // Step 2: Add new constraint with 'farrowed'
    console.log('📋 Step 2: Adding new constraint with "farrowed" status...');
    const { error: constraintError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE breeding_attempts ADD CONSTRAINT breeding_attempts_result_check CHECK (result IN ('pending', 'pregnant', 'returned_to_heat', 'aborted', 'farrowed', 'unknown'));`
    });

    if (constraintError) {
      console.error('   ❌ Error adding constraint:', constraintError.message);
      throw constraintError;
    }
    console.log('   ✅ New constraint added\n');

    // Step 3: Update existing breeding attempts
    console.log('📋 Step 3: Updating existing breeding attempts that have farrowed...');
    const { data: updateData, error: updateError } = await supabase
      .rpc('exec_sql', {
        sql: `UPDATE breeding_attempts ba SET result = 'farrowed' FROM farrowings f WHERE ba.farrowing_id = f.id AND f.actual_farrowing_date IS NOT NULL AND ba.result = 'pregnant';`
      });

    if (updateError) {
      console.error('   ⚠️  Issue updating breeding attempts:', updateError.message);
    } else {
      console.log('   ✅ Existing breeding attempts updated\n');
    }

    // Step 4: Create trigger function
    console.log('📋 Step 4: Creating trigger function...');
    const triggerFunction = `
CREATE OR REPLACE FUNCTION update_breeding_attempt_on_farrowing()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual_farrowing_date IS NOT NULL AND (OLD.actual_farrowing_date IS NULL OR OLD.actual_farrowing_date IS DISTINCT FROM NEW.actual_farrowing_date) THEN
    UPDATE breeding_attempts
    SET result = 'farrowed'
    WHERE id = NEW.breeding_attempt_id
      AND result = 'pregnant';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
    `;

    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: triggerFunction
    });

    if (functionError) {
      console.error('   ⚠️  Issue creating function:', functionError.message);
    } else {
      console.log('   ✅ Trigger function created\n');
    }

    // Step 5: Create trigger
    console.log('📋 Step 5: Creating trigger...');
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `DROP TRIGGER IF EXISTS trigger_update_breeding_attempt_on_farrowing ON farrowings; CREATE TRIGGER trigger_update_breeding_attempt_on_farrowing AFTER UPDATE ON farrowings FOR EACH ROW EXECUTE FUNCTION update_breeding_attempt_on_farrowing();`
    });

    if (triggerError) {
      console.error('   ⚠️  Issue creating trigger:', triggerError.message);
    } else {
      console.log('   ✅ Trigger created\n');
    }

    console.log('✅ Migration completed successfully!\n');
    console.log('📋 Changes applied:');
    console.log('   ✓ Added "farrowed" status to breeding_attempts.result enum');
    console.log('   ✓ Updated existing breeding attempts that have completed farrowings');
    console.log('   ✓ Created trigger to auto-update breeding attempts when sows farrow\n');
    console.log('🔧 The issue should now be fixed!');
    console.log('   When a sow is re-bred after farrowing, the old breeding attempt');
    console.log('   will be marked as "farrowed" instead of "pregnant", preventing');
    console.log('   the sow from showing as pregnant again immediately.\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);

    if (error.message && error.message.includes('function exec_sql does not exist')) {
      console.error('\n📝 The exec_sql function does not exist in your Supabase project.');
      console.error('Please apply this migration manually using the Supabase SQL Editor:');
      console.error('\n1. Go to https://supabase.com/dashboard/project/eveuhponokpcsodikwpf');
      console.error('2. Navigate to SQL Editor');
      console.error('3. Copy and paste the migration SQL from:');
      console.error('   supabase/migrations/20260303000004_fix_breeding_attempt_farrowed_status.sql');
      console.error('4. Execute the SQL\n');
    }

    process.exit(1);
  }
}

// Run the migration
applyMigration();
