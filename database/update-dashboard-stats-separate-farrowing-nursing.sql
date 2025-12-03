-- Update dashboard stats to separate farrowing vs nursing phases
-- Farrowing = last 0-2 days (active birth/immediate post-birth)
-- Nursing = 3-28 days (past farrowing, nursing piglets until weaning)

CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  v_today DATE := CURRENT_DATE;
  v_seven_days_from_now DATE := v_today + INTERVAL '7 days';
  v_two_days_ago DATE := v_today - INTERVAL '2 days';
  v_twenty_eight_days_ago DATE := v_today - INTERVAL '28 days';
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

    -- UPDATED: Currently farrowing (0-2 days post-birth, active farrowing phase)
    'currentlyFarrowing', (
      SELECT COUNT(DISTINCT sow_id)
      FROM farrowings
      WHERE user_id = p_user_id
      AND actual_farrowing_date IS NOT NULL
      AND moved_out_of_farrowing_date IS NULL
      AND actual_farrowing_date >= v_two_days_ago
      AND actual_farrowing_date <= v_today
    ),

    -- NEW: Currently nursing (3-28 days post-birth, past farrowing phase)
    'currentlyNursing', (
      SELECT COUNT(DISTINCT sow_id)
      FROM farrowings
      WHERE user_id = p_user_id
      AND actual_farrowing_date IS NOT NULL
      AND moved_out_of_farrowing_date IS NULL
      AND actual_farrowing_date < v_two_days_ago
      AND actual_farrowing_date >= v_twenty_eight_days_ago
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

    -- Bred sows (matrix treatments with breeding_date)
    'bredSows', (
      SELECT COUNT(DISTINCT sow_id)
      FROM matrix_treatments
      WHERE user_id = p_user_id
      AND bred = true
      AND breeding_date IS NOT NULL
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

COMMENT ON FUNCTION get_dashboard_stats IS 'Returns all dashboard statistics in a single JSON response - now separates farrowing (0-2 days) from nursing (3-28 days)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Dashboard stats function updated successfully!';
  RAISE NOTICE 'New stats:';
  RAISE NOTICE '  - currentlyFarrowing: Sows 0-2 days post-birth (active farrowing)';
  RAISE NOTICE '  - currentlyNursing: Sows 3-28 days post-birth (nursing phase)';
END $$;
