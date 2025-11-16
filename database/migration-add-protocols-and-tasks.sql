-- Migration: Add Protocols and Task Scheduling System
-- This enables event-based task scheduling with reusable protocols

-- ============================================================================
-- PROTOCOLS TABLE
-- ============================================================================
-- Stores reusable protocol templates (e.g., "Standard Piglet Care Protocol")
CREATE TABLE IF NOT EXISTS protocols (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_event VARCHAR(50) NOT NULL, -- 'farrowing', 'breeding', 'weaning', 'custom'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- PROTOCOL TASKS TABLE
-- ============================================================================
-- Individual tasks within a protocol with day offsets
CREATE TABLE IF NOT EXISTS protocol_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  task_name VARCHAR(255) NOT NULL,
  description TEXT,
  days_offset INTEGER NOT NULL, -- Days from trigger event (0 = same day, 3 = 3 days after)
  is_required BOOLEAN DEFAULT true, -- Required vs optional task
  task_order INTEGER DEFAULT 0, -- Display order
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- SCHEDULED TASKS TABLE
-- ============================================================================
-- Auto-generated tasks from protocols with calculated due dates
CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol_id UUID REFERENCES protocols(id) ON DELETE SET NULL,
  protocol_task_id UUID REFERENCES protocol_tasks(id) ON DELETE SET NULL,

  -- Link to the source event
  farrowing_id UUID REFERENCES farrowings(id) ON DELETE CASCADE,
  sow_id UUID REFERENCES sows(id) ON DELETE CASCADE,

  -- Task details
  task_name VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_notes TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_protocol_tasks_protocol_id ON protocol_tasks(protocol_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_farrowing_id ON scheduled_tasks(farrowing_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_sow_id ON scheduled_tasks(sow_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_due_date ON scheduled_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_is_completed ON scheduled_tasks(is_completed);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;

-- Protocols policies (authenticated users can manage)
CREATE POLICY "Authenticated users can read protocols" ON protocols FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert protocols" ON protocols FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update protocols" ON protocols FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete protocols" ON protocols FOR DELETE USING (auth.role() = 'authenticated');

-- Protocol tasks policies
CREATE POLICY "Authenticated users can read protocol_tasks" ON protocol_tasks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert protocol_tasks" ON protocol_tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update protocol_tasks" ON protocol_tasks FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete protocol_tasks" ON protocol_tasks FOR DELETE USING (auth.role() = 'authenticated');

-- Scheduled tasks policies
CREATE POLICY "Authenticated users can read scheduled_tasks" ON scheduled_tasks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert scheduled_tasks" ON scheduled_tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update scheduled_tasks" ON scheduled_tasks FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete scheduled_tasks" ON scheduled_tasks FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- DEFAULT PROTOCOLS
-- ============================================================================
-- Insert a default "Standard Piglet Care Protocol"
INSERT INTO protocols (name, description, trigger_event, is_active)
VALUES (
  'Standard Piglet Care Protocol',
  'Standard care tasks for newborn piglets including castration, iron shots, and vaccinations',
  'farrowing',
  true
)
ON CONFLICT DO NOTHING;

-- Get the protocol ID for default tasks
DO $$
DECLARE
  default_protocol_id UUID;
BEGIN
  SELECT id INTO default_protocol_id FROM protocols WHERE name = 'Standard Piglet Care Protocol' LIMIT 1;

  IF default_protocol_id IS NOT NULL THEN
    -- Insert default protocol tasks
    INSERT INTO protocol_tasks (protocol_id, task_name, description, days_offset, is_required, task_order)
    VALUES
      (default_protocol_id, 'Iron Injection', 'Administer iron shot to prevent anemia', 3, true, 1),
      (default_protocol_id, 'Castration', 'Castrate male piglets (if applicable)', 3, false, 2),
      (default_protocol_id, 'First Vaccination', 'Administer first round of vaccines', 7, true, 3),
      (default_protocol_id, 'Teeth Clipping', 'Clip needle teeth to prevent injury', 1, false, 4),
      (default_protocol_id, 'Tail Docking', 'Dock tails if required', 3, false, 5),
      (default_protocol_id, 'Second Vaccination', 'Administer second round of vaccines', 14, true, 6),
      (default_protocol_id, 'Weaning Preparation', 'Prepare for weaning process', 19, true, 7)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify the migration
SELECT
  p.name as protocol_name,
  COUNT(pt.id) as task_count
FROM protocols p
LEFT JOIN protocol_tasks pt ON p.id = pt.protocol_id
GROUP BY p.id, p.name;
