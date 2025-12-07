# Notification Backend - Implementation Guide

## Overview

The notification system automatically sends reminders and alerts for key farm events. This includes database triggers that auto-schedule notifications and helper functions for manual notification sending.

## Architecture

```
┌─────────────────┐
│  Farm Events    │ (Breeding, Farrowing, Health Records, etc.)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Database        │
│ Triggers        │ (Automatically fire on INSERT/UPDATE)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ scheduled_      │
│ notifications   │ (Future notifications)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cron Job/       │
│ Edge Function   │ (Runs every 15 min)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ notifications   │ (Sent notifications)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Frontend        │ (Real-time subscription)
│ Bell Icon       │
└─────────────────┘
```

## Installation

### Step 1: Run the Notification Triggers Migration

1. Go to Supabase Dashboard → SQL Editor
2. Open `migration-phase7-notification-triggers.sql`
3. Copy and paste the entire file
4. Click "Run"

This creates:
- `schedule_farrowing_reminders()` - Trigger function for farrowing
- `send_breeding_notification()` - Trigger function for breeding
- `schedule_pregnancy_check_reminder()` - Trigger function for pregnancy checks
- `schedule_weaning_reminder()` - Trigger function for weaning
- `send_task_due_notification()` - Trigger function for tasks
- `send_health_record_notification()` - Trigger function for health records
- `process_scheduled_notifications()` - Cron function to send due notifications

### Step 2: Set Up Cron Job (Optional but Recommended)

To automatically send scheduled notifications, you need a cron job that calls `process_scheduled_notifications()` every 15 minutes.

**Option A: Supabase Edge Function with pg_cron**

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the notification processor to run every 15 minutes
SELECT cron.schedule(
  'process-scheduled-notifications',
  '*/15 * * * *',  -- Every 15 minutes
  $$SELECT process_scheduled_notifications()$$
);
```

**Option B: External Cron (e.g., GitHub Actions, cron-job.org)**

Create an endpoint that calls:
```typescript
const { data, error } = await supabase.rpc('process_scheduled_notifications');
```

**Option C: Manual Processing**

Call this in SQL Editor periodically:
```sql
SELECT process_scheduled_notifications();
```

## How It Works

### Automatic Notifications

Notifications are **automatically triggered** when these events occur:

#### 1. Farrowing Created
```sql
INSERT INTO farrowings (sow_id, expected_farrowing_date, user_id, ...)
```
**Result:** Schedules reminders based on user preferences (default: 7, 3, 1 days before)

#### 2. Breeding Recorded
```sql
INSERT INTO breeding_attempts (sow_id, boar_id, breeding_date, user_id, ...)
```
**Result:** Sends immediate notification

#### 3. Pregnancy Check Date Set
```sql
INSERT INTO breeding_attempts (..., pregnancy_check_date, ...)
-- OR
UPDATE breeding_attempts SET pregnancy_check_date = '2025-12-20' WHERE id = '...'
```
**Result:** Schedules reminder (default: 1 day before)

#### 4. Weaning Date Set
```sql
UPDATE farrowings SET expected_weaning_date = '2025-12-25' WHERE id = '...'
```
**Result:** Schedules reminders (default: 3, 1 days before)

#### 5. Health Record Added
```sql
INSERT INTO health_records (sow_id, record_type, user_id, ...)
```
**Result:** Sends immediate notification

#### 6. Task Created (Due Today or Overdue)
```sql
INSERT INTO scheduled_tasks (task_title, due_date, user_id, ...)
```
**Result:** Sends immediate notification if due today or overdue

### Manual Notifications

You can also manually send or schedule notifications using the TypeScript helper functions:

```typescript
import {
  sendNotification,
  scheduleNotification,
  scheduleFarrowingReminders,
  sendBreedingNotification,
  sendHealthRecordNotification,
  // ... etc
} from '@/lib/notification-service';

// Send immediate notification
await sendNotification({
  userId: 'user-uuid',
  type: 'farrowing',
  title: 'Sow A123 Farrowed!',
  message: 'Sow A123 has successfully farrowed with 12 piglets',
  linkUrl: '/farrowings/active',
  relatedId: 'farrowing-uuid',
});

// Schedule future notification
await scheduleNotification({
  userId: 'user-uuid',
  type: 'vaccination',
  title: 'Vaccination Due',
  message: 'Boar B456 is due for vaccination',
  linkUrl: '/health',
  relatedId: 'health-record-uuid',
  scheduledFor: new Date('2025-12-15'),
});

// Use convenience functions
await scheduleFarrowingReminders(
  farrowingId,
  'A123',
  new Date('2025-12-20'),
  userId
);
```

## Notification Types

| Type | Icon | Use Case |
|------|------|----------|
| `farrowing` | 🩷 Baby | Farrowing reminders and alerts |
| `breeding` | ❤️ Heart | New breeding records |
| `pregnancy_check` | 💙 Calendar | Pregnancy check reminders |
| `weaning` | 💜 Baby | Weaning date reminders |
| `vaccination` | 💚 Syringe | Vaccination reminders |
| `health` | 🧡 Alert | Health records and issues |
| `task` | 💙 Calendar | Task reminders |
| `transfer` | 🏠 Home | Animal transfers |
| `compliance` | 💛 Alert | Prop 12 compliance |
| `matrix` | Matrix treatments |

## User Preferences

Users control their notifications via `/settings/notifications`:

```typescript
{
  // Channels
  push_enabled: true,
  email_enabled: true,
  email_daily_digest: false,

  // Types
  notify_farrowing: true,
  notify_breeding: true,
  notify_pregnancy_check: true,
  notify_weaning: true,
  notify_vaccination: true,
  notify_health_records: true,
  notify_tasks: true,
  notify_compliance: true,

  // Timing
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',

  // Reminder days before event
  farrowing_reminder_days: [7, 3, 1],
  pregnancy_check_reminder_days: [1],
  weaning_reminder_days: [3, 1],
  vaccination_reminder_days: [7, 3, 1],
}
```

## Database Schema

### notifications
```sql
id UUID PRIMARY KEY
user_id UUID → auth.users
type VARCHAR (farrowing, breeding, etc.)
title VARCHAR
message TEXT
link_url TEXT (where to navigate when clicked)
related_id TEXT (ID of related object)
sent_at TIMESTAMPTZ (when notification was sent)
read_at TIMESTAMPTZ (when user marked as read)
clicked_at TIMESTAMPTZ (when user clicked the notification)
```

### scheduled_notifications
```sql
id UUID PRIMARY KEY
user_id UUID → auth.users
type VARCHAR
title VARCHAR
message TEXT
link_url TEXT
related_id TEXT
scheduled_for TIMESTAMPTZ (when to send)
sent BOOLEAN (has it been sent?)
sent_at TIMESTAMPTZ (when it was sent)
```

## Testing

### Test Farrowing Notification

```sql
-- This should create scheduled notifications
INSERT INTO farrowings (
  sow_id,
  breeding_attempt_id,
  expected_farrowing_date,
  user_id,
  organization_id
) VALUES (
  'sow-uuid',
  'breeding-uuid',
  CURRENT_DATE + INTERVAL '10 days',
  'your-user-id',
  'your-org-id'
);

-- Check scheduled notifications
SELECT * FROM scheduled_notifications
WHERE user_id = 'your-user-id'
  AND sent = false
ORDER BY scheduled_for;
```

### Test Breeding Notification

```sql
-- This should send immediate notification
INSERT INTO breeding_attempts (
  sow_id,
  boar_id,
  breeding_date,
  user_id,
  organization_id
) VALUES (
  'sow-uuid',
  'boar-uuid',
  CURRENT_DATE,
  'your-user-id',
  'your-org-id'
);

-- Check notifications
SELECT * FROM notifications
WHERE user_id = 'your-user-id'
ORDER BY sent_at DESC
LIMIT 5;
```

### Manually Process Scheduled Notifications

```sql
-- See what would be sent
SELECT * FROM scheduled_notifications
WHERE scheduled_for <= NOW()
  AND sent = FALSE;

-- Process them
SELECT process_scheduled_notifications();

-- Verify they were sent
SELECT * FROM notifications
WHERE user_id = 'your-user-id'
ORDER BY sent_at DESC
LIMIT 5;
```

## Troubleshooting

### Notifications Not Appearing

1. **Check triggers exist:**
```sql
SELECT tgname, tgtype, tgenabled
FROM pg_trigger
WHERE tgname LIKE '%notification%';
```

2. **Check user preferences:**
```sql
SELECT * FROM notification_preferences WHERE user_id = 'your-user-id';
```

3. **Check scheduled notifications:**
```sql
SELECT * FROM scheduled_notifications
WHERE user_id = 'your-user-id'
  AND sent = false;
```

4. **Check sent notifications:**
```sql
SELECT * FROM notifications
WHERE user_id = 'your-user-id'
ORDER BY sent_at DESC
LIMIT 10;
```

### Scheduled Notifications Not Sending

- Ensure cron job is running
- Manually call `SELECT process_scheduled_notifications();`
- Check `sent` flag in `scheduled_notifications`

### Too Many Notifications

- Users can disable specific types in `/settings/notifications`
- Adjust reminder days in preferences
- Set quiet hours

## Frontend Integration

The NotificationCenter component automatically:
- Shows unread count badge on bell icon
- Subscribes to real-time notifications via Supabase
- Displays notification dropdown
- Marks as read/clicked
- Navigates to related items

No additional frontend work needed!

## Future Enhancements

### Email Notifications
- Set up Resend or SendGrid
- Create email templates
- Add Edge Function to send emails
- Respect `email_daily_digest` preference

### Push Notifications
- Implement Web Push API
- Store push subscriptions in `notification_preferences.push_subscription`
- Send push notifications via Edge Function

### SMS Notifications
- Integrate Twilio
- Store phone numbers in `notification_preferences.phone_number`
- Send SMS for critical alerts

## Summary

✅ Database triggers auto-schedule notifications
✅ User preferences control what they receive
✅ Frontend displays notifications in real-time
✅ Mark as read/clicked tracking
✅ Supports 10 notification types
✅ Customizable reminder timing

**Next Step:** Run the migration and test by creating a farrowing or breeding record!
