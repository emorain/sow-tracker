-- P1: Correction paths must keep breeding_attempts consistent.
--
-- Two bugs from the audit:
--  1. Deleting a farrowing (SowDetailModal) left its linked breeding_attempt
--     pointing at a now-deleted farrowing and still marked 'pregnant'/'farrowed'.
--  2. The "returned to heat" quick action (sows page) deleted farrowings but
--     never set the attempt's result, and deleted ALL of the sow's not-yet-
--     farrowed farrowings, potentially removing a legitimate pending pregnancy.

-- 1. When a farrowing is deleted, detach and revert its breeding_attempt.
CREATE OR REPLACE FUNCTION public.reset_breeding_attempt_on_farrowing_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.breeding_attempt_id IS NOT NULL THEN
    UPDATE breeding_attempts
    SET farrowing_id = NULL,
        result = CASE WHEN result IN ('pregnant', 'farrowed') THEN 'pending' ELSE result END
    WHERE id = OLD.breeding_attempt_id;
  END IF;
  RETURN OLD;
END;
$function$;

DROP TRIGGER IF EXISTS trg_reset_breeding_attempt_on_farrowing_delete ON public.farrowings;
CREATE TRIGGER trg_reset_breeding_attempt_on_farrowing_delete
  AFTER DELETE ON public.farrowings
  FOR EACH ROW EXECUTE FUNCTION public.reset_breeding_attempt_on_farrowing_delete();

-- 2. Proper "returned to heat" for the sow-list quick action: mark the sow's
--    latest active breeding attempt as returned_to_heat and remove only that
--    attempt's not-yet-farrowed farrowing.
CREATE OR REPLACE FUNCTION public.mark_return_to_heat(
  p_sow_id uuid,
  p_organization_id uuid
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_ba uuid;
BEGIN
  SELECT id INTO v_ba
  FROM breeding_attempts
  WHERE sow_id = p_sow_id
    AND organization_id = p_organization_id
    AND result IN ('pending', 'pregnant')
  ORDER BY breeding_date DESC
  LIMIT 1;

  IF v_ba IS NULL THEN
    RAISE EXCEPTION 'No active breeding attempt to return to heat for this sow';
  END IF;

  -- Remove the not-yet-farrowed farrowing tied to this attempt (the delete
  -- trigger above would revert the attempt to 'pending'; we override below).
  DELETE FROM farrowings
  WHERE breeding_attempt_id = v_ba
    AND organization_id = p_organization_id
    AND actual_farrowing_date IS NULL;

  UPDATE breeding_attempts
  SET result = 'returned_to_heat',
      pregnancy_confirmed = false,
      pregnancy_check_date = CURRENT_DATE,
      farrowing_id = NULL
  WHERE id = v_ba;

  RETURN v_ba;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.mark_return_to_heat(uuid,uuid) TO authenticated;
