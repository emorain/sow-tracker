-- Migration: Add 'depleted' status for AI semen inventory management
-- This allows automatic hiding of AI semen with 0 straws while preserving breeding history

-- Step 1: Drop existing status constraint on boars table
ALTER TABLE boars
DROP CONSTRAINT IF EXISTS boars_status_check;

-- Step 2: Add new constraint with 'depleted' status
ALTER TABLE boars
ADD CONSTRAINT boars_status_check
CHECK (status IN ('active', 'culled', 'sold', 'depleted'));

-- Step 3: Add comment
COMMENT ON COLUMN boars.status IS 'Boar status: active (available for breeding), culled (removed from breeding), sold (sold to another farm), depleted (AI semen with 0 straws remaining)';

-- Step 4: Mark existing AI semen with 0 straws as depleted
UPDATE boars
SET status = 'depleted'
WHERE boar_type = 'ai_semen'
  AND semen_straws = 0
  AND status = 'active';
