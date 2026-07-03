-- P1: Transactional weaning.
--
-- WeanLitterModal looped per-piglet updates, then inserted any new piglets, then
-- stamped the farrowing's moved_out_of_farrowing_date — as separate awaits. A
-- failure partway left a half-weaned litter (some piglets weaned, farrowing still
-- open, sow still reads as nursing) and a retry could double-create piglets. The
-- already-weaned guard was also a TOCTOU check that could race two concurrent
-- weans.
--
-- This RPC does the whole wean in one transaction, locks the farrowing row
-- (FOR UPDATE) so concurrent weans serialize, and re-checks the already-weaned
-- guard under that lock.

CREATE OR REPLACE FUNCTION public.wean_litter(
  p_farrowing_id uuid,
  p_organization_id uuid,
  p_weaning_date date,
  p_housing_unit_id uuid,
  p_piglets jsonb
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_moved date;
  v_piglet jsonb;
  v_ear_tag text;
  v_piglet_id uuid;
  v_updated int := 0;
  v_created int := 0;
BEGIN
  -- Lock the farrowing and re-check the weaned guard under the lock.
  SELECT moved_out_of_farrowing_date INTO v_moved
  FROM farrowings
  WHERE id = p_farrowing_id AND organization_id = p_organization_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Farrowing % not found in organization %', p_farrowing_id, p_organization_id;
  END IF;
  IF v_moved IS NOT NULL THEN
    RAISE EXCEPTION 'This litter has already been weaned';
  END IF;

  IF p_piglets IS NOT NULL THEN
    FOR v_piglet IN SELECT * FROM jsonb_array_elements(p_piglets)
    LOOP
      v_piglet_id := NULLIF(v_piglet->>'id', '')::uuid;

      IF v_piglet_id IS NOT NULL THEN
        -- Existing nursing piglet -> weaned
        UPDATE piglets
        SET weaning_weight = NULLIF(v_piglet->>'weaning_weight', '')::numeric,
            weaned_date = p_weaning_date,
            status = 'weaned',
            housing_unit_id = p_housing_unit_id,
            name = NULLIF(v_piglet->>'name', ''),
            ear_tag = NULLIF(v_piglet->>'ear_tag', ''),
            right_ear_notch = NULLIF(v_piglet->>'right_ear_notch', '')::int,
            left_ear_notch = NULLIF(v_piglet->>'left_ear_notch', '')::int,
            birth_weight = NULLIF(v_piglet->>'birth_weight', '')::numeric,
            sex = COALESCE(NULLIF(v_piglet->>'sex', ''), 'unknown')
        WHERE id = v_piglet_id AND organization_id = p_organization_id;
        IF FOUND THEN
          v_updated := v_updated + 1;
        END IF;
      ELSE
        -- New piglet materialized at weaning time
        v_ear_tag := NULLIF(TRIM(COALESCE(v_piglet->>'ear_tag', '')), '');
        IF v_ear_tag IS NULL
           AND NULLIF(v_piglet->>'right_ear_notch', '') IS NULL
           AND NULLIF(v_piglet->>'left_ear_notch', '') IS NULL THEN
          v_ear_tag := 'PIG-' || to_char(now(), 'YYYYMMDD') || '-'
                       || lpad((floor(random() * 10000))::int::text, 4, '0');
        END IF;

        INSERT INTO piglets (
          user_id, organization_id, farrowing_id, name, ear_tag,
          right_ear_notch, left_ear_notch, birth_weight, weaning_weight,
          sex, status, weaned_date, housing_unit_id
        ) VALUES (
          auth.uid(), p_organization_id, p_farrowing_id,
          NULLIF(v_piglet->>'name', ''), v_ear_tag,
          NULLIF(v_piglet->>'right_ear_notch', '')::int,
          NULLIF(v_piglet->>'left_ear_notch', '')::int,
          NULLIF(v_piglet->>'birth_weight', '')::numeric,
          NULLIF(v_piglet->>'weaning_weight', '')::numeric,
          COALESCE(NULLIF(v_piglet->>'sex', ''), 'unknown'),
          'weaned', p_weaning_date, p_housing_unit_id
        );
        v_created := v_created + 1;
      END IF;
    END LOOP;
  END IF;

  UPDATE farrowings
  SET moved_out_of_farrowing_date = p_weaning_date
  WHERE id = p_farrowing_id AND organization_id = p_organization_id;

  RETURN jsonb_build_object('updated', v_updated, 'created', v_created);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.wean_litter(uuid,uuid,date,uuid,jsonb) TO authenticated;
