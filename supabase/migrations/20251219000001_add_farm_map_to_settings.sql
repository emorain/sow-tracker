-- Add farm map URL to farm_settings for Prop 12 compliance reports
ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS farm_map_url TEXT;

COMMENT ON COLUMN farm_settings.farm_map_url IS 'URL to farm layout/map image for compliance reports (e.g., aerial view with building labels)';
