-- Retire animals, don't delete them: pedigree and history must never vanish.
--
-- Deleting an animal used to destroy pedigree (and, for a sow, cascade-delete
-- her piglets). The correct lifecycle for an animal that dies/leaves is a
-- status change (deceased/culled/sold) that KEEPS the record. Hard delete is
-- reserved for genuine data-entry mistakes — records with no offspring or
-- breeding history.

-- 1. Boars can now be marked 'deceased' (sows already could).
ALTER TABLE public.boars DROP CONSTRAINT IF EXISTS boars_status_check;
ALTER TABLE public.boars
  ADD CONSTRAINT boars_status_check
  CHECK (status::text = ANY (ARRAY['active','culled','sold','depleted','deceased']::text[]));

-- 2. Database backstop: refuse to delete an animal that has descendants or
--    breeding history, no matter which code path attempts it.
CREATE OR REPLACE FUNCTION public.prevent_delete_sow_with_history()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF EXISTS (SELECT 1 FROM farrowings WHERE sow_id = OLD.id)
     OR EXISTS (SELECT 1 FROM breeding_attempts WHERE sow_id = OLD.id)
     OR EXISTS (SELECT 1 FROM piglets WHERE dam_id = OLD.id) THEN
    RAISE EXCEPTION 'Cannot delete "%" — she has breeding or farrowing history. Mark her deceased to keep the records.',
      COALESCE(NULLIF(OLD.name, ''), OLD.ear_tag)
      USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_delete_boar_with_history()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF EXISTS (SELECT 1 FROM piglets WHERE sire_id = OLD.id)
     OR EXISTS (SELECT 1 FROM breeding_attempts WHERE boar_id = OLD.id)
     OR EXISTS (SELECT 1 FROM farrowings WHERE boar_id = OLD.id) THEN
    RAISE EXCEPTION 'Cannot delete "%" — it sired offspring or has breeding history. Mark it deceased/culled to keep the records.',
      COALESCE(NULLIF(OLD.name, ''), OLD.ear_tag)
      USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN OLD;
END;
$function$;

DROP TRIGGER IF EXISTS trg_prevent_delete_sow_with_history ON public.sows;
CREATE TRIGGER trg_prevent_delete_sow_with_history
  BEFORE DELETE ON public.sows
  FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_sow_with_history();

DROP TRIGGER IF EXISTS trg_prevent_delete_boar_with_history ON public.boars;
CREATE TRIGGER trg_prevent_delete_boar_with_history
  BEFORE DELETE ON public.boars
  FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_boar_with_history();

-- 3. Give delete_sow_cascade a clean, early failure (before it touches any
--    child rows) so the guard reads as a friendly message, not a raw FK error.
CREATE OR REPLACE FUNCTION public.delete_sow_cascade(p_sow_id uuid, p_organization_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM sows WHERE id = p_sow_id AND organization_id = p_organization_id
  ) THEN
    RAISE EXCEPTION 'Sow % not found in organization %', p_sow_id, p_organization_id;
  END IF;

  -- Protect pedigree/history: a sow that ever bred or farrowed is retired, not
  -- deleted. Only truly empty records (mistakes) may be removed.
  IF EXISTS (SELECT 1 FROM farrowings WHERE sow_id = p_sow_id)
     OR EXISTS (SELECT 1 FROM breeding_attempts WHERE sow_id = p_sow_id)
     OR EXISTS (SELECT 1 FROM piglets WHERE dam_id = p_sow_id) THEN
    RAISE EXCEPTION 'This sow has breeding or farrowing history. Mark her deceased to keep the records.'
      USING ERRCODE = 'restrict_violation';
  END IF;

  DELETE FROM matrix_treatments WHERE sow_id = p_sow_id;
  DELETE FROM sow_location_history WHERE sow_id = p_sow_id;
  DELETE FROM location_history WHERE sow_id = p_sow_id;
  DELETE FROM health_records WHERE sow_id = p_sow_id;
  DELETE FROM sow_transfer_requests WHERE sow_id = p_sow_id;
  DELETE FROM scheduled_tasks WHERE sow_id = p_sow_id;
  DELETE FROM sows WHERE id = p_sow_id;
END;
$function$;
