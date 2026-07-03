-- P1: Transactional pregnancy confirmation.
--
-- PregnancyCheckModal previously did two separate awaits: insert a farrowing,
-- then update the breeding_attempt. If the second failed, a farrowing existed
-- but the attempt stayed 'pending' — the sow read as both awaiting-check AND
-- pregnant. This RPC does both in one transaction (a plpgsql function is atomic:
-- any error rolls back the whole thing).
--
-- SECURITY INVOKER: runs as the caller so RLS on farrowings / breeding_attempts
-- enforces org scoping. The caller must already have insert/update rights, which
-- the org-scoped policies grant to authenticated members.

CREATE OR REPLACE FUNCTION public.confirm_pregnancy(
  p_breeding_attempt_id uuid,
  p_sow_id uuid,
  p_organization_id uuid,
  p_breeding_date date,
  p_expected_farrowing_date date,
  p_breeding_method text,
  p_boar_id uuid,
  p_check_date date,
  p_notes text
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_farrowing_id uuid;
BEGIN
  INSERT INTO farrowings (
    user_id, organization_id, sow_id, breeding_date, expected_farrowing_date,
    breeding_method, boar_id, breeding_attempt_id, notes
  ) VALUES (
    auth.uid(), p_organization_id, p_sow_id, p_breeding_date, p_expected_farrowing_date,
    p_breeding_method, p_boar_id, p_breeding_attempt_id,
    COALESCE(NULLIF(p_notes, ''), 'Pregnancy confirmed')
  )
  RETURNING id INTO v_farrowing_id;

  UPDATE breeding_attempts
  SET pregnancy_confirmed = true,
      pregnancy_check_date = p_check_date,
      result = 'pregnant',
      farrowing_id = v_farrowing_id,
      notes = CASE
                WHEN NULLIF(p_notes, '') IS NOT NULL
                  THEN p_notes || E'\n\nPregnancy confirmed on ' || p_check_date
                ELSE 'Pregnancy confirmed on ' || p_check_date
              END
  WHERE id = p_breeding_attempt_id
    AND organization_id = p_organization_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Breeding attempt % not found in organization %', p_breeding_attempt_id, p_organization_id;
  END IF;

  RETURN v_farrowing_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.confirm_pregnancy(uuid,uuid,uuid,date,date,text,uuid,date,text) TO authenticated;
