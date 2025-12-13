'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

type Organization = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
};

type OrganizationMembership = {
  organization_id: string;
  role: 'owner' | 'manager' | 'member' | 'vet' | 'readonly';
  organization: Organization;
};

type OrganizationContextType = {
  selectedOrganization: Organization | null;
  selectedOrganizationId: string | null;
  userMemberships: OrganizationMembership[];
  userRole: string | null;
  loading: boolean;
  switchOrganization: (organizationId: string) => void;
  refetchMemberships: () => Promise<void>;
};

const OrganizationContext = createContext<OrganizationContextType>({
  selectedOrganization: null,
  selectedOrganizationId: null,
  userMemberships: [],
  userRole: null,
  loading: true,
  switchOrganization: () => {},
  refetchMemberships: async () => {},
});

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [userMemberships, setUserMemberships] = useState<OrganizationMembership[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMemberships = async () => {
    if (!user) {
      setSelectedOrganization(null);
      setSelectedOrganizationId(null);
      setUserMemberships([]);
      setUserRole(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get all user's organization memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('organization_members')
        .select(`
          organization_id,
          role,
          organizations (
            id,
            name,
            slug,
            logo_url,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (membershipError) {
        console.error('Membership error:', membershipError);
        throw membershipError;
      }

      if (!memberships || memberships.length === 0) {
        console.warn('User has no organization memberships');
        setUserMemberships([]);
        setSelectedOrganization(null);
        setSelectedOrganizationId(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      // Transform the data
      const userOrgs: OrganizationMembership[] = memberships.map((m: any) => ({
        organization_id: m.organization_id,
        role: m.role,
        organization: m.organizations
      }));

      setUserMemberships(userOrgs);

      // Get the currently selected org from localStorage or default to first
      const savedOrgId = localStorage.getItem('selectedOrganizationId');
      const targetOrgId = savedOrgId && userOrgs.find(m => m.organization_id === savedOrgId)
        ? savedOrgId
        : userOrgs[0].organization_id;

      // Set the selected organization
      const selectedMembership = userOrgs.find(m => m.organization_id === targetOrgId);
      if (selectedMembership) {
        setSelectedOrganization(selectedMembership.organization);
        setSelectedOrganizationId(targetOrgId);
        setUserRole(selectedMembership.role);
        localStorage.setItem('selectedOrganizationId', targetOrgId);
      }
    } catch (error) {
      console.error('Failed to fetch organization memberships:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberships();
  }, [user]);

  const switchOrganization = (organizationId: string) => {
    const membership = userMemberships.find(m => m.organization_id === organizationId);
    if (membership) {
      setSelectedOrganization(membership.organization);
      setSelectedOrganizationId(organizationId);
      setUserRole(membership.role);
      localStorage.setItem('selectedOrganizationId', organizationId);

      // Reload the page to refresh all data
      window.location.reload();
    }
  };

  const refetchMemberships = async () => {
    await fetchMemberships();
  };

  return (
    <OrganizationContext.Provider
      value={{
        selectedOrganization,
        selectedOrganizationId,
        userMemberships,
        userRole,
        loading,
        switchOrganization,
        refetchMemberships,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
