'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { X, UserPlus, Mail, Shield } from 'lucide-react';
import { toast } from 'sonner';

type InviteTeamMemberModalProps = {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
  onSuccess: () => void;
};

export default function InviteTeamMemberModal({
  isOpen,
  onClose,
  organizationId,
  organizationName,
  onSuccess,
}: InviteTeamMemberModalProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'manager' | 'member' | 'vet' | 'readonly'>('member');
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Don't allow inviting yourself
    if (email.toLowerCase() === user?.email?.toLowerCase()) {
      toast.error('You cannot invite yourself');
      return;
    }

    setSending(true);

    try {
      // Look up user by email using our database function
      const { data: userData, error: lookupError } = await supabase
        .rpc('lookup_user_by_email', { user_email: email.toLowerCase() });

      if (lookupError) throw lookupError;

      if (!userData || userData.length === 0) {
        // User doesn't exist - create invite token instead
        // Generate a random token
        const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        // Create team invite
        const { error: inviteError } = await supabase
          .from('team_invites')
          .insert({
            token: token,
            organization_id: organizationId,
            invited_by: user?.id,
            email: email.toLowerCase(),
            role: role,
          });

        if (inviteError) throw inviteError;

        // TODO: Send email with invite link
        const inviteLink = `${window.location.origin}/invite/${token}`;

        toast.success(`Invite sent! Share this link with them: ${inviteLink}`, {
          duration: 10000,
        });

        setEmail('');
        setRole('member');
        onSuccess();
        setSending(false);
        return;
      }

      const invitedUserId = userData[0].user_id;

      // Check if user is already a member of this organization
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', invitedUserId)
        .single();

      if (existingMember) {
        toast.error('This user is already a member of your team');
        setSending(false);
        return;
      }

      // Add user to organization
      const { error: insertError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: organizationId,
          user_id: invitedUserId,
          role: role,
          invited_by: user?.id,
          invited_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
          is_active: true
        });

      if (insertError) throw insertError;

      toast.success(`Successfully added ${email} to your team!`);
      setEmail('');
      setRole('member');
      onSuccess();
    } catch (error: any) {
      console.error('Error inviting team member:', error);
      toast.error(error.message || 'Failed to invite team member');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('member');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-red-700" />
            <h2 className="text-xl font-semibold text-gray-900">
              Invite Team Member
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-900">
              <strong>Inviting to:</strong> {organizationName}
            </p>
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">
              <Mail className="inline h-4 w-4 mr-1" />
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@example.com"
              required
              autoComplete="off"
            />
            <p className="text-xs text-gray-500">
              If they don&apos;t have an account yet, they&apos;ll receive an invite link to join
            </p>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">
              <Shield className="inline h-4 w-4 mr-1" />
              Role <span className="text-red-500">*</span>
            </Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            >
              <option value="member">Member - Basic access</option>
              <option value="manager">Manager - Can invite members and manage animals</option>
              <option value="vet">Veterinarian - Health records only</option>
              <option value="readonly">Read Only - View only access</option>
            </select>
          </div>

          {/* Role Description */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-600">
              {role === 'manager' && 'Managers can edit animals, manage housing, and invite new members.'}
              {role === 'member' && 'Members can view animals, complete tasks, and add basic records.'}
              {role === 'vet' && 'Veterinarians can only view and add health records.'}
              {role === 'readonly' && 'Read-only users can view all data but cannot make changes.'}
            </p>
          </div>

          {/* Important Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Team members will have access to all animals and records in your organization.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={sending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={sending}
              className="flex-1"
            >
              {sending ? 'Inviting...' : 'Send Invite'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
