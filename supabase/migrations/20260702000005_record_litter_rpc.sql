-- P1: Transactional litter recording + atomic ear-notch litter counter.
--
-- RecordLitterForm did: insert/update farrowing -> insert piglets -> bump the
-- ear_notch_current_litter counter, as separate awaits. A failure mid-way left a
-- farrowing with no piglets (and a retry created a duplicate farrowing), and the
-- counter bump was a read-modify-write from stale client state, so two litters
-- recorded close together got the SAME litter number stamped on their piglets'
-- right ear notch (a traceability field).
--
-- This RPC does farrowing + piglets + counter in one transaction, and claims the
-- litter number atomically (UPDATE ... RETURNING) so concurrent litters can never
-- collide. Returns the farrowing id and the assigned litter number.

CREATE OR REPLACE FUNCTION public.record_litter(
  p_farrowing_id uuid,
  p_organization_id uuid,
  p_sow_id uuid,
  p_breeding_date date,
  p_actual_farrowing_date date,
  p_live_piglets int,
  p_stillborn int,
  p_mummified int,
  p_notes text,
  p_create_piglets boolean,
  p_piglets jsonb
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_farrowing_id uuid := p_farrowing_id;
  v_litter_number int;
  v_piglet jsonb;
  v_ear_tag text;
BEGIN
  -- 1. Farrowing: update existing or create new
  IF v_farrowing_id IS NULL THEN
    INSERT INTO farrowings (
      user_id, organization_id, sow_id, breeding_date, actual_farrowing_date,
      live_piglets, stillborn, mummified, notes
    ) VALUES (
      auth.uid(), p_organization_id, p_sow_id, p_breeding_date, p_actual_farrowing_date,
      COALESCE(p_live_piglets, 0), COALESCE(p_stillborn, 0), COALESCE(p_mummified, 0), p_notes
    )
    RETURNING id INTO v_farrowing_id;
  ELSE
    UPDATE farrowings
    SET actual_farrowing_date = p_actual_farrowing_date,
        live_piglets = COALESCE(p_live_piglets, 0),
        stillborn = COALESCE(p_stillborn, 0),
        mummified = COALESCE(p_mummified, 0),
        notes = p_notes
    WHERE id = v_farrowing_id
      AND organization_id = p_organization_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Farrowing % not found in organization %', v_farrowing_id, p_organization_id;
    END IF;
  END IF;

  -- 2. Individual piglets (optional)
  IF p_create_piglets AND p_piglets IS NOT NULL AND jsonb_array_length(p_piglets) > 0 THEN
    -- Atomically claim this litter's number and advance the counter.
    UPDATE farm_settings
    SET ear_notch_current_litter = COALESCE(ear_notch_current_litter, 1) + 1
    WHERE organization_id = p_organization_id
    RETURNING ear_notch_current_litter - 1 INTO v_litter_number;

    -- Org has no settings row yet: create one, claiming litter number 1.
    IF v_litter_number IS NULL THEN
      INSERT INTO farm_settings (user_id, organization_id, ear_notch_current_litter)
      VALUES (auth.uid(), p_organization_id, 2);
      v_litter_number := 1;
    END IF;

    FOR v_piglet IN SELECT * FROM jsonb_array_elements(p_piglets)
    LOOP
      v_ear_tag := NULLIF(TRIM(COALESCE(v_piglet->>'ear_tag', '')), '');
      -- Auto-generate an ear tag only when the piglet has no other identification.
      IF v_ear_tag IS NULL AND NULLIF(v_piglet->>'left_ear_notch', '') IS NULL THEN
        v_ear_tag := 'PIG-' || to_char(now(), 'YYYYMMDD') || '-'
                     || lpad((floor(random() * 10000))::int::text, 4, '0');
      END IF;

      INSERT INTO piglets (
        user_id, organization_id, farrowing_id, ear_tag,
        right_ear_notch, left_ear_notch, sex, birth_weight, status
      ) VALUES (
        auth.uid(), p_organization_id, v_farrowing_id, v_ear_tag,
        v_litter_number,                                        -- right notch = litter number
        NULLIF(v_piglet->>'left_ear_notch', '')::int,
        COALESCE(NULLIF(v_piglet->>'sex', ''), 'unknown'),
        NULLIF(v_piglet->>'birth_weight', '')::numeric,
        'nursing'
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object('farrowing_id', v_farrowing_id, 'litter_number', v_litter_number);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.record_litter(uuid,uuid,uuid,date,date,int,int,int,text,boolean,jsonb) TO authenticated;
