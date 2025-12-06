# Phase 7: Multi-User Collaboration & Notifications - Implementation Guide

## Overview

Phase 7 introduces two major features to Sow Tracker:
1. **Multi-User Collaboration** - Teams can work together on the same farm
2. **Notification System** - Push notifications, email alerts, and smart reminders

## Database Migrations

### Prerequisites
- Access to your Supabase dashboard
- SQL Editor permissions
- Backup your database before running migrations

### Migration Steps

#### Step 1: Run Organizations Migration

1. Go to Supabase Dashboard → SQL Editor
2. Open `migration-phase7-organizations.sql`
3. Copy and paste the entire file
4. Click "Run"
5. Verify success (should see "Success. No rows returned")

**What this creates:**
- `organizations` table - Stores farm/organization data
- `organization_members` table - Team members and their roles
- Adds `organization_id` column to all existing tables
- Sets up Row-Level Security (RLS) for org-based access
- Creates auto-migration for existing users
- Creates trigger to auto-create org for new signups

#### Step 2: Migrate Existing Users

After running the migration, execute this ONE TIME:

```sql
SELECT migrate_existing_users_to_orgs();
```

This will:
- Create an organization for each existing user
- Set them as the "owner" of their organization
- Link all their existing data to their organization

#### Step 3: Run Notifications Migration

1. In SQL Editor, open `migration-phase7-notifications.sql`
2. Copy and paste the entire file
3. Click "Run"

**What this creates:**
- `notification_preferences` table - User notification settings
- `notifications` table - Sent notifications with read tracking
- `scheduled_notifications` table - Future notifications to send
- Helper functions for scheduling reminders
- Auto-creates default preferences for new users

## Database Schema

### Organizations Table

```sql
organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255),           -- "Smith Family Farm"
  slug VARCHAR(100) UNIQUE,    -- "smith-farm"
  logo_url TEXT,               -- Organization logo
  settings JSONB,              -- Farm-wide settings
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### Organization Members Table

```sql
organization_members (
  id UUID PRIMARY KEY,
  organization_id UUID,        -- Which organization
  user_id UUID,                -- Which user
  role VARCHAR(50),            -- 'owner', 'manager', 'member', 'vet', 'readonly'
  invited_by UUID,             -- Who invited them
  invited_at TIMESTAMPTZ,      -- When invited
  joined_at TIMESTAMPTZ,       -- When they joined
  is_active BOOLEAN,           -- Can be deactivated without deletion
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(organization_id, user_id)
)
```

### Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Owner** | Full access, manage team, delete org, all features |
| **Manager** | Edit animals, manage housing, view reports, invite members |
| **Member** | View animals, complete tasks, add basic records |
| **Vet** | View/add health records only |
| **Readonly** | View-only access for reports and data |

### Notification Preferences Table

```sql
notification_preferences (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE,

  -- Channel enablement
  push_enabled BOOLEAN,
  push_subscription JSONB,     -- Web Push API subscription
  email_enabled BOOLEAN,
  email_daily_digest BOOLEAN,
  sms_enabled BOOLEAN,
  phone_number VARCHAR(20),

  -- Notification types
  notify_farrowing BOOLEAN,
  notify_breeding BOOLEAN,
  notify_pregnancy_check BOOLEAN,
  notify_weaning BOOLEAN,
  notify_vaccination BOOLEAN,
  notify_health_records BOOLEAN,
  notify_matrix BOOLEAN,
  notify_tasks BOOLEAN,
  notify_transfers BOOLEAN,
  notify_compliance BOOLEAN,

  -- Timing
  quiet_hours_start TIME,      -- No notifications during quiet hours
  quiet_hours_end TIME,
  timezone VARCHAR(50),

  -- Reminder timing (days before event)
  farrowing_reminder_days INTEGER[],      -- [7, 3, 1]
  pregnancy_check_reminder_days INTEGER[], -- [1]
  weaning_reminder_days INTEGER[],        -- [3, 1]
  vaccination_reminder_days INTEGER[],    -- [7, 3, 1]

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

## Key Features

### 1. Automatic Organization Creation

When a new user signs up, the system automatically:
1. Creates an organization named "{username}'s Farm"
2. Assigns them as the "owner"
3. Creates default notification preferences
4. All their data is linked to their organization

### 2. Team Collaboration

**Inviting Team Members:**
- Owners and Managers can invite new members
- Invites are email-based
- New members automatically join the inviter's organization
- Existing users can be added to multiple organizations (future enhancement)

**Accessing Shared Data:**
- All team members see the same animals, health records, tasks
- Permissions control what actions they can take
- Activity is tracked per user (future: audit logs)

### 3. Smart Notifications

**Farrowing Reminders:**
```sql
-- Example: Schedule reminders 7, 3, and 1 days before farrowing
SELECT schedule_farrowing_notifications(
  p_farrowing_id => 'uuid-here',
  p_sow_ear_tag => 'A123',
  p_expected_date => '2025-12-15',
  p_user_id => 'user-uuid'
);
```

**Pregnancy Check Reminders:**
```sql
SELECT schedule_pregnancy_check_notifications(
  p_breeding_attempt_id => 'uuid-here',
  p_sow_ear_tag => 'A123',
  p_check_date => '2025-12-10',
  p_user_id => 'user-uuid'
);
```

### 4. Notification Tracking

**Get Unread Count:**
```sql
SELECT get_unread_notification_count('user-uuid');
```

**Mark as Read:**
```sql
-- Mark all notifications as read
SELECT mark_notifications_as_read('user-uuid');

-- Mark specific notifications as read
SELECT mark_notifications_as_read('user-uuid', ARRAY['notif-uuid-1', 'notif-uuid-2']);
```

## Security

### Row-Level Security (RLS)

All tables have RLS enabled with policies that ensure:
- Users can only see data from organizations they belong to
- Only owners can delete organizations
- Only owners/managers can invite members
- Users can only manage their own notification preferences

### Data Isolation

The `user_id` columns are kept for backwards compatibility, but access is now controlled by `organization_id`. This allows:
- Teams to share data within their organization
- Complete isolation between organizations
- Easy migration path from single-user to multi-user

## Next Steps (Phase 1B - To Be Implemented)

### 1. Frontend Implementation

**Organization Management UI:**
- [ ] Team members page (`/settings/team`)
- [ ] Invite member modal
- [ ] Role management interface
- [ ] Organization settings page

**Notification Preferences UI:**
- [ ] Notification settings page (`/settings/notifications`)
- [ ] Toggle notification types
- [ ] Set quiet hours
- [ ] Configure reminder timing
- [ ] Push notification permission request

**Notification Center:**
- [ ] Bell icon with unread count
- [ ] Notification dropdown
- [ ] Mark as read functionality
- [ ] Click to navigate to related item

### 2. Push Notification Service

**Web Push API Integration:**
- [ ] Generate VAPID keys
- [ ] Service worker for push handling
- [ ] Subscribe/unsubscribe logic
- [ ] Send push notifications via Supabase Edge Function

### 3. Email Service

**Email Integration:**
- [ ] Set up Resend/SendGrid
- [ ] Create email templates
- [ ] Daily digest email generation
- [ ] Send via Edge Function

### 4. Notification Scheduler

**Background Job:**
- [ ] Supabase Edge Function to check scheduled_notifications
- [ ] Run every 15 minutes
- [ ] Send pending notifications
- [ ] Mark as sent

## Testing

### Test Organization Creation

```sql
-- Verify organizations were created
SELECT o.*, om.role, u.email
FROM organizations o
JOIN organization_members om ON om.organization_id = o.id
JOIN auth.users u ON u.id = om.user_id
ORDER BY o.created_at DESC;
```

### Test Notification Scheduling

```sql
-- View scheduled notifications
SELECT sn.*, u.email
FROM scheduled_notifications sn
JOIN auth.users u ON u.id = sn.user_id
WHERE sent = false
  AND scheduled_for > NOW()
ORDER BY scheduled_for ASC
LIMIT 10;
```

### Test Notification Preferences

```sql
-- View user preferences
SELECT np.*, u.email
FROM notification_preferences np
JOIN auth.users u ON u.id = np.user_id;
```

## Troubleshooting

### Issue: Existing users not migrated

**Solution:** Run the migration function:
```sql
SELECT migrate_existing_users_to_orgs();
```

### Issue: New users not getting organization

**Solution:** Check trigger exists:
```sql
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created_create_org';
```

If missing, recreate the trigger (see migration file).

### Issue: Notification preferences not created

**Solution:** Check trigger:
```sql
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created_notification_prefs';
```

Manually create if needed:
```sql
INSERT INTO notification_preferences (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM notification_preferences);
```

## API Examples (For Future Frontend)

### Get User's Organization

```typescript
const { data: membership } = await supabase
  .from('organization_members')
  .select('organization_id, role, organizations(*)')
  .eq('user_id', user.id)
  .eq('is_active', true)
  .single();
```

### Get Team Members

```typescript
const { data: members } = await supabase
  .from('organization_members')
  .select('*, auth.users(email)')
  .eq('organization_id', orgId)
  .eq('is_active', true);
```

### Update Notification Preferences

```typescript
const { error } = await supabase
  .from('notification_preferences')
  .update({
    notify_farrowing: true,
    farrowing_reminder_days: [7, 3, 1]
  })
  .eq('user_id', user.id);
```

### Get Unread Notifications

```typescript
const { data: notifications } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', user.id)
  .is('read_at', null)
  .order('sent_at', { ascending: false })
  .limit(20);
```

## Migration Rollback (Emergency Only)

If you need to rollback:

```sql
-- WARNING: This will delete all organization data
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS scheduled_notifications CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;

-- Remove organization_id columns (run for each table)
ALTER TABLE sows DROP COLUMN IF EXISTS organization_id;
-- ... repeat for all tables
```

## Support

If you encounter issues:
1. Check Supabase logs (Dashboard → Logs)
2. Verify RLS policies are enabled
3. Test with SQL queries in editor
4. Check triggers are created

---

**Status:** Database migrations complete ✅
**Next:** Frontend implementation
**Estimated Effort:** 2-3 days for complete Phase 1 frontend
