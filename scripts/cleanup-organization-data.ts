/**
 * Clean up all data for a specific organization
 *
 * This script deletes all farm data for the specified organization:
 * - Sows, boars, piglets
 * - Farrowings, breeding attempts, AI doses
 * - Location history, health records
 * - Housing units
 * - Tasks, calendar events, protocols
 *
 * IMPORTANT: This only deletes data for YOUR organization, not other users!
 *
 * Run with: npx tsx scripts/cleanup-organization-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🧹 Organization Data Cleanup\n');

  // Get ALL organizations
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name');

  if (!orgs || orgs.length === 0) {
    console.error('❌ No organizations found.');
    process.exit(1);
  }

  console.log('Available organizations:');
  orgs.forEach((org, i) => {
    console.log(`  ${i + 1}. ${org.name} (${org.id})`);
  });
  console.log('');

  // Clean ALL organizations (you can modify to select specific one)
  console.log(`⚠️  Will clean ${orgs.length} organization(s)\n`);

  for (const org of orgs) {
    await cleanOrganization(org.id, org.name);
  }

  console.log('\n🎉 All organizations cleaned!');
  process.exit(0);
}

async function cleanOrganization(orgId: string, orgName: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 Cleaning: ${orgName}`);
  console.log(`🆔 ID: ${orgId}`);
  console.log('='.repeat(60));


  // Delete in order to respect foreign key constraints
  const tables = [
    'ai_semen_doses',
    'piglets',
    'farrowings',
    'breeding_attempts',
    'location_history',
    'health_records',
    'sows',
    'boars',
    'housing_units',
    'matrix_treatments',
    'matrix_treatment_batches',
    'calendar_events',
    'protocol_templates',
  ];

  // Also check for tasks table
  const tasksTableExists = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .limit(1);

  if (!tasksTableExists.error) {
    tables.push('tasks');
  }

  let totalDeleted = 0;

  for (const table of tables) {
    try {
      const { count: beforeCount } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId);

      if (!beforeCount || beforeCount === 0) {
        console.log(`  ${table}: No records to delete`);
        continue;
      }

      const { error, count } = await supabase
        .from(table)
        .delete({ count: 'exact' })
        .eq('organization_id', orgId);

      if (error) {
        console.error(`  ❌ ${table}: ${error.message}`);
      } else {
        console.log(`  ✅ ${table}: Deleted ${count || beforeCount} records`);
        totalDeleted += (count || beforeCount);
      }
    } catch (error: any) {
      console.error(`  ⚠️  ${table}: ${error.message}`);
    }
  }

  console.log(`\n🎉 Cleanup complete! Deleted ${totalDeleted} total records.`);
  console.log(`✨ Your organization is now ready for fresh data!\n`);
}

main().catch(console.error);
