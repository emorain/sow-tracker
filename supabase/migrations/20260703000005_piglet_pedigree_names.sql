-- Pedigree durability + honest AI-semen birth dates.
--
-- Problem: a piglet's sire/dam were stored only as IDs (piglets.sire_id ->
-- boars, dam_id -> sows, both ON DELETE SET NULL) and the *_name text columns
-- were never filled. Deleting a used-up AI-semen record (or an old sow) then
-- silently wiped the sire/dam from every offspring's pedigree.
--
-- Fix: denormalize the parent NAMES onto the piglet at insert, and backfill
-- existing rows, so pedigree survives the parent record being removed.

CREATE OR REPLACE FUNCTION public.set_piglet_pedigree()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_sow_id UUID;
  v_boar_id UUID;
BEGIN
  -- Pull the parents from the farrowing this piglet belongs to.
  SELECT sow_id, boar_id INTO v_sow_id, v_boar_id
  FROM farrowings
  WHERE id = NEW.farrowing_id;

  IF NEW.dam_id IS NULL THEN NEW.dam_id := v_sow_id; END IF;
  IF NEW.sire_id IS NULL THEN NEW.sire_id := v_boar_id; END IF;

  -- Capture the names too (denormalized). These persist even if the boar/sow
  -- record is later deleted, so the pedigree still reads correctly.
  IF NEW.dam_name IS NULL AND NEW.dam_id IS NOT NULL THEN
    SELECT COALESCE(NULLIF(name, ''), ear_tag) INTO NEW.dam_name FROM sows WHERE id = NEW.dam_id;
  END IF;
  IF NEW.sire_name IS NULL AND NEW.sire_id IS NOT NULL THEN
    SELECT COALESCE(NULLIF(name, ''), ear_tag) INTO NEW.sire_name FROM boars WHERE id = NEW.sire_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- Backfill existing piglets that have a parent id but no captured name.
UPDATE piglets p
SET sire_name = COALESCE(NULLIF(b.name, ''), b.ear_tag)
FROM boars b
WHERE p.sire_id = b.id AND p.sire_name IS NULL;

UPDATE piglets p
SET dam_name = COALESCE(NULLIF(s.name, ''), s.ear_tag)
FROM sows s
WHERE p.dam_id = s.id AND p.dam_name IS NULL;

-- A collected-semen boar's birth date is often unknown; the form was silently
-- defaulting it to "today", polluting pedigree/age. Allow it to be blank.
ALTER TABLE public.boars ALTER COLUMN birth_date DROP NOT NULL;
