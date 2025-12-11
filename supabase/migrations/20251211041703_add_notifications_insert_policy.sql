-- Add RLS policy to allow system triggers to insert notifications
-- The existing policies only allowed SELECT and UPDATE, but not INSERT
-- This is needed for the notification triggers to work

-- Drop existing policies and recreate with INSERT support
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- Allow users to view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Allow users to update their own notifications (mark as read, etc.)
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow system to insert notifications for users
-- This policy allows INSERT when the user_id matches the authenticated user
-- This enables triggers to create notifications
CREATE POLICY "System can insert notifications for users"
  ON notifications
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Similar policy for scheduled_notifications
DROP POLICY IF EXISTS "Users can view their scheduled notifications" ON scheduled_notifications;

CREATE POLICY "Users can view their scheduled notifications"
  ON scheduled_notifications
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert scheduled notifications for users"
  ON scheduled_notifications
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
