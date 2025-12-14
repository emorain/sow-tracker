'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PiggyBank, Eye, EyeOff } from "lucide-react";
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite_token');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    farmName: '',
  });

  // Load invite data if token is present
  useEffect(() => {
    if (inviteToken) {
      loadInviteData();
    }
  }, [inviteToken]);

  const loadInviteData = async () => {
    try {
      const { data, error } = await supabase
        .from('team_invites')
        .select(`
          id,
          email,
          role,
          organization_id,
          expires_at,
          organization:organizations(id, name)
        `)
        .eq('token', inviteToken)
        .is('accepted_at', null)
        .single();

      if (error) {
        console.error('Error loading invite:', error);
        return;
      }

      if (data && new Date(data.expires_at) > new Date()) {
        setInviteData(data);
        // Pre-fill email
        setFormData(prev => ({ ...prev, email: data.email }));
      }
    } catch (err) {
      console.error('Error loading invite:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Validate password strength
      if (formData.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // If signing up via invite, validate email matches
      if (inviteData && formData.email.toLowerCase() !== inviteData.email.toLowerCase()) {
        throw new Error(`This invite is for ${inviteData.email}. Please use that email address.`);
      }

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            farm_name: formData.farmName,
            invite_token: inviteToken || null, // Store invite token in user metadata
          },
        },
      });

      if (error) throw error;

      // Check if email confirmation is required
      if (data.user && !data.session) {
        setSuccess(true);
      } else if (data.session) {
        // Auto-login successful
        if (inviteToken) {
          // Redirect to invite acceptance page
          router.push(`/invite/${inviteToken}`);
        } else {
          // Normal signup - go to home
          router.push('/');
        }
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-red-700 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <PiggyBank className="h-10 w-10 text-red-700" />
              <h1 className="text-3xl font-bold text-gray-900">Sow Tracker</h1>
            </div>
            <div className="text-center">
              <CardTitle className="text-2xl">Check Your Email</CardTitle>
              <CardDescription>We&apos;ve sent you a confirmation link</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Please check your email and click the confirmation link to activate your account.
            </p>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full">
                Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <PiggyBank className="h-10 w-10 text-red-700" />
            <h1 className="text-3xl font-bold text-gray-900">Sow Tracker</h1>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>
              {inviteData
                ? `Join ${inviteData.organization.name}`
                : 'Start tracking your farm today'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {inviteData && (
              <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-md text-sm">
                <p className="font-medium mb-1">You are joining {inviteData.organization.name}</p>
                <p className="text-xs">Your role will be: <span className="capitalize font-medium">{inviteData.role}</span></p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="farmName">
                Farm Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="farmName"
                name="farmName"
                type="text"
                value={formData.farmName}
                onChange={handleChange}
                placeholder="Green Acres Farm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                autoComplete="email"
                disabled={!!inviteData}
                className={inviteData ? 'bg-gray-100 cursor-not-allowed' : ''}
              />
              {inviteData && (
                <p className="text-xs text-gray-500">
                  This email is pre-filled from your invitation
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">At least 8 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-red-700 hover:text-red-800 font-medium">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-red-700 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <div className="text-center text-gray-600">Loading...</div>
          </CardContent>
        </Card>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
