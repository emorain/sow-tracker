#!/usr/bin/env node

/**
 * Direct Migration Runner for Supabase
 * Applies SQL migrations directly to the database
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

async function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL('/rest/v1/rpc/exec_sql', SUPABASE_URL);

    const postData = JSON.stringify({ query: sql });

    const options = {
      hostname: url.hostname,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function applyMigration() {
  try {
    console.log('🔧 Applying Breeding Attempt Farrowed Status Fix Migration...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260303000004_fix_breeding_attempt_farrowed_status.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Executing migration SQL...\n');

    // Execute the entire migration as one transaction
    try {
      await executeSql(migrationSQL);
      console.log('✅ Migration executed successfully!\n');
    } catch (error) {
      // If the exec_sql function doesn't exist, we need to tell the user to use SQL Editor
      if (error.message.includes('not found') || error.message.includes('404')) {
        console.log('⚠️  Direct SQL execution not available via REST API.\n');
        console.log('📝 Please apply this migration using one of these methods:\n');
        console.log('1. Supabase Dashboard SQL Editor:');
        console.log('   - Go to https://supabase.com/dashboard/project/eveuhponokpcsodikwpf');
        console.log('   - Navigate to SQL Editor');
        console.log('   - Copy and paste the migration SQL');
        console.log('   - Execute\n');
        console.log('2. Supabase CLI:');
        console.log('   - Run: npx supabase db push\n');
        console.log('Migration file location:');
        console.log('  supabase/migrations/20260303000004_fix_breeding_attempt_farrowed_status.sql\n');
        return;
      }
      throw error;
    }

    console.log('🎉 Migration completed successfully!\n');
    console.log('📋 Changes applied:');
    console.log('   ✓ Added "farrowed" status to breeding_attempts.result enum');
    console.log('   ✓ Updated existing breeding attempts that have completed farrowings');
    console.log('   ✓ Created trigger to auto-update breeding attempts when sows farrow\n');
    console.log('🔧 The issue should now be fixed!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n📝 Please apply this migration manually using the Supabase SQL Editor:');
    console.error('1. Go to https://supabase.com/dashboard/project/eveuhponokpcsodikwpf');
    console.error('2. Navigate to SQL Editor');
    console.error('3. Copy and paste the migration SQL from:');
    console.error('   supabase/migrations/20260303000004_fix_breeding_attempt_farrowed_status.sql');
    console.error('4. Execute the SQL\n');
    process.exit(1);
  }
}

// Run the migration
applyMigration();
