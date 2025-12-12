'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

type FarmSettings = {
  id?: string;
  farm_name: string;
  logo_url?: string | null;
  prop12_compliance_enabled: boolean;
  timezone: string;
  weight_unit: 'kg' | 'lbs';
  measurement_unit: 'feet' | 'meters';
  email_notifications_enabled: boolean;
  task_reminders_enabled: boolean;
  ear_notch_current_litter?: number;
  ear_notch_last_reset_date?: string | null;
};

type SettingsContextType = {
  settings: FarmSettings | null;
  loading: boolean;
  updateSettings: (updates: Partial<FarmSettings>) => Promise<void>;
  refetchSettings: () => Promise<void>;
};

const defaultSettings: FarmSettings = {
  farm_name: 'My Farm',
  logo_url: null,
  prop12_compliance_enabled: false,
  timezone: 'America/Los_Angeles',
  weight_unit: 'kg',
  measurement_unit: 'feet',
  email_notifications_enabled: true,
  task_reminders_enabled: true,
  ear_notch_current_litter: 1,
  ear_notch_last_reset_date: null,
};

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  loading: true,
  updateSettings: async () => {},
  refetchSettings: async () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<FarmSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('farm_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data as FarmSettings);
      } else {
        // Create default settings if none exist
        const { data: newSettings, error: insertError } = await supabase
          .from('farm_settings')
          .insert({
            user_id: user.id,
            ...defaultSettings,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newSettings as FarmSettings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      // Use default settings on error
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);

  const updateSettings = async (updates: Partial<FarmSettings>) => {
    if (!user || !settings) return;

    try {
      const { error } = await supabase
        .from('farm_settings')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setSettings({ ...settings, ...updates });
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  };

  const refetchSettings = async () => {
    setLoading(true);
    await fetchSettings();
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings, refetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
