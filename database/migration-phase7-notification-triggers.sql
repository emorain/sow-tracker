-- Migration: Phase 7B - Notification Triggers
-- Automatically schedule notifications when farm events occur

-- ========================================
-- 1. Function: Schedule Farrowing Reminders
-- ========================================

CREATE OR REPLACE FUNCTION schedule_farrowing_reminders()
RETURNS TRIGGER AS $$
DECLARE
  v_sow_ear_tag VARCHAR(50);
  v_reminder_days INTEGER[];
  v_day INTEGER;
  v_scheduled_date TIMESTAMPTZ;
  v_notify_enabled BOOLEAN;
BEGIN
  -- Only schedule for new farrowings that are not completed
  IF TG_OP = 'INSERT' AND NEW.actual_farrowing_date IS NULL THEN
    -- Get sow ear tag
    SELECT ear_tag INTO v_sow_ear_tag
    FROM sows
    WHERE id = NEW.sow_id;

    -- Get user's notification preferences
    SELECT
      notify_farrowing,
      farrowing_reminder_days
    INTO v_notify_enabled, v_reminder_days
    FROM notification_preferences
    WHERE user_id = NEW.user_id;

    -- Default to enabled with [7,3,1] if no preferences set
    v_notify_enabled := COALESCE(v_notify_enabled, TRUE);
    v_reminder_days := COALESCE(v_reminder_days, ARRAY[7,3,1]);

    IF v_notify_enabled THEN
      -- Schedule reminders for each day
      FOREACH v_day IN ARRAY v_reminder_days
      LOOP
        v_scheduled_date := NEW.expected_farrowing_date - (v_day || ' days')::INTERVAL;

        -- Only schedule if in the future
        IF v_scheduled_date > NOW() THEN
          INSERT INTO scheduled_notifications (
            user_id,
            type,
            title,
            message,
            link_url,
            related_id,
            scheduled_for,
            sent
          ) VALUES (
            NEW.user_id,
            'farrowing',
            'Farrowing Alert: ' || v_sow_ear_tag,
            'Sow ' || v_sow_ear_tag || ' is expected to farrow in ' || v_day || ' day' || CASE WHEN v_day != 1 THEN 's' ELSE '' END,
            '/farrowings/active',
            NEW.id::TEXT,
            v_scheduled_date,
            FALSE
          );
        END IF;
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for farrowings
DROP TRIGGER IF EXISTS on_farrowing_created_schedule_reminders ON farrowings;
CREATE TRIGGER on_farrowing_created_schedule_reminders
  AFTER INSERT ON farrowings
  FOR EACH ROW
  EXECUTE FUNCTION schedule_farrowing_reminders();

-- ========================================
-- 2. Function: Send Breeding Notification
-- ========================================

CREATE OR REPLACE FUNCTION send_breeding_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_sow_ear_tag VARCHAR(50);
  v_boar_ear_tag VARCHAR(50);
  v_notify_enabled BOOLEAN;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get ear tags
    SELECT ear_tag INTO v_sow_ear_tag FROM sows WHERE id = NEW.sow_id;
    SELECT ear_tag INTO v_boar_ear_tag FROM boars WHERE id = NEW.boar_id;

    -- Get user's notification preferences
    SELECT notify_breeding INTO v_notify_enabled
    FROM notification_preferences
    WHERE user_id = NEW.user_id;

    -- Default to enabled if no preferences set
    v_notify_enabled := COALESCE(v_notify_enabled, TRUE);

    IF v_notify_enabled THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        link_url,
        related_id,
        sent_at
      ) VALUES (
        NEW.user_id,
        'breeding',
        'New Breeding Recorded',
        'Sow ' || v_sow_ear_tag || ' bred with boar ' || v_boar_ear_tag,
        '/sows',
        NEW.id::TEXT,
        NOW()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for breeding attempts
DROP TRIGGER IF EXISTS on_breeding_created_send_notification ON breeding_attempts;
CREATE TRIGGER on_breeding_created_send_notification
  AFTER INSERT ON breeding_attempts
  FOR EACH ROW
  EXECUTE FUNCTION send_breeding_notification();

-- ========================================
-- 3. Function: Schedule Pregnancy Check Reminder
-- ========================================

CREATE OR REPLACE FUNCTION schedule_pregnancy_check_reminder()
RETURNS TRIGGER AS $$
DECLARE
  v_sow_ear_tag VARCHAR(50);
  v_check_date DATE;
  v_reminder_days INTEGER[];
  v_day INTEGER;
  v_scheduled_date TIMESTAMPTZ;
  v_notify_enabled BOOLEAN;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.pregnancy_check_date IS NOT NULL THEN
    -- Get sow ear tag
    SELECT ear_tag INTO v_sow_ear_tag FROM sows WHERE id = NEW.sow_id;

    -- Get user's notification preferences
    SELECT
      notify_pregnancy_check,
      pregnancy_check_reminder_days
    INTO v_notify_enabled, v_reminder_days
    FROM notification_preferences
    WHERE user_id = NEW.user_id;

    v_notify_enabled := COALESCE(v_notify_enabled, TRUE);
    v_reminder_days := COALESCE(v_reminder_days, ARRAY[1]);

    IF v_notify_enabled THEN
      FOREACH v_day IN ARRAY v_reminder_days
      LOOP
        v_scheduled_date := NEW.pregnancy_check_date - (v_day || ' days')::INTERVAL;

        IF v_scheduled_date > NOW() THEN
          INSERT INTO scheduled_notifications (
            user_id,
            type,
            title,
            message,
            link_url,
            related_id,
            scheduled_for,
            sent
          ) VALUES (
            NEW.user_id,
            'pregnancy_check',
            'Pregnancy Check Due: ' || v_sow_ear_tag,
            'Sow ' || v_sow_ear_tag || ' pregnancy check is due in ' || v_day || ' day' || CASE WHEN v_day != 1 THEN 's' ELSE '' END,
            '/sows',
            NEW.id::TEXT,
            v_scheduled_date,
            FALSE
          );
        END IF;
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for breeding attempts with pregnancy check dates
DROP TRIGGER IF EXISTS on_breeding_with_check_date_schedule_reminder ON breeding_attempts;
CREATE TRIGGER on_breeding_with_check_date_schedule_reminder
  AFTER INSERT OR UPDATE OF pregnancy_check_date ON breeding_attempts
  FOR EACH ROW
  EXECUTE FUNCTION schedule_pregnancy_check_reminder();

-- ========================================
-- 4. Function: Send Weaning Notification
-- ========================================
-- Note: Weaning reminders can be added when piglets are weaned
-- For now, we'll skip auto-scheduling since weaning dates are on piglets, not farrowings

CREATE OR REPLACE FUNCTION send_weaning_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_farrowing_id UUID;
  v_sow_ear_tag VARCHAR(50);
  v_user_id UUID;
  v_notify_enabled BOOLEAN;
  v_weaned_count INTEGER;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.weaned_date IS NULL AND NEW.weaned_date IS NOT NULL THEN
    -- Get farrowing and sow info
    SELECT f.id, f.user_id, s.ear_tag
    INTO v_farrowing_id, v_user_id, v_sow_ear_tag
    FROM farrowings f
    JOIN sows s ON s.id = f.sow_id
    WHERE f.id = NEW.farrowing_id;

    -- Count how many piglets have been weaned from this farrowing
    SELECT COUNT(*) INTO v_weaned_count
    FROM piglets
    WHERE farrowing_id = v_farrowing_id
      AND weaned_date IS NOT NULL;

    -- Get user's notification preferences
    SELECT notify_weaning INTO v_notify_enabled
    FROM notification_preferences
    WHERE user_id = v_user_id;

    v_notify_enabled := COALESCE(v_notify_enabled, TRUE);

    IF v_notify_enabled THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        link_url,
        related_id,
        sent_at
      ) VALUES (
        v_user_id,
        'weaning',
        'Piglets Weaned: ' || v_sow_ear_tag,
        v_weaned_count || ' piglet' || CASE WHEN v_weaned_count != 1 THEN 's' ELSE '' END || ' weaned from ' || v_sow_ear_tag,
        '/piglets/weaned',
        v_farrowing_id::TEXT,
        NOW()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for piglets when weaned
DROP TRIGGER IF EXISTS on_piglet_weaned_send_notification ON piglets;
CREATE TRIGGER on_piglet_weaned_send_notification
  AFTER UPDATE OF weaned_date ON piglets
  FOR EACH ROW
  EXECUTE FUNCTION send_weaning_notification();

-- ========================================
-- 5. Function: Send Task Reminder
-- ========================================

CREATE OR REPLACE FUNCTION send_task_due_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_notify_enabled BOOLEAN;
  v_is_overdue BOOLEAN;
BEGIN
  IF TG_OP = 'INSERT' AND NOT NEW.is_completed THEN
    -- Check if task is due today or overdue
    v_is_overdue := NEW.due_date < CURRENT_DATE;

    -- Get user's notification preferences
    SELECT notify_tasks INTO v_notify_enabled
    FROM notification_preferences
    WHERE user_id = NEW.user_id;

    v_notify_enabled := COALESCE(v_notify_enabled, TRUE);

    -- Send notification for tasks due today or overdue
    IF v_notify_enabled AND (NEW.due_date <= CURRENT_DATE) THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        link_url,
        related_id,
        sent_at
      ) VALUES (
        NEW.user_id,
        'task',
        CASE WHEN v_is_overdue THEN 'Overdue Task' ELSE 'Task Reminder' END,
        CASE
          WHEN v_is_overdue THEN 'Task "' || NEW.task_title || '" is overdue'
          ELSE 'Task "' || NEW.task_title || '" is due today'
        END,
        '/tasks',
        NEW.id::TEXT,
        NOW()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tasks
DROP TRIGGER IF EXISTS on_task_created_send_reminder ON scheduled_tasks;
CREATE TRIGGER on_task_created_send_reminder
  AFTER INSERT ON scheduled_tasks
  FOR EACH ROW
  EXECUTE FUNCTION send_task_due_notification();

-- ========================================
-- 6. Function: Send Health Record Notification
-- ========================================

CREATE OR REPLACE FUNCTION send_health_record_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_animal_ear_tag VARCHAR(50);
  v_notify_enabled BOOLEAN;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get animal ear tag (check both sows and boars)
    IF NEW.sow_id IS NOT NULL THEN
      SELECT ear_tag INTO v_animal_ear_tag FROM sows WHERE id = NEW.sow_id;
    ELSIF NEW.boar_id IS NOT NULL THEN
      SELECT ear_tag INTO v_animal_ear_tag FROM boars WHERE id = NEW.boar_id;
    END IF;

    -- Get user's notification preferences
    SELECT notify_health_records INTO v_notify_enabled
    FROM notification_preferences
    WHERE user_id = NEW.user_id;

    v_notify_enabled := COALESCE(v_notify_enabled, TRUE);

    IF v_notify_enabled THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        link_url,
        related_id,
        sent_at
      ) VALUES (
        NEW.user_id,
        'health',
        'Health Record: ' || COALESCE(v_animal_ear_tag, 'Animal'),
        'New ' || NEW.record_type || ' record added for ' || COALESCE(v_animal_ear_tag, 'animal'),
        '/health',
        NEW.id::TEXT,
        NOW()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for health records
DROP TRIGGER IF EXISTS on_health_record_created_send_notification ON health_records;
CREATE TRIGGER on_health_record_created_send_notification
  AFTER INSERT ON health_records
  FOR EACH ROW
  EXECUTE FUNCTION send_health_record_notification();

-- ========================================
-- 7. Function: Process Scheduled Notifications
-- ========================================
-- This function should be called by a cron job or edge function

CREATE OR REPLACE FUNCTION process_scheduled_notifications()
RETURNS INTEGER AS $$
DECLARE
  v_notification RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Find all scheduled notifications that are due and haven't been sent
  FOR v_notification IN
    SELECT *
    FROM scheduled_notifications
    WHERE scheduled_for <= NOW()
      AND sent = FALSE
    ORDER BY scheduled_for ASC
    LIMIT 100  -- Process in batches
  LOOP
    -- Insert into notifications table
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      link_url,
      related_id,
      sent_at
    ) VALUES (
      v_notification.user_id,
      v_notification.type,
      v_notification.title,
      v_notification.message,
      v_notification.link_url,
      v_notification.related_id,
      NOW()
    );

    -- Mark as sent
    UPDATE scheduled_notifications
    SET sent = TRUE, sent_at = NOW()
    WHERE id = v_notification.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 8. Comments for documentation
-- ========================================

COMMENT ON FUNCTION schedule_farrowing_reminders() IS 'Automatically schedules reminder notifications when a new farrowing is recorded';
COMMENT ON FUNCTION send_breeding_notification() IS 'Sends immediate notification when a new breeding is recorded';
COMMENT ON FUNCTION schedule_pregnancy_check_reminder() IS 'Schedules reminder for pregnancy check dates';
COMMENT ON FUNCTION send_weaning_notification() IS 'Sends notification when piglets are weaned';
COMMENT ON FUNCTION send_task_due_notification() IS 'Sends notification for tasks that are due today or overdue';
COMMENT ON FUNCTION send_health_record_notification() IS 'Sends notification when a new health record is added';
COMMENT ON FUNCTION process_scheduled_notifications() IS 'Processes due scheduled notifications and sends them. Should be called periodically by a cron job.';

-- ========================================
-- 9. Grant permissions
-- ========================================

GRANT EXECUTE ON FUNCTION process_scheduled_notifications() TO authenticated;
