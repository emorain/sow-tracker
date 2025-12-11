// lib/types.ts — Pig-proof types
export interface Sow {
  id: string;
  ear_tag: string;
  breed: string;
  status: 'active' | 'pregnant' | 'dry' | 'retired';
  created_at: string; // ISO timestamp
}

export interface Farrowing {
  id: string;
  sow_id: string;
  expected_date: string;
  actual_date?: string;
  litter_size: number;
}

export interface Piglet {
  id: string;
  farrowing_id: string;
  ear_tag: string;
  birth_weight: number;
  sex: 'male' | 'female' | 'unknown';
}

// Use in queries: supabase.from('sows').select('*').returns<Sow[]>()