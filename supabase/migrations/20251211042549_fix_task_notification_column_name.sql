-- Fix task notification trigger to use correct column name
-- The trigger was referencing NEW.task_title but the column is task_name

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
          WHEN v_is_overdue THEN 'Task "' || NEW.task_name || '" is overdue'
          ELSE 'Task "' || NEW.task_name || '" is due today'
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
