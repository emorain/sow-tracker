'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Building2, CheckCircle, XCircle, Loader2, UserPlus } from 'lucide-react';
import Link from 'next/link';

type InviteData = {
  id: string;
  email: string;
  role: string;
  organization_id: string;
  invited_by: string;
  expires_at: string;
  organization: {
    id: string;
    name: string;
  };
  inviter: {
    email: string;
  };
};

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid invite link');
      setLoading(false);
      return;
    }

    loadInvite();
  }, [token]);

  const loadInvite = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch invite details
      const { data, error: fetchError } = await supabase
        .from('team_invites')
        .select(`
          id,
          email,
          role,
          organization_id,
          invited_by,
          expires_at,
          organization:organizations(id, name),
          inviter:auth.users!team_invites_invited_by_fkey(email)
        `)
        .eq('token', token)
        .is('accepted_at', null)
        .single();

      if (fetchError) {
        console.error('Error fetching invite:', fetchError);
        setError('Invalid or expired invite link');
        setLoading(false);
        return;
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        setError('This invite has expired');
        setLoading(false);
        return;
      }

      setInvite(data as InviteData);
    } catch (err: any) {
      console.error('Error loading invite:', err);
      setError('Failed to load invite');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!user) {
      // Redirect to signup with token
      router.push(`/auth/signup?invite_token=${token}`);
      return;
    }

    // Check if user's email matches the invite
    if (user.email?.toLowerCase() !== invite?.email.toLowerCase()) {
      setError(`This invite is for ${invite?.email}. Please log in with that email address.`);
      return;
    }

    setAccepting(true);
    setError(null);

    try {
      // Call the accept_team_invite function
      const { data, error: acceptError } = await supabase
        .rpc('accept_team_invite', { invite_token: token });

      if (acceptError) throw acceptError;

      // Success!
      setSuccess(true);

      // Switch to the new organization
      localStorage.setItem('selectedOrganizationId', data.organization_id);

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err: any) {
      console.error('Error accepting invite:', err);

      // Handle specific error messages
      if (err.message.includes('already a member')) {
        setError('You are already a member of this organization');
        // Still redirect to home
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setError(err.message || 'Failed to accept invite');
      }
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <Loader2 className="h-12 w-12 text-red-700 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invite</h1>
            <p className="text-gray-600 mb-6">{error || 'This invite link is not valid'}</p>
            <Link href="/auth/login">
              <Button className="w-full">
                Go to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h1>
            <p className="text-gray-600 mb-6">
              You've successfully joined <strong>{invite.organization.name}</strong>
            </p>
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <Building2 className="h-16 w-16 text-red-700 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Invitation</h1>
          <p className="text-gray-600">
            You've been invited to join an organization
          </p>
        </div>

        {/* Invite Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
          <div>
            <p className="text-sm text-gray-500">Organization</p>
            <p className="text-lg font-semibold text-gray-900">{invite.organization.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Invited by</p>
            <p className="text-gray-900">{invite.inviter.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Your role</p>
            <p className="text-gray-900 capitalize">{invite.role}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Invited email</p>
            <p className="text-gray-900">{invite.email}</p>
          </div>
        </div>

        {/* User Status */}
        {!user ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900">
              You'll need to create an account or log in to accept this invitation.
            </p>
          </div>
        ) : user.email?.toLowerCase() !== invite.email.toLowerCase() ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-900">
              <strong>Note:</strong> This invite is for {invite.email}. You are currently logged in as {user.email}.
            </p>
          </div>
        ) : null}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleAcceptInvite}
            disabled={accepting}
            className="w-full"
            size="lg"
          >
            {accepting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-5 w-5" />
                {user ? 'Accept Invitation' : 'Sign Up & Join'}
              </>
            )}
          </Button>

          {user && (
            <Link href="/">
              <Button variant="outline" className="w-full">
                Go to Dashboard
              </Button>
            </Link>
          )}
        </div>

        {/* Expiry Notice */}
        <p className="text-xs text-gray-500 text-center mt-6">
          This invite expires on {new Date(invite.expires_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
