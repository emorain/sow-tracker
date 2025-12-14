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

    console.log('[Cron] Processing scheduled notifications...');

    // Get all scheduled notifications that are due
    const now = new Date().toISOString();
    const { data: scheduledNotifications, error: fetchError } = await supabase
      .from('scheduled_notifications')
      .select(`
        id,
        user_id,
        type,
        title,
        body,
        action_url,
        channels,
        scheduled_for,
        notification_preferences!inner(
          push_enabled,
          push_subscription,
          email_enabled
        )
      `)
      .eq('sent', false)
      .lte('scheduled_for', now)
      .limit(100); // Process 100 at a time

    if (fetchError) {
      console.error('[Cron] Error fetching scheduled notifications:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch scheduled notifications', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!scheduledNotifications || scheduledNotifications.length === 0) {
      console.log('[Cron] No scheduled notifications to process');
      return NextResponse.json({
        success: true,
        message: 'No notifications to process',
        processed: 0,
      });
    }

    console.log(`[Cron] Found ${scheduledNotifications.length} notifications to process`);

    // Create in-app notifications and send push/email
    const results = {
      processed: 0,
      pushSent: 0,
      pushFailed: 0,
      errors: [] as string[],
    };

    for (const scheduled of scheduledNotifications) {
      try {
        // Create in-app notification
        const { data: notification, error: createError } = await supabase
          .from('notifications')
          .insert({
            user_id: scheduled.user_id,
            type: scheduled.type,
            title: scheduled.title,
            message: scheduled.body,
            action_url: scheduled.action_url,
            channels: scheduled.channels,
          })
          .select('id')
          .single();

        if (createError || !notification) {
          console.error('[Cron] Error creating notification:', createError);
          results.errors.push(`Failed to create notification: ${createError?.message}`);
          continue;
        }

        // Send push notification if enabled
        const prefs = Array.isArray(scheduled.notification_preferences)
          ? scheduled.notification_preferences[0]
          : scheduled.notification_preferences;

        if (prefs?.push_enabled && prefs?.push_subscription && scheduled.channels?.includes('push')) {
          try {
            const pushResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/send-push`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                notificationId: notification.id,
              }),
            });

            if (pushResponse.ok) {
              results.pushSent++;
            } else {
              results.pushFailed++;
              const errorData = await pushResponse.json();
              console.error('[Cron] Push notification failed:', errorData);
            }
          } catch (pushError: any) {
            results.pushFailed++;
            console.error('[Cron] Error sending push notification:', pushError);
          }
        }

        // Mark scheduled notification as sent
        await supabase
          .from('scheduled_notifications')
          .update({
            sent: true,
            sent_at: new Date().toISOString(),
          })
          .eq('id', scheduled.id);

        results.processed++;
      } catch (error: any) {
        console.error('[Cron] Error processing notification:', error);
        results.errors.push(`Error: ${error.message}`);
      }
    }

    console.log('[Cron] Processing complete:', results);

    return NextResponse.json({
      success: true,
      message: 'Notifications processed',
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
