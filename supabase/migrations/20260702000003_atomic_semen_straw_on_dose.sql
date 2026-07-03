-- P1: Atomic, race-free semen straw inventory.
--
-- Model (confirmed with farm owner): ONE straw is consumed per AI dose /
-- insemination, NOT at breeding-attempt creation. Previously the app decremented
-- straws in JS in three places (RecordBreedingForm, BulkBreedingForm, AIDoseModal)
-- via read-modify-write, which (a) double-counted — breeding creation AND each
-- dose both decremented — and (b) raced under concurrent use, and (c) never
-- restored straws when a dose/breeding was deleted.
--
-- This moves the single source of truth into the database: a trigger on ai_doses
-- decrements exactly one straw per dose atomically, and restores one on delete
-- (so cascade-deleting a breeding/sow returns its straws). The JS decrements are
-- removed from the app in the same change.

CREATE OR REPLACE FUNCTION public.adjust_semen_straw_on_dose()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.boar_id IS NOT NULL THEN
      UPDATE boars
        SET semen_straws = GREATEST(0, COALESCE(semen_straws, 0) - 1),
            status = CASE
                       WHEN COALESCE(semen_straws, 0) - 1 <= 0 THEN 'depleted'
                       ELSE status
                     END
        WHERE id = NEW.boar_id
          AND boar_type = 'ai_semen';
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.boar_id IS NOT NULL THEN
      UPDATE boars
        SET semen_straws = COALESCE(semen_straws, 0) + 1,
            -- A deleted dose frees a straw; un-deplete if it was depleted.
            status = CASE
                       WHEN status = 'depleted' THEN 'active'
                       ELSE status
                     END
        WHERE id = OLD.boar_id
          AND boar_type = 'ai_semen';
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS trg_adjust_straw_on_dose_insert ON public.ai_doses;
CREATE TRIGGER trg_adjust_straw_on_dose_insert
  AFTER INSERT ON public.ai_doses
  FOR EACH ROW EXECUTE FUNCTION public.adjust_semen_straw_on_dose();

DROP TRIGGER IF EXISTS trg_adjust_straw_on_dose_delete ON public.ai_doses;
CREATE TRIGGER trg_adjust_straw_on_dose_delete
  AFTER DELETE ON public.ai_doses
  FOR EACH ROW EXECUTE FUNCTION public.adjust_semen_straw_on_dose();

-- Retire the old straw decrement that fired on farrowing creation. It was a
-- hidden fourth decrement path (trigger_decrement_semen on farrowings): every
-- AI farrowing consumed a straw, on top of the JS decrements. Wrong under the
-- per-dose model, so drop the trigger and its function.
DROP TRIGGER IF EXISTS trigger_decrement_semen ON public.farrowings;
DROP FUNCTION IF EXISTS public.decrement_semen_inventory();
