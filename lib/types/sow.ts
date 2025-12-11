// lib/types/sow.ts
export type SowStatus = 'active' | 'culled' | 'sold';

export type BreedingStatus = {
  is_bred: boolean;
  breeding_date: string | null;
  days_since_breeding: number | null;
  status_label: string | null;
  pregnancy_confirmed: boolean;
  needs_pregnancy_check: boolean;
};

export type HousingUnit = {
  name: string;
  type: string;
};

export interface Sow {
  id: string;
  ear_tag: string;
  name: string | null;
  birth_date: string;
  breed: string;
  status: SowStatus;
  photo_url: string | null;
  right_ear_notch: number | null;
  left_ear_notch: number | null;
  registration_number: string | null;
  notes: string | null;
  current_location: string | null;
  housing_unit_id: string | null;
  sire_id: string | null;
  dam_id: string | null;
  sire_name: string | null;
  dam_name: string | null;
  created_at: string;
  housing_unit?: HousingUnit | null;
  housing_move_in_date?: string | null;
  breeding_status?: BreedingStatus;
  current_breeding_method?: 'natural' | 'ai' | null;
  current_breeding_attempt_id?: string | null;
  current_boar_id?: string | null;
  breeding_cycle_complete?: boolean;
}