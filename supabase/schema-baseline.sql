-- ============================================================
-- SCHEMA BASELINE (generated from live database via pg_catalog)
-- Project: eveuhponokpcsodikwpf
-- Purpose: disaster-recovery / rebuild artifact.
-- NOTE: excludes data, storage buckets, auth schema config.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== TABLES ====================
CREATE TABLE public."ai_doses" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "user_id" uuid NOT NULL,
  "breeding_attempt_id" uuid NOT NULL,
  "dose_number" integer NOT NULL,
  "dose_date" date NOT NULL,
  "straws_used" integer,
  "boar_id" uuid,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "dose_time" timestamp with time zone,
  "organization_id" uuid
);

CREATE TABLE public."boar_location_history" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "boar_id" uuid NOT NULL,
  "housing_unit_id" uuid,
  "moved_in_date" timestamp with time zone DEFAULT now(),
  "moved_out_date" timestamp with time zone,
  "reason" character varying(100),
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "organization_id" uuid
);

CREATE TABLE public."boar_transfer_requests" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "boar_id" uuid NOT NULL,
  "from_user_id" uuid NOT NULL,
  "to_user_email" character varying(255) NOT NULL,
  "to_user_id" uuid,
  "status" character varying(20) DEFAULT 'pending'::character varying,
  "message" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "responded_at" timestamp with time zone,
  "retain_records" boolean DEFAULT false,
  "from_organization_id" uuid,
  "to_organization_id" uuid
);

CREATE TABLE public."boars" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "ear_tag" character varying(50) NOT NULL,
  "name" character varying(100),
  "birth_date" date NOT NULL,
  "breed" character varying(100) NOT NULL,
  "status" character varying(20) DEFAULT 'active'::character varying,
  "notes" text,
  "photo_url" text,
  "registration_number" character varying(100),
  "right_ear_notch" integer,
  "left_ear_notch" integer,
  "sire_id" uuid,
  "dam_id" uuid,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "boar_type" character varying(20) DEFAULT 'live'::character varying,
  "semen_straws" integer,
  "supplier" character varying(200),
  "collection_date" date,
  "cost_per_straw" numeric(10,2),
  "user_id" uuid NOT NULL,
  "original_user_id" uuid,
  "transferred_from_user_id" uuid,
  "transferred_at" timestamp with time zone,
  "housing_unit_id" uuid,
  "sire_name" character varying(100),
  "dam_name" character varying(100),
  "organization_id" uuid NOT NULL,
  "purchase_cost" numeric(10,2),
  "purchase_date" date,
  "sale_date" date,
  "sale_price" numeric(10,2),
  "ownership_type" character varying(20) DEFAULT 'owned'::character varying,
  "semen_type" character varying(20) DEFAULT 'fresh'::character varying
);

CREATE TABLE public."breeding_attempts" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "user_id" uuid NOT NULL,
  "sow_id" uuid NOT NULL,
  "breeding_date" date NOT NULL,
  "breeding_method" character varying(20) NOT NULL,
  "boar_id" uuid,
  "boar_description" text,
  "pregnancy_check_date" date,
  "pregnancy_confirmed" boolean,
  "result" character varying(30),
  "farrowing_id" uuid,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "breeding_time" timestamp with time zone,
  "breeding_cycle_complete" boolean DEFAULT false,
  "breeding_cycle_completed_at" timestamp with time zone,
  "last_dose_date" date,
  "scheduled_time" time without time zone,
  "duration_minutes" integer DEFAULT 5,
  "organization_id" uuid NOT NULL
);

CREATE TABLE public."budgets" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "budget_name" character varying(200) NOT NULL,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "feed_budget" numeric(10,2) DEFAULT 0,
  "veterinary_budget" numeric(10,2) DEFAULT 0,
  "facilities_budget" numeric(10,2) DEFAULT 0,
  "utilities_budget" numeric(10,2) DEFAULT 0,
  "other_budget" numeric(10,2) DEFAULT 0,
  "revenue_target" numeric(10,2) DEFAULT 0,
  "status" character varying(20) DEFAULT 'active'::character varying,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."calendar_events" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "user_id" uuid NOT NULL,
  "event_type" character varying(50) NOT NULL,
  "title" character varying(200) NOT NULL,
  "description" text,
  "event_date" date NOT NULL,
  "all_day" boolean DEFAULT true,
  "start_time" time without time zone,
  "end_time" time without time zone,
  "related_sow_id" uuid,
  "related_boar_id" uuid,
  "related_piglet_id" uuid,
  "completed" boolean DEFAULT false,
  "completed_at" timestamp with time zone,
  "priority" character varying(20) DEFAULT 'medium'::character varying,
  "recurrence_pattern" character varying(50),
  "recurrence_end_date" date,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "organization_id" uuid NOT NULL
);

CREATE TABLE public."certifications" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "certification_type" text NOT NULL,
  "certifier_name" text NOT NULL,
  "certifier_organization" text,
  "issue_date" date NOT NULL,
  "expiration_date" date NOT NULL,
  "certificate_number" text,
  "document_url" text,
  "status" text DEFAULT 'active'::text,
  "notes" text,
  "user_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public."confinement_events" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "sow_id" uuid,
  "housing_unit_id" uuid,
  "start_time" timestamp with time zone NOT NULL,
  "end_time" timestamp with time zone,
  "duration_hours" numeric(10,2),
  "reason" text NOT NULL,
  "notes" text,
  "user_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public."cost_allocations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "allocation_date" date NOT NULL,
  "allocation_type" character varying(50) NOT NULL,
  "amount" numeric(10,2) NOT NULL,
  "animal_type" character varying(20) NOT NULL,
  "sow_id" uuid,
  "boar_id" uuid,
  "piglet_id" uuid,
  "farrowing_id" uuid,
  "expense_record_id" uuid,
  "description" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."expense_records" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "expense_date" date NOT NULL,
  "expense_category" character varying(50) NOT NULL,
  "amount" numeric(10,2) NOT NULL,
  "description" character varying(200) NOT NULL,
  "vendor" character varying(200),
  "invoice_number" character varying(100),
  "health_record_id" uuid,
  "feed_record_id" uuid,
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."farm_settings" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "user_id" uuid NOT NULL,
  "farm_name" character varying(255),
  "prop12_compliance_enabled" boolean DEFAULT false,
  "timezone" character varying(50) DEFAULT 'America/Los_Angeles'::character varying,
  "weight_unit" character varying(10) DEFAULT 'kg'::character varying,
  "measurement_unit" character varying(10) DEFAULT 'feet'::character varying,
  "email_notifications_enabled" boolean DEFAULT true,
  "task_reminders_enabled" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "logo_url" text,
  "ear_notch_current_litter" integer DEFAULT 1,
  "ear_notch_last_reset_date" timestamp with time zone DEFAULT now(),
  "organization_id" uuid NOT NULL,
  "farm_map_url" text
);

CREATE TABLE public."farrowings" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "sow_id" uuid NOT NULL,
  "breeding_date" date NOT NULL,
  "expected_farrowing_date" date NOT NULL,
  "actual_farrowing_date" date,
  "live_piglets" integer,
  "stillborn" integer DEFAULT 0,
  "mummified" integer DEFAULT 0,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "moved_to_farrowing_date" date,
  "farrowing_crate" character varying(50),
  "moved_out_of_farrowing_date" date,
  "boar_id" uuid,
  "breeding_method" character varying(20) DEFAULT 'natural'::character varying,
  "user_id" uuid NOT NULL,
  "breeding_attempt_id" uuid,
  "scheduled_time" time without time zone,
  "duration_minutes" integer DEFAULT 30,
  "organization_id" uuid NOT NULL
);

CREATE TABLE public."feed_records" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "record_date" date NOT NULL,
  "feed_type" character varying(100) NOT NULL,
  "animal_group" character varying(50) NOT NULL,
  "quantity_lbs" numeric(10,2) NOT NULL,
  "cost_per_unit" numeric(10,2),
  "total_cost" numeric(10,2) NOT NULL,
  "supplier" character varying(200),
  "notes" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."feedback" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "organization_id" uuid,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "page_url" text,
  "status" text DEFAULT 'open'::text NOT NULL,
  "priority" text DEFAULT 'medium'::text,
  "admin_notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "resolved_at" timestamp with time zone
);

CREATE TABLE public."health_records" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "user_id" uuid NOT NULL,
  "animal_type" character varying(20) NOT NULL,
  "sow_id" uuid,
  "boar_id" uuid,
  "piglet_id" uuid,
  "record_type" character varying(50) NOT NULL,
  "record_date" date NOT NULL,
  "title" character varying(200) NOT NULL,
  "description" text,
  "dosage" character varying(100),
  "cost" numeric(10,2),
  "administered_by" character varying(100),
  "veterinarian" character varying(100),
  "next_due_date" date,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "scheduled_time" time without time zone,
  "duration_minutes" integer DEFAULT 15,
  "organization_id" uuid NOT NULL
);

CREATE TABLE public."housing_units" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "user_id" uuid NOT NULL,
  "name" character varying(100) NOT NULL,
  "unit_number" character varying(50),
  "type" character varying(50) NOT NULL,
  "length_feet" numeric(10,2),
  "width_feet" numeric(10,2),
  "square_footage" numeric(10,2),
  "max_capacity" integer,
  "building_name" character varying(100),
  "notes" text,
  "measurement_date" date,
  "measured_by" character varying(100),
  "measurement_notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "floor_space_sqft" numeric(10,2),
  "pen_number" text,
  "organization_id" uuid NOT NULL
);

CREATE TABLE public."income_records" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "income_date" date NOT NULL,
  "income_type" character varying(50) NOT NULL,
  "quantity" integer,
  "price_per_unit" numeric(10,2),
  "total_amount" numeric(10,2) NOT NULL,
  "sow_ids" uuid[],
  "boar_ids" uuid[],
  "piglet_ids" uuid[],
  "buyer_name" character varying(200),
  "invoice_number" character varying(100),
  "payment_status" character varying(50) DEFAULT 'pending'::character varying,
  "description" text,
  "is_deleted" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."location_history" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "sow_id" uuid,
  "housing_unit_id" uuid,
  "moved_in_date" timestamp with time zone NOT NULL,
  "moved_out_date" timestamp with time zone,
  "reason" text,
  "notes" text,
  "user_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public."matrix_treatments" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "sow_id" uuid NOT NULL,
  "batch_name" character varying(100) NOT NULL,
  "administration_date" date NOT NULL,
  "expected_heat_date" date NOT NULL,
  "actual_heat_date" date,
  "bred" boolean DEFAULT false,
  "breeding_date" date,
  "dosage" character varying(50),
  "lot_number" character varying(50),
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "user_id" uuid NOT NULL,
  "treatment_start_date" date,
  "treatment_end_date" date,
  "treatment_duration_days" integer DEFAULT 30,
  "treatment_completed" boolean DEFAULT false,
  "scheduled_time" time without time zone,
  "duration_minutes" integer DEFAULT 5,
  "organization_id" uuid
);

CREATE TABLE public."notification_preferences" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "push_enabled" boolean DEFAULT true,
  "push_subscription" jsonb,
  "email_enabled" boolean DEFAULT true,
  "email_daily_digest" boolean DEFAULT true,
  "email_weekly_report" boolean DEFAULT false,
  "sms_enabled" boolean DEFAULT false,
  "phone_number" character varying(20),
  "notify_farrowing" boolean DEFAULT true,
  "notify_breeding" boolean DEFAULT true,
  "notify_pregnancy_check" boolean DEFAULT true,
  "notify_weaning" boolean DEFAULT true,
  "notify_vaccination" boolean DEFAULT true,
  "notify_health_records" boolean DEFAULT true,
  "notify_matrix" boolean DEFAULT true,
  "notify_tasks" boolean DEFAULT true,
  "notify_transfers" boolean DEFAULT true,
  "notify_compliance" boolean DEFAULT true,
  "quiet_hours_start" time without time zone DEFAULT '22:00:00'::time without time zone,
  "quiet_hours_end" time without time zone DEFAULT '07:00:00'::time without time zone,
  "timezone" character varying(50) DEFAULT 'America/Chicago'::character varying,
  "farrowing_reminder_days" integer[] DEFAULT ARRAY[7, 3, 1],
  "pregnancy_check_reminder_days" integer[] DEFAULT ARRAY[1],
  "weaning_reminder_days" integer[] DEFAULT ARRAY[3, 1],
  "vaccination_reminder_days" integer[] DEFAULT ARRAY[7, 3, 1],
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."notifications" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "organization_id" uuid,
  "type" character varying(50) NOT NULL,
  "title" character varying(255) NOT NULL,
  "body" text NOT NULL,
  "icon_url" text,
  "related_type" character varying(50),
  "related_id" uuid,
  "action_url" text,
  "channels" character varying(50)[] DEFAULT ARRAY['push'::text],
  "sent_at" timestamp with time zone DEFAULT now(),
  "read_at" timestamp with time zone,
  "clicked_at" timestamp with time zone,
  "priority" character varying(20) DEFAULT 'normal'::character varying,
  "expires_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now(),
  "push_sent_at" timestamp with time zone,
  "email_sent_at" timestamp with time zone,
  "push_error" text,
  "email_error" text
);

CREATE TABLE public."organization_members" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role" character varying(50) NOT NULL,
  "invited_by" uuid,
  "invited_at" timestamp with time zone DEFAULT now(),
  "joined_at" timestamp with time zone,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."organizations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" character varying(255) NOT NULL,
  "slug" character varying(100) NOT NULL,
  "logo_url" text,
  "settings" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."piglet_location_history" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "piglet_id" uuid NOT NULL,
  "housing_unit_id" uuid,
  "moved_in_date" timestamp with time zone DEFAULT now(),
  "moved_out_date" timestamp with time zone,
  "reason" character varying(100),
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."piglets" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "farrowing_id" uuid NOT NULL,
  "birth_weight" numeric(5,2),
  "status" character varying(20) DEFAULT 'alive'::character varying,
  "died_date" date,
  "weaned_date" date,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "weaning_weight" numeric(5,2),
  "ear_tag" character varying(50),
  "right_ear_notch" integer,
  "left_ear_notch" integer,
  "sex" character varying(10),
  "ear_notch_date" date,
  "castration_date" date,
  "culled_date" date,
  "sold_date" date,
  "user_id" uuid NOT NULL,
  "sire_id" uuid,
  "dam_id" uuid,
  "registration_number" character varying(100),
  "registration_association" character varying(200),
  "registration_date" date,
  "name" character varying(200),
  "housing_unit_id" uuid,
  "sire_name" character varying(100),
  "dam_name" character varying(100),
  "organization_id" uuid NOT NULL,
  "sale_date" date,
  "sale_price" numeric(10,2),
  "sale_weight_lbs" numeric(10,2)
);

CREATE TABLE public."protocol_tasks" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "protocol_id" uuid NOT NULL,
  "task_name" character varying(255) NOT NULL,
  "description" text,
  "days_offset" integer NOT NULL,
  "is_required" boolean DEFAULT true,
  "task_order" integer DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "user_id" uuid,
  "priority" character varying(20) DEFAULT 'medium'::character varying
);

CREATE TABLE public."protocols" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" character varying(255) NOT NULL,
  "description" text,
  "trigger_event" character varying(50) NOT NULL,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "user_id" uuid,
  "organization_id" uuid NOT NULL
);

CREATE TABLE public."reminders" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "type" character varying(20) NOT NULL,
  "title" character varying(200) NOT NULL,
  "due_date" date NOT NULL,
  "sow_id" uuid,
  "completed" boolean DEFAULT false,
  "completed_at" timestamp with time zone,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "user_id" uuid NOT NULL,
  "organization_id" uuid
);

CREATE TABLE public."scheduled_notifications" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "organization_id" uuid,
  "type" character varying(50) NOT NULL,
  "title" character varying(255) NOT NULL,
  "body" text NOT NULL,
  "related_type" character varying(50),
  "related_id" uuid,
  "action_url" text,
  "scheduled_for" timestamp with time zone NOT NULL,
  "sent" boolean DEFAULT false,
  "sent_at" timestamp with time zone,
  "priority" character varying(20) DEFAULT 'normal'::character varying,
  "channels" character varying(50)[] DEFAULT ARRAY['push'::text],
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."scheduled_tasks" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "protocol_id" uuid,
  "protocol_task_id" uuid,
  "farrowing_id" uuid,
  "sow_id" uuid,
  "task_name" character varying(255) NOT NULL,
  "description" text,
  "due_date" date NOT NULL,
  "is_completed" boolean DEFAULT false,
  "completed_at" timestamp with time zone,
  "completed_notes" text,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "user_id" uuid NOT NULL,
  "organization_id" uuid
);

CREATE TABLE public."sow_location_history" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "sow_id" uuid NOT NULL,
  "from_location" character varying(50),
  "to_location" character varying(50) NOT NULL,
  "moved_at" timestamp with time zone DEFAULT now() NOT NULL,
  "moved_by" uuid,
  "reason" character varying(255),
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "housing_unit_id" uuid,
  "user_id" uuid NOT NULL,
  "scheduled_time" time without time zone,
  "duration_minutes" integer DEFAULT 10,
  "organization_id" uuid
);

CREATE TABLE public."sow_temporary_confinement" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "sow_id" uuid NOT NULL,
  "start_time" timestamp with time zone NOT NULL,
  "end_time" timestamp with time zone,
  "duration_hours" numeric(5,2),
  "reason" character varying(255) NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "user_id" uuid NOT NULL
);

CREATE TABLE public."sow_transfer_requests" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "sow_id" uuid NOT NULL,
  "from_user_id" uuid NOT NULL,
  "to_user_email" character varying(255) NOT NULL,
  "to_user_id" uuid,
  "status" character varying(20) DEFAULT 'pending'::character varying,
  "message" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "responded_at" timestamp with time zone,
  "retain_records" boolean DEFAULT false,
  "from_organization_id" uuid,
  "to_organization_id" uuid
);

CREATE TABLE public."sows" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "ear_tag" character varying(50) NOT NULL,
  "birth_date" date NOT NULL,
  "breed" character varying(100) NOT NULL,
  "status" character varying(20) DEFAULT 'active'::character varying,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "name" character varying(100),
  "right_ear_notch" integer,
  "left_ear_notch" integer,
  "registration_number" character varying(100),
  "photo_url" text,
  "registration_document_url" text,
  "sire_id" uuid,
  "dam_id" uuid,
  "current_location" character varying(50),
  "last_location_change" timestamp with time zone,
  "housing_unit_id" uuid,
  "user_id" uuid NOT NULL,
  "original_user_id" uuid,
  "transferred_from_user_id" uuid,
  "transferred_at" timestamp with time zone,
  "sire_name" character varying(100),
  "dam_name" character varying(100),
  "organization_id" uuid NOT NULL,
  "purchase_cost" numeric(10,2),
  "purchase_date" date,
  "sale_date" date,
  "sale_price" numeric(10,2)
);

CREATE TABLE public."team_invites" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "token" text NOT NULL,
  "organization_id" uuid NOT NULL,
  "invited_by" uuid NOT NULL,
  "email" text NOT NULL,
  "role" text NOT NULL,
  "expires_at" timestamp with time zone DEFAULT (now() + '7 days'::interval) NOT NULL,
  "accepted_at" timestamp with time zone,
  "accepted_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."transactions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "transaction_date" date NOT NULL,
  "transaction_type" text NOT NULL,
  "animal_ids" uuid[] NOT NULL,
  "quantity" integer NOT NULL,
  "party_name" text NOT NULL,
  "party_address" text,
  "transfer_location" text,
  "compliance_status" text,
  "invoice_number" text,
  "notes" text,
  "user_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "price_per_unit" numeric(10,2),
  "total_amount" numeric(10,2)
);

CREATE TABLE public."vaccinations" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "sow_id" uuid,
  "piglet_id" uuid,
  "vaccine_type" character varying(100) NOT NULL,
  "date_given" date NOT NULL,
  "next_due_date" date,
  "batch_number" character varying(50),
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "user_id" uuid NOT NULL,
  "organization_id" uuid
);

-- ==================== CONSTRAINTS ====================
ALTER TABLE ai_doses ADD CONSTRAINT "ai_doses_pkey" PRIMARY KEY (id);
ALTER TABLE boar_location_history ADD CONSTRAINT "boar_location_history_pkey" PRIMARY KEY (id);
ALTER TABLE boar_transfer_requests ADD CONSTRAINT "boar_transfer_requests_pkey" PRIMARY KEY (id);
ALTER TABLE boars ADD CONSTRAINT "boars_pkey" PRIMARY KEY (id);
ALTER TABLE breeding_attempts ADD CONSTRAINT "breeding_attempts_pkey" PRIMARY KEY (id);
ALTER TABLE budgets ADD CONSTRAINT "budgets_pkey" PRIMARY KEY (id);
ALTER TABLE calendar_events ADD CONSTRAINT "calendar_events_pkey" PRIMARY KEY (id);
ALTER TABLE certifications ADD CONSTRAINT "certifications_pkey" PRIMARY KEY (id);
ALTER TABLE confinement_events ADD CONSTRAINT "confinement_events_pkey" PRIMARY KEY (id);
ALTER TABLE cost_allocations ADD CONSTRAINT "cost_allocations_pkey" PRIMARY KEY (id);
ALTER TABLE expense_records ADD CONSTRAINT "expense_records_pkey" PRIMARY KEY (id);
ALTER TABLE farm_settings ADD CONSTRAINT "farm_settings_pkey" PRIMARY KEY (id);
ALTER TABLE farrowings ADD CONSTRAINT "farrowings_pkey" PRIMARY KEY (id);
ALTER TABLE feed_records ADD CONSTRAINT "feed_records_pkey" PRIMARY KEY (id);
ALTER TABLE feedback ADD CONSTRAINT "feedback_pkey" PRIMARY KEY (id);
ALTER TABLE health_records ADD CONSTRAINT "health_records_pkey" PRIMARY KEY (id);
ALTER TABLE housing_units ADD CONSTRAINT "housing_units_pkey" PRIMARY KEY (id);
ALTER TABLE income_records ADD CONSTRAINT "income_records_pkey" PRIMARY KEY (id);
ALTER TABLE location_history ADD CONSTRAINT "location_history_pkey" PRIMARY KEY (id);
ALTER TABLE matrix_treatments ADD CONSTRAINT "matrix_treatments_pkey" PRIMARY KEY (id);
ALTER TABLE notification_preferences ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY (id);
ALTER TABLE notifications ADD CONSTRAINT "notifications_pkey" PRIMARY KEY (id);
ALTER TABLE organization_members ADD CONSTRAINT "organization_members_pkey" PRIMARY KEY (id);
ALTER TABLE organizations ADD CONSTRAINT "organizations_pkey" PRIMARY KEY (id);
ALTER TABLE piglet_location_history ADD CONSTRAINT "piglet_location_history_pkey" PRIMARY KEY (id);
ALTER TABLE piglets ADD CONSTRAINT "piglets_pkey" PRIMARY KEY (id);
ALTER TABLE protocol_tasks ADD CONSTRAINT "protocol_tasks_pkey" PRIMARY KEY (id);
ALTER TABLE protocols ADD CONSTRAINT "protocols_pkey" PRIMARY KEY (id);
ALTER TABLE reminders ADD CONSTRAINT "reminders_pkey" PRIMARY KEY (id);
ALTER TABLE scheduled_notifications ADD CONSTRAINT "scheduled_notifications_pkey" PRIMARY KEY (id);
ALTER TABLE scheduled_tasks ADD CONSTRAINT "scheduled_tasks_pkey" PRIMARY KEY (id);
ALTER TABLE sow_location_history ADD CONSTRAINT "sow_location_history_pkey" PRIMARY KEY (id);
ALTER TABLE sow_temporary_confinement ADD CONSTRAINT "sow_temporary_confinement_pkey" PRIMARY KEY (id);
ALTER TABLE sow_transfer_requests ADD CONSTRAINT "sow_transfer_requests_pkey" PRIMARY KEY (id);
ALTER TABLE sows ADD CONSTRAINT "sows_pkey" PRIMARY KEY (id);
ALTER TABLE team_invites ADD CONSTRAINT "team_invites_pkey" PRIMARY KEY (id);
ALTER TABLE transactions ADD CONSTRAINT "transactions_pkey" PRIMARY KEY (id);
ALTER TABLE vaccinations ADD CONSTRAINT "vaccinations_pkey" PRIMARY KEY (id);
ALTER TABLE boar_transfer_requests ADD CONSTRAINT "unique_active_boar_request" UNIQUE (boar_id, status) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE boars ADD CONSTRAINT "boars_ear_tag_key" UNIQUE (ear_tag);
ALTER TABLE notification_preferences ADD CONSTRAINT "notification_preferences_user_id_key" UNIQUE (user_id);
ALTER TABLE organization_members ADD CONSTRAINT "organization_members_organization_id_user_id_key" UNIQUE (organization_id, user_id);
ALTER TABLE organizations ADD CONSTRAINT "organizations_slug_key" UNIQUE (slug);
ALTER TABLE sow_transfer_requests ADD CONSTRAINT "unique_active_request" UNIQUE (sow_id, status) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE sows ADD CONSTRAINT "sows_ear_tag_key" UNIQUE (ear_tag);
ALTER TABLE team_invites ADD CONSTRAINT "team_invites_token_key" UNIQUE (token);
ALTER TABLE team_invites ADD CONSTRAINT "unique_active_invite" UNIQUE (organization_id, email, accepted_at);
ALTER TABLE ai_doses ADD CONSTRAINT "ai_doses_dose_number_check" CHECK (((dose_number >= 1) AND (dose_number <= 10)));
ALTER TABLE ai_doses ADD CONSTRAINT "ai_doses_straws_used_check" CHECK ((straws_used > 0));
ALTER TABLE boar_transfer_requests ADD CONSTRAINT "boar_transfer_requests_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'declined'::character varying, 'cancelled'::character varying])::text[])));
ALTER TABLE boars ADD CONSTRAINT "boars_boar_type_check" CHECK (((boar_type)::text = ANY ((ARRAY['live'::character varying, 'ai_semen'::character varying])::text[])));
ALTER TABLE boars ADD CONSTRAINT "boars_ownership_type_check" CHECK (((ownership_type)::text = ANY ((ARRAY['owned'::character varying, 'borrowed'::character varying, 'rented'::character varying])::text[])));
ALTER TABLE boars ADD CONSTRAINT "boars_semen_type_check" CHECK (((semen_type)::text = ANY ((ARRAY['fresh'::character varying, 'frozen'::character varying])::text[])));
ALTER TABLE boars ADD CONSTRAINT "boars_status_check" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'culled'::character varying, 'sold'::character varying, 'depleted'::character varying])::text[])));
ALTER TABLE breeding_attempts ADD CONSTRAINT "breeding_attempts_breeding_method_check" CHECK (((breeding_method)::text = ANY ((ARRAY['natural'::character varying, 'ai'::character varying])::text[])));
ALTER TABLE breeding_attempts ADD CONSTRAINT "breeding_attempts_result_check" CHECK (((result)::text = ANY ((ARRAY['pending'::character varying, 'pregnant'::character varying, 'returned_to_heat'::character varying, 'aborted'::character varying, 'farrowed'::character varying, 'unknown'::character varying])::text[])));
ALTER TABLE budgets ADD CONSTRAINT "budgets_status_check" CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'active'::character varying, 'completed'::character varying, 'archived'::character varying])::text[])));
ALTER TABLE calendar_events ADD CONSTRAINT "calendar_events_event_type_check" CHECK (((event_type)::text = ANY ((ARRAY['custom'::character varying, 'task'::character varying, 'reminder'::character varying, 'note'::character varying])::text[])));
ALTER TABLE calendar_events ADD CONSTRAINT "calendar_events_priority_check" CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying])::text[])));
ALTER TABLE cost_allocations ADD CONSTRAINT "check_one_animal" CHECK (((((animal_type)::text = 'sow'::text) AND (sow_id IS NOT NULL) AND (boar_id IS NULL) AND (piglet_id IS NULL) AND (farrowing_id IS NULL)) OR (((animal_type)::text = 'boar'::text) AND (boar_id IS NOT NULL) AND (sow_id IS NULL) AND (piglet_id IS NULL) AND (farrowing_id IS NULL)) OR (((animal_type)::text = 'piglet'::text) AND (piglet_id IS NOT NULL) AND (sow_id IS NULL) AND (boar_id IS NULL) AND (farrowing_id IS NULL)) OR (((animal_type)::text = 'litter'::text) AND (farrowing_id IS NOT NULL) AND (sow_id IS NULL) AND (boar_id IS NULL) AND (piglet_id IS NULL))));
ALTER TABLE cost_allocations ADD CONSTRAINT "cost_allocations_allocation_type_check" CHECK (((allocation_type)::text = ANY ((ARRAY['feed'::character varying, 'veterinary'::character varying, 'breeding'::character varying, 'housing'::character varying, 'other'::character varying])::text[])));
ALTER TABLE cost_allocations ADD CONSTRAINT "cost_allocations_animal_type_check" CHECK (((animal_type)::text = ANY ((ARRAY['sow'::character varying, 'boar'::character varying, 'piglet'::character varying, 'litter'::character varying])::text[])));
ALTER TABLE expense_records ADD CONSTRAINT "expense_records_expense_category_check" CHECK (((expense_category)::text = ANY ((ARRAY['feed'::character varying, 'veterinary'::character varying, 'facilities'::character varying, 'utilities'::character varying, 'labor'::character varying, 'supplies'::character varying, 'breeding'::character varying, 'other'::character varying])::text[])));
ALTER TABLE farm_settings ADD CONSTRAINT "farm_settings_measurement_unit_check" CHECK (((measurement_unit)::text = ANY ((ARRAY['feet'::character varying, 'meters'::character varying])::text[])));
ALTER TABLE farm_settings ADD CONSTRAINT "farm_settings_weight_unit_check" CHECK (((weight_unit)::text = ANY ((ARRAY['kg'::character varying, 'lbs'::character varying])::text[])));
ALTER TABLE farrowings ADD CONSTRAINT "farrowings_breeding_method_check" CHECK (((breeding_method)::text = ANY ((ARRAY['natural'::character varying, 'ai'::character varying])::text[])));
ALTER TABLE feed_records ADD CONSTRAINT "feed_records_animal_group_check" CHECK (((animal_group)::text = ANY ((ARRAY['gestation'::character varying, 'farrowing'::character varying, 'nursery'::character varying, 'boars'::character varying, 'other'::character varying])::text[])));
ALTER TABLE feedback ADD CONSTRAINT "feedback_priority_check" CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])));
ALTER TABLE feedback ADD CONSTRAINT "feedback_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text])));
ALTER TABLE feedback ADD CONSTRAINT "feedback_type_check" CHECK ((type = ANY (ARRAY['bug'::text, 'feature'::text, 'improvement'::text, 'other'::text])));
ALTER TABLE health_records ADD CONSTRAINT "check_animal_reference_and_type" CHECK ((((sow_id IS NOT NULL) AND (boar_id IS NULL) AND (piglet_id IS NULL) AND ((animal_type)::text = 'sow'::text)) OR ((sow_id IS NULL) AND (boar_id IS NOT NULL) AND (piglet_id IS NULL) AND ((animal_type)::text = 'boar'::text)) OR ((sow_id IS NULL) AND (boar_id IS NULL) AND (piglet_id IS NOT NULL) AND ((animal_type)::text = 'piglet'::text))));
ALTER TABLE health_records ADD CONSTRAINT "health_records_animal_type_check" CHECK (((animal_type)::text = ANY ((ARRAY['sow'::character varying, 'boar'::character varying, 'piglet'::character varying])::text[])));
ALTER TABLE housing_units ADD CONSTRAINT "housing_units_type_check" CHECK (((type)::text = ANY ((ARRAY['gestation'::character varying, 'farrowing'::character varying, 'breeding'::character varying, 'hospital'::character varying, 'quarantine'::character varying, 'nursery'::character varying, 'other'::character varying])::text[])));
ALTER TABLE income_records ADD CONSTRAINT "income_records_income_type_check" CHECK (((income_type)::text = ANY ((ARRAY['piglet_sale'::character varying, 'cull_sow_sale'::character varying, 'breeding_stock_sale'::character varying, 'boar_sale'::character varying, 'other'::character varying])::text[])));
ALTER TABLE income_records ADD CONSTRAINT "income_records_payment_status_check" CHECK (((payment_status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'partial'::character varying, 'overdue'::character varying])::text[])));
ALTER TABLE organization_members ADD CONSTRAINT "organization_members_role_check" CHECK (((role)::text = ANY ((ARRAY['owner'::character varying, 'manager'::character varying, 'member'::character varying, 'vet'::character varying, 'readonly'::character varying])::text[])));
ALTER TABLE piglets ADD CONSTRAINT "piglets_sex_check" CHECK (((sex)::text = ANY ((ARRAY['male'::character varying, 'female'::character varying, 'unknown'::character varying])::text[])));
ALTER TABLE piglets ADD CONSTRAINT "piglets_status_check" CHECK (((status)::text = ANY ((ARRAY['nursing'::character varying, 'weaned'::character varying, 'sold'::character varying, 'died'::character varying, 'culled'::character varying])::text[])));
ALTER TABLE protocol_tasks ADD CONSTRAINT "protocol_tasks_priority_check" CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::text[])));
ALTER TABLE reminders ADD CONSTRAINT "reminders_type_check" CHECK (((type)::text = ANY ((ARRAY['breeding'::character varying, 'farrowing'::character varying, 'vaccination'::character varying, 'weaning'::character varying, 'custom'::character varying])::text[])));
ALTER TABLE sow_transfer_requests ADD CONSTRAINT "sow_transfer_requests_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'declined'::character varying, 'cancelled'::character varying])::text[])));
ALTER TABLE sows ADD CONSTRAINT "sows_current_location_check" CHECK (((current_location)::text = ANY ((ARRAY['breeding'::character varying, 'gestation'::character varying, 'farrowing'::character varying, 'hospital'::character varying, 'quarantine'::character varying, 'other'::character varying])::text[])));
ALTER TABLE sows ADD CONSTRAINT "sows_left_ear_notch_check" CHECK ((left_ear_notch >= 0));
ALTER TABLE sows ADD CONSTRAINT "sows_right_ear_notch_check" CHECK ((right_ear_notch >= 0));
ALTER TABLE sows ADD CONSTRAINT "sows_status_check" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'culled'::character varying, 'sold'::character varying, 'deceased'::character varying])::text[])));
ALTER TABLE team_invites ADD CONSTRAINT "team_invites_role_check" CHECK ((role = ANY (ARRAY['manager'::text, 'member'::text, 'vet'::text, 'readonly'::text])));
ALTER TABLE vaccinations ADD CONSTRAINT "vaccinations_check" CHECK ((((sow_id IS NOT NULL) AND (piglet_id IS NULL)) OR ((sow_id IS NULL) AND (piglet_id IS NOT NULL))));
ALTER TABLE ai_doses ADD CONSTRAINT "ai_doses_boar_id_fkey" FOREIGN KEY (boar_id) REFERENCES boars(id) ON DELETE SET NULL;
ALTER TABLE ai_doses ADD CONSTRAINT "ai_doses_breeding_attempt_id_fkey" FOREIGN KEY (breeding_attempt_id) REFERENCES breeding_attempts(id) ON DELETE CASCADE;
ALTER TABLE ai_doses ADD CONSTRAINT "ai_doses_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE ai_doses ADD CONSTRAINT "ai_doses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE boar_location_history ADD CONSTRAINT "boar_location_history_boar_id_fkey" FOREIGN KEY (boar_id) REFERENCES boars(id) ON DELETE CASCADE;
ALTER TABLE boar_location_history ADD CONSTRAINT "boar_location_history_housing_unit_id_fkey" FOREIGN KEY (housing_unit_id) REFERENCES housing_units(id) ON DELETE SET NULL;
ALTER TABLE boar_location_history ADD CONSTRAINT "boar_location_history_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE boar_transfer_requests ADD CONSTRAINT "boar_transfer_requests_boar_id_fkey" FOREIGN KEY (boar_id) REFERENCES boars(id) ON DELETE CASCADE;
ALTER TABLE boar_transfer_requests ADD CONSTRAINT "boar_transfer_requests_from_organization_id_fkey" FOREIGN KEY (from_organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE boar_transfer_requests ADD CONSTRAINT "boar_transfer_requests_from_user_id_fkey" FOREIGN KEY (from_user_id) REFERENCES auth.users(id);
ALTER TABLE boar_transfer_requests ADD CONSTRAINT "boar_transfer_requests_to_organization_id_fkey" FOREIGN KEY (to_organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE boar_transfer_requests ADD CONSTRAINT "boar_transfer_requests_to_user_id_fkey" FOREIGN KEY (to_user_id) REFERENCES auth.users(id);
ALTER TABLE boars ADD CONSTRAINT "boars_dam_id_fkey" FOREIGN KEY (dam_id) REFERENCES sows(id) ON DELETE SET NULL;
ALTER TABLE boars ADD CONSTRAINT "boars_housing_unit_id_fkey" FOREIGN KEY (housing_unit_id) REFERENCES housing_units(id) ON DELETE SET NULL;
ALTER TABLE boars ADD CONSTRAINT "boars_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE boars ADD CONSTRAINT "boars_original_user_id_fkey" FOREIGN KEY (original_user_id) REFERENCES auth.users(id);
ALTER TABLE boars ADD CONSTRAINT "boars_sire_id_fkey" FOREIGN KEY (sire_id) REFERENCES boars(id) ON DELETE SET NULL;
ALTER TABLE boars ADD CONSTRAINT "boars_transferred_from_user_id_fkey" FOREIGN KEY (transferred_from_user_id) REFERENCES auth.users(id);
ALTER TABLE boars ADD CONSTRAINT "boars_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE breeding_attempts ADD CONSTRAINT "breeding_attempts_boar_id_fkey" FOREIGN KEY (boar_id) REFERENCES boars(id);
ALTER TABLE breeding_attempts ADD CONSTRAINT "breeding_attempts_farrowing_id_fkey" FOREIGN KEY (farrowing_id) REFERENCES farrowings(id) ON DELETE SET NULL;
ALTER TABLE breeding_attempts ADD CONSTRAINT "breeding_attempts_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE breeding_attempts ADD CONSTRAINT "breeding_attempts_sow_id_fkey" FOREIGN KEY (sow_id) REFERENCES sows(id) ON DELETE CASCADE;
ALTER TABLE breeding_attempts ADD CONSTRAINT "breeding_attempts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE budgets ADD CONSTRAINT "budgets_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE budgets ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE calendar_events ADD CONSTRAINT "calendar_events_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE calendar_events ADD CONSTRAINT "calendar_events_related_boar_id_fkey" FOREIGN KEY (related_boar_id) REFERENCES boars(id) ON DELETE CASCADE;
ALTER TABLE calendar_events ADD CONSTRAINT "calendar_events_related_piglet_id_fkey" FOREIGN KEY (related_piglet_id) REFERENCES piglets(id) ON DELETE CASCADE;
ALTER TABLE calendar_events ADD CONSTRAINT "calendar_events_related_sow_id_fkey" FOREIGN KEY (related_sow_id) REFERENCES sows(id) ON DELETE CASCADE;
ALTER TABLE calendar_events ADD CONSTRAINT "calendar_events_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE confinement_events ADD CONSTRAINT "confinement_events_housing_unit_id_fkey" FOREIGN KEY (housing_unit_id) REFERENCES housing_units(id);
ALTER TABLE confinement_events ADD CONSTRAINT "confinement_events_sow_id_fkey" FOREIGN KEY (sow_id) REFERENCES sows(id) ON DELETE CASCADE;
ALTER TABLE cost_allocations ADD CONSTRAINT "cost_allocations_boar_id_fkey" FOREIGN KEY (boar_id) REFERENCES boars(id) ON DELETE CASCADE;
ALTER TABLE cost_allocations ADD CONSTRAINT "cost_allocations_expense_record_id_fkey" FOREIGN KEY (expense_record_id) REFERENCES expense_records(id) ON DELETE SET NULL;
ALTER TABLE cost_allocations ADD CONSTRAINT "cost_allocations_farrowing_id_fkey" FOREIGN KEY (farrowing_id) REFERENCES farrowings(id) ON DELETE CASCADE;
ALTER TABLE cost_allocations ADD CONSTRAINT "cost_allocations_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE cost_allocations ADD CONSTRAINT "cost_allocations_piglet_id_fkey" FOREIGN KEY (piglet_id) REFERENCES piglets(id) ON DELETE CASCADE;
ALTER TABLE cost_allocations ADD CONSTRAINT "cost_allocations_sow_id_fkey" FOREIGN KEY (sow_id) REFERENCES sows(id) ON DELETE CASCADE;
ALTER TABLE cost_allocations ADD CONSTRAINT "cost_allocations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE expense_records ADD CONSTRAINT "expense_records_feed_record_id_fkey" FOREIGN KEY (feed_record_id) REFERENCES feed_records(id) ON DELETE SET NULL;
ALTER TABLE expense_records ADD CONSTRAINT "expense_records_health_record_id_fkey" FOREIGN KEY (health_record_id) REFERENCES health_records(id) ON DELETE SET NULL;
ALTER TABLE expense_records ADD CONSTRAINT "expense_records_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE expense_records ADD CONSTRAINT "expense_records_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE farm_settings ADD CONSTRAINT "farm_settings_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE farm_settings ADD CONSTRAINT "farm_settings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE farrowings ADD CONSTRAINT "farrowings_boar_id_fkey" FOREIGN KEY (boar_id) REFERENCES boars(id) ON DELETE SET NULL;
ALTER TABLE farrowings ADD CONSTRAINT "farrowings_breeding_attempt_id_fkey" FOREIGN KEY (breeding_attempt_id) REFERENCES breeding_attempts(id);
ALTER TABLE farrowings ADD CONSTRAINT "farrowings_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE farrowings ADD CONSTRAINT "farrowings_sow_id_fkey" FOREIGN KEY (sow_id) REFERENCES sows(id) ON DELETE CASCADE;
ALTER TABLE farrowings ADD CONSTRAINT "farrowings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE feed_records ADD CONSTRAINT "feed_records_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE feed_records ADD CONSTRAINT "feed_records_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE feedback ADD CONSTRAINT "feedback_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE feedback ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE health_records ADD CONSTRAINT "health_records_boar_id_fkey" FOREIGN KEY (boar_id) REFERENCES boars(id) ON DELETE CASCADE;
ALTER TABLE health_records ADD CONSTRAINT "health_records_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE health_records ADD CONSTRAINT "health_records_piglet_id_fkey" FOREIGN KEY (piglet_id) REFERENCES piglets(id) ON DELETE CASCADE;
ALTER TABLE health_records ADD CONSTRAINT "health_records_sow_id_fkey" FOREIGN KEY (sow_id) REFERENCES sows(id) ON DELETE CASCADE;
ALTER TABLE health_records ADD CONSTRAINT "health_records_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE housing_units ADD CONSTRAINT "housing_units_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE housing_units ADD CONSTRAINT "housing_units_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE income_records ADD CONSTRAINT "income_records_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE income_records ADD CONSTRAINT "income_records_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE location_history ADD CONSTRAINT "location_history_housing_unit_id_fkey" FOREIGN KEY (housing_unit_id) REFERENCES housing_units(id);
ALTER TABLE location_history ADD CONSTRAINT "location_history_sow_id_fkey" FOREIGN KEY (sow_id) REFERENCES sows(id) ON DELETE CASCADE;
ALTER TABLE matrix_treatments ADD CONSTRAINT "matrix_treatments_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE matrix_treatments ADD CONSTRAINT "matrix_treatments_sow_id_fkey" FOREIGN KEY (sow_id) REFERENCES sows(id) ON DELETE CASCADE;
ALTER TABLE matrix_treatments ADD CONSTRAINT "matrix_treatments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE notification_preferences ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE organization_members ADD CONSTRAINT "organization_members_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES auth.users(id);
ALTER TABLE organization_members ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE organization_members ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE piglet_location_history ADD CONSTRAINT "piglet_location_history_housing_unit_id_fkey" FOREIGN KEY (housing_unit_id) REFERENCES housing_units(id) ON DELETE SET NULL;
ALTER TABLE piglet_location_history ADD CONSTRAINT "piglet_location_history_piglet_id_fkey" FOREIGN KEY (piglet_id) REFERENCES piglets(id) ON DELETE CASCADE;
ALTER TABLE piglets ADD CONSTRAINT "piglets_dam_id_fkey" FOREIGN KEY (dam_id) REFERENCES sows(id) ON DELETE SET NULL;
ALTER TABLE piglets ADD CONSTRAINT "piglets_farrowing_id_fkey" FOREIGN KEY (farrowing_id) REFERENCES farrowings(id) ON DELETE CASCADE;
ALTER TABLE piglets ADD CONSTRAINT "piglets_housing_unit_id_fkey" FOREIGN KEY (housing_unit_id) REFERENCES housing_units(id) ON DELETE SET NULL;
ALTER TABLE piglets ADD CONSTRAINT "piglets_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE piglets ADD CONSTRAINT "piglets_sire_id_fkey" FOREIGN KEY (sire_id) REFERENCES boars(id) ON DELETE SET NULL;
ALTER TABLE piglets ADD CONSTRAINT "piglets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE protocol_tasks ADD CONSTRAINT "protocol_tasks_protocol_id_fkey" FOREIGN KEY (protocol_id) REFERENCES protocols(id) ON DELETE CASCADE;
ALTER TABLE protocol_tasks ADD CONSTRAINT "protocol_tasks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE protocols ADD CONSTRAINT "protocols_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE protocols ADD CONSTRAINT "protocols_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE reminders ADD CONSTRAINT "reminders_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE reminders ADD CONSTRAINT "reminders_sow_id_fkey" FOREIGN KEY (sow_id) REFERENCES sows(id) ON DELETE CASCADE;
ALTER TABLE reminders ADD CONSTRAINT "reminders_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE scheduled_notifications ADD CONSTRAINT "scheduled_notifications_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE scheduled_notifications ADD CONSTRAINT "scheduled_notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE scheduled_tasks ADD CONSTRAINT "scheduled_tasks_farrowing_id_fkey" FOREIGN KEY (farrowing_id) REFERENCES farrowings(id) ON DELETE CASCADE;
ALTER TABLE scheduled_tasks ADD CONSTRAINT "scheduled_tasks_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE scheduled_tasks ADD CONSTRAINT "scheduled_tasks_protocol_id_fkey" FOREIGN KEY (protocol_id) REFERENCES protocols(id) ON DELETE SET NULL;
ALTER TABLE scheduled_tasks ADD CONSTRAINT "scheduled_tasks_protocol_task_id_fkey" FOREIGN KEY (protocol_task_id) REFERENCES protocol_tasks(id) ON DELETE SET NULL;
ALTER TABLE scheduled_tasks ADD CONSTRAINT "scheduled_tasks_sow_id_fkey" FOREIGN KEY (sow_id) REFERENCES sows(id) ON DELETE CASCADE;
ALTER TABLE scheduled_tasks ADD CONSTRAINT "scheduled_tasks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE sow_location_history ADD CONSTRAINT "sow_location_history_housing_unit_id_fkey" FOREIGN KEY (housing_unit_id) REFERENCES housing_units(id) ON DELETE SET NULL;
ALTER TABLE sow_location_history ADD CONSTRAINT "sow_location_history_moved_by_fkey" FOREIGN KEY (moved_by) REFERENCES auth.users(id);
ALTER TABLE sow_location_history ADD CONSTRAINT "sow_location_history_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE sow_location_history ADD CONSTRAINT "sow_location_history_sow_id_fkey" FOREIGN KEY (sow_id) REFERENCES sows(id) ON DELETE CASCADE;
ALTER TABLE sow_location_history ADD CONSTRAINT "sow_location_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE sow_temporary_confinement ADD CONSTRAINT "sow_temporary_confinement_sow_id_fkey" FOREIGN KEY (sow_id) REFERENCES sows(id) ON DELETE CASCADE;
ALTER TABLE sow_temporary_confinement ADD CONSTRAINT "sow_temporary_confinement_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE sow_transfer_requests ADD CONSTRAINT "sow_transfer_requests_from_organization_id_fkey" FOREIGN KEY (from_organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE sow_transfer_requests ADD CONSTRAINT "sow_transfer_requests_from_user_id_fkey" FOREIGN KEY (from_user_id) REFERENCES auth.users(id);
ALTER TABLE sow_transfer_requests ADD CONSTRAINT "sow_transfer_requests_sow_id_fkey" FOREIGN KEY (sow_id) REFERENCES sows(id) ON DELETE CASCADE;
ALTER TABLE sow_transfer_requests ADD CONSTRAINT "sow_transfer_requests_to_organization_id_fkey" FOREIGN KEY (to_organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE sow_transfer_requests ADD CONSTRAINT "sow_transfer_requests_to_user_id_fkey" FOREIGN KEY (to_user_id) REFERENCES auth.users(id);
ALTER TABLE sows ADD CONSTRAINT "sows_dam_id_fkey" FOREIGN KEY (dam_id) REFERENCES sows(id) ON DELETE SET NULL;
ALTER TABLE sows ADD CONSTRAINT "sows_housing_unit_id_fkey" FOREIGN KEY (housing_unit_id) REFERENCES housing_units(id) ON DELETE SET NULL;
ALTER TABLE sows ADD CONSTRAINT "sows_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE sows ADD CONSTRAINT "sows_original_user_id_fkey" FOREIGN KEY (original_user_id) REFERENCES auth.users(id);
ALTER TABLE sows ADD CONSTRAINT "sows_sire_id_fkey" FOREIGN KEY (sire_id) REFERENCES boars(id) ON DELETE SET NULL;
ALTER TABLE sows ADD CONSTRAINT "sows_transferred_from_user_id_fkey" FOREIGN KEY (transferred_from_user_id) REFERENCES auth.users(id);
ALTER TABLE sows ADD CONSTRAINT "sows_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE team_invites ADD CONSTRAINT "team_invites_accepted_by_fkey" FOREIGN KEY (accepted_by) REFERENCES auth.users(id);
ALTER TABLE team_invites ADD CONSTRAINT "team_invites_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE team_invites ADD CONSTRAINT "team_invites_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE vaccinations ADD CONSTRAINT "vaccinations_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE vaccinations ADD CONSTRAINT "vaccinations_piglet_id_fkey" FOREIGN KEY (piglet_id) REFERENCES piglets(id) ON DELETE CASCADE;
ALTER TABLE vaccinations ADD CONSTRAINT "vaccinations_sow_id_fkey" FOREIGN KEY (sow_id) REFERENCES sows(id) ON DELETE CASCADE;
ALTER TABLE vaccinations ADD CONSTRAINT "vaccinations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ==================== INDEXES ====================
CREATE INDEX idx_ai_doses_boar_id ON public.ai_doses USING btree (boar_id);
CREATE INDEX idx_ai_doses_breeding_attempt_id ON public.ai_doses USING btree (breeding_attempt_id);
CREATE INDEX idx_ai_doses_dose_date ON public.ai_doses USING btree (dose_date);
CREATE INDEX idx_ai_doses_dose_time ON public.ai_doses USING btree (dose_time);
CREATE INDEX idx_ai_doses_organization_id ON public.ai_doses USING btree (organization_id);
CREATE INDEX idx_ai_doses_user_id ON public.ai_doses USING btree (user_id);
CREATE INDEX idx_boar_location_history_boar ON public.boar_location_history USING btree (boar_id);
CREATE INDEX idx_boar_location_history_dates ON public.boar_location_history USING btree (moved_in_date, moved_out_date);
CREATE INDEX idx_boar_location_history_housing ON public.boar_location_history USING btree (housing_unit_id);
CREATE INDEX idx_boar_transfer_requests_boar ON public.boar_transfer_requests USING btree (boar_id);
CREATE INDEX idx_boar_transfer_requests_from_org ON public.boar_transfer_requests USING btree (from_organization_id);
CREATE INDEX idx_boar_transfer_requests_from_user ON public.boar_transfer_requests USING btree (from_user_id);
CREATE INDEX idx_boar_transfer_requests_status ON public.boar_transfer_requests USING btree (status);
CREATE INDEX idx_boar_transfer_requests_to_org ON public.boar_transfer_requests USING btree (to_organization_id);
CREATE INDEX idx_boar_transfer_requests_to_user ON public.boar_transfer_requests USING btree (to_user_id);
CREATE INDEX idx_boars_dam ON public.boars USING btree (dam_id);
CREATE INDEX idx_boars_ear_tag ON public.boars USING btree (ear_tag);
CREATE INDEX idx_boars_housing_unit ON public.boars USING btree (housing_unit_id);
CREATE INDEX idx_boars_org_id ON public.boars USING btree (organization_id);
CREATE INDEX idx_boars_organization_id ON public.boars USING btree (organization_id);
CREATE INDEX idx_boars_ownership_type ON public.boars USING btree (ownership_type);
CREATE INDEX idx_boars_semen_type ON public.boars USING btree (semen_type);
CREATE INDEX idx_boars_sire ON public.boars USING btree (sire_id);
CREATE INDEX idx_boars_status ON public.boars USING btree (status);
CREATE INDEX idx_boars_type ON public.boars USING btree (boar_type);
CREATE INDEX idx_boars_user ON public.boars USING btree (user_id);
CREATE INDEX idx_boars_user_id ON public.boars USING btree (user_id);
CREATE INDEX idx_breeding_attempts_boar ON public.breeding_attempts USING btree (boar_id);
CREATE INDEX idx_breeding_attempts_breeding_time ON public.breeding_attempts USING btree (breeding_time);
CREATE INDEX idx_breeding_attempts_cycle_complete ON public.breeding_attempts USING btree (breeding_cycle_complete, breeding_method, last_dose_date) WHERE (breeding_cycle_complete = false);
CREATE INDEX idx_breeding_attempts_date ON public.breeding_attempts USING btree (breeding_date);
CREATE INDEX idx_breeding_attempts_org_id ON public.breeding_attempts USING btree (organization_id);
CREATE INDEX idx_breeding_attempts_organization_id ON public.breeding_attempts USING btree (organization_id);
CREATE INDEX idx_breeding_attempts_result ON public.breeding_attempts USING btree (result);
CREATE INDEX idx_breeding_attempts_sow ON public.breeding_attempts USING btree (sow_id);
CREATE INDEX idx_breeding_attempts_sow_org_result ON public.breeding_attempts USING btree (sow_id, organization_id, result, breeding_date DESC) WHERE ((result)::text = ANY ((ARRAY['pending'::character varying, 'pregnant'::character varying])::text[]));
CREATE INDEX idx_breeding_attempts_user ON public.breeding_attempts USING btree (user_id);
CREATE INDEX idx_budgets_dates ON public.budgets USING btree (start_date, end_date);
CREATE INDEX idx_budgets_org_id ON public.budgets USING btree (organization_id);
CREATE INDEX idx_budgets_status ON public.budgets USING btree (status);
CREATE INDEX idx_budgets_user_id ON public.budgets USING btree (user_id);
CREATE INDEX idx_calendar_events_boar ON public.calendar_events USING btree (related_boar_id);
CREATE INDEX idx_calendar_events_completed ON public.calendar_events USING btree (completed);
CREATE INDEX idx_calendar_events_date ON public.calendar_events USING btree (event_date);
CREATE INDEX idx_calendar_events_organization_id ON public.calendar_events USING btree (organization_id);
CREATE INDEX idx_calendar_events_sow ON public.calendar_events USING btree (related_sow_id);
CREATE INDEX idx_calendar_events_type ON public.calendar_events USING btree (event_type);
CREATE INDEX idx_calendar_events_user ON public.calendar_events USING btree (user_id);
CREATE INDEX idx_certifications_expiration ON public.certifications USING btree (expiration_date);
CREATE INDEX idx_certifications_type ON public.certifications USING btree (certification_type, status);
CREATE INDEX idx_confinement_events_reason ON public.confinement_events USING btree (reason, start_time DESC);
CREATE INDEX idx_confinement_events_sow_time ON public.confinement_events USING btree (sow_id, start_time DESC);
CREATE INDEX idx_cost_allocations_boar_id ON public.cost_allocations USING btree (boar_id);
CREATE INDEX idx_cost_allocations_farrowing_id ON public.cost_allocations USING btree (farrowing_id);
CREATE INDEX idx_cost_allocations_org_id ON public.cost_allocations USING btree (organization_id);
CREATE INDEX idx_cost_allocations_piglet_id ON public.cost_allocations USING btree (piglet_id);
CREATE INDEX idx_cost_allocations_sow_id ON public.cost_allocations USING btree (sow_id);
CREATE INDEX idx_expense_records_category ON public.expense_records USING btree (expense_category);
CREATE INDEX idx_expense_records_date ON public.expense_records USING btree (expense_date DESC);
CREATE INDEX idx_expense_records_org_id ON public.expense_records USING btree (organization_id);
CREATE INDEX idx_expense_records_user_id ON public.expense_records USING btree (user_id);
CREATE INDEX idx_farm_settings_organization_id ON public.farm_settings USING btree (organization_id);
CREATE UNIQUE INDEX idx_farm_settings_user_id ON public.farm_settings USING btree (user_id);
CREATE INDEX idx_farrowings_active_status ON public.farrowings USING btree (sow_id, user_id, actual_farrowing_date, moved_out_of_farrowing_date) WHERE ((actual_farrowing_date IS NOT NULL) AND (moved_out_of_farrowing_date IS NULL));
CREATE INDEX idx_farrowings_boar ON public.farrowings USING btree (boar_id);
CREATE INDEX idx_farrowings_boar_org_count ON public.farrowings USING btree (boar_id, organization_id);
CREATE INDEX idx_farrowings_breeding_lookup ON public.farrowings USING btree (sow_id, user_id, breeding_date, actual_farrowing_date);
CREATE INDEX idx_farrowings_expected_date ON public.farrowings USING btree (expected_farrowing_date);
CREATE INDEX idx_farrowings_org_id ON public.farrowings USING btree (organization_id);
CREATE INDEX idx_farrowings_organization_id ON public.farrowings USING btree (organization_id);
CREATE INDEX idx_farrowings_sow_id ON public.farrowings USING btree (sow_id);
CREATE INDEX idx_farrowings_sow_org_count ON public.farrowings USING btree (sow_id, organization_id);
CREATE INDEX idx_farrowings_user_id ON public.farrowings USING btree (user_id);
CREATE INDEX idx_feed_records_animal_group ON public.feed_records USING btree (animal_group);
CREATE INDEX idx_feed_records_date ON public.feed_records USING btree (record_date DESC);
CREATE INDEX idx_feed_records_org_id ON public.feed_records USING btree (organization_id);
CREATE INDEX idx_feed_records_user_id ON public.feed_records USING btree (user_id);
CREATE INDEX idx_feedback_created_at ON public.feedback USING btree (created_at DESC);
CREATE INDEX idx_feedback_organization_id ON public.feedback USING btree (organization_id);
CREATE INDEX idx_feedback_status ON public.feedback USING btree (status);
CREATE INDEX idx_feedback_user_id ON public.feedback USING btree (user_id);
CREATE INDEX idx_health_records_boar ON public.health_records USING btree (boar_id);
CREATE INDEX idx_health_records_date ON public.health_records USING btree (record_date DESC);
CREATE INDEX idx_health_records_next_due ON public.health_records USING btree (next_due_date);
CREATE INDEX idx_health_records_org_id ON public.health_records USING btree (organization_id);
CREATE INDEX idx_health_records_organization_id ON public.health_records USING btree (organization_id);
CREATE INDEX idx_health_records_piglet ON public.health_records USING btree (piglet_id);
CREATE INDEX idx_health_records_sow ON public.health_records USING btree (sow_id);
CREATE INDEX idx_health_records_type ON public.health_records USING btree (record_type);
CREATE INDEX idx_health_records_user ON public.health_records USING btree (user_id);
CREATE INDEX idx_housing_units_building ON public.housing_units USING btree (building_name, pen_number);
CREATE INDEX idx_housing_units_org_id ON public.housing_units USING btree (organization_id);
CREATE INDEX idx_housing_units_organization_id ON public.housing_units USING btree (organization_id);
CREATE INDEX idx_housing_units_type ON public.housing_units USING btree (type);
CREATE INDEX idx_housing_units_user_id ON public.housing_units USING btree (user_id);
CREATE INDEX idx_income_records_date ON public.income_records USING btree (income_date DESC);
CREATE INDEX idx_income_records_org_id ON public.income_records USING btree (organization_id);
CREATE INDEX idx_income_records_payment_status ON public.income_records USING btree (payment_status);
CREATE INDEX idx_income_records_type ON public.income_records USING btree (income_type);
CREATE INDEX idx_income_records_user_id ON public.income_records USING btree (user_id);
CREATE INDEX idx_location_history_dates ON public.location_history USING btree (moved_in_date, moved_out_date);
CREATE INDEX idx_location_history_housing ON public.location_history USING btree (housing_unit_id, moved_in_date DESC);
CREATE INDEX idx_location_history_sow ON public.location_history USING btree (sow_id, moved_in_date DESC);
CREATE INDEX idx_matrix_treatments_administration_date ON public.matrix_treatments USING btree (administration_date);
CREATE INDEX idx_matrix_treatments_batch_name ON public.matrix_treatments USING btree (batch_name);
CREATE INDEX idx_matrix_treatments_bred ON public.matrix_treatments USING btree (sow_id, user_id, bred, breeding_date) WHERE ((bred = true) AND (breeding_date IS NOT NULL));
CREATE INDEX idx_matrix_treatments_expected_heat_date ON public.matrix_treatments USING btree (expected_heat_date);
CREATE INDEX idx_matrix_treatments_organization_id ON public.matrix_treatments USING btree (organization_id);
CREATE INDEX idx_matrix_treatments_sow_id ON public.matrix_treatments USING btree (sow_id);
CREATE INDEX idx_matrix_treatments_user_id ON public.matrix_treatments USING btree (user_id);
CREATE INDEX idx_notifications_email_pending ON public.notifications USING btree (created_at) WHERE ((email_sent_at IS NULL) AND (email_error IS NULL));
CREATE INDEX idx_notifications_org_id ON public.notifications USING btree (organization_id);
CREATE INDEX idx_notifications_organization_id ON public.notifications USING btree (organization_id);
CREATE INDEX idx_notifications_push_pending ON public.notifications USING btree (created_at) WHERE ((push_sent_at IS NULL) AND (push_error IS NULL));
CREATE INDEX idx_notifications_read_at ON public.notifications USING btree (read_at);
CREATE INDEX idx_notifications_sent_at ON public.notifications USING btree (sent_at);
CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);
CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);
CREATE INDEX idx_org_members_org_id ON public.organization_members USING btree (organization_id);
CREATE INDEX idx_org_members_role ON public.organization_members USING btree (role);
CREATE INDEX idx_org_members_user_id ON public.organization_members USING btree (user_id);
CREATE INDEX idx_piglet_location_history_dates ON public.piglet_location_history USING btree (moved_in_date, moved_out_date);
CREATE INDEX idx_piglet_location_history_housing ON public.piglet_location_history USING btree (housing_unit_id);
CREATE INDEX idx_piglet_location_history_piglet ON public.piglet_location_history USING btree (piglet_id);
CREATE INDEX idx_piglets_dam ON public.piglets USING btree (dam_id);
CREATE INDEX idx_piglets_ear_tag ON public.piglets USING btree (ear_tag);
CREATE INDEX idx_piglets_farrowing_id ON public.piglets USING btree (farrowing_id);
CREATE INDEX idx_piglets_housing_unit ON public.piglets USING btree (housing_unit_id);
CREATE INDEX idx_piglets_org_id ON public.piglets USING btree (organization_id);
CREATE INDEX idx_piglets_organization_id ON public.piglets USING btree (organization_id);
CREATE INDEX idx_piglets_registration ON public.piglets USING btree (registration_number);
CREATE INDEX idx_piglets_sire ON public.piglets USING btree (sire_id);
CREATE INDEX idx_piglets_status ON public.piglets USING btree (status);
CREATE INDEX idx_piglets_user_id ON public.piglets USING btree (user_id);
CREATE INDEX idx_protocol_tasks_protocol_id ON public.protocol_tasks USING btree (protocol_id);
CREATE INDEX idx_protocol_tasks_user_id ON public.protocol_tasks USING btree (user_id);
CREATE INDEX idx_protocols_organization_id ON public.protocols USING btree (organization_id);
CREATE INDEX idx_protocols_user_id ON public.protocols USING btree (user_id);
CREATE INDEX idx_reminders_completed ON public.reminders USING btree (completed);
CREATE INDEX idx_reminders_due_date ON public.reminders USING btree (due_date);
CREATE INDEX idx_reminders_org_id ON public.reminders USING btree (organization_id);
CREATE INDEX idx_reminders_user_id ON public.reminders USING btree (user_id);
CREATE INDEX idx_scheduled_notifications_pending ON public.scheduled_notifications USING btree (scheduled_for) WHERE (sent = false);
CREATE INDEX idx_scheduled_notifications_scheduled_for ON public.scheduled_notifications USING btree (scheduled_for);
CREATE INDEX idx_scheduled_notifications_sent ON public.scheduled_notifications USING btree (sent);
CREATE INDEX idx_scheduled_notifications_user_id ON public.scheduled_notifications USING btree (user_id);
CREATE INDEX idx_scheduled_tasks_due_date ON public.scheduled_tasks USING btree (due_date);
CREATE INDEX idx_scheduled_tasks_farrowing_id ON public.scheduled_tasks USING btree (farrowing_id);
CREATE INDEX idx_scheduled_tasks_is_completed ON public.scheduled_tasks USING btree (is_completed);
CREATE INDEX idx_scheduled_tasks_org_id ON public.scheduled_tasks USING btree (organization_id);
CREATE INDEX idx_scheduled_tasks_sow_id ON public.scheduled_tasks USING btree (sow_id);
CREATE INDEX idx_scheduled_tasks_sow_incomplete ON public.scheduled_tasks USING btree (sow_id, user_id, is_completed, due_date) WHERE (is_completed = false);
CREATE INDEX idx_scheduled_tasks_user_id ON public.scheduled_tasks USING btree (user_id);
CREATE INDEX idx_location_history_moved_at ON public.sow_location_history USING btree (moved_at);
CREATE INDEX idx_location_history_sow_id ON public.sow_location_history USING btree (sow_id);
CREATE INDEX idx_sow_location_history_user_id ON public.sow_location_history USING btree (user_id);
CREATE INDEX idx_sow_temporary_confinement_user_id ON public.sow_temporary_confinement USING btree (user_id);
CREATE INDEX idx_temp_confinement_sow_id ON public.sow_temporary_confinement USING btree (sow_id);
CREATE INDEX idx_temp_confinement_start_time ON public.sow_temporary_confinement USING btree (start_time);
CREATE INDEX idx_sow_transfer_requests_from_org ON public.sow_transfer_requests USING btree (from_organization_id);
CREATE INDEX idx_sow_transfer_requests_to_org ON public.sow_transfer_requests USING btree (to_organization_id);
CREATE INDEX idx_transfer_requests_from_user ON public.sow_transfer_requests USING btree (from_user_id);
CREATE INDEX idx_transfer_requests_sow ON public.sow_transfer_requests USING btree (sow_id);
CREATE INDEX idx_transfer_requests_status ON public.sow_transfer_requests USING btree (status);
CREATE INDEX idx_transfer_requests_to_user ON public.sow_transfer_requests USING btree (to_user_id);
CREATE INDEX idx_sows_dam ON public.sows USING btree (dam_id);
CREATE INDEX idx_sows_housing_unit_id ON public.sows USING btree (housing_unit_id);
CREATE INDEX idx_sows_org_id ON public.sows USING btree (organization_id);
CREATE INDEX idx_sows_organization_id ON public.sows USING btree (organization_id);
CREATE INDEX idx_sows_sire ON public.sows USING btree (sire_id);
CREATE INDEX idx_sows_user_id ON public.sows USING btree (user_id);
CREATE INDEX idx_team_invites_org ON public.team_invites USING btree (organization_id) WHERE (accepted_at IS NULL);
CREATE INDEX idx_team_invites_token ON public.team_invites USING btree (token) WHERE (accepted_at IS NULL);
CREATE INDEX idx_transactions_animals ON public.transactions USING gin (animal_ids);
CREATE INDEX idx_transactions_date ON public.transactions USING btree (transaction_date DESC);
CREATE INDEX idx_transactions_type ON public.transactions USING btree (transaction_type, transaction_date DESC);
CREATE INDEX idx_vaccinations_next_due ON public.vaccinations USING btree (next_due_date);
CREATE INDEX idx_vaccinations_org_id ON public.vaccinations USING btree (organization_id);
CREATE INDEX idx_vaccinations_piglet_id ON public.vaccinations USING btree (piglet_id);
CREATE INDEX idx_vaccinations_sow_id ON public.vaccinations USING btree (sow_id);
CREATE INDEX idx_vaccinations_user_id ON public.vaccinations USING btree (user_id);

-- ==================== FUNCTIONS ====================
CREATE OR REPLACE FUNCTION public.accept_team_invite(invite_token text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_invite team_invites;
  v_user_email text;
  v_result json;
BEGIN
  -- Get current user's email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Get the invite
  SELECT * INTO v_invite
  FROM team_invites
  WHERE token = invite_token
    AND accepted_at IS NULL
    AND expires_at > now()
    AND email = v_user_email;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite token';
  END IF;

  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = v_invite.organization_id
      AND user_id = auth.uid()
  ) THEN
    -- Mark invite as accepted anyway
    UPDATE team_invites
    SET accepted_at = now(),
        accepted_by = auth.uid()
    WHERE id = v_invite.id;

    RAISE EXCEPTION 'You are already a member of this organization';
  END IF;

  -- Add user to organization
  INSERT INTO organization_members (
    organization_id,
    user_id,
    role,
    invited_by,
    invited_at,
    joined_at,
    is_active
  ) VALUES (
    v_invite.organization_id,
    auth.uid(),
    v_invite.role,
    v_invite.invited_by,
    v_invite.created_at,
    now(),
    true
  );

  -- Mark invite as accepted
  UPDATE team_invites
  SET accepted_at = now(),
      accepted_by = auth.uid()
  WHERE id = v_invite.id;

  -- Return success with org info
  SELECT json_build_object(
    'organization_id', v_invite.organization_id,
    'role', v_invite.role,
    'success', true
  ) INTO v_result;

  RETURN v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.add_user_to_org_secure()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_org_id uuid;
    v_org_slug text;
    v_counter int := 1;
BEGIN
    -- Exit if user already has an organization
    IF EXISTS (
        SELECT 1
        FROM public.organizations o
        JOIN public.organization_members om ON om.organization_id = o.id
        WHERE om.user_id = NEW.id
    ) THEN
        RETURN NEW;
    END IF;

    -- Generate initial slug from email
    v_org_slug := LOWER(REGEXP_REPLACE(NEW.email, '[^a-z0-9]+', '-', 'g'));

    -- Ensure slug is unique
    WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = v_org_slug) LOOP
        v_counter := v_counter + 1;
        v_org_slug := v_org_slug || '-' || v_counter;
    END LOOP;

    -- Insert organization and get the UUID
    INSERT INTO public.organizations (name, slug, created_at)
    VALUES (NEW.email || '''s Farm', v_org_slug, NOW())
    RETURNING id INTO v_org_id;

    -- Add user as owner to organization_members
    INSERT INTO public.organization_members (organization_id, user_id, role, is_active, created_at)
    VALUES (v_org_id, NEW.id, 'owner', TRUE, NOW());

    -- Add default notification preferences
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.add_user_to_org_secure(user_uuid uuid, user_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_org_id UUID;
    v_org_slug TEXT;
    v_counter INT := 1;
BEGIN
    -- Exit if user already has an organization
    IF EXISTS (
        SELECT 1
        FROM public.organizations o
        JOIN public.organization_members om ON om.organization_id = o.id
        WHERE om.user_id = user_uuid
    ) THEN
        RETURN;
    END IF;

    -- Generate unique slug from email
    v_org_slug := LOWER(REGEXP_REPLACE(user_email, '[^a-z0-9]+', '-', 'g'));
    WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = v_org_slug) LOOP
        v_counter := v_counter + 1;
        v_org_slug := v_org_slug || '-' || v_counter;
    END LOOP;

    -- Insert organization
    INSERT INTO public.organizations (name, slug, created_at)
    VALUES (user_email || '''s Farm', v_org_slug, NOW())
    RETURNING id INTO v_org_id;

    -- Insert membership (bypasses RLS)
    INSERT INTO public.organization_members (organization_id, user_id, role, is_active, created_at)
    VALUES (v_org_id, user_uuid, 'owner', TRUE, NOW());

    -- Insert default notification preferences
    INSERT INTO public.notification_preferences (user_id)
    VALUES (user_uuid)
    ON CONFLICT (user_id) DO NOTHING;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.adjust_semen_straw_on_dose()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.boar_id IS NOT NULL THEN
      UPDATE boars
        SET semen_straws = GREATEST(0, COALESCE(semen_straws, 0) - 1),
            status = CASE
                       WHEN COALESCE(semen_straws, 0) - 1 <= 0 THEN 'depleted'
                       ELSE status
                     END
        WHERE id = NEW.boar_id
          AND boar_type = 'ai_semen';
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.boar_id IS NOT NULL THEN
      UPDATE boars
        SET semen_straws = COALESCE(semen_straws, 0) + 1,
            -- A deleted dose frees a straw; un-deplete if it was depleted.
            status = CASE
                       WHEN status = 'depleted' THEN 'active'
                       ELSE status
                     END
        WHERE id = OLD.boar_id
          AND boar_type = 'ai_semen';
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_animal_profit_loss(p_animal_type character varying, p_animal_id uuid, p_organization_id uuid)
 RETURNS TABLE(total_revenue numeric, total_costs numeric, profit_loss numeric)
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
  v_purchase_cost DECIMAL(10,2) := 0;
  v_sale_price DECIMAL(10,2) := 0;
BEGIN
  -- Get purchase/sale from animal tables
  IF p_animal_type = 'sow' THEN
    SELECT COALESCE(purchase_cost, 0), COALESCE(sale_price, 0)
    INTO v_purchase_cost, v_sale_price
    FROM sows WHERE id = p_animal_id;
  ELSIF p_animal_type = 'boar' THEN
    SELECT COALESCE(purchase_cost, 0), COALESCE(sale_price, 0)
    INTO v_purchase_cost, v_sale_price
    FROM boars WHERE id = p_animal_id;
  ELSIF p_animal_type = 'piglet' THEN
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
            (p_animal_type = 'sow' AND p_animal_id = ANY(ir.sow_ids)) OR
            (p_animal_type = 'boar' AND p_animal_id = ANY(ir.boar_ids)) OR
            (p_animal_type = 'piglet' AND p_animal_id = ANY(ir.piglet_ids))
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
            (p_animal_type = 'sow' AND ca.sow_id = p_animal_id) OR
            (p_animal_type = 'boar' AND ca.boar_id = p_animal_id) OR
            (p_animal_type = 'piglet' AND ca.piglet_id = p_animal_id)
          )
      ), 0) +
      COALESCE((
        SELECT SUM(hr.cost)
        FROM health_records hr
        WHERE hr.organization_id = p_organization_id
          AND hr.cost IS NOT NULL
          AND (
            (p_animal_type = 'sow' AND hr.sow_id = p_animal_id) OR
            (p_animal_type = 'boar' AND hr.boar_id = p_animal_id) OR
            (p_animal_type = 'piglet' AND hr.piglet_id = p_animal_id)
          )
      ), 0) as total_costs
  )
  SELECT
    r.total_revenue::DECIMAL(10,2),
    c.total_costs::DECIMAL(10,2),
    (r.total_revenue - c.total_costs)::DECIMAL(10,2) as profit_loss
  FROM revenue r, costs c;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_farrowing_date()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
  BEGIN
      IF NEW.expected_farrowing_date IS NULL THEN
          NEW.expected_farrowing_date := NEW.breeding_date + INTERVAL '114 days';
      END IF;
      RETURN NEW;
  END;
  $function$
;

CREATE OR REPLACE FUNCTION public.calculate_matrix_treatment_dates()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- If treatment_start_date is provided but not end_date, calculate it
    IF NEW.treatment_start_date IS NOT NULL AND NEW.treatment_end_date IS NULL THEN
        -- Use treatment_duration_days if provided, otherwise default to 30
        NEW.treatment_end_date := NEW.treatment_start_date + (COALESCE(NEW.treatment_duration_days, 30) || ' days')::INTERVAL;
    END IF;

    -- Calculate expected heat date (end date + 4 days, middle of 3-5 range)
    IF NEW.treatment_end_date IS NOT NULL AND NEW.expected_heat_date IS NULL THEN
        NEW.expected_heat_date := NEW.treatment_end_date + INTERVAL '4 days';
    END IF;

    -- Auto-mark as completed if treatment end date has passed
    IF NEW.treatment_end_date IS NOT NULL AND NEW.treatment_end_date <= CURRENT_DATE THEN
        NEW.treatment_completed := true;
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.confirm_pregnancy(p_breeding_attempt_id uuid, p_sow_id uuid, p_organization_id uuid, p_breeding_date date, p_expected_farrowing_date date, p_breeding_method text, p_boar_id uuid, p_check_date date, p_notes text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_farrowing_id uuid;
BEGIN
  INSERT INTO farrowings (
    user_id, organization_id, sow_id, breeding_date, expected_farrowing_date,
    breeding_method, boar_id, breeding_attempt_id, notes
  ) VALUES (
    auth.uid(), p_organization_id, p_sow_id, p_breeding_date, p_expected_farrowing_date,
    p_breeding_method, p_boar_id, p_breeding_attempt_id,
    COALESCE(NULLIF(p_notes, ''), 'Pregnancy confirmed')
  )
  RETURNING id INTO v_farrowing_id;

  UPDATE breeding_attempts
  SET pregnancy_confirmed = true,
      pregnancy_check_date = p_check_date,
      result = 'pregnant',
      farrowing_id = v_farrowing_id,
      notes = CASE
                WHEN NULLIF(p_notes, '') IS NOT NULL
                  THEN p_notes || E'\n\nPregnancy confirmed on ' || p_check_date
                ELSE 'Pregnancy confirmed on ' || p_check_date
              END
  WHERE id = p_breeding_attempt_id
    AND organization_id = p_organization_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Breeding attempt % not found in organization %', p_breeding_attempt_id, p_organization_id;
  END IF;

  RETURN v_farrowing_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_notification_prefs_for_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_organization_for_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_org_id UUID;      -- store the organization ID
    v_org_slug TEXT;    -- store the slug
    v_counter INT := 1; -- counter for unique slug generation
BEGIN
    -- Exit if user already has an organization
    IF EXISTS (
        SELECT 1
        FROM public.organizations o
        JOIN public.organization_members om ON om.organization_id = o.id
        WHERE om.user_id = NEW.id
    ) THEN
        RETURN NEW;
    END IF;

    -- Generate initial slug from email
    v_org_slug := LOWER(REGEXP_REPLACE(NEW.email, '[^a-z0-9]+', '-', 'g'));

    -- Ensure slug is unique
    WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = v_org_slug) LOOP
        v_counter := v_counter + 1;
        v_org_slug := v_org_slug || '-' || v_counter;
    END LOOP;

    -- Insert organization and get the UUID
    INSERT INTO public.organizations (name, slug, created_at)
    VALUES (NEW.email || '''s Farm', v_org_slug, NOW())
    RETURNING id INTO v_org_id;

    -- Add user as owner (RLS-safe: use SECURITY DEFINER context)
    PERFORM pg_sleep(0); -- dummy PERFORM to prevent RLS recursion issues
    INSERT INTO public.organization_members (organization_id, user_id, role, is_active, created_at)
    VALUES (v_org_id, NEW.id, 'owner', TRUE, NOW());

    -- Add default notification preferences (RLS-safe)
    PERFORM pg_sleep(0);
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.execute_boar_transfer(p_request_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_request boar_transfer_requests%ROWTYPE;
    v_boar_id UUID;
    v_from_user UUID;
    v_to_user UUID;
    v_transfer_count INT := 0;
    v_sold_copy_id UUID;
BEGIN
    -- Get and validate the request
    SELECT * INTO v_request
    FROM boar_transfer_requests
    WHERE id = p_request_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transfer request not found';
    END IF;

    IF v_request.status != 'accepted' THEN
        RAISE EXCEPTION 'Transfer request must be accepted before execution';
    END IF;

    v_boar_id := v_request.boar_id;
    v_from_user := v_request.from_user_id;
    v_to_user := v_request.to_user_id;

    -- Verify the boar still belongs to sender
    IF NOT EXISTS (
        SELECT 1 FROM boars WHERE id = v_boar_id AND user_id = v_from_user
    ) THEN
        RAISE EXCEPTION 'Boar no longer belongs to sender';
    END IF;

    -- ========================================
    -- CREATE SOLD COPY IF RETAIN_RECORDS IS TRUE
    -- ========================================

    IF v_request.retain_records THEN
        -- Create a copy of the boar marked as 'sold'
        INSERT INTO boars (
            user_id, ear_tag, name, breed, date_of_birth, purchase_date,
            purchase_price, source, genetics_info, notes, status,
            sire_id, dam_id, registration_number
        )
        SELECT
            user_id,
            ear_tag || ' (Sold)', -- Mark the sold copy
            name,
            breed,
            date_of_birth,
            purchase_date,
            purchase_price,
            source,
            genetics_info,
            COALESCE(notes, '') || E'\n\nSOLD to ' || v_request.to_user_email || ' on ' || NOW()::date,
            'sold', -- Mark as sold
            sire_id,
            dam_id,
            registration_number
        FROM boars
        WHERE id = v_boar_id
        RETURNING id INTO v_sold_copy_id;

        -- Copy breeding attempts (where this boar was used)
        INSERT INTO breeding_attempts (
            user_id, sow_id, breeding_date, breeding_method, boar_id,
            boar_description, pregnancy_check_date, pregnancy_confirmed,
            result, farrowing_id, notes
        )
        SELECT
            v_from_user, -- Keep under original owner
            sow_id,
            breeding_date,
            breeding_method,
            v_sold_copy_id, -- Reference the sold copy
            boar_description,
            pregnancy_check_date,
            pregnancy_confirmed,
            result,
            farrowing_id,
            notes
        FROM breeding_attempts
        WHERE boar_id = v_boar_id AND user_id = v_from_user;

        -- Copy health records
        INSERT INTO health_records (
            user_id, boar_id, record_date, record_type, diagnosis,
            treatment, veterinarian, cost, notes
        )
        SELECT
            user_id, v_sold_copy_id, record_date, record_type, diagnosis,
            treatment, veterinarian, cost, notes
        FROM health_records
        WHERE boar_id = v_boar_id;

        -- Copy vaccinations
        INSERT INTO vaccinations (
            user_id, boar_id, vaccination_date, vaccine_name,
            vaccine_type, batch_number, veterinarian, notes
        )
        SELECT
            user_id, v_sold_copy_id, vaccination_date, vaccine_name,
            vaccine_type, batch_number, veterinarian, notes
        FROM vaccinations
        WHERE boar_id = v_boar_id;

    END IF;

    -- ========================================
    -- TRANSFER ALL RELATED RECORDS
    -- ========================================

    -- 1. Transfer BOAR
    UPDATE boars
    SET
        user_id = v_to_user,
        transferred_from_user_id = v_from_user,
        transferred_at = NOW()
    WHERE id = v_boar_id;

    v_transfer_count := v_transfer_count + 1;

    -- 2. Transfer BREEDING ATTEMPTS (where this boar was used)
    -- Note: Only transfer breeding records where the user owns BOTH the boar AND the sow
    UPDATE breeding_attempts
    SET user_id = v_to_user
    WHERE boar_id = v_boar_id
      AND user_id = v_from_user
      AND sow_id IN (SELECT id FROM sows WHERE user_id = v_to_user);

    v_transfer_count := v_transfer_count + (
        SELECT COUNT(*) FROM breeding_attempts
        WHERE boar_id = v_boar_id AND user_id = v_to_user
    );

    -- 3. Transfer VACCINATIONS
    UPDATE vaccinations
    SET user_id = v_to_user
    WHERE boar_id = v_boar_id AND user_id = v_from_user;

    v_transfer_count := v_transfer_count + (SELECT COUNT(*) FROM vaccinations WHERE boar_id = v_boar_id AND user_id = v_to_user);

    -- 4. Transfer HEALTH RECORDS
    UPDATE health_records
    SET user_id = v_to_user
    WHERE boar_id = v_boar_id AND user_id = v_from_user;

    v_transfer_count := v_transfer_count + (SELECT COUNT(*) FROM health_records WHERE boar_id = v_boar_id AND user_id = v_to_user);

    RETURN jsonb_build_object(
        'success', true,
        'boar_id', v_boar_id,
        'from_user', v_from_user,
        'to_user', v_to_user,
        'records_transferred', v_transfer_count,
        'sold_copy_created', v_request.retain_records,
        'sold_copy_id', v_sold_copy_id,
        'message', format('Successfully transferred boar and %s related records%s',
            v_transfer_count,
            CASE WHEN v_request.retain_records THEN ' (sold copy retained)' ELSE '' END
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.execute_sow_transfer(p_request_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_request sow_transfer_requests%ROWTYPE;
    v_sow_id UUID;
    v_from_user UUID;
    v_to_user UUID;
    v_transfer_count INT := 0;
    v_sold_copy_id UUID;
BEGIN
    -- Get and validate the request
    SELECT * INTO v_request
    FROM sow_transfer_requests
    WHERE id = p_request_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transfer request not found';
    END IF;

    IF v_request.status != 'accepted' THEN
        RAISE EXCEPTION 'Transfer request must be accepted before execution';
    END IF;

    v_sow_id := v_request.sow_id;
    v_from_user := v_request.from_user_id;
    v_to_user := v_request.to_user_id;

    -- Verify the sow still belongs to sender
    IF NOT EXISTS (
        SELECT 1 FROM sows WHERE id = v_sow_id AND user_id = v_from_user
    ) THEN
        RAISE EXCEPTION 'Sow no longer belongs to sender';
    END IF;

    -- ========================================
    -- CREATE SOLD COPY IF RETAIN_RECORDS IS TRUE
    -- ========================================

    IF v_request.retain_records THEN
        -- Create a copy of the sow marked as 'sold'
        INSERT INTO sows (
            user_id, ear_tag, name, breed, date_of_birth, purchase_date,
            purchase_price, source, genetics_info, notes, status,
            sire_id, dam_id, registration_number
        )
        SELECT
            user_id,
            ear_tag || ' (Sold)', -- Mark the sold copy
            name,
            breed,
            date_of_birth,
            purchase_date,
            purchase_price,
            source,
            genetics_info,
            COALESCE(notes, '') || E'\n\nSOLD to ' || v_request.to_user_email || ' on ' || NOW()::date,
            'sold', -- Mark as sold
            sire_id,
            dam_id,
            registration_number
        FROM sows
        WHERE id = v_sow_id
        RETURNING id INTO v_sold_copy_id;

        -- Copy breeding attempts
        INSERT INTO breeding_attempts (
            user_id, sow_id, breeding_date, breeding_method, boar_id,
            boar_description, pregnancy_check_date, pregnancy_confirmed,
            result, farrowing_id, notes
        )
        SELECT
            user_id, v_sold_copy_id, breeding_date, breeding_method, boar_id,
            boar_description, pregnancy_check_date, pregnancy_confirmed,
            result, farrowing_id, notes
        FROM breeding_attempts
        WHERE sow_id = v_sow_id;

        -- Copy farrowings
        INSERT INTO farrowings (
            user_id, sow_id, breeding_date, expected_farrowing_date,
            actual_farrowing_date, born_alive, born_dead, mummified,
            weaned_count, weaned_date, breeding_method, boar_id,
            breeding_attempt_id, notes
        )
        SELECT
            user_id, v_sold_copy_id, breeding_date, expected_farrowing_date,
            actual_farrowing_date, born_alive, born_dead, mummified,
            weaned_count, weaned_date, breeding_method, boar_id,
            NULL, -- Don't link to breeding attempt (it's a copy)
            notes
        FROM farrowings
        WHERE sow_id = v_sow_id;

        -- Copy health records
        INSERT INTO health_records (
            user_id, sow_id, record_date, record_type, diagnosis,
            treatment, veterinarian, cost, notes
        )
        SELECT
            user_id, v_sold_copy_id, record_date, record_type, diagnosis,
            treatment, veterinarian, cost, notes
        FROM health_records
        WHERE sow_id = v_sow_id;

        -- Copy vaccinations
        INSERT INTO vaccinations (
            user_id, sow_id, vaccination_date, vaccine_name,
            vaccine_type, batch_number, veterinarian, notes
        )
        SELECT
            user_id, v_sold_copy_id, vaccination_date, vaccine_name,
            vaccine_type, batch_number, veterinarian, notes
        FROM vaccinations
        WHERE sow_id = v_sow_id;

        -- Note: Don't copy scheduled_tasks or matrix_treatments for sold animals
        -- These are active/future records that shouldn't apply to sold copies

    END IF;

    -- ========================================
    -- TRANSFER ALL RELATED RECORDS
    -- ========================================

    -- 1. Transfer SOW
    UPDATE sows
    SET
        user_id = v_to_user,
        transferred_from_user_id = v_from_user,
        transferred_at = NOW()
    WHERE id = v_sow_id;

    v_transfer_count := v_transfer_count + 1;

    -- 2. Transfer BREEDING ATTEMPTS
    UPDATE breeding_attempts
    SET user_id = v_to_user
    WHERE sow_id = v_sow_id AND user_id = v_from_user;

    v_transfer_count := v_transfer_count + (SELECT COUNT(*) FROM breeding_attempts WHERE sow_id = v_sow_id AND user_id = v_to_user);

    -- 3. Transfer FARROWINGS (breeding/farrowing records)
    UPDATE farrowings
    SET user_id = v_to_user
    WHERE sow_id = v_sow_id AND user_id = v_from_user;

    v_transfer_count := v_transfer_count + (SELECT COUNT(*) FROM farrowings WHERE sow_id = v_sow_id AND user_id = v_to_user);

    -- 4. DO NOT TRANSFER PIGLETS
    -- Piglets are separate animals and may have been sold/transferred independently

    -- 5. Transfer VACCINATIONS
    UPDATE vaccinations
    SET user_id = v_to_user
    WHERE sow_id = v_sow_id AND user_id = v_from_user;

    v_transfer_count := v_transfer_count + (SELECT COUNT(*) FROM vaccinations WHERE sow_id = v_sow_id AND user_id = v_to_user);

    -- 6. Transfer HEALTH RECORDS
    UPDATE health_records
    SET user_id = v_to_user
    WHERE sow_id = v_sow_id AND user_id = v_from_user;

    v_transfer_count := v_transfer_count + (SELECT COUNT(*) FROM health_records WHERE sow_id = v_sow_id AND user_id = v_to_user);

    -- 7. Transfer SCHEDULED TASKS
    UPDATE scheduled_tasks
    SET user_id = v_to_user
    WHERE sow_id = v_sow_id AND user_id = v_from_user;

    v_transfer_count := v_transfer_count + (SELECT COUNT(*) FROM scheduled_tasks WHERE sow_id = v_sow_id AND user_id = v_to_user);

    -- 8. Transfer MATRIX TREATMENTS
    UPDATE matrix_treatments
    SET user_id = v_to_user
    WHERE sow_id = v_sow_id AND user_id = v_from_user;

    v_transfer_count := v_transfer_count + (SELECT COUNT(*) FROM matrix_treatments WHERE sow_id = v_sow_id AND user_id = v_to_user);

    RETURN jsonb_build_object(
        'success', true,
        'sow_id', v_sow_id,
        'from_user', v_from_user,
        'to_user', v_to_user,
        'records_transferred', v_transfer_count,
        'sold_copy_created', v_request.retain_records,
        'sold_copy_id', v_sold_copy_id,
        'message', format('Successfully transferred sow and %s related records%s',
            v_transfer_count,
            CASE WHEN v_request.retain_records THEN ' (sold copy retained)' ELSE '' END
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_unique_slug(org_name text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_slug text;
  v_counter int := 0;
  v_final_slug text;
BEGIN
  -- Create base slug from name
  v_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := regexp_replace(v_slug, '^-+|-+$', '', 'g');

  -- If slug is empty, use default
  IF length(v_slug) = 0 THEN
    v_slug := 'organization';
  END IF;

  v_final_slug := v_slug;

  -- Check for conflicts and add number if needed
  WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = v_final_slug) LOOP
    v_counter := v_counter + 1;
    v_final_slug := v_slug || '-' || v_counter;
  END LOOP;

  RETURN v_final_slug;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_confinement_hours_24h(p_sow_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(duration_hours), 0)
    FROM confinement_events
    WHERE sow_id = p_sow_id
      AND start_time >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
      AND end_time IS NOT NULL
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_confinement_hours_30d(p_sow_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(duration_hours), 0)
    FROM confinement_events
    WHERE sow_id = p_sow_id
      AND start_time >= CURRENT_DATE - INTERVAL '30 days'
      AND end_time IS NOT NULL
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result JSON;
  v_today DATE := CURRENT_DATE;
  v_seven_days_from_now DATE := v_today + INTERVAL '7 days';
  v_twenty_one_days_ago DATE := v_today - INTERVAL '21 days';
BEGIN
  SELECT json_build_object(
    -- Sow counts
    'totalSows', (
      SELECT COUNT(*)
      FROM sows
      WHERE user_id = p_user_id
    ),
    'activeSows', (
      SELECT COUNT(*)
      FROM sows
      WHERE user_id = p_user_id
      AND status = 'active'
    ),

    -- Boar counts
    'totalBoars', (
      SELECT COUNT(*)
      FROM boars
      WHERE user_id = p_user_id
    ),
    'activeBoars', (
      SELECT COUNT(*)
      FROM boars
      WHERE user_id = p_user_id
      AND status = 'active'
    ),

    -- Piglet counts
    'nursingPiglets', (
      SELECT COUNT(*)
      FROM piglets
      WHERE user_id = p_user_id
      AND status = 'nursing'
    ),
    'weanedPiglets', (
      SELECT COUNT(*)
      FROM piglets
      WHERE user_id = p_user_id
      AND status = 'weaned'
    ),

    -- Currently farrowing (unique sows with active farrowings in last 21 days)
    'currentlyFarrowing', (
      SELECT COUNT(DISTINCT sow_id)
      FROM farrowings
      WHERE user_id = p_user_id
      AND actual_farrowing_date IS NOT NULL
      AND moved_out_of_farrowing_date IS NULL
      AND actual_farrowing_date >= v_twenty_one_days_ago
    ),

    -- Expected heat this week (matrix treatments)
    'expectedHeatThisWeek', (
      SELECT COUNT(DISTINCT sow_id)
      FROM matrix_treatments
      WHERE user_id = p_user_id
      AND expected_heat_date >= v_today
      AND expected_heat_date <= v_seven_days_from_now
      AND actual_heat_date IS NULL
    ),

    -- Bred sows (from breeding_attempts, not yet farrowed)
    -- A sow is considered "bred" if she has a breeding attempt and no associated farrowing yet
    'bredSows', (
      SELECT COUNT(DISTINCT ba.sow_id)
      FROM breeding_attempts ba
      WHERE ba.user_id = p_user_id
      AND NOT EXISTS (
        SELECT 1
        FROM farrowings f
        WHERE f.breeding_attempt_id = ba.id
        AND f.actual_farrowing_date IS NOT NULL
      )
    ),

    -- Task counts
    'pendingTasks', (
      SELECT COUNT(*)
      FROM scheduled_tasks
      WHERE user_id = p_user_id
      AND is_completed = false
    ),
    'overdueTasks', (
      SELECT COUNT(*)
      FROM scheduled_tasks
      WHERE user_id = p_user_id
      AND is_completed = false
      AND due_date < v_today
    )
  ) INTO result;

  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_financial_summary(p_organization_id uuid, p_start_date date, p_end_date date)
 RETURNS TABLE(total_revenue numeric, total_expenses numeric, net_profit_loss numeric, feed_costs numeric, veterinary_costs numeric, facilities_costs numeric, utilities_costs numeric, other_costs numeric, piglet_sales numeric, cull_sales numeric, breeding_stock_sales numeric, other_income numeric)
 LANGUAGE plpgsql
 STABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_organization_members_with_email()
 RETURNS TABLE(id uuid, organization_id uuid, user_id uuid, role text, invited_by uuid, invited_at timestamp with time zone, joined_at timestamp with time zone, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone, email text, full_name text, avatar_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    om.id,
    om.organization_id,
    om.user_id,
    om.role::TEXT,
    om.invited_by,
    om.invited_at,
    om.joined_at,
    om.is_active,
    om.created_at,
    om.updated_at,
    u.email,
    (u.raw_user_meta_data->>'full_name')::TEXT as full_name,
    (u.raw_user_meta_data->>'avatar_url')::TEXT as avatar_url
  FROM organization_members om
  LEFT JOIN auth.users u ON u.id = om.user_id
  WHERE om.organization_id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
      AND is_active = true
  );
$function$
;

CREATE OR REPLACE FUNCTION public.get_temp_confinement_hours_30days(p_sow_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
DECLARE
  total_hours DECIMAL;
BEGIN
  SELECT COALESCE(SUM(duration_hours), 0)
  INTO total_hours
  FROM sow_temporary_confinement
  WHERE sow_id = p_sow_id
    AND start_time >= NOW() - INTERVAL '30 days'
    AND end_time IS NOT NULL;

  RETURN total_hours;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_unread_notification_count(p_user_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM notifications
  WHERE user_id = p_user_id
    AND read_at IS NULL
    AND (expires_at IS NULL OR expires_at > NOW());
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_organization_id(p_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$
  SELECT organization_id
  FROM organization_members
  WHERE user_id = p_user_id
    AND is_active = true
  LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_primary_organization(p_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_org_id uuid;
BEGIN
  SELECT organization_id INTO v_org_id
  FROM organization_members
  WHERE user_id = p_user_id
    AND is_active = true
  ORDER BY created_at ASC
  LIMIT 1;

  RETURN v_org_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_org_id UUID;
    v_org_slug TEXT;
    v_counter INT := 1;
BEGIN
    -- Step 1: Ensure the user exists (FK-safe)
    -- Normally NEW.id comes from auth insert, so we assume user exists

    -- Step 2: Create organization if user has none
    IF NOT EXISTS (
        SELECT 1
        FROM public.organizations o
        JOIN public.organization_members om ON om.organization_id = o.id
        WHERE om.user_id = NEW.id
    ) THEN
        -- Generate initial slug from email
        v_org_slug := LOWER(REGEXP_REPLACE(NEW.email, '[^a-z0-9]+', '-', 'g'));

        -- Ensure slug is unique
        WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = v_org_slug) LOOP
            v_counter := v_counter + 1;
            v_org_slug := v_org_slug || '-' || v_counter;
        END LOOP;

        -- Insert organization and get UUID
        INSERT INTO public.organizations (name, slug, created_at)
        VALUES (NEW.email || '''s Farm', v_org_slug, NOW())
        RETURNING id INTO v_org_id;

        -- Add user as owner
        INSERT INTO public.organization_members (organization_id, user_id, role, is_active, created_at)
        VALUES (v_org_id, NEW.id, 'owner', TRUE, NOW());
    END IF;

    -- Step 3: Add default notification preferences
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_organization_role(org_id uuid, check_user_id uuid, required_roles text[])
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_id = org_id
      AND user_id = check_user_id
      AND is_active = true
      AND role = ANY(required_roles)
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN auth.email() = 'emorain@gmail.com';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_organization_member(org_id uuid, check_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_id = org_id
      AND user_id = check_user_id
      AND is_active = true
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_sow_compliant(p_sow_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_hours_24h DECIMAL;
  v_hours_30d DECIMAL;
  v_has_space BOOLEAN;
BEGIN
  -- Check confinement limits
  v_hours_24h := get_confinement_hours_24h(p_sow_id);
  v_hours_30d := get_confinement_hours_30d(p_sow_id);

  -- Check if current housing has adequate space
  -- (This is a simplified check - real implementation needs to count pigs per pen)
  v_has_space := EXISTS(
    SELECT 1
    FROM sows s
    JOIN housing_units hu ON hu.id = s.housing_unit_id
    WHERE s.id = p_sow_id
      AND hu.floor_space_sqft >= 24
  );

  -- Compliant if: under confinement limits AND has adequate space
  RETURN (v_hours_24h <= 6 AND v_hours_30d <= 24 AND v_has_space);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_sow_location_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- If housing_unit_id changed, close old location and create new
  IF OLD.housing_unit_id IS DISTINCT FROM NEW.housing_unit_id THEN
    -- Close previous location if exists
    IF OLD.housing_unit_id IS NOT NULL THEN
      UPDATE location_history
      SET moved_out_date = CURRENT_TIMESTAMP
      WHERE sow_id = OLD.id
        AND housing_unit_id = OLD.housing_unit_id
        AND moved_out_date IS NULL;
    END IF;

    -- Create new location entry if new housing unit assigned
    IF NEW.housing_unit_id IS NOT NULL THEN
      INSERT INTO location_history (
        sow_id,
        housing_unit_id,
        moved_in_date,
        user_id
      ) VALUES (
        NEW.id,
        NEW.housing_unit_id,
        CURRENT_TIMESTAMP,
        NEW.user_id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.lookup_user_by_email(user_email text)
 RETURNS TABLE(user_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT id as user_id
  FROM auth.users
  WHERE email = LOWER(user_email)
  LIMIT 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_notifications_as_read(p_user_id uuid, p_notification_ids uuid[] DEFAULT NULL::uuid[])
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF p_notification_ids IS NULL THEN
    -- Mark all as read
    UPDATE notifications
    SET read_at = NOW()
    WHERE user_id = p_user_id
      AND read_at IS NULL;
  ELSE
    -- Mark specific notifications as read
    UPDATE notifications
    SET read_at = NOW()
    WHERE user_id = p_user_id
      AND id = ANY(p_notification_ids)
      AND read_at IS NULL;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_return_to_heat(p_sow_id uuid, p_organization_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_ba uuid;
BEGIN
  SELECT id INTO v_ba
  FROM breeding_attempts
  WHERE sow_id = p_sow_id
    AND organization_id = p_organization_id
    AND result IN ('pending', 'pregnant')
  ORDER BY breeding_date DESC
  LIMIT 1;

  IF v_ba IS NULL THEN
    RAISE EXCEPTION 'No active breeding attempt to return to heat for this sow';
  END IF;

  -- Remove the not-yet-farrowed farrowing tied to this attempt (the delete
  -- trigger above would revert the attempt to 'pending'; we override below).
  DELETE FROM farrowings
  WHERE breeding_attempt_id = v_ba
    AND organization_id = p_organization_id
    AND actual_farrowing_date IS NULL;

  UPDATE breeding_attempts
  SET result = 'returned_to_heat',
      pregnancy_confirmed = false,
      pregnancy_check_date = CURRENT_DATE,
      farrowing_id = NULL
  WHERE id = v_ba;

  RETURN v_ba;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.match_boar_transfer_request_to_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Try to find user by email
    SELECT id INTO NEW.to_user_id
    FROM auth.users
    WHERE email = NEW.to_user_email
    LIMIT 1;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.match_transfer_request_to_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Try to find user by email
    SELECT id INTO NEW.to_user_id
    FROM auth.users
    WHERE email = NEW.to_user_email
    LIMIT 1;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.migrate_existing_users_to_orgs()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_user RECORD;
  v_org_id UUID;
BEGIN
  -- For each existing user without an organization
  FOR v_user IN
    SELECT DISTINCT u.id, u.email
    FROM auth.users u
    LEFT JOIN organization_members om ON om.user_id = u.id
    WHERE om.id IS NULL
  LOOP
    -- Create organization for this user
    INSERT INTO organizations (name, slug, settings)
    VALUES (
      SPLIT_PART(v_user.email, '@', 1) || '''s Farm',
      LOWER(REGEXP_REPLACE(SPLIT_PART(v_user.email, '@', 1), '[^a-zA-Z0-9]', '', 'g')) || '-farm-' || substr(md5(random()::text), 1, 6),
      jsonb_build_object('farm_name', SPLIT_PART(v_user.email, '@', 1) || '''s Farm')
    )
    RETURNING id INTO v_org_id;

    -- Add user as owner
    INSERT INTO organization_members (organization_id, user_id, role, joined_at, invited_by)
    VALUES (v_org_id, v_user.id, 'owner', NOW(), v_user.id);

    -- Update all their existing data with org_id
    UPDATE sows SET organization_id = v_org_id WHERE user_id = v_user.id AND organization_id IS NULL;
    UPDATE boars SET organization_id = v_org_id WHERE user_id = v_user.id AND organization_id IS NULL;
    UPDATE breeding_attempts SET organization_id = v_org_id WHERE user_id = v_user.id AND organization_id IS NULL;
    UPDATE farrowings SET organization_id = v_org_id WHERE user_id = v_user.id AND organization_id IS NULL;
    UPDATE piglets SET organization_id = v_org_id WHERE user_id = v_user.id AND organization_id IS NULL;
    UPDATE health_records SET organization_id = v_org_id WHERE user_id = v_user.id AND organization_id IS NULL;
    UPDATE housing_units SET organization_id = v_org_id WHERE user_id = v_user.id AND organization_id IS NULL;
    UPDATE scheduled_tasks SET organization_id = v_org_id WHERE user_id = v_user.id AND organization_id IS NULL;
    UPDATE matrix_treatments SET organization_id = v_org_id WHERE user_id = v_user.id AND organization_id IS NULL;
    UPDATE protocols SET organization_id = v_org_id WHERE user_id = v_user.id AND organization_id IS NULL;

    -- Update location history tables via their parent tables
    UPDATE sow_location_history
    SET organization_id = v_org_id
    WHERE sow_id IN (SELECT id FROM sows WHERE user_id = v_user.id)
      AND organization_id IS NULL;

    UPDATE boar_location_history
    SET organization_id = v_org_id
    WHERE boar_id IN (SELECT id FROM boars WHERE user_id = v_user.id)
      AND organization_id IS NULL;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.on_auth_user_created_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Use the SECURITY DEFINER function to safely add org, membership, and notification prefs
    PERFORM public.add_user_to_org_secure(NEW.id, NEW.email);
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.process_scheduled_notifications()
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_notification RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Find all scheduled notifications that are due and haven't been sent
  FOR v_notification IN
    SELECT *
    FROM scheduled_notifications
    WHERE scheduled_for <= NOW()
      AND sent = FALSE
    ORDER BY scheduled_for ASC
    LIMIT 100  -- Process in batches
  LOOP
    -- Insert into notifications table
    INSERT INTO notifications (
      user_id,
      organization_id,
      type,
      title,
      body,
      related_type,
      related_id,
      action_url
    ) VALUES (
      v_notification.user_id,
      v_notification.organization_id,
      v_notification.type,
      v_notification.title,
      v_notification.body,
      v_notification.related_type,
      v_notification.related_id,
      v_notification.action_url
    );

    -- Mark as sent
    UPDATE scheduled_notifications
    SET sent = TRUE, sent_at = NOW()
    WHERE id = v_notification.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.record_litter(p_farrowing_id uuid, p_organization_id uuid, p_sow_id uuid, p_breeding_date date, p_actual_farrowing_date date, p_live_piglets integer, p_stillborn integer, p_mummified integer, p_notes text, p_create_piglets boolean, p_piglets jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_farrowing_id uuid := p_farrowing_id;
  v_litter_number int;
  v_piglet jsonb;
  v_ear_tag text;
BEGIN
  -- 1. Farrowing: update existing or create new
  IF v_farrowing_id IS NULL THEN
    INSERT INTO farrowings (
      user_id, organization_id, sow_id, breeding_date, actual_farrowing_date,
      live_piglets, stillborn, mummified, notes
    ) VALUES (
      auth.uid(), p_organization_id, p_sow_id, p_breeding_date, p_actual_farrowing_date,
      COALESCE(p_live_piglets, 0), COALESCE(p_stillborn, 0), COALESCE(p_mummified, 0), p_notes
    )
    RETURNING id INTO v_farrowing_id;
  ELSE
    UPDATE farrowings
    SET actual_farrowing_date = p_actual_farrowing_date,
        live_piglets = COALESCE(p_live_piglets, 0),
        stillborn = COALESCE(p_stillborn, 0),
        mummified = COALESCE(p_mummified, 0),
        notes = p_notes
    WHERE id = v_farrowing_id
      AND organization_id = p_organization_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Farrowing % not found in organization %', v_farrowing_id, p_organization_id;
    END IF;
  END IF;

  -- 2. Individual piglets (optional)
  IF p_create_piglets AND p_piglets IS NOT NULL AND jsonb_array_length(p_piglets) > 0 THEN
    -- Atomically claim this litter's number and advance the counter.
    UPDATE farm_settings
    SET ear_notch_current_litter = COALESCE(ear_notch_current_litter, 1) + 1
    WHERE organization_id = p_organization_id
    RETURNING ear_notch_current_litter - 1 INTO v_litter_number;

    -- Org has no settings row yet: create one, claiming litter number 1.
    IF v_litter_number IS NULL THEN
      INSERT INTO farm_settings (user_id, organization_id, ear_notch_current_litter)
      VALUES (auth.uid(), p_organization_id, 2);
      v_litter_number := 1;
    END IF;

    FOR v_piglet IN SELECT * FROM jsonb_array_elements(p_piglets)
    LOOP
      v_ear_tag := NULLIF(TRIM(COALESCE(v_piglet->>'ear_tag', '')), '');
      -- Auto-generate an ear tag only when the piglet has no other identification.
      IF v_ear_tag IS NULL AND NULLIF(v_piglet->>'left_ear_notch', '') IS NULL THEN
        v_ear_tag := 'PIG-' || to_char(now(), 'YYYYMMDD') || '-'
                     || lpad((floor(random() * 10000))::int::text, 4, '0');
      END IF;

      INSERT INTO piglets (
        user_id, organization_id, farrowing_id, ear_tag,
        right_ear_notch, left_ear_notch, sex, birth_weight, status
      ) VALUES (
        auth.uid(), p_organization_id, v_farrowing_id, v_ear_tag,
        v_litter_number,                                        -- right notch = litter number
        NULLIF(v_piglet->>'left_ear_notch', '')::int,
        COALESCE(NULLIF(v_piglet->>'sex', ''), 'unknown'),
        NULLIF(v_piglet->>'birth_weight', '')::numeric,
        'nursing'
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object('farrowing_id', v_farrowing_id, 'litter_number', v_litter_number);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reset_breeding_attempt_on_farrowing_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.breeding_attempt_id IS NOT NULL THEN
    UPDATE breeding_attempts
    SET farrowing_id = NULL,
        result = CASE WHEN result IN ('pregnant', 'farrowed') THEN 'pending' ELSE result END
    WHERE id = OLD.breeding_attempt_id;
  END IF;
  RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.schedule_farrowing_notifications(p_farrowing_id uuid, p_sow_ear_tag character varying, p_expected_date date, p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_org_id UUID;
  v_reminder_days INTEGER;
  v_prefs RECORD;
BEGIN
  -- Get user's organization
  SELECT organization_id INTO v_org_id
  FROM organization_members
  WHERE user_id = p_user_id AND is_active = true
  LIMIT 1;

  -- Get user's notification preferences
  SELECT * INTO v_prefs
  FROM notification_preferences
  WHERE user_id = p_user_id;

  -- If user doesn't have preferences, create default
  IF v_prefs IS NULL THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_prefs;
  END IF;

  -- Skip if farrowing notifications disabled
  IF v_prefs.notify_farrowing = FALSE THEN
    RETURN;
  END IF;

  -- Schedule notifications for each reminder day
  FOREACH v_reminder_days IN ARRAY v_prefs.farrowing_reminder_days
  LOOP
    INSERT INTO scheduled_notifications (
      user_id,
      organization_id,
      type,
      title,
      body,
      related_type,
      related_id,
      action_url,
      scheduled_for,
      priority,
      channels
    )
    VALUES (
      p_user_id,
      v_org_id,
      'farrowing_reminder',
      'Farrowing Expected Soon',
      'Sow ' || p_sow_ear_tag || ' is expected to farrow in ' || v_reminder_days || ' day' || CASE WHEN v_reminder_days > 1 THEN 's' ELSE '' END,
      'farrowing',
      p_farrowing_id,
      '/farrowings/active',
      (p_expected_date - (v_reminder_days || ' days')::INTERVAL)::TIMESTAMPTZ + TIME '08:00:00',
      CASE WHEN v_reminder_days <= 1 THEN 'high' ELSE 'normal' END,
      ARRAY['push', 'email']
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.schedule_farrowing_reminders()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_sow_ear_tag VARCHAR(50);
  v_reminder_days INTEGER[];
  v_day INTEGER;
  v_scheduled_date TIMESTAMPTZ;
  v_notify_enabled BOOLEAN;
BEGIN
  -- Only schedule for new farrowings that are not completed
  IF TG_OP = 'INSERT' AND NEW.actual_farrowing_date IS NULL THEN
    -- Get sow ear tag
    SELECT ear_tag INTO v_sow_ear_tag
    FROM sows
    WHERE id = NEW.sow_id;

    -- Get user's notification preferences
    SELECT
      notify_farrowing,
      farrowing_reminder_days
    INTO v_notify_enabled, v_reminder_days
    FROM notification_preferences
    WHERE user_id = NEW.user_id;

    -- Default to enabled with [7,3,1] if no preferences set
    v_notify_enabled := COALESCE(v_notify_enabled, TRUE);
    v_reminder_days := COALESCE(v_reminder_days, ARRAY[7,3,1]);

    IF v_notify_enabled THEN
      -- Schedule reminders for each day
      FOREACH v_day IN ARRAY v_reminder_days
      LOOP
        v_scheduled_date := NEW.expected_farrowing_date - (v_day || ' days')::INTERVAL;

        -- Only schedule if in the future
        IF v_scheduled_date > NOW() THEN
          INSERT INTO scheduled_notifications (
            user_id,
            organization_id,
            type,
            title,
            body,
            related_type,
            related_id,
            action_url,
            scheduled_for,
            sent
          ) VALUES (
            NEW.user_id,
            NEW.organization_id,
            'farrowing',
            'Farrowing Alert: ' || v_sow_ear_tag,
            'Sow ' || v_sow_ear_tag || ' is expected to farrow in ' || v_day || ' day' || CASE WHEN v_day != 1 THEN 's' ELSE '' END,
            'farrowing',
            NEW.id,
            '/farrowings/active',
            v_scheduled_date,
            FALSE
          );
        END IF;
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.schedule_pregnancy_check_notifications(p_breeding_attempt_id uuid, p_sow_ear_tag character varying, p_check_date date, p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_org_id UUID;
  v_reminder_days INTEGER;
  v_prefs RECORD;
BEGIN
  -- Get user's organization
  SELECT organization_id INTO v_org_id
  FROM organization_members
  WHERE user_id = p_user_id AND is_active = true
  LIMIT 1;

  -- Get user's notification preferences
  SELECT * INTO v_prefs
  FROM notification_preferences
  WHERE user_id = p_user_id;

  IF v_prefs IS NULL THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_prefs;
  END IF;

  -- Skip if pregnancy check notifications disabled
  IF v_prefs.notify_pregnancy_check = FALSE THEN
    RETURN;
  END IF;

  -- Schedule notifications
  FOREACH v_reminder_days IN ARRAY v_prefs.pregnancy_check_reminder_days
  LOOP
    INSERT INTO scheduled_notifications (
      user_id,
      organization_id,
      type,
      title,
      body,
      related_type,
      related_id,
      action_url,
      scheduled_for,
      priority,
      channels
    )
    VALUES (
      p_user_id,
      v_org_id,
      'pregnancy_check_reminder',
      'Pregnancy Check Due',
      'Sow ' || p_sow_ear_tag || ' needs pregnancy check' || CASE WHEN v_reminder_days > 0 THEN ' in ' || v_reminder_days || ' day(s)' ELSE ' today' END,
      'breeding_attempt',
      p_breeding_attempt_id,
      '/breeding/bred-sows',
      (p_check_date - (v_reminder_days || ' days')::INTERVAL)::TIMESTAMPTZ + TIME '08:00:00',
      CASE WHEN v_reminder_days = 0 THEN 'high' ELSE 'normal' END,
      ARRAY['push', 'email']
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.schedule_pregnancy_check_reminder()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_sow_ear_tag VARCHAR(50);
  v_check_date DATE;
  v_reminder_days INTEGER[];
  v_day INTEGER;
  v_scheduled_date TIMESTAMPTZ;
  v_notify_enabled BOOLEAN;
  v_org_id UUID;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.pregnancy_check_date IS NOT NULL THEN
    -- Get sow ear tag
    SELECT ear_tag INTO v_sow_ear_tag FROM sows WHERE id = NEW.sow_id;

    -- Get organization_id
    SELECT organization_id INTO v_org_id
    FROM organization_members
    WHERE user_id = NEW.user_id AND is_active = true
    LIMIT 1;

    -- Get user's notification preferences
    SELECT
      notify_pregnancy_check,
      pregnancy_check_reminder_days
    INTO v_notify_enabled, v_reminder_days
    FROM notification_preferences
    WHERE user_id = NEW.user_id;

    v_notify_enabled := COALESCE(v_notify_enabled, TRUE);
    v_reminder_days := COALESCE(v_reminder_days, ARRAY[1]);

    IF v_notify_enabled THEN
      FOREACH v_day IN ARRAY v_reminder_days
      LOOP
        v_scheduled_date := NEW.pregnancy_check_date - (v_day || ' days')::INTERVAL;

        IF v_scheduled_date > NOW() THEN
          INSERT INTO scheduled_notifications (
            user_id,
            organization_id,
            type,
            title,
            body,
            related_type,
            related_id,
            action_url,
            scheduled_for,
            sent
          ) VALUES (
            NEW.user_id,
            v_org_id,
            'pregnancy_check',
            'Pregnancy Check Due: ' || v_sow_ear_tag,
            'Sow ' || v_sow_ear_tag || ' pregnancy check is due in ' || v_day || ' day' || CASE WHEN v_day != 1 THEN 's' ELSE '' END,
            'breeding_attempt',
            NEW.id,
            '/sows',
            v_scheduled_date,
            FALSE
          );
        END IF;
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.send_breeding_notification()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_sow_ear_tag VARCHAR(50);
  v_boar_ear_tag VARCHAR(50);
  v_notify_enabled BOOLEAN;
  v_body TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get ear tags (with fallback for NULL)
    SELECT COALESCE(ear_tag, 'Unknown') INTO v_sow_ear_tag FROM sows WHERE id = NEW.sow_id;
    SELECT COALESCE(ear_tag, 'Unknown') INTO v_boar_ear_tag FROM boars WHERE id = NEW.boar_id;

    -- Get user's notification preferences
    SELECT notify_breeding INTO v_notify_enabled
    FROM notification_preferences
    WHERE user_id = NEW.user_id;

    -- Default to enabled if no preferences set
    v_notify_enabled := COALESCE(v_notify_enabled, TRUE);

    IF v_notify_enabled THEN
      -- Build body text with proper null handling
      v_body := 'Sow ' || COALESCE(v_sow_ear_tag, 'Unknown') || ' bred with boar ' || COALESCE(v_boar_ear_tag, 'Unknown');
      
      INSERT INTO notifications (
        user_id,
        type,
        title,
        body,
        action_url,
        related_type,
        related_id
      ) VALUES (
        NEW.user_id,
        'breeding',
        'New Breeding Recorded',
        v_body,
        '/sows',
        'breeding_attempt',
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.send_health_record_notification()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_animal_ear_tag VARCHAR(50);
  v_notify_enabled BOOLEAN;
  v_org_id UUID;
  v_related_type VARCHAR(50);
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get animal ear tag (check both sows and boars)
    IF NEW.sow_id IS NOT NULL THEN
      SELECT ear_tag INTO v_animal_ear_tag FROM sows WHERE id = NEW.sow_id;
      v_related_type := 'sow';
    ELSIF NEW.boar_id IS NOT NULL THEN
      SELECT ear_tag INTO v_animal_ear_tag FROM boars WHERE id = NEW.boar_id;
      v_related_type := 'boar';
    END IF;

    -- Get organization_id
    SELECT organization_id INTO v_org_id
    FROM organization_members
    WHERE user_id = NEW.user_id AND is_active = true
    LIMIT 1;

    -- Get user's notification preferences
    SELECT notify_health_records INTO v_notify_enabled
    FROM notification_preferences
    WHERE user_id = NEW.user_id;

    v_notify_enabled := COALESCE(v_notify_enabled, TRUE);

    IF v_notify_enabled THEN
      INSERT INTO notifications (
        user_id,
        organization_id,
        type,
        title,
        body,
        related_type,
        related_id,
        action_url
      ) VALUES (
        NEW.user_id,
        v_org_id,
        'health',
        'Health Record: ' || COALESCE(v_animal_ear_tag, 'Animal'),
        'New ' || NEW.record_type || ' record added for ' || COALESCE(v_animal_ear_tag, 'animal'),
        v_related_type,
        NEW.id,
        '/health'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.send_task_due_notification()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_notify_enabled BOOLEAN;
  v_is_overdue BOOLEAN;
  v_org_id UUID;
BEGIN
  IF TG_OP = 'INSERT' AND NOT NEW.is_completed THEN
    -- Check if task is due today or overdue
    v_is_overdue := NEW.due_date < CURRENT_DATE;

    -- Get organization_id
    SELECT organization_id INTO v_org_id
    FROM organization_members
    WHERE user_id = NEW.user_id AND is_active = true
    LIMIT 1;

    -- Get user's notification preferences
    SELECT notify_tasks INTO v_notify_enabled
    FROM notification_preferences
    WHERE user_id = NEW.user_id;

    v_notify_enabled := COALESCE(v_notify_enabled, TRUE);

    -- Send notification for tasks due today or overdue
    IF v_notify_enabled AND (NEW.due_date <= CURRENT_DATE) THEN
      INSERT INTO notifications (
        user_id,
        organization_id,
        type,
        title,
        body,
        related_type,
        related_id,
        action_url
      ) VALUES (
        NEW.user_id,
        v_org_id,
        'task',
        CASE WHEN v_is_overdue THEN 'Overdue Task' ELSE 'Task Reminder' END,
        CASE
          WHEN v_is_overdue THEN 'Task "' || NEW.task_name || '" is overdue'
          ELSE 'Task "' || NEW.task_name || '" is due today'
        END,
        'task',
        NEW.id,
        '/tasks'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.send_weaning_notification()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_farrowing_id UUID;
  v_sow_ear_tag VARCHAR(50);
  v_user_id UUID;
  v_org_id UUID;
  v_notify_enabled BOOLEAN;
  v_weaned_count INTEGER;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.weaned_date IS NULL AND NEW.weaned_date IS NOT NULL THEN
    -- Get farrowing and sow info
    SELECT f.id, f.user_id, f.organization_id, s.ear_tag
    INTO v_farrowing_id, v_user_id, v_org_id, v_sow_ear_tag
    FROM farrowings f
    JOIN sows s ON s.id = f.sow_id
    WHERE f.id = NEW.farrowing_id;

    -- Count how many piglets have been weaned from this farrowing
    SELECT COUNT(*) INTO v_weaned_count
    FROM piglets
    WHERE farrowing_id = v_farrowing_id
      AND weaned_date IS NOT NULL;

    -- Get user's notification preferences
    SELECT notify_weaning INTO v_notify_enabled
    FROM notification_preferences
    WHERE user_id = v_user_id;

    v_notify_enabled := COALESCE(v_notify_enabled, TRUE);

    IF v_notify_enabled THEN
      INSERT INTO notifications (
        user_id,
        organization_id,
        type,
        title,
        body,
        related_type,
        related_id,
        action_url
      ) VALUES (
        v_user_id,
        v_org_id,
        'weaning',
        'Piglets Weaned: ' || v_sow_ear_tag,
        v_weaned_count || ' piglet' || CASE WHEN v_weaned_count != 1 THEN 's' ELSE '' END || ' weaned from ' || v_sow_ear_tag,
        'farrowing',
        v_farrowing_id,
        '/piglets/weaned'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_health_record_animal_type()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Auto-set animal_type based on which ID column is populated
  IF NEW.sow_id IS NOT NULL THEN
    NEW.animal_type := 'sow';
  ELSIF NEW.boar_id IS NOT NULL THEN
    NEW.animal_type := 'boar';
  ELSIF NEW.piglet_id IS NOT NULL THEN
    NEW.animal_type := 'piglet';
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_piglet_pedigree()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_sow_id UUID;
    v_boar_id UUID;
BEGIN
    -- Get the sow_id and boar_id from the farrowing record
    SELECT sow_id, boar_id INTO v_sow_id, v_boar_id
    FROM farrowings
    WHERE id = NEW.farrowing_id;

    -- Set the dam (mother) and sire (father) if not already set
    IF NEW.dam_id IS NULL THEN
        NEW.dam_id := v_sow_id;
    END IF;

    IF NEW.sire_id IS NULL THEN
        NEW.sire_id := v_boar_id;
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.track_boar_housing_changes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.track_piglet_housing_changes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_ai_doses_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_breeding_attempt_on_farrowing()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- When a farrowing record gets an actual_farrowing_date, mark the breeding attempt as 'farrowed'
  IF NEW.actual_farrowing_date IS NOT NULL AND (OLD.actual_farrowing_date IS NULL OR OLD.actual_farrowing_date IS DISTINCT FROM NEW.actual_farrowing_date) THEN
    -- Update the breeding attempt linked to this farrowing
    UPDATE breeding_attempts
    SET result = 'farrowed'
    WHERE id = NEW.breeding_attempt_id
      AND result = 'pregnant';
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_farm_settings_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_feedback_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status IN ('resolved', 'closed') AND OLD.status NOT IN ('resolved', 'closed') THEN
    NEW.resolved_at = NOW();
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_housing_unit_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.user_in_organization(org_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND is_active = true
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.wean_litter(p_farrowing_id uuid, p_organization_id uuid, p_weaning_date date, p_housing_unit_id uuid, p_piglets jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_moved date;
  v_piglet jsonb;
  v_ear_tag text;
  v_piglet_id uuid;
  v_updated int := 0;
  v_created int := 0;
BEGIN
  -- Lock the farrowing and re-check the weaned guard under the lock.
  SELECT moved_out_of_farrowing_date INTO v_moved
  FROM farrowings
  WHERE id = p_farrowing_id AND organization_id = p_organization_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Farrowing % not found in organization %', p_farrowing_id, p_organization_id;
  END IF;
  IF v_moved IS NOT NULL THEN
    RAISE EXCEPTION 'This litter has already been weaned';
  END IF;

  IF p_piglets IS NOT NULL THEN
    FOR v_piglet IN SELECT * FROM jsonb_array_elements(p_piglets)
    LOOP
      v_piglet_id := NULLIF(v_piglet->>'id', '')::uuid;

      IF v_piglet_id IS NOT NULL THEN
        -- Existing nursing piglet -> weaned
        UPDATE piglets
        SET weaning_weight = NULLIF(v_piglet->>'weaning_weight', '')::numeric,
            weaned_date = p_weaning_date,
            status = 'weaned',
            housing_unit_id = p_housing_unit_id,
            name = NULLIF(v_piglet->>'name', ''),
            ear_tag = NULLIF(v_piglet->>'ear_tag', ''),
            right_ear_notch = NULLIF(v_piglet->>'right_ear_notch', '')::int,
            left_ear_notch = NULLIF(v_piglet->>'left_ear_notch', '')::int,
            birth_weight = NULLIF(v_piglet->>'birth_weight', '')::numeric,
            sex = COALESCE(NULLIF(v_piglet->>'sex', ''), 'unknown')
        WHERE id = v_piglet_id AND organization_id = p_organization_id;
        IF FOUND THEN
          v_updated := v_updated + 1;
        END IF;
      ELSE
        -- New piglet materialized at weaning time
        v_ear_tag := NULLIF(TRIM(COALESCE(v_piglet->>'ear_tag', '')), '');
        IF v_ear_tag IS NULL
           AND NULLIF(v_piglet->>'right_ear_notch', '') IS NULL
           AND NULLIF(v_piglet->>'left_ear_notch', '') IS NULL THEN
          v_ear_tag := 'PIG-' || to_char(now(), 'YYYYMMDD') || '-'
                       || lpad((floor(random() * 10000))::int::text, 4, '0');
        END IF;

        INSERT INTO piglets (
          user_id, organization_id, farrowing_id, name, ear_tag,
          right_ear_notch, left_ear_notch, birth_weight, weaning_weight,
          sex, status, weaned_date, housing_unit_id
        ) VALUES (
          auth.uid(), p_organization_id, p_farrowing_id,
          NULLIF(v_piglet->>'name', ''), v_ear_tag,
          NULLIF(v_piglet->>'right_ear_notch', '')::int,
          NULLIF(v_piglet->>'left_ear_notch', '')::int,
          NULLIF(v_piglet->>'birth_weight', '')::numeric,
          NULLIF(v_piglet->>'weaning_weight', '')::numeric,
          COALESCE(NULLIF(v_piglet->>'sex', ''), 'unknown'),
          'weaned', p_weaning_date, p_housing_unit_id
        );
        v_created := v_created + 1;
      END IF;
    END LOOP;
  END IF;

  UPDATE farrowings
  SET moved_out_of_farrowing_date = p_weaning_date
  WHERE id = p_farrowing_id AND organization_id = p_organization_id;

  RETURN jsonb_build_object('updated', v_updated, 'created', v_created);
END;
$function$
;

-- ==================== VIEWS ====================
CREATE OR REPLACE VIEW public."available_ai_semen" AS
 SELECT id,
    ear_tag,
    name,
    breed,
    semen_straws,
    supplier,
    collection_date,
    cost_per_straw,
    registration_number
   FROM boars
  WHERE boar_type::text = 'ai_semen'::text AND status::text = 'active'::text AND (semen_straws IS NULL OR semen_straws > 0)
  ORDER BY name, ear_tag;

CREATE OR REPLACE VIEW public."boar_list_view" AS
 SELECT id,
    ear_tag,
    name,
    birth_date,
    breed,
    status,
    photo_url,
    right_ear_notch,
    left_ear_notch,
    registration_number,
    notes,
    created_at,
    sire_id,
    dam_id,
    boar_type,
    semen_straws,
    semen_type,
    supplier,
    collection_date,
    user_id,
    organization_id,
    cost_per_straw,
    ownership_type,
    housing_unit_id,
    ( SELECT count(*) AS count
           FROM breeding_attempts ba
          WHERE ba.boar_id = b.id AND ba.organization_id = b.organization_id) AS breeding_count
   FROM boars b;

CREATE OR REPLACE VIEW public."bred_sows_view" AS
 SELECT ba.id,
    ba.sow_id,
    ba.breeding_date,
    COALESCE(ba.notes, 'Breeding Attempt'::text) AS batch_name,
    ba.user_id,
    'breeding_attempt'::text AS breeding_source,
    s.ear_tag,
    s.name AS sow_name,
    s.photo_url,
    ( SELECT json_build_object('task_name', st.task_name, 'due_date', st.due_date) AS json_build_object
           FROM scheduled_tasks st
          WHERE st.sow_id = ba.sow_id AND st.user_id = ba.user_id AND st.is_completed = false AND st.due_date >= CURRENT_DATE
          ORDER BY st.due_date
         LIMIT 1) AS next_task,
    (EXISTS ( SELECT 1
           FROM farrowings f
          WHERE f.breeding_attempt_id = ba.id AND f.actual_farrowing_date IS NOT NULL)) AS has_farrowed,
    ba.pregnancy_confirmed = true OR ba.pregnancy_check_date IS NOT NULL AS pregnancy_check_completed
   FROM breeding_attempts ba
     JOIN sows s ON s.id = ba.sow_id AND s.user_id = ba.user_id
  WHERE NOT (EXISTS ( SELECT 1
           FROM farrowings f
          WHERE f.breeding_attempt_id = ba.id AND f.actual_farrowing_date IS NOT NULL));

CREATE OR REPLACE VIEW public."housing_unit_occupancy" AS
 SELECT id,
    name,
    pen_number,
    type,
    length_feet,
    width_feet,
    square_footage,
    max_capacity,
    building_name,
    notes,
    measurement_date,
    measured_by,
    measurement_notes,
    user_id,
    organization_id,
    ( SELECT count(*) AS count
           FROM sows
          WHERE sows.housing_unit_id = hu.id AND sows.status::text = 'active'::text AND sows.organization_id = hu.organization_id) AS current_sows,
    ( SELECT count(*) AS count
           FROM boars
          WHERE boars.housing_unit_id = hu.id AND boars.status::text = 'active'::text AND boars.organization_id = hu.organization_id) AS current_boars,
    ( SELECT count(*) AS count
           FROM piglets
          WHERE piglets.housing_unit_id = hu.id AND (piglets.status::text = ANY (ARRAY['nursing'::character varying, 'weaned'::character varying]::text[])) AND piglets.organization_id = hu.organization_id) AS current_piglets,
    (( SELECT count(*) AS count
           FROM sows
          WHERE sows.housing_unit_id = hu.id AND sows.status::text = 'active'::text AND sows.organization_id = hu.organization_id)) + (( SELECT count(*) AS count
           FROM boars
          WHERE boars.housing_unit_id = hu.id AND boars.status::text = 'active'::text AND boars.organization_id = hu.organization_id)) + (( SELECT count(*) AS count
           FROM piglets
          WHERE piglets.housing_unit_id = hu.id AND (piglets.status::text = ANY (ARRAY['nursing'::character varying, 'weaned'::character varying]::text[])) AND piglets.organization_id = hu.organization_id)) AS total_animals,
        CASE
            WHEN type::text = 'gestation'::text AND square_footage IS NOT NULL AND (( SELECT count(*) AS count
               FROM sows
              WHERE sows.housing_unit_id = hu.id AND sows.status::text = 'active'::text AND sows.organization_id = hu.organization_id)) > 0 THEN square_footage / NULLIF(( SELECT count(*) AS count
               FROM sows
              WHERE sows.housing_unit_id = hu.id AND sows.status::text = 'active'::text AND sows.organization_id = hu.organization_id), 0)::numeric
            ELSE NULL::numeric
        END AS sq_ft_per_sow,
        CASE
            WHEN square_footage IS NOT NULL AND ((( SELECT count(*) AS count
               FROM sows
              WHERE sows.housing_unit_id = hu.id AND sows.status::text = 'active'::text AND sows.organization_id = hu.organization_id)) + (( SELECT count(*) AS count
               FROM boars
              WHERE boars.housing_unit_id = hu.id AND boars.status::text = 'active'::text AND boars.organization_id = hu.organization_id)) + (( SELECT count(*) AS count
               FROM piglets
              WHERE piglets.housing_unit_id = hu.id AND (piglets.status::text = ANY (ARRAY['nursing'::character varying, 'weaned'::character varying]::text[])) AND piglets.organization_id = hu.organization_id))) > 0 THEN square_footage / NULLIF((( SELECT count(*) AS count
               FROM sows
              WHERE sows.housing_unit_id = hu.id AND sows.status::text = 'active'::text AND sows.organization_id = hu.organization_id)) + (( SELECT count(*) AS count
               FROM boars
              WHERE boars.housing_unit_id = hu.id AND boars.status::text = 'active'::text AND boars.organization_id = hu.organization_id)) + (( SELECT count(*) AS count
               FROM piglets
              WHERE piglets.housing_unit_id = hu.id AND (piglets.status::text = ANY (ARRAY['nursing'::character varying, 'weaned'::character varying]::text[])) AND piglets.organization_id = hu.organization_id)), 0)::numeric
            ELSE NULL::numeric
        END AS sq_ft_per_animal,
        CASE
            WHEN type::text = 'gestation'::text AND square_footage IS NOT NULL AND (( SELECT count(*) AS count
               FROM sows
              WHERE sows.housing_unit_id = hu.id AND sows.status::text = 'active'::text AND sows.organization_id = hu.organization_id)) > 0 THEN (square_footage / NULLIF(( SELECT count(*) AS count
               FROM sows
              WHERE sows.housing_unit_id = hu.id AND sows.status::text = 'active'::text AND sows.organization_id = hu.organization_id), 0)::numeric) >= 24::numeric
            ELSE NULL::boolean
        END AS is_compliant
   FROM housing_units hu;

CREATE OR REPLACE VIEW public."matrix_treatment_status" AS
 SELECT mt.id,
    mt.sow_id,
    mt.batch_name,
    mt.treatment_start_date,
    mt.treatment_end_date,
    mt.treatment_duration_days,
    mt.expected_heat_date,
    mt.actual_heat_date,
    mt.bred,
    mt.breeding_date,
    mt.treatment_completed,
    CURRENT_DATE - mt.treatment_start_date AS days_since_start,
        CASE
            WHEN mt.treatment_end_date > CURRENT_DATE THEN mt.treatment_end_date - CURRENT_DATE
            ELSE 0
        END AS days_remaining,
        CASE
            WHEN mt.bred THEN 'bred'::text
            WHEN mt.actual_heat_date IS NOT NULL THEN 'in_heat'::text
            WHEN mt.treatment_end_date > CURRENT_DATE THEN 'in_treatment'::text
            WHEN mt.expected_heat_date >= CURRENT_DATE THEN 'awaiting_heat'::text
            ELSE 'heat_window_passed'::text
        END AS status,
    s.ear_tag,
    s.name AS sow_name
   FROM matrix_treatments mt
     JOIN sows s ON s.id = mt.sow_id;

CREATE OR REPLACE VIEW public."my_transfer_requests" AS
 SELECT tr.id,
    'sow'::text AS animal_type,
    tr.sow_id AS animal_id,
    NULL::uuid AS boar_id,
    tr.sow_id,
    tr.from_user_id,
    tr.to_user_email,
    tr.to_user_id,
    tr.status,
    tr.message,
    tr.created_at,
    tr.responded_at,
    s.ear_tag AS animal_ear_tag,
    s.name AS animal_name,
    s.breed AS animal_breed,
    'sent'::text AS request_type
   FROM sow_transfer_requests tr
     JOIN sows s ON tr.sow_id = s.id
  WHERE tr.from_user_id = auth.uid()
UNION ALL
 SELECT tr.id,
    'sow'::text AS animal_type,
    tr.sow_id AS animal_id,
    NULL::uuid AS boar_id,
    tr.sow_id,
    tr.from_user_id,
    tr.to_user_email,
    tr.to_user_id,
    tr.status,
    tr.message,
    tr.created_at,
    tr.responded_at,
    s.ear_tag AS animal_ear_tag,
    s.name AS animal_name,
    s.breed AS animal_breed,
    'received'::text AS request_type
   FROM sow_transfer_requests tr
     JOIN sows s ON tr.sow_id = s.id
  WHERE tr.to_user_id = auth.uid() OR tr.to_user_email::text = auth.email()
UNION ALL
 SELECT tr.id,
    'boar'::text AS animal_type,
    tr.boar_id AS animal_id,
    tr.boar_id,
    NULL::uuid AS sow_id,
    tr.from_user_id,
    tr.to_user_email,
    tr.to_user_id,
    tr.status,
    tr.message,
    tr.created_at,
    tr.responded_at,
    b.ear_tag AS animal_ear_tag,
    b.name AS animal_name,
    b.breed AS animal_breed,
    'sent'::text AS request_type
   FROM boar_transfer_requests tr
     JOIN boars b ON tr.boar_id = b.id
  WHERE tr.from_user_id = auth.uid()
UNION ALL
 SELECT tr.id,
    'boar'::text AS animal_type,
    tr.boar_id AS animal_id,
    tr.boar_id,
    NULL::uuid AS sow_id,
    tr.from_user_id,
    tr.to_user_email,
    tr.to_user_id,
    tr.status,
    tr.message,
    tr.created_at,
    tr.responded_at,
    b.ear_tag AS animal_ear_tag,
    b.name AS animal_name,
    b.breed AS animal_breed,
    'received'::text AS request_type
   FROM boar_transfer_requests tr
     JOIN boars b ON tr.boar_id = b.id
  WHERE tr.to_user_id = auth.uid() OR tr.to_user_email::text = auth.email();

CREATE OR REPLACE VIEW public."organization_members_with_email" AS
 SELECT id,
    organization_id,
    user_id,
    role,
    invited_by,
    invited_at,
    joined_at,
    is_active,
    created_at,
    updated_at,
    email,
    full_name,
    avatar_url
   FROM get_organization_members_with_email() get_organization_members_with_email(id, organization_id, user_id, role, invited_by, invited_at, joined_at, is_active, created_at, updated_at, email, full_name, avatar_url);

CREATE OR REPLACE VIEW public."piglet_pedigree_view" AS
 SELECT p.id AS piglet_id,
    p.ear_tag AS piglet_ear_tag,
    p.sex,
    p.birth_weight,
    p.weaning_weight,
    p.registration_number,
    p.registration_association,
    p.registration_date,
    s.id AS dam_id,
    s.ear_tag AS dam_ear_tag,
    s.name AS dam_name,
    s.breed AS dam_breed,
    s.registration_number AS dam_registration,
    s.sire_id AS maternal_grandsire_id,
    s.dam_id AS maternal_granddam_id,
    b.id AS sire_id,
    b.ear_tag AS sire_ear_tag,
    b.name AS sire_name,
    b.breed AS sire_breed,
    b.registration_number AS sire_registration,
    b.sire_id AS paternal_grandsire_id,
    b.dam_id AS paternal_granddam_id,
    f.id AS farrowing_id,
    f.breeding_date,
    f.actual_farrowing_date
   FROM piglets p
     LEFT JOIN sows s ON p.dam_id = s.id
     LEFT JOIN boars b ON p.sire_id = b.id
     LEFT JOIN farrowings f ON p.farrowing_id = f.id;

CREATE OR REPLACE VIEW public."sow_breeding_status" AS
 SELECT s.id AS sow_id,
    s.user_id,
    ba.id AS latest_breeding_attempt_id,
    ba.breeding_date,
    ba.breeding_method,
    ba.boar_id,
    ba.pregnancy_check_date,
    ba.pregnancy_confirmed,
    ba.result,
    ba.farrowing_id,
    CURRENT_DATE - ba.breeding_date AS days_since_breeding,
        CASE
            WHEN ba.pregnancy_confirmed = true THEN 'pregnant'::text
            WHEN ba.pregnancy_confirmed = false THEN 'open'::text
            WHEN ba.pregnancy_confirmed IS NULL AND (CURRENT_DATE - ba.breeding_date) >= 18 THEN 'needs_check'::text
            WHEN ba.pregnancy_confirmed IS NULL THEN 'bred'::text
            ELSE 'open'::text
        END AS status,
        CASE
            WHEN ba.pregnancy_confirmed = true THEN 'Pregnant'::text
            WHEN ba.pregnancy_confirmed = false THEN 'Returned to Heat'::text
            WHEN ba.pregnancy_confirmed IS NULL AND (CURRENT_DATE - ba.breeding_date) >= 18 THEN 'Ready for Pregnancy Check'::text
            WHEN ba.pregnancy_confirmed IS NULL THEN format('Bred - Day %s'::text, CURRENT_DATE - ba.breeding_date)
            ELSE 'Open'::text
        END AS status_label
   FROM sows s
     LEFT JOIN LATERAL ( SELECT breeding_attempts.id,
            breeding_attempts.user_id,
            breeding_attempts.sow_id,
            breeding_attempts.breeding_date,
            breeding_attempts.breeding_method,
            breeding_attempts.boar_id,
            breeding_attempts.boar_description,
            breeding_attempts.pregnancy_check_date,
            breeding_attempts.pregnancy_confirmed,
            breeding_attempts.result,
            breeding_attempts.farrowing_id,
            breeding_attempts.notes,
            breeding_attempts.created_at,
            breeding_attempts.updated_at
           FROM breeding_attempts
          WHERE breeding_attempts.sow_id = s.id AND (breeding_attempts.result::text = ANY (ARRAY['pending'::character varying, 'pregnant'::character varying]::text[]))
          ORDER BY breeding_attempts.breeding_date DESC
         LIMIT 1) ba ON true
  WHERE s.status::text = 'active'::text;

CREATE OR REPLACE VIEW public."sow_list_view" AS
 SELECT s.id,
    s.ear_tag,
    s.name,
    s.birth_date,
    s.breed,
    s.status,
    s.photo_url,
    s.right_ear_notch,
    s.left_ear_notch,
    s.registration_number,
    s.notes,
    s.current_location,
    s.housing_unit_id,
    s.sire_id,
    s.dam_id,
    s.sire_name,
    s.dam_name,
    s.created_at,
    s.user_id,
    s.organization_id,
    hu.name AS housing_unit_name,
    hu.type AS housing_unit_type,
    ( SELECT count(*) AS count
           FROM farrowings f
          WHERE f.sow_id = s.id AND f.organization_id = s.organization_id) AS farrowing_count,
    (EXISTS ( SELECT 1
           FROM farrowings f
          WHERE f.sow_id = s.id AND f.organization_id = s.organization_id AND f.actual_farrowing_date IS NOT NULL AND f.moved_out_of_farrowing_date IS NULL)) AS has_active_farrowing,
    ( SELECT f.actual_farrowing_date
           FROM farrowings f
          WHERE f.sow_id = s.id AND f.organization_id = s.organization_id AND f.actual_farrowing_date IS NOT NULL AND f.moved_out_of_farrowing_date IS NULL
          ORDER BY f.actual_farrowing_date DESC
         LIMIT 1) AS active_farrowing_date,
    ( SELECT ba.breeding_date
           FROM breeding_attempts ba
          WHERE ba.sow_id = s.id AND ba.organization_id = s.organization_id AND (ba.result::text = ANY (ARRAY['pending'::character varying, 'pregnant'::character varying]::text[]))
          ORDER BY ba.breeding_date DESC
         LIMIT 1) AS current_breeding_date,
    ( SELECT ba.pregnancy_confirmed
           FROM breeding_attempts ba
          WHERE ba.sow_id = s.id AND ba.organization_id = s.organization_id AND (ba.result::text = ANY (ARRAY['pending'::character varying, 'pregnant'::character varying]::text[]))
          ORDER BY ba.breeding_date DESC
         LIMIT 1) AS pregnancy_confirmed,
    ( SELECT ba.result
           FROM breeding_attempts ba
          WHERE ba.sow_id = s.id AND ba.organization_id = s.organization_id AND (ba.result::text = ANY (ARRAY['pending'::character varying, 'pregnant'::character varying]::text[]))
          ORDER BY ba.breeding_date DESC
         LIMIT 1) AS breeding_result,
    ( SELECT ba.pregnancy_check_date
           FROM breeding_attempts ba
          WHERE ba.sow_id = s.id AND ba.organization_id = s.organization_id AND (ba.result::text = ANY (ARRAY['pending'::character varying, 'pregnant'::character varying]::text[]))
          ORDER BY ba.breeding_date DESC
         LIMIT 1) AS pregnancy_check_date,
    ( SELECT ba.breeding_method
           FROM breeding_attempts ba
          WHERE ba.sow_id = s.id AND ba.organization_id = s.organization_id AND (ba.result::text = ANY (ARRAY['pending'::character varying, 'pregnant'::character varying]::text[]))
          ORDER BY ba.breeding_date DESC
         LIMIT 1) AS current_breeding_method,
    ( SELECT ba.id
           FROM breeding_attempts ba
          WHERE ba.sow_id = s.id AND ba.organization_id = s.organization_id AND (ba.result::text = ANY (ARRAY['pending'::character varying, 'pregnant'::character varying]::text[]))
          ORDER BY ba.breeding_date DESC
         LIMIT 1) AS current_breeding_attempt_id,
    ( SELECT ba.breeding_cycle_complete
           FROM breeding_attempts ba
          WHERE ba.sow_id = s.id AND ba.organization_id = s.organization_id AND (ba.result::text = ANY (ARRAY['pending'::character varying, 'pregnant'::character varying]::text[]))
          ORDER BY ba.breeding_date DESC
         LIMIT 1) AS breeding_cycle_complete
   FROM sows s
     LEFT JOIN housing_units hu ON s.housing_unit_id = hu.id;

-- ==================== TRIGGERS ====================
CREATE TRIGGER ai_doses_updated_at BEFORE UPDATE ON public.ai_doses FOR EACH ROW EXECUTE FUNCTION update_ai_doses_updated_at();
CREATE TRIGGER trg_adjust_straw_on_dose_delete AFTER DELETE ON public.ai_doses FOR EACH ROW EXECUTE FUNCTION adjust_semen_straw_on_dose();
CREATE TRIGGER trg_adjust_straw_on_dose_insert AFTER INSERT ON public.ai_doses FOR EACH ROW EXECUTE FUNCTION adjust_semen_straw_on_dose();
CREATE TRIGGER trigger_match_boar_transfer_email BEFORE INSERT ON public.boar_transfer_requests FOR EACH ROW EXECUTE FUNCTION match_boar_transfer_request_to_user();
CREATE TRIGGER boar_housing_change_trigger AFTER INSERT OR UPDATE OF housing_unit_id ON public.boars FOR EACH ROW EXECUTE FUNCTION track_boar_housing_changes();
CREATE TRIGGER update_boars_updated_at BEFORE UPDATE ON public.boars FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER on_breeding_created_send_notification AFTER INSERT ON public.breeding_attempts FOR EACH ROW EXECUTE FUNCTION send_breeding_notification();
CREATE TRIGGER on_breeding_with_check_date_schedule_reminder AFTER INSERT OR UPDATE OF pregnancy_check_date ON public.breeding_attempts FOR EACH ROW EXECUTE FUNCTION schedule_pregnancy_check_reminder();
CREATE TRIGGER update_breeding_attempts_updated_at BEFORE UPDATE ON public.breeding_attempts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cost_allocations_updated_at BEFORE UPDATE ON public.cost_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expense_records_updated_at BEFORE UPDATE ON public.expense_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER farm_settings_updated_at BEFORE UPDATE ON public.farm_settings FOR EACH ROW EXECUTE FUNCTION update_farm_settings_timestamp();
CREATE TRIGGER on_farrowing_created_schedule_reminders AFTER INSERT ON public.farrowings FOR EACH ROW EXECUTE FUNCTION schedule_farrowing_reminders();
CREATE TRIGGER set_expected_farrowing_date BEFORE INSERT ON public.farrowings FOR EACH ROW EXECUTE FUNCTION calculate_farrowing_date();
CREATE TRIGGER trg_reset_breeding_attempt_on_farrowing_delete AFTER DELETE ON public.farrowings FOR EACH ROW EXECUTE FUNCTION reset_breeding_attempt_on_farrowing_delete();
CREATE TRIGGER trigger_update_breeding_attempt_on_farrowing AFTER UPDATE ON public.farrowings FOR EACH ROW EXECUTE FUNCTION update_breeding_attempt_on_farrowing();
CREATE TRIGGER update_farrowings_updated_at BEFORE UPDATE ON public.farrowings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feed_records_updated_at BEFORE UPDATE ON public.feed_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER feedback_updated_at BEFORE UPDATE ON public.feedback FOR EACH ROW EXECUTE FUNCTION update_feedback_updated_at();
CREATE TRIGGER on_health_record_created_send_notification AFTER INSERT ON public.health_records FOR EACH ROW EXECUTE FUNCTION send_health_record_notification();
CREATE TRIGGER set_animal_type_trigger BEFORE INSERT OR UPDATE ON public.health_records FOR EACH ROW EXECUTE FUNCTION set_health_record_animal_type();
CREATE TRIGGER housing_units_updated_at BEFORE UPDATE ON public.housing_units FOR EACH ROW EXECUTE FUNCTION update_housing_unit_timestamp();
CREATE TRIGGER update_income_records_updated_at BEFORE UPDATE ON public.income_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER calculate_matrix_dates BEFORE INSERT OR UPDATE ON public.matrix_treatments FOR EACH ROW EXECUTE FUNCTION calculate_matrix_treatment_dates();
CREATE TRIGGER update_matrix_treatments_updated_at BEFORE UPDATE ON public.matrix_treatments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER on_piglet_weaned_send_notification AFTER UPDATE OF weaned_date ON public.piglets FOR EACH ROW EXECUTE FUNCTION send_weaning_notification();
CREATE TRIGGER piglet_housing_change_trigger AFTER INSERT OR UPDATE OF housing_unit_id ON public.piglets FOR EACH ROW EXECUTE FUNCTION track_piglet_housing_changes();
CREATE TRIGGER trigger_set_piglet_pedigree BEFORE INSERT ON public.piglets FOR EACH ROW EXECUTE FUNCTION set_piglet_pedigree();
CREATE TRIGGER update_piglets_updated_at BEFORE UPDATE ON public.piglets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER on_task_created_send_reminder AFTER INSERT ON public.scheduled_tasks FOR EACH ROW EXECUTE FUNCTION send_task_due_notification();
CREATE TRIGGER trigger_match_transfer_email BEFORE INSERT ON public.sow_transfer_requests FOR EACH ROW EXECUTE FUNCTION match_transfer_request_to_user();
CREATE TRIGGER sow_location_change_trigger AFTER UPDATE OF housing_unit_id ON public.sows FOR EACH ROW EXECUTE FUNCTION log_sow_location_change();
CREATE TRIGGER update_sows_updated_at BEFORE UPDATE ON public.sows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vaccinations_updated_at BEFORE UPDATE ON public.vaccinations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== ROW LEVEL SECURITY ====================
ALTER TABLE public."ai_doses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."boar_location_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."boar_transfer_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."boars" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."breeding_attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."budgets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."calendar_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."certifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."confinement_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."cost_allocations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."expense_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."farm_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."farrowings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."feed_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."health_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."housing_units" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."income_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."location_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."matrix_treatments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."notification_preferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."organization_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."piglet_location_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."piglets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."protocol_tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."protocols" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."reminders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."scheduled_notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."scheduled_tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."sow_location_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."sow_temporary_confinement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."sow_transfer_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."sows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."team_invites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."vaccinations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can delete ai_doses in their organizations" ON public."ai_doses" FOR DELETE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can delete their own AI doses" ON public."ai_doses" FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own AI doses" ON public."ai_doses" FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own ai_doses" ON public."ai_doses" FOR INSERT TO public
  WITH CHECK (((user_id = auth.uid()) AND (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can update ai_doses in their organizations" ON public."ai_doses" FOR UPDATE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))))
  WITH CHECK (((user_id = auth.uid()) AND (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can update their own AI doses" ON public."ai_doses" FOR UPDATE TO public
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view ai_doses in their organizations" ON public."ai_doses" FOR SELECT TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can view their own AI doses" ON public."ai_doses" FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete location history for their boars" ON public."boar_location_history" FOR DELETE TO public
  USING ((boar_id IN ( SELECT boars.id
   FROM boars
  WHERE ((boars.user_id = auth.uid()) OR (boars.organization_id IN ( SELECT organization_members.organization_id
           FROM organization_members
          WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))))));
CREATE POLICY "Users can insert location history for their boars" ON public."boar_location_history" FOR INSERT TO public
  WITH CHECK ((boar_id IN ( SELECT boars.id
   FROM boars
  WHERE (boars.user_id = auth.uid()))));
CREATE POLICY "Users can update location history for their boars" ON public."boar_location_history" FOR UPDATE TO public
  USING ((boar_id IN ( SELECT boars.id
   FROM boars
  WHERE ((boars.user_id = auth.uid()) OR (boars.organization_id IN ( SELECT organization_members.organization_id
           FROM organization_members
          WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))))))
  WITH CHECK ((boar_id IN ( SELECT boars.id
   FROM boars
  WHERE (boars.user_id = auth.uid()))));
CREATE POLICY "Users can view location history for their boars" ON public."boar_location_history" FOR SELECT TO public
  USING ((boar_id IN ( SELECT boars.id
   FROM boars
  WHERE ((boars.user_id = auth.uid()) OR (boars.organization_id IN ( SELECT organization_members.organization_id
           FROM organization_members
          WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))))));
CREATE POLICY "boar_location_history_delete" ON public."boar_location_history" FOR DELETE TO public
  USING ((boar_id IN ( SELECT boars.id
   FROM boars
  WHERE (boars.user_id = auth.uid()))));
CREATE POLICY "boar_location_history_insert" ON public."boar_location_history" FOR INSERT TO public
  WITH CHECK ((boar_id IN ( SELECT boars.id
   FROM boars
  WHERE (boars.user_id = auth.uid()))));
CREATE POLICY "boar_location_history_select" ON public."boar_location_history" FOR SELECT TO public
  USING ((boar_id IN ( SELECT boars.id
   FROM boars
  WHERE (boars.user_id = auth.uid()))));
CREATE POLICY "boar_location_history_update" ON public."boar_location_history" FOR UPDATE TO public
  USING ((boar_id IN ( SELECT boars.id
   FROM boars
  WHERE (boars.user_id = auth.uid()))));
CREATE POLICY "Recipient can respond to boar requests" ON public."boar_transfer_requests" FOR UPDATE TO public
  USING ((((auth.uid() = to_user_id) OR ((to_user_email)::text = auth.email())) AND ((status)::text = 'pending'::text)))
  WITH CHECK (((status)::text = ANY ((ARRAY['accepted'::character varying, 'declined'::character varying])::text[])));
CREATE POLICY "Users can cancel their pending boar requests" ON public."boar_transfer_requests" FOR UPDATE TO public
  USING (((auth.uid() = from_user_id) AND ((status)::text = 'pending'::text)))
  WITH CHECK (((status)::text = 'cancelled'::text));
CREATE POLICY "Users can create boar transfer requests for their boars" ON public."boar_transfer_requests" FOR INSERT TO public
  WITH CHECK (((auth.uid() = from_user_id) AND (EXISTS ( SELECT 1
   FROM boars
  WHERE ((boars.id = boar_transfer_requests.boar_id) AND (boars.user_id = auth.uid()))))));
CREATE POLICY "Users can delete boar transfer requests from their organization" ON public."boar_transfer_requests" FOR DELETE TO public
  USING ((from_organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can insert boar transfer requests from their organization" ON public."boar_transfer_requests" FOR INSERT TO public
  WITH CHECK ((from_organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can update boar transfer requests for their organizations" ON public."boar_transfer_requests" FOR UPDATE TO public
  USING (((from_organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))) OR (to_organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can view boar transfer requests for their organizations" ON public."boar_transfer_requests" FOR SELECT TO public
  USING (((from_organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))) OR (to_organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can view boar transfer requests sent to them" ON public."boar_transfer_requests" FOR SELECT TO public
  USING (((auth.uid() = to_user_id) OR ((to_user_email)::text = auth.email())));
CREATE POLICY "Users can view their sent boar transfer requests" ON public."boar_transfer_requests" FOR SELECT TO public
  USING ((auth.uid() = from_user_id));
CREATE POLICY "Users can delete boars in their organizations" ON public."boars" FOR DELETE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can insert their own boars" ON public."boars" FOR INSERT TO public
  WITH CHECK (((user_id = auth.uid()) AND (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can update boars in their organizations" ON public."boars" FOR UPDATE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))))
  WITH CHECK (((user_id = auth.uid()) AND (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can view boars in their organizations" ON public."boars" FOR SELECT TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can create breeding attempts" ON public."breeding_attempts" FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete breeding attempts in their organizations" ON public."breeding_attempts" FOR DELETE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can delete their own breeding attempts" ON public."breeding_attempts" FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own breeding attempts" ON public."breeding_attempts" FOR INSERT TO public
  WITH CHECK (((user_id = auth.uid()) AND (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can update breeding attempts in their organizations" ON public."breeding_attempts" FOR UPDATE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))))
  WITH CHECK (((user_id = auth.uid()) AND (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can update their own breeding attempts" ON public."breeding_attempts" FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view breeding attempts in their organizations" ON public."breeding_attempts" FOR SELECT TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can view their own breeding attempts" ON public."breeding_attempts" FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete organization budgets" ON public."budgets" FOR DELETE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can insert organization budgets" ON public."budgets" FOR INSERT TO public
  WITH CHECK (((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))) AND (user_id = auth.uid())));
CREATE POLICY "Users can update organization budgets" ON public."budgets" FOR UPDATE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can view organization budgets" ON public."budgets" FOR SELECT TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can delete calendar events in their organizations" ON public."calendar_events" FOR DELETE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can insert their own calendar events" ON public."calendar_events" FOR INSERT TO public
  WITH CHECK (((user_id = auth.uid()) AND (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can update calendar events in their organizations" ON public."calendar_events" FOR UPDATE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))))
  WITH CHECK (((user_id = auth.uid()) AND (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can view calendar events in their organizations" ON public."calendar_events" FOR SELECT TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "calendar_events_delete_policy" ON public."calendar_events" FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "calendar_events_insert_policy" ON public."calendar_events" FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "calendar_events_select_policy" ON public."calendar_events" FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "calendar_events_update_policy" ON public."calendar_events" FOR UPDATE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their own certifications" ON public."certifications" FOR ALL TO public
  USING ((user_id = auth.uid()));
CREATE POLICY "Users can manage their own confinement events" ON public."confinement_events" FOR ALL TO public
  USING ((user_id = auth.uid()));
CREATE POLICY "Users can delete organization cost allocations" ON public."cost_allocations" FOR DELETE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can insert organization cost allocations" ON public."cost_allocations" FOR INSERT TO public
  WITH CHECK (((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))) AND (user_id = auth.uid())));
CREATE POLICY "Users can update organization cost allocations" ON public."cost_allocations" FOR UPDATE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can view organization cost allocations" ON public."cost_allocations" FOR SELECT TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can delete organization expense records" ON public."expense_records" FOR DELETE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can insert organization expense records" ON public."expense_records" FOR INSERT TO public
  WITH CHECK (((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))) AND (user_id = auth.uid())));
CREATE POLICY "Users can update organization expense records" ON public."expense_records" FOR UPDATE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can view organization expense records" ON public."expense_records" FOR SELECT TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can delete farm settings in their organizations" ON public."farm_settings" FOR DELETE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can delete own settings" ON public."farm_settings" FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert own settings" ON public."farm_settings" FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own farm settings" ON public."farm_settings" FOR INSERT TO public
  WITH CHECK (((user_id = auth.uid()) AND (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can update farm settings in their organizations" ON public."farm_settings" FOR UPDATE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))))
  WITH CHECK (((user_id = auth.uid()) AND (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can update own settings" ON public."farm_settings" FOR UPDATE TO public
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view farm settings in their organizations" ON public."farm_settings" FOR SELECT TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can view own settings" ON public."farm_settings" FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete farrowings in their organizations" ON public."farrowings" FOR DELETE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can insert their own farrowings" ON public."farrowings" FOR INSERT TO public
  WITH CHECK (((user_id = auth.uid()) AND (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can update farrowings in their organizations" ON public."farrowings" FOR UPDATE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))))
  WITH CHECK (((user_id = auth.uid()) AND (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can view farrowings in their organizations" ON public."farrowings" FOR SELECT TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can delete organization feed records" ON public."feed_records" FOR DELETE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can insert organization feed records" ON public."feed_records" FOR INSERT TO public
  WITH CHECK (((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))) AND (user_id = auth.uid())));
CREATE POLICY "Users can update organization feed records" ON public."feed_records" FOR UPDATE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can view organization feed records" ON public."feed_records" FOR SELECT TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Admin can delete feedback" ON public."feedback" FOR DELETE TO public
  USING (is_admin());
CREATE POLICY "Users and admin can update feedback" ON public."feedback" FOR UPDATE TO public
  USING ((((user_id = auth.uid()) AND (status = 'open'::text)) OR is_admin()))
  WITH CHECK ((((user_id = auth.uid()) AND (status = 'open'::text)) OR is_admin()));
CREATE POLICY "Users and admin can view feedback" ON public."feedback" FOR SELECT TO public
  USING (((user_id = auth.uid()) OR is_admin()));
CREATE POLICY "Users can submit feedback" ON public."feedback" FOR INSERT TO public
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can delete health records in their organizations" ON public."health_records" FOR DELETE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can insert their own health records" ON public."health_records" FOR INSERT TO public
  WITH CHECK (((user_id = auth.uid()) AND (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can update health records in their organizations" ON public."health_records" FOR UPDATE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))))
  WITH CHECK (((user_id = auth.uid()) AND (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can view health records in their organizations" ON public."health_records" FOR SELECT TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can delete housing units in their organizations" ON public."housing_units" FOR DELETE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can insert their own housing units" ON public."housing_units" FOR INSERT TO public
  WITH CHECK (((user_id = auth.uid()) AND (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can update housing units in their organizations" ON public."housing_units" FOR UPDATE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))))
  WITH CHECK (((user_id = auth.uid()) AND (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can view housing units in their organizations" ON public."housing_units" FOR SELECT TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can delete organization income records" ON public."income_records" FOR DELETE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can insert organization income records" ON public."income_records" FOR INSERT TO public
  WITH CHECK (((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))) AND (user_id = auth.uid())));
CREATE POLICY "Users can update organization income records" ON public."income_records" FOR UPDATE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can view organization income records" ON public."income_records" FOR SELECT TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can manage their own location history" ON public."location_history" FOR ALL TO public
  USING ((user_id = auth.uid()));
CREATE POLICY "Users can delete matrix treatments in their organizations" ON public."matrix_treatments" FOR DELETE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can insert their own matrix treatments" ON public."matrix_treatments" FOR INSERT TO public
  WITH CHECK (((user_id = auth.uid()) AND (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can update matrix treatments in their organizations" ON public."matrix_treatments" FOR UPDATE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))))
  WITH CHECK (((user_id = auth.uid()) AND (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can view matrix treatments in their organizations" ON public."matrix_treatments" FOR SELECT TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can insert their own notification preferences" ON public."notification_preferences" FOR INSERT TO public
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can manage their own notification preferences" ON public."notification_preferences" FOR ALL TO public
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can update their own notification preferences" ON public."notification_preferences" FOR UPDATE TO public
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can view their own notification preferences" ON public."notification_preferences" FOR SELECT TO public
  USING ((user_id = auth.uid()));
CREATE POLICY "insert_for_trigger" ON public."notification_preferences" FOR INSERT TO public
  WITH CHECK (true);
CREATE POLICY "System can insert notifications for users in organizations" ON public."notifications" FOR INSERT TO public
  WITH CHECK (((user_id = auth.uid()) AND ((organization_id IS NULL) OR user_in_organization(organization_id))));
CREATE POLICY "Users can update their own notifications in their organizations" ON public."notifications" FOR UPDATE TO public
  USING (((user_id = auth.uid()) AND ((organization_id IS NULL) OR user_in_organization(organization_id))))
  WITH CHECK (((user_id = auth.uid()) AND ((organization_id IS NULL) OR user_in_organization(organization_id))));
CREATE POLICY "Users can view notifications in their organizations" ON public."notifications" FOR SELECT TO public
  USING (((user_id = auth.uid()) AND ((organization_id IS NULL) OR user_in_organization(organization_id))));
CREATE POLICY "Owners and managers can add members" ON public."organization_members" FOR INSERT TO public
  WITH CHECK (has_organization_role(organization_id, auth.uid(), ARRAY['owner'::text, 'manager'::text]));
CREATE POLICY "Owners can remove members" ON public."organization_members" FOR DELETE TO public
  USING (has_organization_role(organization_id, auth.uid(), ARRAY['owner'::text]));
CREATE POLICY "Owners can update members" ON public."organization_members" FOR UPDATE TO public
  USING (has_organization_role(organization_id, auth.uid(), ARRAY['owner'::text]))
  WITH CHECK (has_organization_role(organization_id, auth.uid(), ARRAY['owner'::text]));
CREATE POLICY "Users can view organization members" ON public."organization_members" FOR SELECT TO public
  USING (((user_id = auth.uid()) OR is_organization_member(organization_id, auth.uid())));
CREATE POLICY "Owners can delete organizations" ON public."organizations" FOR DELETE TO public
  USING ((id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND ((organization_members.role)::text = 'owner'::text) AND (organization_members.is_active = true)))));
CREATE POLICY "Owners can update organizations" ON public."organizations" FOR UPDATE TO public
  USING ((id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND ((organization_members.role)::text = 'owner'::text) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can view their organizations" ON public."organizations" FOR SELECT TO public
  USING ((id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "piglet_location_history_delete" ON public."piglet_location_history" FOR DELETE TO public
  USING ((piglet_id IN ( SELECT p.id
   FROM ((piglets p
     JOIN farrowings f ON ((p.farrowing_id = f.id)))
     JOIN sows s ON ((f.sow_id = s.id)))
  WHERE (s.user_id = auth.uid()))));
CREATE POLICY "piglet_location_history_insert" ON public."piglet_location_history" FOR INSERT TO public
  WITH CHECK ((piglet_id IN ( SELECT p.id
   FROM ((piglets p
     JOIN farrowings f ON ((p.farrowing_id = f.id)))
     JOIN sows s ON ((f.sow_id = s.id)))
  WHERE (s.user_id = auth.uid()))));
CREATE POLICY "piglet_location_history_select" ON public."piglet_location_history" FOR SELECT TO public
  USING ((piglet_id IN ( SELECT p.id
   FROM ((piglets p
     JOIN farrowings f ON ((p.farrowing_id = f.id)))
     JOIN sows s ON ((f.sow_id = s.id)))
  WHERE (s.user_id = auth.uid()))));
CREATE POLICY "piglet_location_history_update" ON public."piglet_location_history" FOR UPDATE TO public
  USING ((piglet_id IN ( SELECT p.id
   FROM ((piglets p
     JOIN farrowings f ON ((p.farrowing_id = f.id)))
     JOIN sows s ON ((f.sow_id = s.id)))
  WHERE (s.user_id = auth.uid()))));
CREATE POLICY "Users can delete piglets in their organizations" ON public."piglets" FOR DELETE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can insert their own piglets" ON public."piglets" FOR INSERT TO public
  WITH CHECK (((user_id = auth.uid()) AND (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can update piglets in their organizations" ON public."piglets" FOR UPDATE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))))
  WITH CHECK (((user_id = auth.uid()) AND (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can view piglets in their organizations" ON public."piglets" FOR SELECT TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can delete protocol tasks from their protocols" ON public."protocol_tasks" FOR DELETE TO public
  USING ((protocol_id IN ( SELECT protocols.id
   FROM protocols
  WHERE ((protocols.user_id = auth.uid()) OR (protocols.organization_id IN ( SELECT organization_members.organization_id
           FROM organization_members
          WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))))));
CREATE POLICY "Users can insert protocol tasks to their protocols" ON public."protocol_tasks" FOR INSERT TO public
  WITH CHECK ((protocol_id IN ( SELECT protocols.id
   FROM protocols
  WHERE ((protocols.user_id = auth.uid()) OR (protocols.organization_id IN ( SELECT organization_members.organization_id
           FROM organization_members
          WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))))));
CREATE POLICY "Users can update protocol tasks from their protocols" ON public."protocol_tasks" FOR UPDATE TO public
  USING ((protocol_id IN ( SELECT protocols.id
   FROM protocols
  WHERE ((protocols.user_id = auth.uid()) OR (protocols.organization_id IN ( SELECT organization_members.organization_id
           FROM organization_members
          WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))))))
  WITH CHECK ((protocol_id IN ( SELECT protocols.id
   FROM protocols
  WHERE ((protocols.user_id = auth.uid()) OR (protocols.organization_id IN ( SELECT organization_members.organization_id
           FROM organization_members
          WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))))));
CREATE POLICY "Users can view own and system protocol tasks" ON public."protocol_tasks" FOR SELECT TO public
  USING (((user_id IS NULL) OR (auth.uid() = user_id) OR (protocol_id IN ( SELECT protocols.id
   FROM protocols
  WHERE ((protocols.user_id IS NULL) OR (auth.uid() = protocols.user_id))))));
CREATE POLICY "Users can view protocol tasks from their protocols" ON public."protocol_tasks" FOR SELECT TO public
  USING ((protocol_id IN ( SELECT protocols.id
   FROM protocols
  WHERE ((protocols.user_id = auth.uid()) OR (protocols.organization_id IN ( SELECT organization_members.organization_id
           FROM organization_members
          WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))))));
CREATE POLICY "Users can delete own protocols" ON public."protocols" FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own protocols" ON public."protocols" FOR DELETE TO public
  USING (((user_id = auth.uid()) OR (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can insert own protocols" ON public."protocols" FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own protocols" ON public."protocols" FOR INSERT TO public
  WITH CHECK (((user_id = auth.uid()) OR (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can update own protocols" ON public."protocols" FOR UPDATE TO public
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own protocols" ON public."protocols" FOR UPDATE TO public
  USING (((user_id = auth.uid()) OR (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))))
  WITH CHECK (((user_id = auth.uid()) OR (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can view own and system protocols" ON public."protocols" FOR SELECT TO public
  USING (((user_id IS NULL) OR (auth.uid() = user_id)));
CREATE POLICY "Users can view their own protocols" ON public."protocols" FOR SELECT TO public
  USING (((user_id = auth.uid()) OR (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Authenticated users can delete reminders" ON public."reminders" FOR DELETE TO public
  USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Authenticated users can insert reminders" ON public."reminders" FOR INSERT TO public
  WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY "Authenticated users can read reminders" ON public."reminders" FOR SELECT TO public
  USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Authenticated users can update reminders" ON public."reminders" FOR UPDATE TO public
  USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Users can delete their own reminders" ON public."reminders" FOR DELETE TO public
  USING (((user_id = auth.uid()) OR (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can insert their own reminders" ON public."reminders" FOR INSERT TO public
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can update their own reminders" ON public."reminders" FOR UPDATE TO public
  USING (((user_id = auth.uid()) OR (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))))
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can view their own reminders" ON public."reminders" FOR SELECT TO public
  USING (((user_id = auth.uid()) OR (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "System can insert scheduled notifications for users in organiza" ON public."scheduled_notifications" FOR INSERT TO public
  WITH CHECK (((user_id = auth.uid()) AND ((organization_id IS NULL) OR user_in_organization(organization_id))));
CREATE POLICY "System can update scheduled notifications in organizations" ON public."scheduled_notifications" FOR UPDATE TO public
  USING (((user_id = auth.uid()) AND ((organization_id IS NULL) OR user_in_organization(organization_id))))
  WITH CHECK (((user_id = auth.uid()) AND ((organization_id IS NULL) OR user_in_organization(organization_id))));
CREATE POLICY "Users can view scheduled notifications in their organizations" ON public."scheduled_notifications" FOR SELECT TO public
  USING (((user_id = auth.uid()) AND ((organization_id IS NULL) OR user_in_organization(organization_id))));
CREATE POLICY "Users can delete own tasks" ON public."scheduled_tasks" FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own scheduled tasks" ON public."scheduled_tasks" FOR DELETE TO public
  USING (((user_id = auth.uid()) OR (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can insert own tasks" ON public."scheduled_tasks" FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own scheduled tasks" ON public."scheduled_tasks" FOR INSERT TO public
  WITH CHECK (((user_id = auth.uid()) OR (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can update own tasks" ON public."scheduled_tasks" FOR UPDATE TO public
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own scheduled tasks" ON public."scheduled_tasks" FOR UPDATE TO public
  USING (((user_id = auth.uid()) OR (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))))
  WITH CHECK (((user_id = auth.uid()) OR (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can view own tasks" ON public."scheduled_tasks" FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own scheduled tasks" ON public."scheduled_tasks" FOR SELECT TO public
  USING (((user_id = auth.uid()) OR (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can delete location history for their sows" ON public."sow_location_history" FOR DELETE TO public
  USING ((sow_id IN ( SELECT sows.id
   FROM sows
  WHERE ((sows.user_id = auth.uid()) OR (sows.organization_id IN ( SELECT organization_members.organization_id
           FROM organization_members
          WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))))));
CREATE POLICY "Users can delete own location history" ON public."sow_location_history" FOR DELETE TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert location history for their sows" ON public."sow_location_history" FOR INSERT TO public
  WITH CHECK ((sow_id IN ( SELECT sows.id
   FROM sows
  WHERE (sows.user_id = auth.uid()))));
CREATE POLICY "Users can insert own location history" ON public."sow_location_history" FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update location history for their sows" ON public."sow_location_history" FOR UPDATE TO public
  USING ((sow_id IN ( SELECT sows.id
   FROM sows
  WHERE ((sows.user_id = auth.uid()) OR (sows.organization_id IN ( SELECT organization_members.organization_id
           FROM organization_members
          WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))))))
  WITH CHECK ((sow_id IN ( SELECT sows.id
   FROM sows
  WHERE (sows.user_id = auth.uid()))));
CREATE POLICY "Users can update own location history" ON public."sow_location_history" FOR UPDATE TO public
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view location history for their sows" ON public."sow_location_history" FOR SELECT TO public
  USING ((sow_id IN ( SELECT sows.id
   FROM sows
  WHERE ((sows.user_id = auth.uid()) OR (sows.organization_id IN ( SELECT organization_members.organization_id
           FROM organization_members
          WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))))));
CREATE POLICY "Users can view own location history" ON public."sow_location_history" FOR SELECT TO public
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their own temporary confinement" ON public."sow_temporary_confinement" FOR ALL TO public
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Recipient can respond to requests" ON public."sow_transfer_requests" FOR UPDATE TO public
  USING ((((auth.uid() = to_user_id) OR ((to_user_email)::text = auth.email())) AND ((status)::text = 'pending'::text)))
  WITH CHECK (((status)::text = ANY ((ARRAY['accepted'::character varying, 'declined'::character varying])::text[])));
CREATE POLICY "Users can cancel their pending requests" ON public."sow_transfer_requests" FOR UPDATE TO public
  USING (((auth.uid() = from_user_id) AND ((status)::text = 'pending'::text)))
  WITH CHECK (((status)::text = 'cancelled'::text));
CREATE POLICY "Users can create transfer requests for their sows" ON public."sow_transfer_requests" FOR INSERT TO public
  WITH CHECK (((auth.uid() = from_user_id) AND (EXISTS ( SELECT 1
   FROM sows
  WHERE ((sows.id = sow_transfer_requests.sow_id) AND (sows.user_id = auth.uid()))))));
CREATE POLICY "Users can delete sow transfer requests from their organizations" ON public."sow_transfer_requests" FOR DELETE TO public
  USING ((from_organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can insert sow transfer requests from their organizations" ON public."sow_transfer_requests" FOR INSERT TO public
  WITH CHECK ((from_organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can update sow transfer requests for their organizations" ON public."sow_transfer_requests" FOR UPDATE TO public
  USING (((from_organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))) OR (to_organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can view sow transfer requests for their organizations" ON public."sow_transfer_requests" FOR SELECT TO public
  USING (((from_organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))) OR (to_organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can view their sent transfer requests" ON public."sow_transfer_requests" FOR SELECT TO public
  USING ((auth.uid() = from_user_id));
CREATE POLICY "Users can view transfer requests sent to them" ON public."sow_transfer_requests" FOR SELECT TO public
  USING (((auth.uid() = to_user_id) OR ((to_user_email)::text = auth.email())));
CREATE POLICY "Users can delete sows in their organizations" ON public."sows" FOR DELETE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can insert their own sows" ON public."sows" FOR INSERT TO public
  WITH CHECK (((user_id = auth.uid()) AND (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can update sows in their organizations" ON public."sows" FOR UPDATE TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))))
  WITH CHECK (((user_id = auth.uid()) AND (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can view sows in their organizations" ON public."sows" FOR SELECT TO public
  USING ((organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true)))));
CREATE POLICY "Managers can create invites" ON public."team_invites" FOR INSERT TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM organization_members
  WHERE ((organization_members.organization_id = team_invites.organization_id) AND (organization_members.user_id = auth.uid()) AND ((organization_members.role)::text = ANY ((ARRAY['owner'::character varying, 'manager'::character varying])::text[])) AND (organization_members.is_active = true)))));
CREATE POLICY "Users can accept invites" ON public."team_invites" FOR UPDATE TO public
  USING ((email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text))
  WITH CHECK ((email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text));
CREATE POLICY "Users can view invites to their email" ON public."team_invites" FOR SELECT TO public
  USING ((email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text));
CREATE POLICY "Users can view their sent invites" ON public."team_invites" FOR SELECT TO public
  USING ((invited_by = auth.uid()));
CREATE POLICY "Users can manage their own transactions" ON public."transactions" FOR ALL TO public
  USING ((user_id = auth.uid()));
CREATE POLICY "Authenticated users can delete vaccinations" ON public."vaccinations" FOR DELETE TO public
  USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Authenticated users can insert vaccinations" ON public."vaccinations" FOR INSERT TO public
  WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY "Authenticated users can read vaccinations" ON public."vaccinations" FOR SELECT TO public
  USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Authenticated users can update vaccinations" ON public."vaccinations" FOR UPDATE TO public
  USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Users can delete their own vaccinations" ON public."vaccinations" FOR DELETE TO public
  USING (((user_id = auth.uid()) OR (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
CREATE POLICY "Users can insert their own vaccinations" ON public."vaccinations" FOR INSERT TO public
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can update their own vaccinations" ON public."vaccinations" FOR UPDATE TO public
  USING (((user_id = auth.uid()) OR (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))))
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can view their own vaccinations" ON public."vaccinations" FOR SELECT TO public
  USING (((user_id = auth.uid()) OR (organization_id IN ( SELECT organization_members.organization_id
   FROM organization_members
  WHERE ((organization_members.user_id = auth.uid()) AND (organization_members.is_active = true))))));
