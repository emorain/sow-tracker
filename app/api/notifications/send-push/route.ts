import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL || 'noreply@sowtracker.com'}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface PushNotificationPayload {
  notificationId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PushNotificationPayload = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // Fetch notification details
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .select('*, notification_preferences!inner(push_subscription, push_enabled)')
      .eq('id', notificationId)
      .single();

    if (notifError || !notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Check if user has push enabled
    if (!notification.notification_preferences?.push_enabled) {
      return NextResponse.json(
        { error: 'User has push notifications disabled' },
        { status: 400 }
      );
    }

    const pushSubscription = notification.notification_preferences?.push_subscription;
    if (!pushSubscription) {
      return NextResponse.json(
        { error: 'No push subscription found for user' },
        { status: 400 }
      );
    }

    // Prepare push notification payload
    const pushPayload = {
      title: notification.title || 'Sow Tracker Notification',
      body: notification.message || notification.body,
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      tag: notification.type,
      notificationId: notification.id,
      type: notification.type,
      url: getNotificationUrl(notification),
    };

    try {
      // Send push notification
      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify(pushPayload)
      );

      // Mark as sent
      await supabase
        .from('notifications')
        .update({
          push_sent_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      return NextResponse.json({
        success: true,
        message: 'Push notification sent successfully',
      });
    } catch (pushError: any) {
      console.error('Error sending push notification:', pushError);

      // Handle expired subscription
      if (pushError.statusCode === 410) {
        // Subscription expired, remove it
        await supabase
          .from('notification_preferences')
          .update({
            push_subscription: null,
            push_enabled: false,
          })
          .eq('user_id', notification.user_id);

        await supabase
          .from('notifications')
          .update({
            push_error: 'Subscription expired',
          })
          .eq('id', notificationId);

        return NextResponse.json(
          { error: 'Push subscription expired and has been removed' },
          { status: 410 }
        );
      }

      // Log error
      await supabase
        .from('notifications')
        .update({
          push_error: pushError.message || 'Unknown error',
        })
        .eq('id', notificationId);

      return NextResponse.json(
        { error: 'Failed to send push notification', details: pushError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in send-push API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

function getNotificationUrl(notification: any): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Map notification types to URLs
  const typeUrls: Record<string, string> = {
    farrowing: '/sows',
    breeding: '/sows',
    pregnancy_check: '/sows',
    weaning: '/sows',
    vaccination: '/health',
    health: '/health',
    task: '/tasks',
    compliance: '/reports',
    matrix: '/health',
    transfer: '/sows',
  };

  const path = typeUrls[notification.type] || '/';
  return `${baseUrl}${path}`;
}
