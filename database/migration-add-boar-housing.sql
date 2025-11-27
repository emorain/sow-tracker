-- Migration: Add Housing Tracking for Boars
-- Adds housing_unit_id and location history tracking for boars

-- Add housing_unit_id to boars table
ALTER TABLE boars
ADD COLUMN IF NOT EXISTS housing_unit_id UUID REFERENCES housing_units(id) ON DELETE SET NULL;

-- Add user_id to boars table for multi-user support (if not already present)
ALTER TABLE boars
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_boars_housing_unit ON boars(housing_unit_id);
CREATE INDEX IF NOT EXISTS idx_boars_user ON boars(user_id);

-- Create location history table for boars
CREATE TABLE IF NOT EXISTS boar_location_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    boar_id UUID NOT NULL REFERENCES boars(id) ON DELETE CASCADE,
    housing_unit_id UUID REFERENCES housing_units(id) ON DELETE SET NULL,
    moved_in_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    moved_out_date TIMESTAMP WITH TIME ZONE,
    reason VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for boar location history
CREATE INDEX IF NOT EXISTS idx_boar_location_history_boar ON boar_location_history(boar_id);
CREATE INDEX IF NOT EXISTS idx_boar_location_history_housing ON boar_location_history(housing_unit_id);
CREATE INDEX IF NOT EXISTS idx_boar_location_history_dates ON boar_location_history(moved_in_date, moved_out_date);

-- Create trigger function to track boar housing changes
CREATE OR REPLACE FUNCTION track_boar_housing_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- When housing_unit_id changes
    IF (TG_OP = 'UPDATE' AND OLD.housing_unit_id IS DISTINCT FROM NEW.housing_unit_id) THEN
        -- Close out the old location if there was one
        IF OLD.housing_unit_id IS NOT NULL THEN
            UPDATE boar_location_history
            SET moved_out_date = NOW()
            WHERE boar_id = OLD.id
              AND housing_unit_id = OLD.housing_unit_id
              AND moved_out_date IS NULL;
        END IF;

        -- Create new location record if moving to a new location
        IF NEW.housing_unit_id IS NOT NULL THEN
            INSERT INTO boar_location_history (boar_id, housing_unit_id)
            VALUES (NEW.id, NEW.housing_unit_id);
        END IF;
    END IF;

    -- When a new boar is created with a housing_unit_id
    IF (TG_OP = 'INSERT' AND NEW.housing_unit_id IS NOT NULL) THEN
        INSERT INTO boar_location_history (boar_id, housing_unit_id)
        VALUES (NEW.id, NEW.housing_unit_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for boar housing changes
DROP TRIGGER IF EXISTS boar_housing_change_trigger ON boars;
CREATE TRIGGER boar_housing_change_trigger
    AFTER INSERT OR UPDATE OF housing_unit_id ON boars
    FOR EACH ROW
    EXECUTE FUNCTION track_boar_housing_changes();

-- Update housing_unit_occupancy view to include boars
-- First, drop the existing view
DROP VIEW IF EXISTS housing_unit_occupancy;

-- Recreate the view with boar counts
CREATE OR REPLACE VIEW housing_unit_occupancy AS
SELECT
    hu.id,
    hu.name,
    hu.pen_number,
    hu.type,
    hu.building_name,
    hu.square_footage,
    hu.max_capacity,
    hu.notes,
    hu.user_id,
    COALESCE(sow_counts.count, 0) AS current_sows,
    COALESCE(boar_counts.count, 0) AS current_boars,
    COALESCE(sow_counts.count, 0) + COALESCE(boar_counts.count, 0) AS total_animals,
    CASE
        WHEN hu.square_footage IS NOT NULL AND (COALESCE(sow_counts.count, 0) + COALESCE(boar_counts.count, 0)) > 0
        THEN ROUND(hu.square_footage::NUMERIC / (COALESCE(sow_counts.count, 0) + COALESCE(boar_counts.count, 0)), 2)
        ELSE NULL
    END AS sq_ft_per_animal,
    CASE
        WHEN hu.type = 'gestation' AND hu.square_footage IS NOT NULL AND COALESCE(sow_counts.count, 0) > 0
        THEN (hu.square_footage / COALESCE(sow_counts.count, 0)) >= 24
        ELSE NULL
    END AS is_compliant
FROM housing_units hu
LEFT JOIN (
    SELECT housing_unit_id, COUNT(*) as count
    FROM sows
    WHERE housing_unit_id IS NOT NULL
    GROUP BY housing_unit_id
) sow_counts ON hu.id = sow_counts.housing_unit_id
LEFT JOIN (
    SELECT housing_unit_id, COUNT(*) as count
    FROM boars
    WHERE housing_unit_id IS NOT NULL
    GROUP BY housing_unit_id
) boar_counts ON hu.id = boar_counts.housing_unit_id;

-- Add RLS policies for boar_location_history
ALTER TABLE boar_location_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own boar location history
CREATE POLICY boar_location_history_select ON boar_location_history
    FOR SELECT
    USING (
        boar_id IN (
            SELECT id FROM boars WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can insert their own boar location history
CREATE POLICY boar_location_history_insert ON boar_location_history
    FOR INSERT
    WITH CHECK (
        boar_id IN (
            SELECT id FROM boars WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can update their own boar location history
CREATE POLICY boar_location_history_update ON boar_location_history
    FOR UPDATE
    USING (
        boar_id IN (
            SELECT id FROM boars WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can delete their own boar location history
CREATE POLICY boar_location_history_delete ON boar_location_history
    FOR DELETE
    USING (
        boar_id IN (
            SELECT id FROM boars WHERE user_id = auth.uid()
        )
    );
