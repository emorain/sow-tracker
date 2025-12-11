-- Fix breeding notification to handle NULL ear tags properly
-- The body column is NOT NULL, so we need to ensure we always have a value

CREATE OR REPLACE FUNCTION send_breeding_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_sow_ear_tag VARCHAR(50);
  v_boar_ear_tag VARCHAR(50);
  v_notify_enabled BOOLEAN;
  v_body TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get ear tags (with fallback for NULL)
    SELECT COALESCE(ear_tag, 'Unknown') INTO v_sow_ear_tag FROM sows WHERE id = NEW.sow_id;
    SELECT COALESCE(ear_tag, 'Unknown') INTO v_boar_ear_tag FROM boars WHERE id = NEW.boar_id;

    -- Get user's notification preferences
    SELECT notify_breeding INTO v_notify_enabled
    FROM notification_preferences
    WHERE user_id = NEW.user_id;

    -- Default to enabled if no preferences set
    v_notify_enabled := COALESCE(v_notify_enabled, TRUE);

    IF v_notify_enabled THEN
      -- Build body text with proper null handling
      v_body := 'Sow ' || COALESCE(v_sow_ear_tag, 'Unknown') || ' bred with boar ' || COALESCE(v_boar_ear_tag, 'Unknown');
      
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
        v_body,
        '/sows',
        'breeding_attempt',
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
