'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { X, Building2, Plus } from 'lucide-react';
import { toast } from 'sonner';

type CreateOrganizationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (organizationId: string) => void;
};

export default function CreateOrganizationModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateOrganizationModalProps) {
  const { user } = useAuth();
  const [orgName, setOrgName] = useState('');
  const [creating, setCreating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orgName.trim()) {
      toast.error('Please enter an organization name');
      return;
    }

    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    setCreating(true);

    try {
      // Generate unique slug
      const { data: slugData, error: slugError } = await supabase
        .rpc('generate_unique_slug', { org_name: orgName.trim() });

      if (slugError) throw slugError;

      const slug = slugData;

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName.trim(),
          slug: slug,
          created_by: user.id,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add user as owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'owner',
          invited_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
          is_active: true,
        });

      if (memberError) throw memberError;

      toast.success(`${orgName} created successfully!`);

      // Switch to new organization
      localStorage.setItem('selectedOrganizationId', org.id);

      // Call success callback
      if (onSuccess) {
        onSuccess(org.id);
      }

      // Reload to refresh org context
      window.location.reload();
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast.error(error.message || 'Failed to create organization');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setOrgName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-red-700" />
            <h2 className="text-xl font-semibold text-gray-900">
              Create New Organization
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
              Create a new organization to manage animals separately. You'll be the owner with full access.
            </p>
          </div>

          {/* Organization Name Input */}
          <div className="space-y-2">
            <Label htmlFor="orgName">
              Organization Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="orgName"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g., Smith Family Farm, ABC Breeding Co."
              required
              autoComplete="off"
              maxLength={100}
            />
            <p className="text-xs text-gray-500">
              This can be your farm name, business name, or any identifier
            </p>
          </div>

          {/* Info boxes */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-gray-700">What you'll get:</p>
            <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
              <li>Separate animal records and data</li>
              <li>Ability to invite team members</li>
              <li>Independent settings and preferences</li>
              <li>Easy switching between organizations</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-800">
              <strong>Note:</strong> You can belong to multiple organizations and switch between them anytime.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={creating}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating || !orgName.trim()}
              className="flex-1"
            >
              <Plus className="mr-2 h-4 w-4" />
              {creating ? 'Creating...' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
