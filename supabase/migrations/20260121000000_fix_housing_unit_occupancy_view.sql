-- Fix housing_unit_occupancy view to filter animal counts by organization_id
-- CRITICAL: Without organization filtering in subqueries, housing units show
-- counts from ALL organizations, not just their own

DROP VIEW IF EXISTS housing_unit_occupancy;

CREATE VIEW housing_unit_occupancy AS
SELECT
  hu.id,
  hu.name,
  hu.pen_number,
  hu.type,
  hu.length_feet,
  hu.width_feet,
  hu.square_footage,
  hu.max_capacity,
  hu.building_name,
  hu.notes,
  hu.measurement_date,
  hu.measured_by,
  hu.measurement_notes,
  hu.user_id,
  hu.organization_id,

  -- Current occupancy by animal type (FIXED: now filters by organization_id)
  (SELECT COUNT(*) FROM sows WHERE housing_unit_id = hu.id AND status = 'active' AND organization_id = hu.organization_id) as current_sows,
  (SELECT COUNT(*) FROM boars WHERE housing_unit_id = hu.id AND status = 'active' AND organization_id = hu.organization_id) as current_boars,
  (SELECT COUNT(*) FROM piglets WHERE housing_unit_id = hu.id AND status IN ('nursing', 'weaned') AND organization_id = hu.organization_id) as current_piglets,

  -- Total animals (FIXED: now filters by organization_id)
  (
    (SELECT COUNT(*) FROM sows WHERE housing_unit_id = hu.id AND status = 'active' AND organization_id = hu.organization_id) +
    (SELECT COUNT(*) FROM boars WHERE housing_unit_id = hu.id AND status = 'active' AND organization_id = hu.organization_id) +
    (SELECT COUNT(*) FROM piglets WHERE housing_unit_id = hu.id AND status IN ('nursing', 'weaned') AND organization_id = hu.organization_id)
  ) as total_animals,

  -- Prop 12 compliance metrics (FIXED: now filters by organization_id)
  CASE
    WHEN hu.type = 'gestation' AND hu.square_footage IS NOT NULL
      AND (SELECT COUNT(*) FROM sows WHERE housing_unit_id = hu.id AND status = 'active' AND organization_id = hu.organization_id) > 0
    THEN hu.square_footage / NULLIF((SELECT COUNT(*) FROM sows WHERE housing_unit_id = hu.id AND status = 'active' AND organization_id = hu.organization_id), 0)
    ELSE NULL
  END as sq_ft_per_sow,

  -- Square footage per animal (all types) (FIXED: now filters by organization_id)
  CASE
    WHEN hu.square_footage IS NOT NULL AND (
      (SELECT COUNT(*) FROM sows WHERE housing_unit_id = hu.id AND status = 'active' AND organization_id = hu.organization_id) +
      (SELECT COUNT(*) FROM boars WHERE housing_unit_id = hu.id AND status = 'active' AND organization_id = hu.organization_id) +
      (SELECT COUNT(*) FROM piglets WHERE housing_unit_id = hu.id AND status IN ('nursing', 'weaned') AND organization_id = hu.organization_id)
    ) > 0
    THEN hu.square_footage / NULLIF((
      (SELECT COUNT(*) FROM sows WHERE housing_unit_id = hu.id AND status = 'active' AND organization_id = hu.organization_id) +
      (SELECT COUNT(*) FROM boars WHERE housing_unit_id = hu.id AND status = 'active' AND organization_id = hu.organization_id) +
      (SELECT COUNT(*) FROM piglets WHERE housing_unit_id = hu.id AND status IN ('nursing', 'weaned') AND organization_id = hu.organization_id)
    ), 0)
    ELSE NULL
  END as sq_ft_per_animal,

  -- Prop 12 compliance status (for gestation units) (FIXED: now filters by organization_id)
  CASE
    WHEN hu.type = 'gestation' AND hu.square_footage IS NOT NULL
      AND (SELECT COUNT(*) FROM sows WHERE housing_unit_id = hu.id AND status = 'active' AND organization_id = hu.organization_id) > 0
    THEN (hu.square_footage / NULLIF((SELECT COUNT(*) FROM sows WHERE housing_unit_id = hu.id AND status = 'active' AND organization_id = hu.organization_id), 0)) >= 24
    ELSE NULL
  END as is_compliant

FROM housing_units hu;

COMMENT ON VIEW housing_unit_occupancy IS 'Housing unit occupancy with current counts by animal type and Prop 12 compliance metrics. All subqueries now filter by organization_id to prevent cross-organization data leakage.';
