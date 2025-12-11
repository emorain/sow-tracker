-- Fix notification column name inconsistencies
-- The notifications table uses 'body' but triggers were using 'message'
-- This migration updates the triggers to use the correct column names

-- ========================================
-- 1. Update send_breeding_notification function
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
        body,
        action_url,
        related_type,
        related_id
      ) VALUES (
        NEW.user_id,
        'breeding',
        'New Breeding Recorded',
        'Sow ' || v_sow_ear_tag || ' bred with boar ' || v_boar_ear_tag,
        '/sows',
        'breeding_attempt',
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 2. Update schedule_farrowing_reminders function
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
            organization_id,
            type,
            title,
            body,
            related_type,
            related_id,
            action_url,
            scheduled_for,
            sent
          ) VALUES (
            NEW.user_id,
            NEW.organization_id,
            'farrowing',
            'Farrowing Alert: ' || v_sow_ear_tag,
            'Sow ' || v_sow_ear_tag || ' is expected to farrow in ' || v_day || ' day' || CASE WHEN v_day != 1 THEN 's' ELSE '' END,
            'farrowing',
            NEW.id,
            '/farrowings/active',
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

-- ========================================
-- 3. Update schedule_pregnancy_check_reminder function
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
  v_org_id UUID;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.pregnancy_check_date IS NOT NULL THEN
    -- Get sow ear tag
    SELECT ear_tag INTO v_sow_ear_tag FROM sows WHERE id = NEW.sow_id;

    -- Get organization_id
    SELECT organization_id INTO v_org_id
    FROM organization_members
    WHERE user_id = NEW.user_id AND is_active = true
    LIMIT 1;

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
            organization_id,
            type,
            title,
            body,
            related_type,
            related_id,
            action_url,
            scheduled_for,
            sent
          ) VALUES (
            NEW.user_id,
            v_org_id,
            'pregnancy_check',
            'Pregnancy Check Due: ' || v_sow_ear_tag,
            'Sow ' || v_sow_ear_tag || ' pregnancy check is due in ' || v_day || ' day' || CASE WHEN v_day != 1 THEN 's' ELSE '' END,
            'breeding_attempt',
            NEW.id,
            '/sows',
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

-- ========================================
-- 4. Update send_weaning_notification function
-- ========================================

CREATE OR REPLACE FUNCTION send_weaning_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_farrowing_id UUID;
  v_sow_ear_tag VARCHAR(50);
  v_user_id UUID;
  v_org_id UUID;
  v_notify_enabled BOOLEAN;
  v_weaned_count INTEGER;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.weaned_date IS NULL AND NEW.weaned_date IS NOT NULL THEN
    -- Get farrowing and sow info
    SELECT f.id, f.user_id, f.organization_id, s.ear_tag
    INTO v_farrowing_id, v_user_id, v_org_id, v_sow_ear_tag
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
        organization_id,
        type,
        title,
        body,
        related_type,
        related_id,
        action_url
      ) VALUES (
        v_user_id,
        v_org_id,
        'weaning',
        'Piglets Weaned: ' || v_sow_ear_tag,
        v_weaned_count || ' piglet' || CASE WHEN v_weaned_count != 1 THEN 's' ELSE '' END || ' weaned from ' || v_sow_ear_tag,
        'farrowing',
        v_farrowing_id,
        '/piglets/weaned'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 5. Update send_task_due_notification function
-- ========================================

CREATE OR REPLACE FUNCTION send_task_due_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_notify_enabled BOOLEAN;
  v_is_overdue BOOLEAN;
  v_org_id UUID;
BEGIN
  IF TG_OP = 'INSERT' AND NOT NEW.is_completed THEN
    -- Check if task is due today or overdue
    v_is_overdue := NEW.due_date < CURRENT_DATE;

    -- Get organization_id
    SELECT organization_id INTO v_org_id
    FROM organization_members
    WHERE user_id = NEW.user_id AND is_active = true
    LIMIT 1;

    -- Get user's notification preferences
    SELECT notify_tasks INTO v_notify_enabled
    FROM notification_preferences
    WHERE user_id = NEW.user_id;

    v_notify_enabled := COALESCE(v_notify_enabled, TRUE);

    -- Send notification for tasks due today or overdue
    IF v_notify_enabled AND (NEW.due_date <= CURRENT_DATE) THEN
      INSERT INTO notifications (
        user_id,
        organization_id,
        type,
        title,
        body,
        related_type,
        related_id,
        action_url
      ) VALUES (
        NEW.user_id,
        v_org_id,
        'task',
        CASE WHEN v_is_overdue THEN 'Overdue Task' ELSE 'Task Reminder' END,
        CASE
          WHEN v_is_overdue THEN 'Task "' || NEW.task_title || '" is overdue'
          ELSE 'Task "' || NEW.task_title || '" is due today'
        END,
        'task',
        NEW.id,
        '/tasks'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 6. Update send_health_record_notification function
-- ========================================

CREATE OR REPLACE FUNCTION send_health_record_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_animal_ear_tag VARCHAR(50);
  v_notify_enabled BOOLEAN;
  v_org_id UUID;
  v_related_type VARCHAR(50);
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get animal ear tag (check both sows and boars)
    IF NEW.sow_id IS NOT NULL THEN
      SELECT ear_tag INTO v_animal_ear_tag FROM sows WHERE id = NEW.sow_id;
      v_related_type := 'sow';
    ELSIF NEW.boar_id IS NOT NULL THEN
      SELECT ear_tag INTO v_animal_ear_tag FROM boars WHERE id = NEW.boar_id;
      v_related_type := 'boar';
    END IF;

    -- Get organization_id
    SELECT organization_id INTO v_org_id
    FROM organization_members
    WHERE user_id = NEW.user_id AND is_active = true
    LIMIT 1;

    -- Get user's notification preferences
    SELECT notify_health_records INTO v_notify_enabled
    FROM notification_preferences
    WHERE user_id = NEW.user_id;

    v_notify_enabled := COALESCE(v_notify_enabled, TRUE);

    IF v_notify_enabled THEN
      INSERT INTO notifications (
        user_id,
        organization_id,
        type,
        title,
        body,
        related_type,
        related_id,
        action_url
      ) VALUES (
        NEW.user_id,
        v_org_id,
        'health',
        'Health Record: ' || COALESCE(v_animal_ear_tag, 'Animal'),
        'New ' || NEW.record_type || ' record added for ' || COALESCE(v_animal_ear_tag, 'animal'),
        v_related_type,
        NEW.id,
        '/health'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. Update process_scheduled_notifications function
-- ========================================

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
      organization_id,
      type,
      title,
      body,
      related_type,
      related_id,
      action_url
    ) VALUES (
      v_notification.user_id,
      v_notification.organization_id,
      v_notification.type,
      v_notification.title,
      v_notification.body,
      v_notification.related_type,
      v_notification.related_id,
      v_notification.action_url
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
