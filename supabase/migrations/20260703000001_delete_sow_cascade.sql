-- Revamp slice 6: one correct, atomic sow cascade-delete.
--
-- The old delete lived inside SowDetailModal and (a) scoped the piglet delete by
-- user_id instead of organization_id (so it could orphan a teammate's piglets)
-- and (b) never deleted breeding_attempts / ai_doses. This RPC deletes the whole
-- dependency tree in one transaction, child-first, org-scoped.

CREATE OR REPLACE FUNCTION public.delete_sow_cascade(
  p_sow_id uuid,
  p_organization_id uuid
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM sows WHERE id = p_sow_id AND organization_id = p_organization_id
  ) THEN
    RAISE EXCEPTION 'Sow % not found in organization %', p_sow_id, p_organization_id;
  END IF;

  DELETE FROM piglets WHERE farrowing_id IN (SELECT id FROM farrowings WHERE sow_id = p_sow_id);
  DELETE FROM ai_doses WHERE breeding_attempt_id IN (SELECT id FROM breeding_attempts WHERE sow_id = p_sow_id);
  DELETE FROM farrowings WHERE sow_id = p_sow_id;          -- FK sets attempt.farrowing_id null
  DELETE FROM breeding_attempts WHERE sow_id = p_sow_id;
  DELETE FROM matrix_treatments WHERE sow_id = p_sow_id;
  DELETE FROM sow_location_history WHERE sow_id = p_sow_id;
  DELETE FROM location_history WHERE sow_id = p_sow_id;
  DELETE FROM health_records WHERE sow_id = p_sow_id;
  DELETE FROM sow_transfer_requests WHERE sow_id = p_sow_id;
  DELETE FROM scheduled_tasks WHERE sow_id = p_sow_id;
  DELETE FROM sows WHERE id = p_sow_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.delete_sow_cascade(uuid, uuid) TO authenticated;
