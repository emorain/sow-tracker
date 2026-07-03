-- P1 (correction paths, part 2): the FK breeding_attempts.farrowing_id ->
-- farrowings.id was NO ACTION, so deleting a farrowing that a breeding_attempt
-- pointed at was rejected outright. That means deleting a confirmed-pregnant
-- sow's farrowing failed before any reset logic could run, and the
-- reset_breeding_attempt_on_farrowing_delete trigger could never fire.
--
-- Switch it to ON DELETE SET NULL: deleting a farrowing now auto-detaches the
-- back-reference, the AFTER DELETE trigger reverts the attempt's result, and
-- mark_return_to_heat can delete the pending farrowing cleanly.

ALTER TABLE public.breeding_attempts
  DROP CONSTRAINT breeding_attempts_farrowing_id_fkey;

ALTER TABLE public.breeding_attempts
  ADD CONSTRAINT breeding_attempts_farrowing_id_fkey
  FOREIGN KEY (farrowing_id) REFERENCES public.farrowings(id) ON DELETE SET NULL;
