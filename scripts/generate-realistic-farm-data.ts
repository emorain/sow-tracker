/**
 * Generate realistic farm data with 2 years of Prop 12 compliant history
 *
 * This script creates:
 * - 25 sows with realistic breeding cycles
 * - 5-8 boars
 * - 2 years of location history (all compliant)
 * - Realistic farrowings (2-3 per sow per year)
 * - Piglets from each farrowing
 * - Breeding attempts and AI doses
 * - Housing units (group pens, farrowing crates, etc.)
 *
 * Run with: npx tsx scripts/generate-realistic-farm-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration
const CONFIG = {
  organizationId: '', // Will be set from user input
  userId: '', // Will be set from user input
  sowCount: 25,
  boarCount: 6,
  yearsOfHistory: 2,
  avgFarrowingsPerYear: 2.3, // Realistic for sows
  avgPigletsPerLitter: 11, // Average litter size
  pigletSurvivalRate: 0.92, // 92% survival to weaning
};

// Helper: Random date within range
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper: Add days to date
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Helper: Random number in range
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: Random choice from array
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('🐷 Generating realistic farm data...\n');

  // Prompt for user ID and organization ID
  console.log('Please provide your user ID and organization ID from the browser:');
  console.log('1. Open your browser console on the app');
  console.log('2. Run: localStorage.getItem("sb-pwigcphbkzkwzvjmhgmw-auth-token")');
  console.log('3. Or just provide IDs manually\n');

  // For now, let's get from existing data
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name');

  if (!orgs || orgs.length === 0) {
    console.error('❌ No organizations found.');
    process.exit(1);
  }

  // Find "Eddies Farm" or use first organization
  const eddiesFarm = orgs.find(o => o.name === 'Eddies Farm');
  const targetOrg = eddiesFarm || orgs[0];

  CONFIG.organizationId = targetOrg.id;
  console.log(`📋 Using organization: ${targetOrg.name} (${targetOrg.id})`);

  // Get user from organization members
  const { data: members } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', CONFIG.organizationId)
    .limit(1)
    .single();

  if (!members) {
    console.error('❌ No members found for organization.');
    process.exit(1);
  }

  CONFIG.userId = members.user_id;
  console.log(`👤 User ID: ${CONFIG.userId}\n`);

  // Step 1: Create housing units
  console.log('🏠 Creating housing units...');
  const housingUnits = await createHousingUnits();
  console.log(`✅ Created ${housingUnits.length} housing units\n`);

  // Step 2: Create boars
  console.log('🐗 Creating boars...');
  const boars = await createBoars();
  console.log(`✅ Created ${boars.length} boars\n`);

  // Step 3: Create sows with 2 years of history
  console.log('🐷 Creating sows with 2-year history...');
  const sows = await createSowsWithHistory(housingUnits, boars);
  console.log(`✅ Created ${sows.length} sows with complete history\n`);

  console.log('🎉 Farm data generation complete!');
  console.log('\nSummary:');
  console.log(`- ${housingUnits.length} housing units`);
  console.log(`- ${boars.length} boars`);
  console.log(`- ${sows.length} sows`);
  console.log(`- Estimated ~${Math.floor(sows.length * CONFIG.avgFarrowingsPerYear * CONFIG.yearsOfHistory)} farrowings`);
  console.log(`- Estimated ~${Math.floor(sows.length * CONFIG.avgFarrowingsPerYear * CONFIG.yearsOfHistory * CONFIG.avgPigletsPerLitter * CONFIG.pigletSurvivalRate)} piglets`);
}

async function createHousingUnits() {
  const units = [
    // Gestation pens (Prop 12 compliant - 24+ sq ft per sow)
    { name: 'Gestation Pen A', type: 'gestation', floor_space_sqft: 28 },
    { name: 'Gestation Pen B', type: 'gestation', floor_space_sqft: 28 },
    { name: 'Gestation Pen C', type: 'gestation', floor_space_sqft: 30 },
    { name: 'Gestation Pen D', type: 'gestation', floor_space_sqft: 26 },

    // Farrowing crates
    { name: 'Farrowing Crate 1', type: 'farrowing', floor_space_sqft: 24 },
    { name: 'Farrowing Crate 2', type: 'farrowing', floor_space_sqft: 24 },
    { name: 'Farrowing Crate 3', type: 'farrowing', floor_space_sqft: 24 },
    { name: 'Farrowing Crate 4', type: 'farrowing', floor_space_sqft: 24 },
    { name: 'Farrowing Crate 5', type: 'farrowing', floor_space_sqft: 24 },
    { name: 'Farrowing Crate 6', type: 'farrowing', floor_space_sqft: 24 },

    // Breeding/Gestation pens
    { name: 'Breeding Pen 1', type: 'breeding', floor_space_sqft: 32 },
    { name: 'Breeding Pen 2', type: 'breeding', floor_space_sqft: 32 },

    // Hospital
    { name: 'Hospital Pen', type: 'hospital', floor_space_sqft: 40 },
  ];

  const { data, error } = await supabase
    .from('housing_units')
    .insert(
      units.map(unit => ({
        ...unit,
        organization_id: CONFIG.organizationId,
        user_id: CONFIG.userId,
      }))
    )
    .select();

  if (error) throw error;
  return data;
}

async function createBoars() {
  const boarNames = ['Duke', 'Thor', 'Zeus', 'Maximus', 'Bruno', 'Rocket'];
  const breeds = ['Duroc', 'Hampshire', 'Yorkshire', 'Landrace', 'Berkshire'];

  const boars = boarNames.map((name, idx) => ({
    ear_tag: `B${String(idx + 1).padStart(3, '0')}`,
    name,
    breed: randomChoice(breeds),
    birth_date: new Date(2021, randomInt(0, 11), randomInt(1, 28)).toISOString().split('T')[0],
    status: 'active',
    organization_id: CONFIG.organizationId,
    user_id: CONFIG.userId,
  }));

  const { data, error } = await supabase
    .from('boars')
    .insert(boars)
    .select();

  if (error) throw error;
  return data;
}

async function createSowsWithHistory(housingUnits: any[], boars: any[]) {
  const sowNames = [
    'Bella', 'Daisy', 'Rosie', 'Willow', 'Penny', 'Ruby', 'Ginger', 'Pearl',
    'Hazel', 'Maple', 'Clover', 'Poppy', 'Sage', 'Lily', 'Violet', 'Iris',
    'Magnolia', 'Juniper', 'Flora', 'Fauna', 'Grace', 'Hope', 'Faith', 'Joy', 'Harmony'
  ];
  const breeds = ['Yorkshire', 'Landrace', 'Duroc', 'Hampshire', 'Crossbred'];

  const gestationPens = housingUnits.filter(u => u.type === 'gestation');
  const farrowingCrates = housingUnits.filter(u => u.type === 'farrowing');
  const breedingPens = housingUnits.filter(u => u.type === 'breeding');

  const now = new Date();
  const twoYearsAgo = new Date(now.getFullYear() - CONFIG.yearsOfHistory, now.getMonth(), now.getDate());

  const sows = [];

  for (let i = 0; i < CONFIG.sowCount; i++) {
    console.log(`  Creating sow ${i + 1}/${CONFIG.sowCount}...`);

    // Create sow
    const sow = {
      ear_tag: `S${String(i + 1).padStart(3, '0')}`,
      name: sowNames[i],
      breed: randomChoice(breeds),
      birth_date: new Date(2020, randomInt(0, 11), randomInt(1, 28)).toISOString().split('T')[0],
      status: 'active',
      organization_id: CONFIG.organizationId,
      user_id: CONFIG.userId,
    };

    const { data: sowData, error: sowError } = await supabase
      .from('sows')
      .insert(sow)
      .select()
      .single();

    if (sowError) throw sowError;
    sows.push(sowData);

    // Generate 2 years of breeding cycles and location history
    await generateSowHistory(sowData, gestationPens, farrowingCrates, breedingPens, boars, twoYearsAgo, now);
  }

  return sows;
}

async function generateSowHistory(
  sow: any,
  gestationPens: any[],
  farrowingCrates: any[],
  breedingPens: any[],
  boars: any[],
  startDate: Date,
  endDate: Date
) {
  const locationHistory: any[] = [];
  let currentDate = new Date(startDate);
  let currentLocation = randomChoice(gestationPens);

  // Expected farrowings over 2 years
  const numFarrowings = Math.floor(CONFIG.avgFarrowingsPerYear * CONFIG.yearsOfHistory + (Math.random() - 0.5));

  for (let cycle = 0; cycle < numFarrowings; cycle++) {
    // 1. Start in gestation pen
    const gestationPenEntry = addDays(currentDate, randomInt(0, 7));
    locationHistory.push({
      housing_unit_id: currentLocation.id,
      moved_in_date: gestationPenEntry.toISOString(),
      moved_out_date: null,
      reason: cycle === 0 ? 'Initial placement' : 'Post-weaning recovery',
    });

    // 2. Move to breeding pen for heat detection and breeding (21-28 days after last weaning or start)
    currentDate = addDays(gestationPenEntry, randomInt(21, 35));
    if (currentDate > endDate) break;

    const breedingPen = randomChoice(breedingPens);
    locationHistory[locationHistory.length - 1].moved_out_date = currentDate.toISOString();
    locationHistory.push({
      housing_unit_id: breedingPen.id,
      moved_in_date: currentDate.toISOString(),
      moved_out_date: null,
      reason: 'Heat detection and breeding',
    });

    // Create breeding attempt
    const breedingDate = addDays(currentDate, randomInt(1, 3));
    const selectedBoar = randomChoice(boars);

    const { data: breedingAttempt } = await supabase
      .from('breeding_attempts')
      .insert({
        sow_id: sow.id,
        boar_id: selectedBoar.id,
        breeding_date: breedingDate.toISOString().split('T')[0],
        breeding_time: `${String(randomInt(6, 18)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}`,
        breeding_method: randomChoice(['natural', 'ai']),
        result: 'pregnant',
        pregnancy_confirmed: true,
        pregnancy_check_date: addDays(breedingDate, randomInt(21, 28)).toISOString().split('T')[0],
        organization_id: CONFIG.organizationId,
        user_id: CONFIG.userId,
      })
      .select()
      .single();

    // AI doses if AI breeding (2-3 doses)
    if (breedingAttempt) {
      const numDoses = randomInt(2, 3);
      for (let d = 0; d < numDoses; d++) {
        await supabase.from('ai_semen_doses').insert({
          breeding_attempt_id: breedingAttempt.id,
          boar_id: selectedBoar.id,
          dose_date: addDays(breedingDate, d).toISOString().split('T')[0],
          dose_time: `${String(randomInt(6, 18)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}`,
          organization_id: CONFIG.organizationId,
          user_id: CONFIG.userId,
        });
      }
    }

    // 3. Move back to gestation pen (stay compliant - group housing)
    currentDate = addDays(breedingDate, randomInt(3, 7));
    if (currentDate > endDate) break;

    currentLocation = randomChoice(gestationPens);
    locationHistory[locationHistory.length - 1].moved_out_date = currentDate.toISOString();
    locationHistory.push({
      housing_unit_id: currentLocation.id,
      moved_in_date: currentDate.toISOString(),
      moved_out_date: null,
      reason: 'Gestation - group housing',
    });

    // 4. Move to farrowing crate ~110 days after breeding (gestation = 114 days avg)
    const gestationDays = randomInt(110, 114);
    const farrowingMoveDate = addDays(breedingDate, gestationDays);
    if (farrowingMoveDate > endDate) break;

    const farrowingCrate = randomChoice(farrowingCrates);
    locationHistory[locationHistory.length - 1].moved_out_date = farrowingMoveDate.toISOString();
    locationHistory.push({
      housing_unit_id: farrowingCrate.id,
      moved_in_date: farrowingMoveDate.toISOString(),
      moved_out_date: null,
      reason: 'Pre-farrowing preparation',
    });

    // 5. Farrowing occurs (actual birth)
    const farrowingDate = addDays(farrowingMoveDate, randomInt(1, 7));
    if (farrowingDate > endDate) break;

    const totalBorn = randomInt(8, 14);
    const bornAlive = Math.floor(totalBorn * 0.95);
    const stillborn = totalBorn - bornAlive;
    const survived = Math.floor(bornAlive * CONFIG.pigletSurvivalRate);

    const { data: farrowing } = await supabase
      .from('farrowings')
      .insert({
        sow_id: sow.id,
        breeding_attempt_id: breedingAttempt?.id,
        expected_farrowing_date: addDays(breedingDate, 114).toISOString().split('T')[0],
        actual_farrowing_date: farrowingDate.toISOString().split('T')[0],
        total_born: totalBorn,
        born_alive: bornAlive,
        stillborn: stillborn,
        mummified: 0,
        organization_id: CONFIG.organizationId,
        user_id: CONFIG.userId,
      })
      .select()
      .single();

    // Create piglets
    if (farrowing) {
      const piglets = [];
      for (let p = 0; p < bornAlive; p++) {
        const isDead = p >= survived;
        const deathDate = isDead ? addDays(farrowingDate, randomInt(1, 14)) : null;

        piglets.push({
          farrowing_id: farrowing.id,
          sow_id: sow.id,
          birth_date: farrowingDate.toISOString().split('T')[0],
          sex: randomChoice(['male', 'female']),
          birth_weight: randomInt(28, 42) / 10, // 2.8 to 4.2 lbs
          status: isDead ? 'dead' : (addDays(farrowingDate, 21) < endDate ? 'weaned' : 'nursing'),
          weaning_date: !isDead && addDays(farrowingDate, 21) < endDate
            ? addDays(farrowingDate, randomInt(19, 24)).toISOString().split('T')[0]
            : null,
          death_date: deathDate ? deathDate.toISOString().split('T')[0] : null,
          organization_id: CONFIG.organizationId,
          user_id: CONFIG.userId,
        });
      }

      if (piglets.length > 0) {
        await supabase.from('piglets').insert(piglets);
      }
    }

    // 6. Stay in farrowing for lactation (21-28 days)
    // Note: Farrowing crate use is allowed under Prop 12 during farrowing and lactation
    const weaningDate = addDays(farrowingDate, randomInt(21, 28));
    if (weaningDate > endDate) {
      // Still nursing - mark as current location
      currentDate = endDate;
      continue;
    }

    // 7. Move back to gestation pen after weaning (compliant)
    locationHistory[locationHistory.length - 1].moved_out_date = weaningDate.toISOString();
    currentLocation = randomChoice(gestationPens);
    currentDate = weaningDate;
  }

  // Insert all location history
  const historyWithSowId = locationHistory.map(entry => ({
    ...entry,
    sow_id: sow.id,
    organization_id: CONFIG.organizationId,
    user_id: CONFIG.userId,
  }));

  if (historyWithSowId.length > 0) {
    await supabase.from('location_history').insert(historyWithSowId);
  }

  // Update sow's current housing to last location
  if (locationHistory.length > 0) {
    const lastLocation = locationHistory[locationHistory.length - 1];
    await supabase
      .from('sows')
      .update({ housing_unit_id: lastLocation.housing_unit_id })
      .eq('id', sow.id);
  }
}

main().catch(console.error);
