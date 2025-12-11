'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, UserPlus, Crown, Shield, Eye, Trash2, Users } from "lucide-react";
import Link from 'next/link';
import { toast } from 'sonner';
import InviteTeamMemberModal from '@/components/InviteTeamMemberModal';

type OrganizationMember = {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'member' | 'vet' | 'readonly';
  invited_at: string;
  joined_at: string | null;
  is_active: boolean;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

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

const ROLE_INFO = {
  owner: {
    icon: Crown,
    label: 'Owner',
    color: 'text-yellow-600 bg-yellow-50',
    description: 'Full access - manage team, settings, and all data'
  },
  manager: {
    icon: Shield,
    label: 'Manager',
    color: 'text-blue-600 bg-blue-50',
    description: 'Edit animals, manage housing, invite members'
  },
  member: {
    icon: Users,
    label: 'Member',
    color: 'text-green-600 bg-green-50',
    description: 'View animals, complete tasks, add basic records'
  },
  vet: {
    icon: Shield,
    label: 'Veterinarian',
    color: 'text-purple-600 bg-purple-50',
    description: 'View and add health records only'
  },
  readonly: {
    icon: Eye,
    label: 'Read Only',
    color: 'text-gray-600 bg-gray-50',
    description: 'View-only access for reports and data'
  }
};

export default function TeamManagementPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [userMemberships, setUserMemberships] = useState<OrganizationMembership[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrganizationAndMembers();
    }
  }, [user]);

  const fetchOrganizationAndMembers = async (orgId?: string) => {
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
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (membershipError) {
        console.error('Membership error:', membershipError);
        throw new Error(`Failed to fetch membership: ${membershipError.message}`);
      }

      if (!memberships || memberships.length === 0) {
        toast.error('You are not a member of any organization yet. Please contact support.');
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

      // Determine which org to show
      let targetOrgId = orgId || selectedOrgId;

      // If no org selected yet, use localStorage or default to first one
      if (!targetOrgId) {
        const savedOrgId = localStorage.getItem('selectedOrganizationId');
        targetOrgId = savedOrgId && userOrgs.find(m => m.organization_id === savedOrgId)
          ? savedOrgId
          : userOrgs[0].organization_id;
      }

      setSelectedOrgId(targetOrgId);
      localStorage.setItem('selectedOrganizationId', targetOrgId);

      // Get the selected membership
      const selectedMembership = userOrgs.find(m => m.organization_id === targetOrgId);
      if (!selectedMembership) {
        throw new Error('Selected organization not found');
      }

      setCurrentUserRole(selectedMembership.role);
      setOrganization(selectedMembership.organization);

      // Get all team members with emails from the view
      const { data: teamMembers, error: membersError } = await supabase
        .from('organization_members_with_email')
        .select('*')
        .eq('organization_id', targetOrgId)
        .order('joined_at', { ascending: false });

      if (membersError) {
        console.error('Team members error:', membersError);
        throw new Error(`Failed to fetch team members: ${membersError.message}`);
      }

      setMembers(teamMembers || []);
    } catch (error: any) {
      console.error('Error fetching team data:', error);
      toast.error(error.message || 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail?: string) => {
    if (!confirm(`Remove ${memberEmail || 'this member'} from the team?`)) {
      return;
    }

    setRemovingMemberId(memberId);
    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Team member removed');
      await fetchOrganizationAndMembers();
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove team member');
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Role updated successfully');
      await fetchOrganizationAndMembers();
    } catch (error: any) {
      console.error('Error changing role:', error);
      toast.error('Failed to change role');
    }
  };

  const canInvite = currentUserRole === 'owner' || currentUserRole === 'manager';
  const canManageMembers = currentUserRole === 'owner';

  return (
    <div className="min-h-screen bg-red-700">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-red-700" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
                {organization && userMemberships.length > 1 ? (
                  <select
                    value={selectedOrgId || ''}
                    onChange={(e) => fetchOrganizationAndMembers(e.target.value)}
                    className="mt-1 text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {userMemberships.map((membership) => (
                      <option key={membership.organization_id} value={membership.organization_id}>
                        {membership.organization.name}
                      </option>
                    ))}
                  </select>
                ) : organization ? (
                  <p className="text-sm text-gray-600">{organization.name}</p>
                ) : null}
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/settings">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Settings
                </Button>
              </Link>
              {canInvite && (
                <Button onClick={() => setShowInviteModal(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Team Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-700">{members.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Active Members</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {members.filter(m => m.is_active && m.joined_at).length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Pending Invites</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">
                {members.filter(m => !m.joined_at).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Team Members List */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Manage your team members and their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-600">Loading team members...</div>
            ) : members.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
                <p className="text-gray-600 mb-4">
                  Invite team members to collaborate on your farm
                </p>
                {canInvite && (
                  <Button onClick={() => setShowInviteModal(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Your First Member
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {members.map((member) => {
                  const RoleIcon = ROLE_INFO[member.role].icon;
                  const isCurrentUser = member.user_id === user?.id;
                  const canEdit = canManageMembers && !isCurrentUser;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {/* Avatar/Icon */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                            <Users className="h-6 w-6 text-red-700" />
                          </div>
                        </div>

                        {/* Member Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">
                              {member.full_name || member.email || 'Unknown User'}
                            </p>
                            {isCurrentUser && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          {member.full_name && member.email && (
                            <p className="text-xs text-gray-500">{member.email}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_INFO[member.role].color}`}>
                              <RoleIcon className="h-3 w-3 mr-1" />
                              {ROLE_INFO[member.role].label}
                            </span>
                            {!member.joined_at && (
                              <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                                Pending
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {ROLE_INFO[member.role].description}
                          </p>
                        </div>

                        {/* Member Stats */}
                        <div className="hidden md:flex flex-col items-end text-xs text-gray-500">
                          {member.joined_at ? (
                            <>
                              <span>Joined {new Date(member.joined_at).toLocaleDateString()}</span>
                            </>
                          ) : (
                            <span>Invited {new Date(member.invited_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        {canEdit && member.role !== 'owner' && (
                          <select
                            value={member.role}
                            onChange={(e) => handleChangeRole(member.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            <option value="manager">Manager</option>
                            <option value="member">Member</option>
                            <option value="vet">Veterinarian</option>
                            <option value="readonly">Read Only</option>
                          </select>
                        )}
                        {canManageMembers && !isCurrentUser && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id, member.email || undefined)}
                            disabled={removingMemberId === member.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Descriptions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Role Descriptions</CardTitle>
            <CardDescription>
              Understand what each role can do
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(ROLE_INFO).map(([role, info]) => {
                const Icon = info.icon;
                return (
                  <div key={role} className={`p-4 rounded-lg border-2 ${info.color}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-5 w-5" />
                      <h4 className="font-semibold">{info.label}</h4>
                    </div>
                    <p className="text-sm">{info.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Invite Modal */}
      {showInviteModal && organization && (
        <InviteTeamMemberModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          organizationId={organization.id}
          organizationName={organization.name}
          onSuccess={() => {
            setShowInviteModal(false);
            fetchOrganizationAndMembers();
          }}
        />
      )}
    </div>
  );
}
