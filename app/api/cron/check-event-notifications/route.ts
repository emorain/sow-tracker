import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] Checking for upcoming events that need notifications...');

    const results = {
      farrowingAlerts: 0,
      weaningReminders: 0,
      breedingReminders: 0,
      pregnancyCheckReminders: 0,
      errors: [] as string[],
    };

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const twentyOneDaysFromNow = new Date(now);
    twentyOneDaysFromNow.setDate(twentyOneDaysFromNow.getDate() + 21);

    // 1. FARROWING ALERTS (3 days before expected farrowing date)
    const { data: upcomingFarrowings, error: farrowingError } = await supabase
      .from('breeding_attempts')
      .select(`
        id,
        sow_id,
        expected_farrowing_date,
        user_id,
        organization_id,
        sows!inner(ear_tag, name)
      `)
      .eq('status', 'confirmed_pregnant')
      .gte('expected_farrowing_date', now.toISOString().split('T')[0])
      .lte('expected_farrowing_date', threeDaysFromNow.toISOString().split('T')[0]);

    if (farrowingError) {
      console.error('[Cron] Error fetching upcoming farrowings:', farrowingError);
      results.errors.push(`Farrowing check failed: ${farrowingError.message}`);
    } else if (upcomingFarrowings && upcomingFarrowings.length > 0) {
      for (const breeding of upcomingFarrowings) {
        try {
          const sowName = (breeding.sows as any).name || (breeding.sows as any).ear_tag;
          const daysUntil = Math.ceil(
            (new Date(breeding.expected_farrowing_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          const scheduledFor = new Date(now);
          scheduledFor.setHours(9, 0, 0, 0); // Schedule for 9 AM today

          // Check if notification already exists for this event
          const { data: existing } = await supabase
            .from('scheduled_notifications')
            .select('id')
            .eq('user_id', breeding.user_id)
            .eq('type', 'farrowing_alert')
            .eq('action_url', `/breeding/bred-sows?sow=${breeding.sow_id}`)
            .gte('scheduled_for', now.toISOString())
            .single();

          if (!existing) {
            await supabase.from('scheduled_notifications').insert({
              user_id: breeding.user_id,
              organization_id: breeding.organization_id,
              type: 'farrowing_alert',
              title: '🐷 Farrowing Alert',
              body: `${sowName} is expected to farrow in ${daysUntil} day${daysUntil === 1 ? '' : 's'}. Prepare farrowing pen.`,
              action_url: `/breeding/bred-sows?sow=${breeding.sow_id}`,
              channels: ['in_app', 'push'],
              scheduled_for: scheduledFor.toISOString(),
              sent: false,
            });
            results.farrowingAlerts++;
          }
        } catch (error: any) {
          console.error('[Cron] Error scheduling farrowing alert:', error);
          results.errors.push(`Farrowing alert error: ${error.message}`);
        }
      }
    }

    // 2. WEANING REMINDERS (1 day before expected weaning - 21 days after birth)
    const { data: nursingPiglets, error: pigletError } = await supabase
      .from('piglets')
      .select(`
        id,
        sow_id,
        birth_date,
        user_id,
        organization_id,
        sows!inner(ear_tag, name)
      `)
      .eq('status', 'nursing')
      .not('birth_date', 'is', null);

    if (pigletError) {
      console.error('[Cron] Error fetching nursing piglets:', pigletError);
      results.errors.push(`Weaning check failed: ${pigletError.message}`);
    } else if (nursingPiglets && nursingPiglets.length > 0) {
      for (const piglet of nursingPiglets) {
        try {
          const birthDate = new Date(piglet.birth_date);
          const expectedWeaningDate = new Date(birthDate);
          expectedWeaningDate.setDate(expectedWeaningDate.getDate() + 21);

          const daysUntilWeaning = Math.ceil(
            (expectedWeaningDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysUntilWeaning <= 1 && daysUntilWeaning >= 0) {
            const sowName = (piglet.sows as any).name || (piglet.sows as any).ear_tag;
            const scheduledFor = new Date(now);
            scheduledFor.setHours(9, 0, 0, 0);

            // Check if notification already exists
            const { data: existing } = await supabase
              .from('scheduled_notifications')
              .select('id')
              .eq('user_id', piglet.user_id)
              .eq('type', 'weaning_reminder')
              .eq('action_url', `/piglets/nursing?sow=${piglet.sow_id}`)
              .gte('scheduled_for', now.toISOString())
              .single();

            if (!existing) {
              await supabase.from('scheduled_notifications').insert({
                user_id: piglet.user_id,
                organization_id: piglet.organization_id,
                type: 'weaning_reminder',
                title: '🍼 Weaning Reminder',
                body: `Litter from ${sowName} is ready for weaning ${daysUntilWeaning === 0 ? 'today' : 'tomorrow'}. Piglets are 21 days old.`,
                action_url: `/piglets/nursing?sow=${piglet.sow_id}`,
                channels: ['in_app', 'push'],
                scheduled_for: scheduledFor.toISOString(),
                sent: false,
              });
              results.weaningReminders++;
            }
          }
        } catch (error: any) {
          console.error('[Cron] Error scheduling weaning reminder:', error);
          results.errors.push(`Weaning reminder error: ${error.message}`);
        }
      }
    }

    // 3. BREEDING REMINDERS (7 days after weaning)
    const { data: weanedPiglets, error: weanedError } = await supabase
      .from('piglets')
      .select(`
        sow_id,
        weaning_date,
        user_id,
        organization_id,
        sows!inner(ear_tag, name, status)
      `)
      .eq('status', 'weaned')
      .not('weaning_date', 'is', null);

    if (weanedError) {
      console.error('[Cron] Error fetching weaned piglets:', weanedError);
      results.errors.push(`Breeding reminder check failed: ${weanedError.message}`);
    } else if (weanedPiglets && weanedPiglets.length > 0) {
      // Group by sow to avoid duplicate notifications
      const sowMap = new Map();
      for (const piglet of weanedPiglets) {
        if (!sowMap.has(piglet.sow_id)) {
          sowMap.set(piglet.sow_id, piglet);
        } else {
          // Keep the most recent weaning date
          const existing = sowMap.get(piglet.sow_id);
          if (new Date(piglet.weaning_date) > new Date(existing.weaning_date)) {
            sowMap.set(piglet.sow_id, piglet);
          }
        }
      }

      for (const [sowId, piglet] of Array.from(sowMap.entries())) {
        try {
          const weaningDate = new Date(piglet.weaning_date);
          const expectedHeatDate = new Date(weaningDate);
          expectedHeatDate.setDate(expectedHeatDate.getDate() + 7);

          const daysUntilHeat = Math.ceil(
            (expectedHeatDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Notify when it's 0-1 days until expected heat and sow is available for breeding
          if (daysUntilHeat <= 1 && daysUntilHeat >= 0 && (piglet.sows as any).status === 'open') {
            const sowName = (piglet.sows as any).name || (piglet.sows as any).ear_tag;
            const scheduledFor = new Date(now);
            scheduledFor.setHours(9, 0, 0, 0);

            // Check if notification already exists
            const { data: existing } = await supabase
              .from('scheduled_notifications')
              .select('id')
              .eq('user_id', piglet.user_id)
              .eq('type', 'breeding_reminder')
              .eq('action_url', `/breeding?sow=${sowId}`)
              .gte('scheduled_for', now.toISOString())
              .single();

            if (!existing) {
              await supabase.from('scheduled_notifications').insert({
                user_id: piglet.user_id,
                organization_id: piglet.organization_id,
                type: 'breeding_reminder',
                title: '💝 Breeding Reminder',
                body: `${sowName} may be in heat ${daysUntilHeat === 0 ? 'today' : 'tomorrow'}. Monitor for breeding.`,
                action_url: `/breeding?sow=${sowId}`,
                channels: ['in_app', 'push'],
                scheduled_for: scheduledFor.toISOString(),
                sent: false,
              });
              results.breedingReminders++;
            }
          }
        } catch (error: any) {
          console.error('[Cron] Error scheduling breeding reminder:', error);
          results.errors.push(`Breeding reminder error: ${error.message}`);
        }
      }
    }

    // 4. PREGNANCY CHECK REMINDERS (21 days after breeding)
    const { data: recentBreedings, error: breedingError } = await supabase
      .from('breeding_attempts')
      .select(`
        id,
        sow_id,
        breeding_date,
        user_id,
        organization_id,
        sows!inner(ear_tag, name)
      `)
      .eq('status', 'bred')
      .not('breeding_date', 'is', null);

    if (breedingError) {
      console.error('[Cron] Error fetching recent breedings:', breedingError);
      results.errors.push(`Pregnancy check failed: ${breedingError.message}`);
    } else if (recentBreedings && recentBreedings.length > 0) {
      for (const breeding of recentBreedings) {
        try {
          const breedingDate = new Date(breeding.breeding_date);
          const pregnancyCheckDate = new Date(breedingDate);
          pregnancyCheckDate.setDate(pregnancyCheckDate.getDate() + 21);

          const daysUntilCheck = Math.ceil(
            (pregnancyCheckDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysUntilCheck <= 1 && daysUntilCheck >= 0) {
            const sowName = (breeding.sows as any).name || (breeding.sows as any).ear_tag;
            const scheduledFor = new Date(now);
            scheduledFor.setHours(9, 0, 0, 0);

            // Check if notification already exists
            const { data: existing } = await supabase
              .from('scheduled_notifications')
              .select('id')
              .eq('user_id', breeding.user_id)
              .eq('type', 'pregnancy_check')
              .eq('action_url', `/breeding/bred-sows?sow=${breeding.sow_id}`)
              .gte('scheduled_for', now.toISOString())
              .single();

            if (!existing) {
              await supabase.from('scheduled_notifications').insert({
                user_id: breeding.user_id,
                organization_id: breeding.organization_id,
                type: 'pregnancy_check',
                title: '🔍 Pregnancy Check Due',
                body: `${sowName} is due for pregnancy check ${daysUntilCheck === 0 ? 'today' : 'tomorrow'} (21 days post-breeding).`,
                action_url: `/breeding/bred-sows?sow=${breeding.sow_id}`,
                channels: ['in_app', 'push'],
                scheduled_for: scheduledFor.toISOString(),
                sent: false,
              });
              results.pregnancyCheckReminders++;
            }
          }
        } catch (error: any) {
          console.error('[Cron] Error scheduling pregnancy check reminder:', error);
          results.errors.push(`Pregnancy check error: ${error.message}`);
        }
      }
    }

    console.log('[Cron] Event notification check complete:', results);

    return NextResponse.json({
      success: true,
      message: 'Event notifications checked',
      ...results,
    });
  } catch (error: any) {
    console.error('[Cron] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
