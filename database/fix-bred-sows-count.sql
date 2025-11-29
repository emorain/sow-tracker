-- Fix: Update get_dashboard_stats to count bred sows from breeding_attempts
-- The bred sows count was only looking at matrix_treatments, but breeding happens via breeding_attempts

CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  v_today DATE := CURRENT_DATE;
  v_seven_days_from_now DATE := v_today + INTERVAL '7 days';
  v_twenty_one_days_ago DATE := v_today - INTERVAL '21 days';
BEGIN
  SELECT json_build_object(
    -- Sow counts
    'totalSows', (
      SELECT COUNT(*)
      FROM sows
      WHERE user_id = p_user_id
    ),
    'activeSows', (
      SELECT COUNT(*)
      FROM sows
      WHERE user_id = p_user_id
      AND status = 'active'
    ),

    -- Boar counts
    'totalBoars', (
      SELECT COUNT(*)
      FROM boars
      WHERE user_id = p_user_id
    ),
    'activeBoars', (
      SELECT COUNT(*)
      FROM boars
      WHERE user_id = p_user_id
      AND status = 'active'
    ),

    -- Piglet counts
    'nursingPiglets', (
      SELECT COUNT(*)
      FROM piglets
      WHERE user_id = p_user_id
      AND status = 'nursing'
    ),
    'weanedPiglets', (
      SELECT COUNT(*)
      FROM piglets
      WHERE user_id = p_user_id
      AND status = 'weaned'
    ),

    -- Currently farrowing (unique sows with active farrowings in last 21 days)
    'currentlyFarrowing', (
      SELECT COUNT(DISTINCT sow_id)
      FROM farrowings
      WHERE user_id = p_user_id
      AND actual_farrowing_date IS NOT NULL
      AND moved_out_of_farrowing_date IS NULL
      AND actual_farrowing_date >= v_twenty_one_days_ago
    ),

    -- Expected heat this week (matrix treatments)
    'expectedHeatThisWeek', (
      SELECT COUNT(DISTINCT sow_id)
      FROM matrix_treatments
      WHERE user_id = p_user_id
      AND expected_heat_date >= v_today
      AND expected_heat_date <= v_seven_days_from_now
      AND actual_heat_date IS NULL
    ),

    -- Bred sows (from breeding_attempts, not yet farrowed)
    -- A sow is considered "bred" if she has a breeding attempt and no associated farrowing yet
    'bredSows', (
      SELECT COUNT(DISTINCT ba.sow_id)
      FROM breeding_attempts ba
      WHERE ba.user_id = p_user_id
      AND NOT EXISTS (
        SELECT 1
        FROM farrowings f
        WHERE f.breeding_attempt_id = ba.id
        AND f.actual_farrowing_date IS NOT NULL
      )
    ),

    -- Task counts
    'pendingTasks', (
      SELECT COUNT(*)
      FROM scheduled_tasks
      WHERE user_id = p_user_id
      AND is_completed = false
    ),
    'overdueTasks', (
      SELECT COUNT(*)
      FROM scheduled_tasks
      WHERE user_id = p_user_id
      AND is_completed = false
      AND due_date < v_today
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_stats TO authenticated;

COMMENT ON FUNCTION get_dashboard_stats IS 'Returns all dashboard statistics in a single JSON response - eliminates 12 separate queries';
