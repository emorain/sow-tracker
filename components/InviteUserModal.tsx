'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Mail, MessageSquare, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

type InviteUserModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function InviteUserModal({ isOpen, onClose }: InviteUserModalProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  // Get the app URL
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteLink = `${appUrl}/auth/signup`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success('Invite link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleEmailInvite = async () => {
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

    setSending(true);

    try {
      // Create a mailto link with pre-filled subject and body
      const subject = encodeURIComponent('Join Sow Tracker - Farm Management App');
      const body = encodeURIComponent(
        `Hi!\n\nI'd like to invite you to join our farm team on Sow Tracker.\n\n` +
        `Sow Tracker helps us manage breeding, farrowing, piglets, and Prop 12 compliance.\n\n` +
        `Click here to sign up:\n${inviteLink}\n\n` +
        `Once you create your account, you'll be able to track your own herd or we can set up shared access.\n\n` +
        `Thanks!`
      );

      // Open default email client
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;

      toast.success('Email client opened! Send the invitation.');
      setEmail('');
    } catch (err) {
      toast.error('Failed to open email client');
    } finally {
      setSending(false);
    }
  };

  const handleTextInvite = async () => {
    if (!phone) {
      toast.error('Please enter a phone number');
      return;
    }

    setSending(true);

    try {
      // Create SMS message
      const message = encodeURIComponent(
        `Join our farm team on Sow Tracker! ` +
        `Track breeding, farrowing & piglets. ` +
        `Sign up: ${inviteLink}`
      );

      // Open SMS app (works on mobile)
      window.location.href = `sms:${phone}?body=${message}`;

      toast.success('SMS app opened! Send the invitation.');
      setPhone('');
    } catch (err) {
      toast.error('Failed to open SMS app');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invite Team Member</CardTitle>
              <CardDescription>
                Invite someone to join Sow Tracker
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Email Invite */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Invite by Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="colleague@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleEmailInvite();
                  }
                }}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <Button
                onClick={handleEmailInvite}
                disabled={sending || !email}
                className="bg-red-700 hover:bg-red-800"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* SMS Invite */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Invite by Text Message
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTextInvite();
                  }
                }}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <Button
                onClick={handleTextInvite}
                disabled={sending || !phone}
                className="bg-red-700 hover:bg-red-800"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Send
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or copy link</span>
            </div>
          </div>

          {/* Copy Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Share Invite Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="min-w-[100px]"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Share this link via any messaging app or social media
            </p>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Each user will need to create their own account.
              They&apos;ll have their own separate herd data unless you set up shared access in the future.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
