import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }
});

// Database types will be generated from your Supabase schema
export type Database = {
  public: {
    Tables: {
      sows: {
        Row: {
          id: string;
          ear_tag: string;
          name: string | null;
          birth_date: string;
          breed: string;
          status: 'active' | 'culled' | 'sold';
          notes: string | null;
          right_ear_notch: number | null;
          left_ear_notch: number | null;
          registration_number: string | null;
          photo_url: string | null;
          registration_document_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['sows']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['sows']['Insert']>;
      };
      farrowings: {
        Row: {
          id: string;
          sow_id: string;
          breeding_date: string;
          expected_farrowing_date: string;
          actual_farrowing_date: string | null;
          live_piglets: number | null;
          stillborn: number | null;
          mummified: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['farrowings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['farrowings']['Insert']>;
      };
      piglets: {
        Row: {
          id: string;
          farrowing_id: string;
          birth_weight: number | null;
          status: 'alive' | 'died' | 'weaned' | 'sold';
          died_date: string | null;
          weaned_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['piglets']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['piglets']['Insert']>;
      };
      vaccinations: {
        Row: {
          id: string;
          sow_id: string | null;
          piglet_id: string | null;
          vaccine_type: string;
          date_given: string;
          next_due_date: string | null;
          batch_number: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['vaccinations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['vaccinations']['Insert']>;
      };
      reminders: {
        Row: {
          id: string;
          type: 'breeding' | 'farrowing' | 'vaccination' | 'weaning' | 'custom';
          title: string;
          due_date: string;
          sow_id: string | null;
          completed: boolean;
          completed_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reminders']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['reminders']['Insert']>;
      };
    };
  };
};
