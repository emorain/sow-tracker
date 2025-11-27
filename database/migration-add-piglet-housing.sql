-- Migration: Add Housing Tracking for Piglets
-- Adds housing_unit_id and location history tracking for piglets

-- Add housing_unit_id to piglets table
ALTER TABLE piglets
ADD COLUMN IF NOT EXISTS housing_unit_id UUID REFERENCES housing_units(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_piglets_housing_unit ON piglets(housing_unit_id);

-- Create location history table for piglets
CREATE TABLE IF NOT EXISTS piglet_location_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    piglet_id UUID NOT NULL REFERENCES piglets(id) ON DELETE CASCADE,
    housing_unit_id UUID REFERENCES housing_units(id) ON DELETE SET NULL,
    moved_in_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    moved_out_date TIMESTAMP WITH TIME ZONE,
    reason VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for piglet location history
CREATE INDEX IF NOT EXISTS idx_piglet_location_history_piglet ON piglet_location_history(piglet_id);
CREATE INDEX IF NOT EXISTS idx_piglet_location_history_housing ON piglet_location_history(housing_unit_id);
CREATE INDEX IF NOT EXISTS idx_piglet_location_history_dates ON piglet_location_history(moved_in_date, moved_out_date);

-- Create trigger function to track piglet housing changes
CREATE OR REPLACE FUNCTION track_piglet_housing_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- When housing_unit_id changes
    IF (TG_OP = 'UPDATE' AND OLD.housing_unit_id IS DISTINCT FROM NEW.housing_unit_id) THEN
        -- Close out the old location if there was one
        IF OLD.housing_unit_id IS NOT NULL THEN
            UPDATE piglet_location_history
            SET moved_out_date = NOW()
            WHERE piglet_id = OLD.id
              AND housing_unit_id = OLD.housing_unit_id
              AND moved_out_date IS NULL;
        END IF;

        -- Create new location record if moving to a new location
        IF NEW.housing_unit_id IS NOT NULL THEN
            INSERT INTO piglet_location_history (piglet_id, housing_unit_id)
            VALUES (NEW.id, NEW.housing_unit_id);
        END IF;
    END IF;

    -- When a new piglet is created with a housing_unit_id (shouldn't happen, but handle it)
    IF (TG_OP = 'INSERT' AND NEW.housing_unit_id IS NOT NULL) THEN
        INSERT INTO piglet_location_history (piglet_id, housing_unit_id)
        VALUES (NEW.id, NEW.housing_unit_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for piglet housing changes
DROP TRIGGER IF EXISTS piglet_housing_change_trigger ON piglets;
CREATE TRIGGER piglet_housing_change_trigger
    AFTER INSERT OR UPDATE OF housing_unit_id ON piglets
    FOR EACH ROW
    EXECUTE FUNCTION track_piglet_housing_changes();

-- Update housing_unit_occupancy view to include piglets
DROP VIEW IF EXISTS housing_unit_occupancy;

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
    COALESCE(piglet_counts.count, 0) AS current_piglets,
    COALESCE(sow_counts.count, 0) + COALESCE(boar_counts.count, 0) + COALESCE(piglet_counts.count, 0) AS total_animals,
    CASE
        WHEN hu.square_footage IS NOT NULL AND (COALESCE(sow_counts.count, 0) + COALESCE(boar_counts.count, 0) + COALESCE(piglet_counts.count, 0)) > 0
        THEN ROUND(hu.square_footage::NUMERIC / (COALESCE(sow_counts.count, 0) + COALESCE(boar_counts.count, 0) + COALESCE(piglet_counts.count, 0)), 2)
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
) boar_counts ON hu.id = boar_counts.housing_unit_id
LEFT JOIN (
    SELECT housing_unit_id, COUNT(*) as count
    FROM piglets
    WHERE housing_unit_id IS NOT NULL
      AND status IN ('weaned', 'alive')
    GROUP BY housing_unit_id
) piglet_counts ON hu.id = piglet_counts.housing_unit_id;

-- Add RLS policies for piglet_location_history
ALTER TABLE piglet_location_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own piglet location history
CREATE POLICY piglet_location_history_select ON piglet_location_history
    FOR SELECT
    USING (
        piglet_id IN (
            SELECT p.id FROM piglets p
            JOIN farrowings f ON p.farrowing_id = f.id
            JOIN sows s ON f.sow_id = s.id
            WHERE s.user_id = auth.uid()
        )
    );

-- Policy: Users can insert their own piglet location history
CREATE POLICY piglet_location_history_insert ON piglet_location_history
    FOR INSERT
    WITH CHECK (
        piglet_id IN (
            SELECT p.id FROM piglets p
            JOIN farrowings f ON p.farrowing_id = f.id
            JOIN sows s ON f.sow_id = s.id
            WHERE s.user_id = auth.uid()
        )
    );

-- Policy: Users can update their own piglet location history
CREATE POLICY piglet_location_history_update ON piglet_location_history
    FOR UPDATE
    USING (
        piglet_id IN (
            SELECT p.id FROM piglets p
            JOIN farrowings f ON p.farrowing_id = f.id
            JOIN sows s ON f.sow_id = s.id
            WHERE s.user_id = auth.uid()
        )
    );

-- Policy: Users can delete their own piglet location history
CREATE POLICY piglet_location_history_delete ON piglet_location_history
    FOR DELETE
    USING (
        piglet_id IN (
            SELECT p.id FROM piglets p
            JOIN farrowings f ON p.farrowing_id = f.id
            JOIN sows s ON f.sow_id = s.id
            WHERE s.user_id = auth.uid()
        )
    );
