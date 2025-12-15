-- Fix notification RLS policies to use organization-based access control
-- This migration updates RLS policies to check organization membership instead of just user_id
--
-- Problem: Current policies only check user_id = auth.uid()
-- Solution: Check that user is a member of the notification's organization
--
-- Affected tables:
-- - notifications
-- - scheduled_notifications
-- - notification_preferences

-- ========================================
-- Helper function to check organization membership
-- ========================================

CREATE OR REPLACE FUNCTION user_in_organization(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ========================================
-- 1. Fix notifications table RLS policies
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications for users" ON notifications;

-- Allow users to view notifications for organizations they belong to
CREATE POLICY "Users can view notifications in their organizations"
  ON notifications
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND (
      organization_id IS NULL
      OR user_in_organization(organization_id)
    )
  );

-- Allow users to update their own notifications within their organizations
CREATE POLICY "Users can update their own notifications in their organizations"
  ON notifications
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND (
      organization_id IS NULL
      OR user_in_organization(organization_id)
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND (
      organization_id IS NULL
      OR user_in_organization(organization_id)
    )
  );

-- Allow system to insert notifications for users in their organizations
CREATE POLICY "System can insert notifications for users in organizations"
  ON notifications
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      organization_id IS NULL
      OR user_in_organization(organization_id)
    )
  );

-- ========================================
-- 2. Fix scheduled_notifications table RLS policies
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their scheduled notifications" ON scheduled_notifications;
DROP POLICY IF EXISTS "System can insert scheduled notifications for users" ON scheduled_notifications;
DROP POLICY IF EXISTS "System can update scheduled notifications" ON scheduled_notifications;

-- Allow users to view scheduled notifications for organizations they belong to
CREATE POLICY "Users can view scheduled notifications in their organizations"
  ON scheduled_notifications
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND (
      organization_id IS NULL
      OR user_in_organization(organization_id)
    )
  );

-- Allow system to insert scheduled notifications for users in their organizations
CREATE POLICY "System can insert scheduled notifications for users in organizations"
  ON scheduled_notifications
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      organization_id IS NULL
      OR user_in_organization(organization_id)
    )
  );

-- Allow system to update scheduled notifications (mark as sent, etc.)
CREATE POLICY "System can update scheduled notifications in organizations"
  ON scheduled_notifications
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND (
      organization_id IS NULL
      OR user_in_organization(organization_id)
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND (
      organization_id IS NULL
      OR user_in_organization(organization_id)
    )
  );

-- ========================================
-- 3. Fix notification_preferences table RLS policies
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update their own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON notification_preferences;

-- Allow users to view their own notification preferences
CREATE POLICY "Users can view their own notification preferences"
  ON notification_preferences
  FOR SELECT
  USING (user_id = auth.uid());

-- Allow users to update their own notification preferences
CREATE POLICY "Users can update their own notification preferences"
  ON notification_preferences
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow users to insert their own notification preferences
CREATE POLICY "Users can insert their own notification preferences"
  ON notification_preferences
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Add comments
COMMENT ON FUNCTION user_in_organization IS 'Check if the authenticated user is an active member of the specified organization';
COMMENT ON POLICY "Users can view notifications in their organizations" ON notifications IS 'Users can only see notifications for organizations they belong to';
COMMENT ON POLICY "Users can view scheduled notifications in their organizations" ON scheduled_notifications IS 'Users can only see scheduled notifications for organizations they belong to';
