-- Sow Tracker Database Schema
-- Run this in your Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sows table
CREATE TABLE IF NOT EXISTS sows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ear_tag VARCHAR(50) UNIQUE NOT NULL,
    birth_date DATE NOT NULL,
    breed VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'culled', 'sold')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Farrowings table
CREATE TABLE IF NOT EXISTS farrowings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sow_id UUID NOT NULL REFERENCES sows(id) ON DELETE CASCADE,
    breeding_date DATE NOT NULL,
    expected_farrowing_date DATE NOT NULL,
    actual_farrowing_date DATE,
    live_piglets INTEGER,
    stillborn INTEGER DEFAULT 0,
    mummified INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Piglets table
CREATE TABLE IF NOT EXISTS piglets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farrowing_id UUID NOT NULL REFERENCES farrowings(id) ON DELETE CASCADE,
    birth_weight DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'alive' CHECK (status IN ('alive', 'died', 'weaned', 'sold')),
    died_date DATE,
    weaned_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vaccinations table
CREATE TABLE IF NOT EXISTS vaccinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sow_id UUID REFERENCES sows(id) ON DELETE CASCADE,
    piglet_id UUID REFERENCES piglets(id) ON DELETE CASCADE,
    vaccine_type VARCHAR(100) NOT NULL,
    date_given DATE NOT NULL,
    next_due_date DATE,
    batch_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (
        (sow_id IS NOT NULL AND piglet_id IS NULL) OR
        (sow_id IS NULL AND piglet_id IS NOT NULL)
    )
);

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('breeding', 'farrowing', 'vaccination', 'weaning', 'custom')),
    title VARCHAR(200) NOT NULL,
    due_date DATE NOT NULL,
    sow_id UUID REFERENCES sows(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_farrowings_sow_id ON farrowings(sow_id);
CREATE INDEX IF NOT EXISTS idx_farrowings_expected_date ON farrowings(expected_farrowing_date);
CREATE INDEX IF NOT EXISTS idx_piglets_farrowing_id ON piglets(farrowing_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_sow_id ON vaccinations(sow_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_piglet_id ON vaccinations(piglet_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_next_due ON vaccinations(next_due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_completed ON reminders(completed);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_sows_updated_at BEFORE UPDATE ON sows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farrowings_updated_at BEFORE UPDATE ON farrowings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_piglets_updated_at BEFORE UPDATE ON piglets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vaccinations_updated_at BEFORE UPDATE ON vaccinations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically calculate expected farrowing date (114 days from breeding)
CREATE OR REPLACE FUNCTION calculate_farrowing_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expected_farrowing_date IS NULL THEN
        NEW.expected_farrowing_date := NEW.breeding_date + INTERVAL '114 days';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_expected_farrowing_date BEFORE INSERT ON farrowings
    FOR EACH ROW EXECUTE FUNCTION calculate_farrowing_date();

-- Sample data has been removed
-- Use database/sample-data-20-sows.sql for realistic test data

-- Enable Row Level Security (RLS) - Important for security!
ALTER TABLE sows ENABLE ROW LEVEL SECURITY;
ALTER TABLE farrowings ENABLE ROW LEVEL SECURITY;
ALTER TABLE piglets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (you can customize these)
-- For now, allowing all authenticated users to do everything
-- You might want to restrict this based on user roles later

CREATE POLICY "Enable all access for authenticated users" ON sows
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON farrowings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON piglets
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON vaccinations
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON reminders
    FOR ALL USING (auth.role() = 'authenticated');

-- For development/testing, you might want to allow anonymous access
-- UNCOMMENT these lines if you're not using authentication yet:

-- CREATE POLICY "Enable read access for all users" ON sows FOR SELECT USING (true);
-- CREATE POLICY "Enable insert access for all users" ON sows FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Enable update access for all users" ON sows FOR UPDATE USING (true);
-- CREATE POLICY "Enable delete access for all users" ON sows FOR DELETE USING (true);

-- (Repeat for other tables if needed)
