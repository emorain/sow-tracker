-- Migration: Add delivery tracking columns to notifications table
-- Tracks when push and email notifications were sent and any errors

-- Add delivery status columns
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS push_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS push_error TEXT,
ADD COLUMN IF NOT EXISTS email_error TEXT;

-- Add index for cron job queries (find unprocessed scheduled notifications)
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_pending
ON scheduled_notifications(scheduled_for)
WHERE sent = FALSE;

-- Add index for finding notifications that need push delivery
CREATE INDEX IF NOT EXISTS idx_notifications_push_pending
ON notifications(created_at)
WHERE push_sent_at IS NULL AND push_error IS NULL;

-- Add index for finding notifications that need email delivery
CREATE INDEX IF NOT EXISTS idx_notifications_email_pending
ON notifications(created_at)
WHERE email_sent_at IS NULL AND email_error IS NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN notifications.push_sent_at IS 'Timestamp when push notification was successfully sent';
COMMENT ON COLUMN notifications.email_sent_at IS 'Timestamp when email notification was successfully sent';
COMMENT ON COLUMN notifications.push_error IS 'Error message if push notification failed';
COMMENT ON COLUMN notifications.email_error IS 'Error message if email notification failed';
