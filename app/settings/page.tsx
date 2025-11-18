'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from 'next/link';
import { useSettings } from '@/lib/settings-context';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { settings, loading, updateSettings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    farm_name: settings?.farm_name || '',
    prop12_compliance_enabled: settings?.prop12_compliance_enabled || false,
    weight_unit: settings?.weight_unit || 'kg',
    measurement_unit: settings?.measurement_unit || 'feet',
    email_notifications_enabled: settings?.email_notifications_enabled ?? true,
    task_reminders_enabled: settings?.task_reminders_enabled ?? true,
  });

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        farm_name: settings.farm_name || '',
        prop12_compliance_enabled: settings.prop12_compliance_enabled || false,
        weight_unit: settings.weight_unit || 'kg',
        measurement_unit: settings.measurement_unit || 'feet',
        email_notifications_enabled: settings.email_notifications_enabled ?? true,
        task_reminders_enabled: settings.task_reminders_enabled ?? true,
      });
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateSettings(formData);
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <Settings className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">Farm Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Farm Information */}
          <Card>
            <CardHeader>
              <CardTitle>Farm Information</CardTitle>
              <CardDescription>
                Basic information about your farm
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="farm_name">Farm Name</Label>
                <Input
                  id="farm_name"
                  name="farm_name"
                  value={formData.farm_name}
                  onChange={handleChange}
                  placeholder="My Farm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Compliance Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Settings</CardTitle>
              <CardDescription>
                Configure regulatory compliance tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="prop12_compliance_enabled"
                    name="prop12_compliance_enabled"
                    checked={formData.prop12_compliance_enabled}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <Label htmlFor="prop12_compliance_enabled" className="cursor-pointer">
                      Enable California Prop 12 Compliance Tracking
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Track sow housing locations, space requirements, and exemption periods
                      for California Proposition 12 compliance. This adds additional tracking
                      fields, validation rules, and audit reporting capabilities.
                    </p>

                    {formData.prop12_compliance_enabled && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div className="text-sm text-blue-900">
                            <p className="font-medium">Prop 12 Requirements:</p>
                            <ul className="mt-1 space-y-1 list-disc list-inside">
                              <li>24 square feet per breeding sow (gestation)</li>
                              <li>Track housing locations and movements</li>
                              <li>Document temporary confinement periods</li>
                              <li>Maintain detailed records for audits</li>
                            </ul>
                            <p className="mt-2">
                              After enabling, you&apos;ll need to set up your housing units
                              with square footage measurements.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unit Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Unit Preferences</CardTitle>
              <CardDescription>
                Choose your preferred units for weights and measurements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight_unit">Weight Unit</Label>
                  <select
                    id="weight_unit"
                    name="weight_unit"
                    value={formData.weight_unit}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="lbs">Pounds (lbs)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="measurement_unit">Measurement Unit</Label>
                  <select
                    id="measurement_unit"
                    name="measurement_unit"
                    value={formData.measurement_unit}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="feet">Feet (ft)</option>
                    <option value="meters">Meters (m)</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Used for housing unit measurements
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Manage notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="email_notifications_enabled"
                  name="email_notifications_enabled"
                  checked={formData.email_notifications_enabled}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <div>
                  <Label htmlFor="email_notifications_enabled" className="cursor-pointer">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about important farm events
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="task_reminders_enabled"
                  name="task_reminders_enabled"
                  checked={formData.task_reminders_enabled}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <div>
                  <Label htmlFor="task_reminders_enabled" className="cursor-pointer">
                    Task Reminders
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded about upcoming and overdue tasks
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end space-x-3">
            <Link href="/">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
