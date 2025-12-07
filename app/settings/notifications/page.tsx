'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, Bell, Mail, Smartphone, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import Link from 'next/link';
import { toast } from 'sonner';

type NotificationPreferences = {
  id?: string;
  user_id?: string;

  // Channels
  push_enabled: boolean;
  push_subscription: any;
  email_enabled: boolean;
  email_daily_digest: boolean;
  sms_enabled: boolean;
  phone_number: string | null;

  // Notification types
  notify_farrowing: boolean;
  notify_breeding: boolean;
  notify_pregnancy_check: boolean;
  notify_weaning: boolean;
  notify_vaccination: boolean;
  notify_health_records: boolean;
  notify_matrix: boolean;
  notify_tasks: boolean;
  notify_transfers: boolean;
  notify_compliance: boolean;

  // Timing
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;

  // Reminder timing (days before event)
  farrowing_reminder_days: number[];
  pregnancy_check_reminder_days: number[];
  weaning_reminder_days: number[];
  vaccination_reminder_days: number[];
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  push_enabled: true,
  push_subscription: null,
  email_enabled: true,
  email_daily_digest: false,
  sms_enabled: false,
  phone_number: null,

  notify_farrowing: true,
  notify_breeding: true,
  notify_pregnancy_check: true,
  notify_weaning: true,
  notify_vaccination: true,
  notify_health_records: true,
  notify_matrix: false,
  notify_tasks: true,
  notify_transfers: false,
  notify_compliance: true,

  quiet_hours_start: null,
  quiet_hours_end: null,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

  farrowing_reminder_days: [7, 3, 1],
  pregnancy_check_reminder_days: [1],
  weaning_reminder_days: [3, 1],
  vaccination_reminder_days: [7, 3, 1],
};

export default function NotificationSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (user) {
      fetchPreferences();
      checkPushPermission();
    }
  }, [user]);

  const checkPushPermission = () => {
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }
  };

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreferences(data);
      }
    } catch (error: any) {
      console.error('Error fetching notification preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (field: keyof NotificationPreferences) => {
    setPreferences({
      ...preferences,
      [field]: !preferences[field as keyof NotificationPreferences],
    });
  };

  const handleTimeChange = (field: 'quiet_hours_start' | 'quiet_hours_end', value: string) => {
    setPreferences({
      ...preferences,
      [field]: value || null,
    });
  };

  const handleReminderDaysChange = (field: keyof NotificationPreferences, value: string) => {
    const days = value
      .split(',')
      .map(d => parseInt(d.trim()))
      .filter(d => !isNaN(d) && d > 0);

    setPreferences({
      ...preferences,
      [field]: days,
    });
  };

  const handleRequestPushPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Push notifications are not supported in your browser');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === 'granted') {
        toast.success('Push notifications enabled!');
        setPreferences({ ...preferences, push_enabled: true });
      } else {
        toast.error('Push notification permission denied');
        setPreferences({ ...preferences, push_enabled: false });
      }
    } catch (error) {
      console.error('Error requesting push permission:', error);
      toast.error('Failed to request push notification permission');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          ...preferences,
          user_id: user?.id,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Notification preferences saved!');
      await fetchPreferences();
    } catch (error: any) {
      console.error('Error saving notification preferences:', error);
      toast.error('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-red-700 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading notification settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-700">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <Bell className="h-8 w-8 text-red-700" />
            <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/settings">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Settings
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Notification Channels */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Push Notifications */}
              <div className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex items-start space-x-3">
                  <Smartphone className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="font-medium">Push Notifications</Label>
                      {pushPermission === 'granted' && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                          Enabled
                        </span>
                      )}
                      {pushPermission === 'denied' && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                          Blocked
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Get instant notifications in your browser
                    </p>
                    {pushPermission === 'denied' && (
                      <p className="text-xs text-red-600 mt-2">
                        Push notifications are blocked. Please enable them in your browser settings.
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {pushPermission === 'default' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRequestPushPermission}
                    >
                      Enable
                    </Button>
                  )}
                  <input
                    type="checkbox"
                    checked={preferences.push_enabled}
                    onChange={() => handleToggle('push_enabled')}
                    disabled={pushPermission !== 'granted'}
                    className="h-4 w-4 text-red-700 focus:ring-red-600 border-gray-300 rounded"
                  />
                </div>
              </div>

              {/* Email Notifications */}
              <div className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <Label className="font-medium">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Receive notifications via email
                    </p>
                    {preferences.email_enabled && (
                      <div className="mt-3 ml-6">
                        <label className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={preferences.email_daily_digest}
                            onChange={() => handleToggle('email_daily_digest')}
                            className="h-4 w-4 text-red-700 focus:ring-red-600 border-gray-300 rounded"
                          />
                          <span>Send daily digest instead of individual emails</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.email_enabled}
                  onChange={() => handleToggle('email_enabled')}
                  className="h-4 w-4 text-red-700 focus:ring-red-600 border-gray-300 rounded"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Types */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
              <CardDescription>
                Choose which events you want to be notified about
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: 'notify_farrowing', label: 'Farrowing Events', description: 'Upcoming and completed farrowings' },
                { key: 'notify_breeding', label: 'Breeding Events', description: 'New breeding attempts and heat cycles' },
                { key: 'notify_pregnancy_check', label: 'Pregnancy Checks', description: 'Upcoming pregnancy check dates' },
                { key: 'notify_weaning', label: 'Weaning Events', description: 'Upcoming weaning dates' },
                { key: 'notify_vaccination', label: 'Vaccinations', description: 'Due and upcoming vaccinations' },
                { key: 'notify_health_records', label: 'Health Records', description: 'New health issues and treatments' },
                { key: 'notify_tasks', label: 'Tasks & Reminders', description: 'Upcoming and overdue tasks' },
                { key: 'notify_compliance', label: 'Compliance Alerts', description: 'Prop 12 and regulatory compliance' },
                { key: 'notify_matrix', label: 'Matrix Treatments', description: 'Matrix treatment schedules' },
                { key: 'notify_transfers', label: 'Animal Transfers', description: 'Housing location changes' },
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <Label className="font-medium cursor-pointer">{label}</Label>
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences[key as keyof NotificationPreferences] as boolean}
                    onChange={() => handleToggle(key as keyof NotificationPreferences)}
                    className="h-4 w-4 text-red-700 focus:ring-red-600 border-gray-300 rounded mt-1"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Reminder Timing */}
          <Card>
            <CardHeader>
              <CardTitle>Reminder Timing</CardTitle>
              <CardDescription>
                Configure how many days before events you want to be reminded
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <p className="text-xs text-blue-900">
                    Enter days as comma-separated numbers (e.g., &quot;7, 3, 1&quot; for reminders 7, 3, and 1 day before)
                  </p>
                </div>
              </div>

              {[
                { key: 'farrowing_reminder_days', label: 'Farrowing Reminders', default: '7, 3, 1' },
                { key: 'pregnancy_check_reminder_days', label: 'Pregnancy Check Reminders', default: '1' },
                { key: 'weaning_reminder_days', label: 'Weaning Reminders', default: '3, 1' },
                { key: 'vaccination_reminder_days', label: 'Vaccination Reminders', default: '7, 3, 1' },
              ].map(({ key, label, default: defaultValue }) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>{label}</Label>
                  <input
                    id={key}
                    type="text"
                    value={(preferences[key as keyof NotificationPreferences] as number[])?.join(', ') || defaultValue}
                    onChange={(e) => handleReminderDaysChange(key as keyof NotificationPreferences, e.target.value)}
                    placeholder={defaultValue}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Quiet Hours</CardTitle>
              <CardDescription>
                Set times when you don&apos;t want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quiet_hours_start">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Start Time
                  </Label>
                  <input
                    id="quiet_hours_start"
                    type="time"
                    value={preferences.quiet_hours_start || ''}
                    onChange={(e) => handleTimeChange('quiet_hours_start', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quiet_hours_end">
                    <Clock className="inline h-4 w-4 mr-1" />
                    End Time
                  </Label>
                  <input
                    id="quiet_hours_end"
                    type="time"
                    value={preferences.quiet_hours_end || ''}
                    onChange={(e) => handleTimeChange('quiet_hours_end', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                No notifications will be sent during quiet hours. Leave empty to receive notifications at any time.
              </p>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <input
                  id="timezone"
                  type="text"
                  value={preferences.timezone}
                  onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                  placeholder="America/New_York"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                />
                <p className="text-xs text-muted-foreground">
                  Your detected timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end space-x-3">
            <Link href="/settings">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
