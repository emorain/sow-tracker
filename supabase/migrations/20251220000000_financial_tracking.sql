-- Financial Tracking System Migration
-- Creates tables for comprehensive financial tracking including:
-- - Feed records by animal group
-- - Income records (sales revenue)
-- - Expense records (operating costs)
-- - Budgets (planning and monitoring)
-- - Cost allocations (per-animal cost tracking)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: feed_records
-- Tracks feed consumption by animal group (gestation, farrowing, nursery, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS feed_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  record_date DATE NOT NULL,
  feed_type VARCHAR(100) NOT NULL,
  animal_group VARCHAR(50) NOT NULL CHECK (animal_group IN
    ('gestation', 'farrowing', 'nursery', 'boars', 'other')),

  quantity_lbs DECIMAL(10,2) NOT NULL,
  cost_per_unit DECIMAL(10,2),
  total_cost DECIMAL(10,2) NOT NULL,

  supplier VARCHAR(200),
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE feed_records IS 'Tracks feed consumption and costs by animal group';
COMMENT ON COLUMN feed_records.animal_group IS 'Animal group: gestation, farrowing, nursery, boars, other';
COMMENT ON COLUMN feed_records.quantity_lbs IS 'Feed quantity in pounds';
COMMENT ON COLUMN feed_records.total_cost IS 'Total cost for this feed record';

CREATE INDEX idx_feed_records_org_id ON feed_records(organization_id);
CREATE INDEX idx_feed_records_user_id ON feed_records(user_id);
CREATE INDEX idx_feed_records_date ON feed_records(record_date DESC);
CREATE INDEX idx_feed_records_animal_group ON feed_records(animal_group);

-- ============================================================================
-- TABLE: income_records
-- Tracks all revenue streams (piglet sales, breeding stock sales, cull sales)
-- ============================================================================

CREATE TABLE IF NOT EXISTS income_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  income_date DATE NOT NULL,
  income_type VARCHAR(50) NOT NULL CHECK (income_type IN (
    'piglet_sale', 'cull_sow_sale', 'breeding_stock_sale', 'boar_sale', 'other'
  )),

  quantity INTEGER,
  price_per_unit DECIMAL(10,2),
  total_amount DECIMAL(10,2) NOT NULL,

  -- Animal references (arrays for batch sales)
  sow_ids UUID[],
  boar_ids UUID[],
  piglet_ids UUID[],

  buyer_name VARCHAR(200),
  invoice_number VARCHAR(100),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN
    ('pending', 'paid', 'partial', 'overdue')),

  description TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE income_records IS 'Tracks all farm revenue streams including animal sales';
COMMENT ON COLUMN income_records.income_type IS 'Type: piglet_sale, cull_sow_sale, breeding_stock_sale, boar_sale, other';
COMMENT ON COLUMN income_records.sow_ids IS 'Array of sow UUIDs involved in this income record';
COMMENT ON COLUMN income_records.payment_status IS 'Payment status: pending, paid, partial, overdue';

CREATE INDEX idx_income_records_org_id ON income_records(organization_id);
CREATE INDEX idx_income_records_user_id ON income_records(user_id);
CREATE INDEX idx_income_records_date ON income_records(income_date DESC);
CREATE INDEX idx_income_records_type ON income_records(income_type);
CREATE INDEX idx_income_records_payment_status ON income_records(payment_status);

-- ============================================================================
-- TABLE: expense_records
-- Tracks all farm expenses by category
-- ============================================================================

CREATE TABLE IF NOT EXISTS expense_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  expense_date DATE NOT NULL,
  expense_category VARCHAR(50) NOT NULL CHECK (expense_category IN (
    'feed', 'veterinary', 'facilities', 'utilities', 'labor',
    'supplies', 'breeding', 'other'
  )),

  amount DECIMAL(10,2) NOT NULL,
  description VARCHAR(200) NOT NULL,
  vendor VARCHAR(200),
  invoice_number VARCHAR(100),

  -- Optional references to link expenses
  health_record_id UUID REFERENCES health_records(id) ON DELETE SET NULL,
  feed_record_id UUID REFERENCES feed_records(id) ON DELETE SET NULL,

  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE expense_records IS 'Tracks all farm operating expenses by category';
COMMENT ON COLUMN expense_records.expense_category IS 'Category: feed, veterinary, facilities, utilities, labor, supplies, breeding, other';
COMMENT ON COLUMN expense_records.health_record_id IS 'Optional link to health_records for veterinary expenses';
COMMENT ON COLUMN expense_records.feed_record_id IS 'Optional link to feed_records for feed expenses';

CREATE INDEX idx_expense_records_org_id ON expense_records(organization_id);
CREATE INDEX idx_expense_records_user_id ON expense_records(user_id);
CREATE INDEX idx_expense_records_date ON expense_records(expense_date DESC);
CREATE INDEX idx_expense_records_category ON expense_records(expense_category);

-- ============================================================================
-- TABLE: budgets
-- Budget planning and tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  budget_name VARCHAR(200) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Category budgets
  feed_budget DECIMAL(10,2) DEFAULT 0,
  veterinary_budget DECIMAL(10,2) DEFAULT 0,
  facilities_budget DECIMAL(10,2) DEFAULT 0,
  utilities_budget DECIMAL(10,2) DEFAULT 0,
  other_budget DECIMAL(10,2) DEFAULT 0,
  revenue_target DECIMAL(10,2) DEFAULT 0,

  status VARCHAR(20) DEFAULT 'active' CHECK (status IN
    ('draft', 'active', 'completed', 'archived')),
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE budgets IS 'Budget planning and monitoring for farm operations';
COMMENT ON COLUMN budgets.status IS 'Status: draft, active, completed, archived';

CREATE INDEX idx_budgets_org_id ON budgets(organization_id);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_dates ON budgets(start_date, end_date);
CREATE INDEX idx_budgets_status ON budgets(status);

-- ============================================================================
-- TABLE: cost_allocations
-- Links costs to specific animals/litters for per-animal P&L tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS cost_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  allocation_date DATE NOT NULL,
  allocation_type VARCHAR(50) NOT NULL CHECK (allocation_type IN
    ('feed', 'veterinary', 'breeding', 'housing', 'other')),
  amount DECIMAL(10,2) NOT NULL,

  animal_type VARCHAR(20) NOT NULL CHECK (animal_type IN
    ('sow', 'boar', 'piglet', 'litter')),
  sow_id UUID REFERENCES sows(id) ON DELETE CASCADE,
  boar_id UUID REFERENCES boars(id) ON DELETE CASCADE,
  piglet_id UUID REFERENCES piglets(id) ON DELETE CASCADE,
  farrowing_id UUID REFERENCES farrowings(id) ON DELETE CASCADE,

  expense_record_id UUID REFERENCES expense_records(id) ON DELETE SET NULL,
  description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: exactly one animal reference must be set
  CONSTRAINT check_one_animal CHECK (
    (animal_type = 'sow' AND sow_id IS NOT NULL AND boar_id IS NULL AND piglet_id IS NULL AND farrowing_id IS NULL) OR
    (animal_type = 'boar' AND boar_id IS NOT NULL AND sow_id IS NULL AND piglet_id IS NULL AND farrowing_id IS NULL) OR
    (animal_type = 'piglet' AND piglet_id IS NOT NULL AND sow_id IS NULL AND boar_id IS NULL AND farrowing_id IS NULL) OR
    (animal_type = 'litter' AND farrowing_id IS NOT NULL AND sow_id IS NULL AND boar_id IS NULL AND piglet_id IS NULL)
  )
);

COMMENT ON TABLE cost_allocations IS 'Allocates costs to specific animals for profit/loss tracking';
COMMENT ON COLUMN cost_allocations.allocation_type IS 'Type: feed, veterinary, breeding, housing, other';
COMMENT ON COLUMN cost_allocations.animal_type IS 'Animal type: sow, boar, piglet, litter';

CREATE INDEX idx_cost_allocations_org_id ON cost_allocations(organization_id);
CREATE INDEX idx_cost_allocations_sow_id ON cost_allocations(sow_id);
CREATE INDEX idx_cost_allocations_boar_id ON cost_allocations(boar_id);
CREATE INDEX idx_cost_allocations_piglet_id ON cost_allocations(piglet_id);
CREATE INDEX idx_cost_allocations_farrowing_id ON cost_allocations(farrowing_id);

-- ============================================================================
-- EXTEND EXISTING TABLES
-- Add purchase/sale tracking to animals
-- ============================================================================

-- Add financial columns to sows table
ALTER TABLE sows
ADD COLUMN IF NOT EXISTS purchase_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS sale_date DATE,
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2);

COMMENT ON COLUMN sows.purchase_cost IS 'Initial purchase cost of the sow';
COMMENT ON COLUMN sows.sale_price IS 'Sale price when sold/culled';

-- Add financial columns to boars table
ALTER TABLE boars
ADD COLUMN IF NOT EXISTS purchase_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS sale_date DATE,
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2);

COMMENT ON COLUMN boars.purchase_cost IS 'Initial purchase cost of the boar';
COMMENT ON COLUMN boars.sale_price IS 'Sale price when sold/culled';

-- Add financial columns to piglets table
ALTER TABLE piglets
ADD COLUMN IF NOT EXISTS sale_date DATE,
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS sale_weight_lbs DECIMAL(10,2);

COMMENT ON COLUMN piglets.sale_price IS 'Sale price when sold';
COMMENT ON COLUMN piglets.sale_weight_lbs IS 'Weight at sale in pounds';

-- Add financial columns to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS price_per_unit DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);

COMMENT ON COLUMN transactions.price_per_unit IS 'Price per animal in transaction';
COMMENT ON COLUMN transactions.total_amount IS 'Total transaction amount';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE feed_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_allocations ENABLE ROW LEVEL SECURITY;

-- feed_records policies
CREATE POLICY "Users can view organization feed records"
  ON feed_records FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert organization feed records"
  ON feed_records FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    ) AND user_id = auth.uid()
  );

CREATE POLICY "Users can update organization feed records"
  ON feed_records FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can delete organization feed records"
  ON feed_records FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- income_records policies
CREATE POLICY "Users can view organization income records"
  ON income_records FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert organization income records"
  ON income_records FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    ) AND user_id = auth.uid()
  );

CREATE POLICY "Users can update organization income records"
  ON income_records FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can delete organization income records"
  ON income_records FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- expense_records policies
CREATE POLICY "Users can view organization expense records"
  ON expense_records FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert organization expense records"
  ON expense_records FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    ) AND user_id = auth.uid()
  );

CREATE POLICY "Users can update organization expense records"
  ON expense_records FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can delete organization expense records"
  ON expense_records FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- budgets policies
CREATE POLICY "Users can view organization budgets"
  ON budgets FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert organization budgets"
  ON budgets FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    ) AND user_id = auth.uid()
  );

CREATE POLICY "Users can update organization budgets"
  ON budgets FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can delete organization budgets"
  ON budgets FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- cost_allocations policies
CREATE POLICY "Users can view organization cost allocations"
  ON cost_allocations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert organization cost allocations"
  ON cost_allocations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    ) AND user_id = auth.uid()
  );

CREATE POLICY "Users can update organization cost allocations"
  ON cost_allocations FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can delete organization cost allocations"
  ON cost_allocations FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_feed_records_updated_at BEFORE UPDATE ON feed_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_income_records_updated_at BEFORE UPDATE ON income_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_records_updated_at BEFORE UPDATE ON expense_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cost_allocations_updated_at BEFORE UPDATE ON cost_allocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DATABASE FUNCTIONS FOR FINANCIAL ANALYTICS
-- ============================================================================

-- Get financial summary for a date range
CREATE OR REPLACE FUNCTION get_financial_summary(
  p_organization_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_revenue DECIMAL(10,2),
  total_expenses DECIMAL(10,2),
  net_profit_loss DECIMAL(10,2),
  feed_costs DECIMAL(10,2),
  veterinary_costs DECIMAL(10,2),
  facilities_costs DECIMAL(10,2),
  utilities_costs DECIMAL(10,2),
  other_costs DECIMAL(10,2),
  piglet_sales DECIMAL(10,2),
  cull_sales DECIMAL(10,2),
  breeding_stock_sales DECIMAL(10,2),
  other_income DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(i.total_amount), 0)::DECIMAL(10,2) as total_revenue,
    COALESCE(SUM(e.amount), 0)::DECIMAL(10,2) as total_expenses,
    (COALESCE(SUM(i.total_amount), 0) - COALESCE(SUM(e.amount), 0))::DECIMAL(10,2) as net_profit_loss,
    COALESCE(SUM(CASE WHEN e.expense_category = 'feed' THEN e.amount ELSE 0 END), 0)::DECIMAL(10,2) as feed_costs,
    COALESCE(SUM(CASE WHEN e.expense_category = 'veterinary' THEN e.amount ELSE 0 END), 0)::DECIMAL(10,2) as veterinary_costs,
    COALESCE(SUM(CASE WHEN e.expense_category = 'facilities' THEN e.amount ELSE 0 END), 0)::DECIMAL(10,2) as facilities_costs,
    COALESCE(SUM(CASE WHEN e.expense_category = 'utilities' THEN e.amount ELSE 0 END), 0)::DECIMAL(10,2) as utilities_costs,
    COALESCE(SUM(CASE WHEN e.expense_category = 'other' THEN e.amount ELSE 0 END), 0)::DECIMAL(10,2) as other_costs,
    COALESCE(SUM(CASE WHEN i.income_type = 'piglet_sale' THEN i.total_amount ELSE 0 END), 0)::DECIMAL(10,2) as piglet_sales,
    COALESCE(SUM(CASE WHEN i.income_type = 'cull_sow_sale' THEN i.total_amount ELSE 0 END), 0)::DECIMAL(10,2) as cull_sales,
    COALESCE(SUM(CASE WHEN i.income_type IN ('breeding_stock_sale', 'boar_sale') THEN i.total_amount ELSE 0 END), 0)::DECIMAL(10,2) as breeding_stock_sales,
    COALESCE(SUM(CASE WHEN i.income_type = 'other' THEN i.total_amount ELSE 0 END), 0)::DECIMAL(10,2) as other_income
  FROM
    (SELECT total_amount, income_type FROM income_records
     WHERE organization_id = p_organization_id
       AND income_date >= p_start_date
       AND income_date <= p_end_date
       AND is_deleted = FALSE) i
  FULL OUTER JOIN
    (SELECT amount, expense_category FROM expense_records
     WHERE organization_id = p_organization_id
       AND expense_date >= p_start_date
       AND expense_date <= p_end_date
       AND is_deleted = FALSE) e ON true;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_financial_summary IS 'Returns comprehensive financial summary for organization within date range';

-- Calculate profit/loss for specific animal
CREATE OR REPLACE FUNCTION calculate_animal_profit_loss(
  p_animal_type VARCHAR,
  p_animal_id UUID,
  p_organization_id UUID
)
RETURNS TABLE (
  total_revenue DECIMAL(10,2),
  total_costs DECIMAL(10,2),
  profit_loss DECIMAL(10,2)
) AS $$
DECLARE
  v_purchase_cost DECIMAL(10,2) := 0;
  v_sale_price DECIMAL(10,2) := 0;
  v_type VARCHAR;
BEGIN
  -- Normalize animal type (handle both singular and plural)
  v_type := CASE
    WHEN p_animal_type IN ('sow', 'sows') THEN 'sow'
    WHEN p_animal_type IN ('boar', 'boars') THEN 'boar'
    WHEN p_animal_type IN ('piglet', 'piglets') THEN 'piglet'
    ELSE p_animal_type
  END;

  -- Get purchase/sale from animal tables
  IF v_type = 'sow' THEN
    SELECT COALESCE(purchase_cost, 0), COALESCE(sale_price, 0)
    INTO v_purchase_cost, v_sale_price
    FROM sows WHERE id = p_animal_id;
  ELSIF v_type = 'boar' THEN
    SELECT COALESCE(purchase_cost, 0), COALESCE(sale_price, 0)
    INTO v_purchase_cost, v_sale_price
    FROM boars WHERE id = p_animal_id;
  ELSIF v_type = 'piglet' THEN
    SELECT 0, COALESCE(sale_price, 0)
    INTO v_purchase_cost, v_sale_price
    FROM piglets WHERE id = p_animal_id;
  END IF;

  RETURN QUERY
  WITH revenue AS (
    SELECT
      v_sale_price +
      COALESCE((
        SELECT SUM(ir.total_amount / COALESCE(ir.quantity, 1))
        FROM income_records ir
        WHERE ir.organization_id = p_organization_id
          AND ir.is_deleted = FALSE
          AND (
            (v_type = 'sow' AND p_animal_id = ANY(ir.sow_ids)) OR
            (v_type = 'boar' AND p_animal_id = ANY(ir.boar_ids)) OR
            (v_type = 'piglet' AND p_animal_id = ANY(ir.piglet_ids))
          )
      ), 0) as total_revenue
  ),
  costs AS (
    SELECT
      v_purchase_cost +
      COALESCE((
        SELECT SUM(ca.amount)
        FROM cost_allocations ca
        WHERE ca.organization_id = p_organization_id
          AND (
            (v_type = 'sow' AND ca.sow_id = p_animal_id) OR
            (v_type = 'boar' AND ca.boar_id = p_animal_id) OR
            (v_type = 'piglet' AND ca.piglet_id = p_animal_id)
          )
      ), 0) +
      COALESCE((
        SELECT SUM(hr.cost)
        FROM health_records hr
        WHERE hr.organization_id = p_organization_id
          AND hr.cost IS NOT NULL
          AND (
            (v_type = 'sow' AND hr.sow_id = p_animal_id) OR
            (v_type = 'boar' AND hr.boar_id = p_animal_id) OR
            (v_type = 'piglet' AND hr.piglet_id = p_animal_id)
          )
      ), 0) as total_costs
  )
  SELECT
    r.total_revenue::DECIMAL(10,2),
    c.total_costs::DECIMAL(10,2),
    (r.total_revenue - c.total_costs)::DECIMAL(10,2) as profit_loss
  FROM revenue r, costs c;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_animal_profit_loss IS 'Calculates total profit/loss for specific animal including purchase cost, allocated costs, health costs, and sale revenue';
