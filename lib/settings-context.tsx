'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useOrganization } from '@/lib/organization-context';

type FarmSettings = {
  id?: string;
  farm_name: string;
  logo_url?: string | null;
  farm_map_url?: string | null;
  prop12_compliance_enabled: boolean;
  feature_finances: boolean;
  feature_transfers: boolean;
  timezone: string;
  weight_unit: 'kg' | 'lbs';
  measurement_unit: 'feet' | 'meters';
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
  farm_map_url: null,
  prop12_compliance_enabled: false,
  feature_finances: false,
  feature_transfers: false,
  timezone: 'America/Los_Angeles',
  weight_unit: 'kg',
  measurement_unit: 'feet',
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
  const { selectedOrganizationId } = useOrganization();
  const [settings, setSettings] = useState<FarmSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Settings are per-FARM (name, logo, feature flags, ear-notch counter), so they
  // are keyed by the selected organization — a user who belongs to several farms
  // sees each farm's own settings, and record-keeping (ear-notch counter) matches
  // the record_litter RPC which is org-scoped too.
  const fetchSettings = async () => {
    if (!user || !selectedOrganizationId) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('farm_settings')
        .select('*')
        .eq('organization_id', selectedOrganizationId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data as FarmSettings);
      } else {
        // Create default settings for this farm if none exist
        const { data: newSettings, error: insertError } = await supabase
          .from('farm_settings')
          .insert({
            user_id: user.id,
            organization_id: selectedOrganizationId,
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
  }, [user, selectedOrganizationId]);

  const updateSettings = async (updates: Partial<FarmSettings>) => {
    if (!user || !settings || !selectedOrganizationId) return;

    try {
      const { error } = await supabase
        .from('farm_settings')
        .update(updates)
        .eq('organization_id', selectedOrganizationId);

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
