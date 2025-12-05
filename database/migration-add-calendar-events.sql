-- Migration: Add Calendar Events Table
-- This adds support for custom user-created calendar events and tasks

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('custom', 'task', 'reminder', 'note')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    all_day BOOLEAN DEFAULT true,
    start_time TIME,
    end_time TIME,

    -- Optional relationships to farm entities
    related_sow_id UUID REFERENCES sows(id) ON DELETE CASCADE,
    related_boar_id UUID REFERENCES boars(id) ON DELETE CASCADE,
    related_piglet_id UUID REFERENCES piglets(id) ON DELETE CASCADE,

    -- Task/reminder fields
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),

    -- Recurrence fields (for future enhancement)
    recurrence_pattern VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'yearly'
    recurrence_end_date DATE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_sow ON calendar_events(related_sow_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_boar ON calendar_events(related_boar_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_completed ON calendar_events(completed);

-- Create trigger for updated_at
CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own calendar events
CREATE POLICY calendar_events_select_policy ON calendar_events
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own calendar events
CREATE POLICY calendar_events_insert_policy ON calendar_events
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own calendar events
CREATE POLICY calendar_events_update_policy ON calendar_events
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own calendar events
CREATE POLICY calendar_events_delete_policy ON calendar_events
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE calendar_events IS 'User-created calendar events, tasks, and reminders';
COMMENT ON COLUMN calendar_events.event_type IS 'Type of calendar entry: custom, task, reminder, or note';
COMMENT ON COLUMN calendar_events.all_day IS 'Whether this is an all-day event (no specific time)';
COMMENT ON COLUMN calendar_events.priority IS 'Priority level for tasks and reminders';
COMMENT ON COLUMN calendar_events.recurrence_pattern IS 'Future: Pattern for recurring events';
