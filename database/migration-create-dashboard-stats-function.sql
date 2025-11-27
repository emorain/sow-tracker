-- Migration: Create get_dashboard_stats RPC function
-- This function returns all dashboard statistics in a single query
-- Performance improvement: 12 queries → 1 RPC call

-- ========================================
-- 1. CREATE RPC FUNCTION
-- ========================================

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

COMMENT ON FUNCTION get_dashboard_stats IS 'Returns all dashboard statistics in a single JSON response - eliminates 12 separate queries';

-- ========================================
-- 2. USAGE NOTES
-- ========================================

-- Call the function:
-- SELECT get_dashboard_stats('user-uuid-here');
--
-- Or from JavaScript/Supabase:
-- const { data } = await supabase.rpc('get_dashboard_stats', { p_user_id: user.id });
--
-- Performance comparison:
-- Before: 12 separate queries
-- After: 1 RPC call (all queries run in parallel within PostgreSQL)
-- Expected improvement: 3-5 seconds → <1 second
