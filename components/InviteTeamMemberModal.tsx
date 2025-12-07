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
      // Check if user already exists in Supabase Auth
      const { data: existingUsers } = await supabase
        .from('auth.users')
        .select('id, email')
        .eq('email', email.toLowerCase())
        .single();

      let invitedUserId: string;

      if (existingUsers) {
        // User exists, check if already in organization
        const { data: existingMember } = await supabase
          .from('organization_members')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('user_id', existingUsers.id)
          .single();

        if (existingMember) {
          toast.error('This user is already a member of your team');
          return;
        }

        invitedUserId = existingUsers.id;
      } else {
        // User doesn't exist yet - they'll need to sign up
        // We'll create a placeholder invitation
        // When they sign up with this email, they'll automatically join the org
        toast.info('An invitation will be sent. User must sign up first.');

        // For now, we can't invite users who don't have accounts
        // This would require implementing an invitation system with email tokens
        toast.error('User must create an account first before being invited');
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
          joined_at: new Date().toISOString(), // Auto-join for now
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
              User must already have a Sow Tracker account
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
