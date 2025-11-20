# Health & Wellness Tracking System - Implementation Plan

**Version:** 1.0
**Date:** 2025-01-18
**Status:** Planning Phase - Future Feature

---

## Table of Contents

1. [Overview](#overview)
2. [Requirements & Features](#requirements--features)
3. [Database Schema Design](#database-schema-design)
4. [UI/UX Design](#uiux-design)
5. [Integration with Existing System](#integration-with-existing-system)
6. [Implementation Phases](#implementation-phases)
7. [Timeline Estimate](#timeline-estimate)
8. [Future Enhancements](#future-enhancements)

---

## Overview

Add comprehensive health and wellness tracking to the Sow Tracker application, enabling farmers to maintain complete medical records, track vaccinations, monitor illnesses, and manage treatments for all animals.

### Current State
- Basic notes field on sows/boars/piglets
- No structured health tracking
- No vaccination scheduling
- No medication tracking
- No illness/disease monitoring

### Target State
- Complete medical history per animal
- Vaccination tracking with schedules and reminders
- Medication/antibiotic tracking with withdrawal periods
- Illness and disease monitoring
- Health event logging (injuries, procedures, vet visits)
- Quarantine and isolation tracking
- Health alerts and notifications
- Mortality tracking with cause analysis

---

## Requirements & Features

### 1. Vaccination Management

#### Core Features
- **Vaccination Records**: Track all vaccines administered
  - Vaccine type/name
  - Date administered
  - Batch/lot number
  - Expiration date
  - Administered by (team member)
  - Dosage
  - Route (IM, SC, oral, etc.)
  - Next due date (auto-calculated based on vaccine schedule)

- **Vaccination Schedules**: Define vaccine programs
  - Create vaccination protocols per animal type (sows, boars, piglets)
  - Multi-dose vaccines (e.g., 2-dose series)
  - Age-based schedules (e.g., piglets at 3 weeks, 6 weeks)
  - Booster reminders

- **Vaccine Inventory**: Track vaccine stock
  - Quantity on hand
  - Expiration dates
  - Low stock alerts
  - Batch tracking for recalls

#### Alerts & Reminders
- Upcoming vaccinations due (7-day, 3-day, today)
- Overdue vaccinations
- Vaccine expiration warnings
- Batch recall notifications

---

### 2. Medical Records & Treatments

#### Treatment Tracking
- **Medications/Antibiotics**: Record all treatments
  - Medication name
  - Reason/diagnosis
  - Dosage and frequency
  - Start date and duration
  - Route of administration
  - Prescribed by (veterinarian)
  - Administered by (team member)
  - **Withdrawal period** (critical for meat/milk)
  - Cost tracking

#### Withdrawal Period Management
- Automatically calculate withdrawal end date
- Alert when animal is eligible for sale/slaughter
- Block animals from being marked as "sold" during withdrawal
- Display withdrawal status prominently

#### Veterinary Visits
- Record vet visits
  - Date and time
  - Veterinarian name
  - Reason for visit
  - Diagnosis
  - Treatment prescribed
  - Follow-up required
  - Cost
  - Attach documents (vet reports, lab results)

---

### 3. Illness & Disease Tracking

#### Illness Records
- **Symptoms**: Record observed symptoms
  - Symptom type (respiratory, digestive, lameness, etc.)
  - Severity (mild, moderate, severe)
  - Date first observed
  - Notes

- **Diagnosis**: Link symptoms to diagnosis
  - Disease/condition name
  - Confirmed by veterinarian (yes/no)
  - Contagious (yes/no) - triggers quarantine protocols
  - Treatment plan

- **Recovery Tracking**: Monitor progress
  - Daily/weekly check-ins
  - Symptom improvement
  - Return to health date
  - Outcome (recovered, chronic, died)

#### Disease Outbreak Management
- Track contagious diseases across the farm
- See all animals affected by specific disease
- Quarantine/isolation tracking
- Treatment effectiveness analysis

---

### 4. Health Events

#### General Health Events
- **Injuries**: Track accidents and injuries
  - Injury type (laceration, fracture, bruise)
  - Location on body
  - Cause
  - Treatment
  - Recovery time

- **Procedures**: Non-routine procedures
  - Hoof trimming
  - Dental work
  - Surgical procedures
  - Artificial insemination health checks
  - Pregnancy checks

- **General Observations**: Daily health monitoring
  - Body condition score (BCS)
  - Lameness score
  - General behavior notes
  - Appetite changes

---

### 5. Quarantine & Isolation

#### Quarantine Management
- Mark animals as quarantined
- Quarantine reason (illness, new arrival, etc.)
- Quarantine location (housing unit)
- Start and expected end date
- Daily monitoring notes
- Release criteria
- Automatically block animal from breeding/farrowing while quarantined

#### Isolation Alerts
- List of animals currently in quarantine
- Overdue quarantine releases
- Quarantine location capacity

---

### 6. Mortality Tracking

#### Death Records
- Enhanced death tracking beyond simple "died" status
- Cause of death (illness, injury, euthanized, unknown)
- Necropsy performed (yes/no)
- Necropsy findings
- Contributing factors
- Age at death
- Cost impact

#### Mortality Analysis
- Mortality rate by age group
- Most common causes of death
- Seasonal patterns
- Early warning indicators

---

### 7. Health Dashboard & Reporting

#### Health Overview Dashboard
- Animals currently on medication
- Animals in quarantine
- Upcoming vaccinations (this week)
- Overdue vaccinations
- Animals in withdrawal period
- Recent illnesses/outbreaks
- Mortality rate (last 30 days)

#### Health Reports
- Vaccination compliance report
- Treatment cost report
- Illness/disease frequency report
- Mortality analysis report
- Antibiotic usage report (important for compliance)

---

## Database Schema Design

### New Tables

#### 1. `vaccination_types` Table
Master list of vaccine types.

```sql
CREATE TABLE vaccination_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Vaccine info
  name VARCHAR(200) NOT NULL,
  manufacturer VARCHAR(200),
  description TEXT,

  -- Dosage
  default_dosage DECIMAL(10,2),
  dosage_unit VARCHAR(20), -- ml, cc, units

  -- Schedule
  animal_type VARCHAR(20) CHECK (animal_type IN ('sow', 'boar', 'piglet', 'all')),
  recommended_age_weeks INTEGER, -- For piglets
  booster_interval_days INTEGER, -- Days until booster needed
  annual_booster BOOLEAN DEFAULT false,

  -- Administration
  route VARCHAR(50), -- IM, SC, oral, intranasal

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vaccination_types_org ON vaccination_types(organization_id);
```

---

#### 2. `vaccinations` Table
Records of vaccinations administered.

```sql
CREATE TABLE vaccinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Animal reference (polymorphic)
  animal_type VARCHAR(20) NOT NULL CHECK (animal_type IN ('sow', 'boar', 'piglet')),
  sow_id UUID REFERENCES sows(id) ON DELETE CASCADE,
  boar_id UUID REFERENCES boars(id) ON DELETE CASCADE,
  piglet_id UUID REFERENCES piglets(id) ON DELETE CASCADE,

  -- Vaccine details
  vaccination_type_id UUID REFERENCES vaccination_types(id) ON DELETE RESTRICT,
  vaccine_name VARCHAR(200) NOT NULL, -- Cached for display if type deleted

  -- Administration
  date_administered DATE NOT NULL,
  dosage DECIMAL(10,2),
  dosage_unit VARCHAR(20),
  route VARCHAR(50),
  batch_lot_number VARCHAR(100),
  expiration_date DATE,

  -- Next dose
  next_due_date DATE,
  is_booster BOOLEAN DEFAULT false,

  -- People
  administered_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  administered_by_name VARCHAR(100),
  veterinarian_name VARCHAR(100),

  -- Notes
  notes TEXT,
  side_effects TEXT,

  -- Metadata
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vaccinations_org ON vaccinations(organization_id);
CREATE INDEX idx_vaccinations_sow ON vaccinations(sow_id);
CREATE INDEX idx_vaccinations_boar ON vaccinations(boar_id);
CREATE INDEX idx_vaccinations_piglet ON vaccinations(piglet_id);
CREATE INDEX idx_vaccinations_next_due ON vaccinations(next_due_date);
```

---

#### 3. `medications` Table
Track all medications and treatments.

```sql
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Animal reference (polymorphic)
  animal_type VARCHAR(20) NOT NULL CHECK (animal_type IN ('sow', 'boar', 'piglet')),
  sow_id UUID REFERENCES sows(id) ON DELETE CASCADE,
  boar_id UUID REFERENCES boars(id) ON DELETE CASCADE,
  piglet_id UUID REFERENCES piglets(id) ON DELETE CASCADE,

  -- Medication details
  medication_name VARCHAR(200) NOT NULL,
  medication_type VARCHAR(50), -- Antibiotic, Anti-inflammatory, Hormone, etc.

  -- Treatment
  reason TEXT NOT NULL, -- Why prescribed
  diagnosis VARCHAR(200),
  dosage VARCHAR(100), -- e.g., "2ml twice daily"
  route VARCHAR(50), -- IM, SC, oral, topical, etc.

  -- Schedule
  start_date DATE NOT NULL,
  end_date DATE,
  duration_days INTEGER,
  frequency VARCHAR(100), -- "Twice daily", "Once daily", "Every 12 hours"

  -- Withdrawal period (CRITICAL for food safety)
  has_withdrawal_period BOOLEAN DEFAULT false,
  withdrawal_days INTEGER,
  withdrawal_end_date DATE,
  safe_for_sale_date DATE, -- Auto-calculated

  -- People
  prescribed_by_veterinarian VARCHAR(100),
  administered_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  administered_by_name VARCHAR(100),

  -- Status
  treatment_status VARCHAR(20) DEFAULT 'active'
    CHECK (treatment_status IN ('active', 'completed', 'discontinued')),

  -- Cost
  cost DECIMAL(10,2),

  -- Notes
  notes TEXT,
  side_effects TEXT,

  -- Metadata
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_medications_org ON medications(organization_id);
CREATE INDEX idx_medications_sow ON medications(sow_id);
CREATE INDEX idx_medications_boar ON medications(boar_id);
CREATE INDEX idx_medications_piglet ON medications(piglet_id);
CREATE INDEX idx_medications_status ON medications(treatment_status);
CREATE INDEX idx_medications_withdrawal_end ON medications(withdrawal_end_date);
```

---

#### 4. `illnesses` Table
Track illnesses and diseases.

```sql
CREATE TABLE illnesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Animal reference (polymorphic)
  animal_type VARCHAR(20) NOT NULL CHECK (animal_type IN ('sow', 'boar', 'piglet')),
  sow_id UUID REFERENCES sows(id) ON DELETE CASCADE,
  boar_id UUID REFERENCES boars(id) ON DELETE CASCADE,
  piglet_id UUID REFERENCES piglets(id) ON DELETE CASCADE,

  -- Illness details
  illness_name VARCHAR(200) NOT NULL,
  illness_category VARCHAR(50), -- Respiratory, Digestive, Reproductive, Lameness, Skin, etc.

  -- Symptoms
  symptoms TEXT NOT NULL,
  severity VARCHAR(20) CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),

  -- Dates
  date_first_observed DATE NOT NULL,
  date_diagnosed DATE,
  date_recovered DATE,

  -- Diagnosis
  diagnosed_by_veterinarian VARCHAR(100),
  confirmed_diagnosis BOOLEAN DEFAULT false,
  contagious BOOLEAN DEFAULT false, -- Triggers quarantine protocols

  -- Treatment
  treatment_plan TEXT,
  outcome VARCHAR(20) CHECK (outcome IN ('recovering', 'recovered', 'chronic', 'died', 'euthanized')),

  -- Status
  status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active', 'recovering', 'resolved')),

  -- Notes
  notes TEXT,

  -- Metadata
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name VARCHAR(100),
  updated_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_illnesses_org ON illnesses(organization_id);
CREATE INDEX idx_illnesses_sow ON illnesses(sow_id);
CREATE INDEX idx_illnesses_boar ON illnesses(boar_id);
CREATE INDEX idx_illnesses_piglet ON illnesses(piglet_id);
CREATE INDEX idx_illnesses_status ON illnesses(status);
CREATE INDEX idx_illnesses_contagious ON illnesses(contagious);
```

---

#### 5. `health_events` Table
General health events and observations.

```sql
CREATE TABLE health_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Animal reference (polymorphic)
  animal_type VARCHAR(20) NOT NULL CHECK (animal_type IN ('sow', 'boar', 'piglet')),
  sow_id UUID REFERENCES sows(id) ON DELETE CASCADE,
  boar_id UUID REFERENCES boars(id) ON DELETE CASCADE,
  piglet_id UUID REFERENCES piglets(id) ON DELETE CASCADE,

  -- Event details
  event_type VARCHAR(50) NOT NULL, -- injury, procedure, observation, vet_visit, etc.
  event_date DATE NOT NULL,

  -- Description
  title VARCHAR(200) NOT NULL,
  description TEXT,

  -- Health scores (optional)
  body_condition_score DECIMAL(3,1), -- 1.0 to 5.0
  lameness_score INTEGER, -- 0-5

  -- People
  performed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_by_name VARCHAR(100),
  veterinarian_name VARCHAR(100),

  -- Cost
  cost DECIMAL(10,2),

  -- Attachments
  attachment_url TEXT, -- Link to document/image

  -- Metadata
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_health_events_org ON health_events(organization_id);
CREATE INDEX idx_health_events_sow ON health_events(sow_id);
CREATE INDEX idx_health_events_boar ON health_events(boar_id);
CREATE INDEX idx_health_events_piglet ON health_events(piglet_id);
CREATE INDEX idx_health_events_type ON health_events(event_type);
CREATE INDEX idx_health_events_date ON health_events(event_date);
```

---

#### 6. `quarantine_records` Table
Track quarantined/isolated animals.

```sql
CREATE TABLE quarantine_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Animal reference (polymorphic)
  animal_type VARCHAR(20) NOT NULL CHECK (animal_type IN ('sow', 'boar', 'piglet')),
  sow_id UUID REFERENCES sows(id) ON DELETE CASCADE,
  boar_id UUID REFERENCES boars(id) ON DELETE CASCADE,
  piglet_id UUID REFERENCES piglets(id) ON DELETE CASCADE,

  -- Quarantine details
  reason VARCHAR(200) NOT NULL,
  illness_id UUID REFERENCES illnesses(id) ON DELETE SET NULL, -- Link to illness if applicable

  -- Dates
  quarantine_start_date DATE NOT NULL,
  expected_end_date DATE,
  actual_end_date DATE,

  -- Location
  quarantine_location_id UUID REFERENCES housing_units(id) ON DELETE SET NULL,
  quarantine_location_name VARCHAR(100),

  -- Status
  status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active', 'released', 'died')),

  -- Release criteria
  release_criteria TEXT,
  release_notes TEXT,

  -- People
  ordered_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ordered_by_name VARCHAR(100),
  released_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  released_by_name VARCHAR(100),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quarantine_org ON quarantine_records(organization_id);
CREATE INDEX idx_quarantine_sow ON quarantine_records(sow_id);
CREATE INDEX idx_quarantine_boar ON quarantine_records(boar_id);
CREATE INDEX idx_quarantine_piglet ON quarantine_records(piglet_id);
CREATE INDEX idx_quarantine_status ON quarantine_records(status);
```

---

### Modified Existing Tables

#### Update `sows`, `boars`, `piglets` Tables
Add health status indicators:

```sql
-- Add to sows table
ALTER TABLE sows
ADD COLUMN health_status VARCHAR(20) DEFAULT 'healthy'
  CHECK (health_status IN ('healthy', 'sick', 'quarantined', 'in_treatment')),
ADD COLUMN last_health_check_date DATE,
ADD COLUMN is_in_withdrawal BOOLEAN DEFAULT false,
ADD COLUMN withdrawal_end_date DATE;

-- Repeat for boars and piglets tables
```

---

## UI/UX Design

### 1. Navigation & Menu

Add "Health" section to main navigation:
- **Health Dashboard** - Overview of health status
- **Vaccinations** - Upcoming, overdue, history
- **Treatments** - Active treatments, withdrawal periods
- **Illnesses** - Active illnesses, disease tracking
- **Quarantine** - Animals in isolation
- **Health Reports** - Analytics and compliance

---

### 2. Animal Detail View Enhancements

Add "Health Tab" to sow/boar/piglet detail modals:

**Health Tab Sections:**
1. **Quick Health Status**
   - Current health status badge (Healthy, Sick, In Treatment, Quarantined)
   - Active treatments count
   - In withdrawal? (Yes/No with end date)
   - Last health check

2. **Vaccination History**
   - List all vaccines administered
   - Next due vaccinations highlighted
   - "Add Vaccination" button

3. **Current Treatments**
   - Active medications with end dates
   - Withdrawal periods
   - "Add Treatment" button

4. **Illness History**
   - Past and current illnesses
   - Recovery status
   - "Record Illness" button

5. **Health Events Timeline**
   - Chronological view of all health events
   - Vet visits, injuries, procedures

---

### 3. New Pages/Components

#### Health Dashboard (`app/health/page.tsx`)
- **Alert Cards:**
  - Overdue vaccinations (red)
  - Vaccinations due this week (yellow)
  - Animals in withdrawal (orange)
  - Animals in quarantine (blue)

- **Quick Stats:**
  - Total active treatments
  - Animals currently sick
  - Mortality rate (last 30 days)

- **Quick Actions:**
  - Record vaccination
  - Record treatment
  - Log illness
  - Add health event

#### Vaccinations Page (`app/health/vaccinations/page.tsx`)
- Vaccination calendar view
- Filter by: Due date, Animal type, Vaccine type
- Batch vaccination feature (vaccinate multiple animals at once)
- Vaccine inventory tracker

#### Treatments Page (`app/health/treatments/page.tsx`)
- Active treatments list
- Withdrawal period tracker
- Treatment history
- Cost tracking

#### Illnesses Page (`app/health/illnesses/page.tsx`)
- Active illnesses
- Disease outbreak tracking
- Contagious disease alerts
- Illness history and patterns

#### Quarantine Page (`app/health/quarantine/page.tsx`)
- Animals currently in quarantine
- Quarantine location map
- Release schedule
- Daily monitoring checklist

---

### 4. Forms & Modals

#### Record Vaccination Modal
- Select animal (dropdown with search)
- Select vaccine type (from vaccination_types)
- OR enter custom vaccine name
- Date administered
- Batch/lot number
- Expiration date
- Next due date (auto-calculated or manual)
- Administered by (team member dropdown)
- Notes

#### Record Treatment Modal
- Select animal
- Medication name
- Reason/diagnosis
- Dosage and frequency
- Start date and duration
- Withdrawal period? (checkbox)
  - If yes: withdrawal days → auto-calculate safe date
- Prescribed by (vet name)
- Cost

#### Log Illness Modal
- Select animal
- Illness name/type
- Symptoms (multi-line text)
- Severity (dropdown)
- Date first observed
- Contagious? (checkbox → triggers quarantine question)
- Diagnosed by vet? (checkbox)
- Treatment plan

---

## Integration with Existing System

### 1. Animal Status Updates

**Automatic Updates:**
- When illness logged with `contagious=true` → Create quarantine record
- When treatment with withdrawal added → Set `is_in_withdrawal=true` on animal
- When quarantined → Block animal from breeding/farrowing operations
- When died → Show cause of death from mortality record

### 2. Task Integration

**Automatic Task Creation:**
- Vaccination due → Create task "Vaccinate [animal] with [vaccine]"
- Treatment end date → Create task "Complete treatment for [animal]"
- Withdrawal end date → Create task "Animal [X] ready for sale"
- Health check due → Create task "Perform health check on [animal]"

### 3. Notifications & Alerts

**Dashboard Alerts:**
- Overdue vaccinations
- Withdrawal periods ending this week
- Quarantine animals ready for release
- Disease outbreak warnings

### 4. Prop 12 Compliance

**Health-Related Compliance:**
- Track animals receiving veterinary treatment (exempt from space requirements)
- Link illnesses to location history (compliance documentation)
- Quarantine tracking (part of temporary confinement)

---

## Implementation Phases

### Phase 1: Vaccination Management (3-4 hours)
**Goal**: Basic vaccination tracking

- [ ] Create `vaccination_types` and `vaccinations` tables
- [ ] Build vaccination type management (admin)
- [ ] Build "Record Vaccination" modal
- [ ] Add vaccination history to animal detail view
- [ ] Create vaccinations due list
- [ ] Test: Record vaccine, see in history, see due date

---

### Phase 2: Treatment & Medications (3-4 hours)
**Goal**: Track treatments and withdrawal periods

- [ ] Create `medications` table
- [ ] Build "Record Treatment" modal
- [ ] Implement withdrawal period calculations
- [ ] Add withdrawal status to animal cards
- [ ] Create active treatments page
- [ ] Block sales during withdrawal
- [ ] Test: Record treatment, verify withdrawal tracking

---

### Phase 3: Illness Tracking (2-3 hours)
**Goal**: Log and monitor illnesses

- [ ] Create `illnesses` table
- [ ] Build "Log Illness" modal
- [ ] Add illness history to animal detail view
- [ ] Create active illnesses page
- [ ] Implement severity indicators
- [ ] Test: Log illness, track recovery

---

### Phase 4: Quarantine Management (2-3 hours)
**Goal**: Isolate sick animals

- [ ] Create `quarantine_records` table
- [ ] Build quarantine workflow
- [ ] Link quarantine to housing units
- [ ] Create quarantine page
- [ ] Block breeding/farrowing during quarantine
- [ ] Test: Quarantine animal, release animal

---

### Phase 5: Health Events & General Observations (2-3 hours)
**Goal**: Track vet visits, injuries, procedures

- [ ] Create `health_events` table
- [ ] Build health event modal
- [ ] Add health timeline to animal detail view
- [ ] Implement body condition scoring
- [ ] Test: Log vet visit, record injury

---

### Phase 6: Health Dashboard & Alerts (2-3 hours)
**Goal**: Centralized health overview

- [ ] Create health dashboard page
- [ ] Build alert cards (overdue, due soon, in withdrawal)
- [ ] Add quick stats
- [ ] Integrate with notification system
- [ ] Test: Dashboard shows correct alerts

---

### Phase 7: Reports & Analytics (2-3 hours)
**Goal**: Health insights and compliance

- [ ] Vaccination compliance report
- [ ] Treatment cost report
- [ ] Mortality analysis
- [ ] Disease frequency report
- [ ] Antibiotic usage report
- [ ] Export reports to CSV/PDF

---

### Phase 8: Testing & Refinement (2-3 hours)
**Goal**: End-to-end testing

- [ ] Test complete vaccination workflow
- [ ] Test treatment with withdrawal
- [ ] Test illness → quarantine → recovery
- [ ] Test health dashboard accuracy
- [ ] Performance testing
- [ ] Bug fixes

---

## Timeline Estimate

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1: Vaccinations | 3-4 hours | 3-4 hours |
| Phase 2: Treatments | 3-4 hours | 6-8 hours |
| Phase 3: Illnesses | 2-3 hours | 8-11 hours |
| Phase 4: Quarantine | 2-3 hours | 10-14 hours |
| Phase 5: Health Events | 2-3 hours | 12-17 hours |
| Phase 6: Dashboard | 2-3 hours | 14-20 hours |
| Phase 7: Reports | 2-3 hours | 16-23 hours |
| Phase 8: Testing | 2-3 hours | 18-26 hours |
| **TOTAL** | **18-26 hours** | |

**Recommended Approach**: Implement over 4-5 coding sessions, one phase at a time.

---

## Future Enhancements (v3.0+)

### Advanced Features
- **Mobile Health Tracking**: Record treatments via mobile app
- **Photo Documentation**: Attach photos to health events (injuries, symptoms)
- **Vet Portal**: Allow veterinarians to access and update records
- **Lab Results Integration**: Link to lab test results
- **Predictive Analytics**: Identify health patterns, predict outbreaks
- **Feed Efficiency**: Correlate health status with feed consumption
- **Genetic Health Tracking**: Track hereditary conditions, breeding decisions
- **Herd Health Scoring**: Overall herd health metrics

### Integration Opportunities
- **Vet Practice Software**: Sync with veterinarian's system
- **Lab Systems**: Auto-import lab results
- **Government Reporting**: Auto-generate compliance reports
- **Supply Chain**: Track medication suppliers, costs

---

## Notes & Considerations

### Data Privacy & Compliance
- Health records may be subject to veterinary confidentiality
- Antibiotic usage data important for regulatory compliance
- USDA/FDA may require certain records be maintained

### Best Practices
- Always record batch/lot numbers for vaccines (for recalls)
- Track withdrawal periods carefully (food safety critical)
- Document all veterinary treatments (legal protection)
- Maintain complete vaccination records (sale/export requirements)

### User Education
- Provide guidance on withdrawal periods
- Educate on importance of batch tracking
- Explain proper quarantine procedures
- Offer vaccination schedule templates

---

**Document End**

*This plan represents a comprehensive health & wellness tracking system. Implementation should be prioritized based on farm needs and can be phased over multiple releases.*
