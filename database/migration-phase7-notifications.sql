-- Migration: Phase 7 - Notification System
-- This creates tables and infrastructure for push notifications, email alerts, and reminders

-- ========================================
-- 1. Create Notification Preferences Table
-- ========================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Push notification settings
  push_enabled BOOLEAN DEFAULT TRUE,
  push_subscription JSONB, -- Web Push subscription object

  -- Email notification settings
  email_enabled BOOLEAN DEFAULT TRUE,
  email_daily_digest BOOLEAN DEFAULT TRUE,
  email_weekly_report BOOLEAN DEFAULT FALSE,

  -- SMS settings (future)
  sms_enabled BOOLEAN DEFAULT FALSE,
  phone_number VARCHAR(20),

  -- Notification type preferences
  notify_farrowing BOOLEAN DEFAULT TRUE,
  notify_breeding BOOLEAN DEFAULT TRUE,
  notify_pregnancy_check BOOLEAN DEFAULT TRUE,
  notify_weaning BOOLEAN DEFAULT TRUE,
  notify_vaccination BOOLEAN DEFAULT TRUE,
  notify_health_records BOOLEAN DEFAULT TRUE,
  notify_matrix BOOLEAN DEFAULT TRUE,
  notify_tasks BOOLEAN DEFAULT TRUE,
  notify_transfers BOOLEAN DEFAULT TRUE,
  notify_compliance BOOLEAN DEFAULT TRUE,

  -- Timing preferences
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '07:00',
  timezone VARCHAR(50) DEFAULT 'America/Chicago',

  -- Reminder timing (days before event)
  farrowing_reminder_days INTEGER[] DEFAULT ARRAY[7, 3, 1],
  pregnancy_check_reminder_days INTEGER[] DEFAULT ARRAY[1],
  weaning_reminder_days INTEGER[] DEFAULT ARRAY[3, 1],
  vaccination_reminder_days INTEGER[] DEFAULT ARRAY[7, 3, 1],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- ========================================
-- 2. Create Notifications Table (for tracking sent notifications)
-- ========================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Notification details
  type VARCHAR(50) NOT NULL, -- 'farrowing', 'breeding', 'vaccination', 'task', etc.
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  icon_url TEXT,

  -- Related data
  related_type VARCHAR(50), -- 'sow', 'boar', 'piglet', 'task', etc.
  related_id UUID,
  action_url TEXT, -- URL to navigate to when clicked

  -- Delivery tracking
  channels VARCHAR(50)[] DEFAULT ARRAY['push'], -- 'push', 'email', 'sms'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  -- Metadata
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 3. Create Scheduled Notifications Table
-- ========================================

CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Notification details
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,

  -- Related data
  related_type VARCHAR(50),
  related_id UUID,
  action_url TEXT,

  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,

  -- Metadata
  priority VARCHAR(20) DEFAULT 'normal',
  channels VARCHAR(50)[] DEFAULT ARRAY['push'],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 4. Create indexes for performance
-- ========================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_org_id ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at);

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user_id ON scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_sent ON scheduled_notifications(sent);

-- ========================================
-- 5. Enable RLS
-- ========================================

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Notification Preferences: Users can only manage their own
CREATE POLICY "Users can manage their own notification preferences"
  ON notification_preferences
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Notifications: Users can only see their own
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Scheduled Notifications: Users can only see their own
CREATE POLICY "Users can view their scheduled notifications"
  ON scheduled_notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- ========================================
-- 6. Create function to schedule farrowing notifications
-- ========================================

CREATE OR REPLACE FUNCTION schedule_farrowing_notifications(
  p_farrowing_id UUID,
  p_sow_ear_tag VARCHAR,
  p_expected_date DATE,
  p_user_id UUID
)
RETURNS void AS $$
DECLARE
  v_org_id UUID;
  v_reminder_days INTEGER;
  v_prefs RECORD;
BEGIN
  -- Get user's organization
  SELECT organization_id INTO v_org_id
  FROM organization_members
  WHERE user_id = p_user_id AND is_active = true
  LIMIT 1;

  -- Get user's notification preferences
  SELECT * INTO v_prefs
  FROM notification_preferences
  WHERE user_id = p_user_id;

  -- If user doesn't have preferences, create default
  IF v_prefs IS NULL THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_prefs;
  END IF;

  -- Skip if farrowing notifications disabled
  IF v_prefs.notify_farrowing = FALSE THEN
    RETURN;
  END IF;

  -- Schedule notifications for each reminder day
  FOREACH v_reminder_days IN ARRAY v_prefs.farrowing_reminder_days
  LOOP
    INSERT INTO scheduled_notifications (
      user_id,
      organization_id,
      type,
      title,
      body,
      related_type,
      related_id,
      action_url,
      scheduled_for,
      priority,
      channels
    )
    VALUES (
      p_user_id,
      v_org_id,
      'farrowing_reminder',
      'Farrowing Expected Soon',
      'Sow ' || p_sow_ear_tag || ' is expected to farrow in ' || v_reminder_days || ' day' || CASE WHEN v_reminder_days > 1 THEN 's' ELSE '' END,
      'farrowing',
      p_farrowing_id,
      '/farrowings/active',
      (p_expected_date - (v_reminder_days || ' days')::INTERVAL)::TIMESTAMPTZ + TIME '08:00:00',
      CASE WHEN v_reminder_days <= 1 THEN 'high' ELSE 'normal' END,
      ARRAY['push', 'email']
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. Create function to schedule pregnancy check notifications
-- ========================================

CREATE OR REPLACE FUNCTION schedule_pregnancy_check_notifications(
  p_breeding_attempt_id UUID,
  p_sow_ear_tag VARCHAR,
  p_check_date DATE,
  p_user_id UUID
)
RETURNS void AS $$
DECLARE
  v_org_id UUID;
  v_reminder_days INTEGER;
  v_prefs RECORD;
BEGIN
  -- Get user's organization
  SELECT organization_id INTO v_org_id
  FROM organization_members
  WHERE user_id = p_user_id AND is_active = true
  LIMIT 1;

  -- Get user's notification preferences
  SELECT * INTO v_prefs
  FROM notification_preferences
  WHERE user_id = p_user_id;

  IF v_prefs IS NULL THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_prefs;
  END IF;

  -- Skip if pregnancy check notifications disabled
  IF v_prefs.notify_pregnancy_check = FALSE THEN
    RETURN;
  END IF;

  -- Schedule notifications
  FOREACH v_reminder_days IN ARRAY v_prefs.pregnancy_check_reminder_days
  LOOP
    INSERT INTO scheduled_notifications (
      user_id,
      organization_id,
      type,
      title,
      body,
      related_type,
      related_id,
      action_url,
      scheduled_for,
      priority,
      channels
    )
    VALUES (
      p_user_id,
      v_org_id,
      'pregnancy_check_reminder',
      'Pregnancy Check Due',
      'Sow ' || p_sow_ear_tag || ' needs pregnancy check' || CASE WHEN v_reminder_days > 0 THEN ' in ' || v_reminder_days || ' day(s)' ELSE ' today' END,
      'breeding_attempt',
      p_breeding_attempt_id,
      '/breeding/bred-sows',
      (p_check_date - (v_reminder_days || ' days')::INTERVAL)::TIMESTAMPTZ + TIME '08:00:00',
      CASE WHEN v_reminder_days = 0 THEN 'high' ELSE 'normal' END,
      ARRAY['push', 'email']
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 8. Create function to get unread notification count
-- ========================================

CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM notifications
  WHERE user_id = p_user_id
    AND read_at IS NULL
    AND (expires_at IS NULL OR expires_at > NOW());
$$ LANGUAGE SQL STABLE;

-- ========================================
-- 9. Create function to mark notifications as read
-- ========================================

CREATE OR REPLACE FUNCTION mark_notifications_as_read(
  p_user_id UUID,
  p_notification_ids UUID[] DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  IF p_notification_ids IS NULL THEN
    -- Mark all as read
    UPDATE notifications
    SET read_at = NOW()
    WHERE user_id = p_user_id
      AND read_at IS NULL;
  ELSE
    -- Mark specific notifications as read
    UPDATE notifications
    SET read_at = NOW()
    WHERE user_id = p_user_id
      AND id = ANY(p_notification_ids)
      AND read_at IS NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 10. Auto-create notification preferences for new users
-- ========================================

CREATE OR REPLACE FUNCTION create_notification_prefs_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_notification_prefs ON auth.users;
CREATE TRIGGER on_auth_user_created_notification_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_prefs_for_new_user();

-- ========================================
-- 11. Comments for documentation
-- ========================================

COMMENT ON TABLE notification_preferences IS 'User notification preferences for push, email, and SMS alerts';
COMMENT ON TABLE notifications IS 'Sent notifications with delivery tracking';
COMMENT ON TABLE scheduled_notifications IS 'Notifications scheduled to be sent in the future';

-- ========================================
-- 12. Grant permissions
-- ========================================

GRANT SELECT, INSERT, UPDATE, DELETE ON notification_preferences TO authenticated;
GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT SELECT ON scheduled_notifications TO authenticated;
