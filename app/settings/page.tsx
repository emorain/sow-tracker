'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, ArrowLeft, AlertCircle, CheckCircle2, Upload, X, Image, Users, Bell, MessageSquare } from "lucide-react";
import Link from 'next/link';
import { useSettings } from '@/lib/settings-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { settings, loading, updateSettings, refetchSettings } = useSettings();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingMap, setUploadingMap] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    farm_name: settings?.farm_name || '',
    logo_url: settings?.logo_url || null,
    farm_map_url: settings?.farm_map_url || null,
    prop12_compliance_enabled: settings?.prop12_compliance_enabled || false,
    weight_unit: settings?.weight_unit || 'kg',
    measurement_unit: settings?.measurement_unit || 'feet',
  });

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        farm_name: settings.farm_name || '',
        logo_url: settings.logo_url || null,
        farm_map_url: settings.farm_map_url || null,
        prop12_compliance_enabled: settings.prop12_compliance_enabled || false,
        weight_unit: settings.weight_unit || 'kg',
        measurement_unit: settings.measurement_unit || 'feet',
      });
    }
  }, [settings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/farm-logos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('farm-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('farm-assets')
        .getPublicUrl(filePath);

      // Update settings
      await updateSettings({ logo_url: publicUrl });
      setFormData({ ...formData, logo_url: publicUrl });
      await refetchSettings();
      toast.success('Logo uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await updateSettings({ logo_url: null });
      setFormData({ ...formData, logo_url: null });
      await refetchSettings();
      toast.success('Logo removed');
    } catch (error) {
      console.error('Failed to remove logo:', error);
      toast.error('Failed to remove logo');
    }
  };

  const handleFarmMapUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB for maps)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingMap(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/farm-maps/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('farm-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('farm-assets')
        .getPublicUrl(filePath);

      // Update settings
      await updateSettings({ farm_map_url: publicUrl });
      setFormData({ ...formData, farm_map_url: publicUrl });
      await refetchSettings();
      toast.success('Farm map uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload farm map:', error);
      toast.error('Failed to upload farm map');
    } finally {
      setUploadingMap(false);
      if (mapInputRef.current) {
        mapInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFarmMap = async () => {
    try {
      await updateSettings({ farm_map_url: null });
      setFormData({ ...formData, farm_map_url: null });
      await refetchSettings();
      toast.success('Farm map removed');
    } catch (error) {
      console.error('Failed to remove farm map:', error);
      toast.error('Failed to remove farm map');
    }
  };

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
      <div className="min-h-screen bg-red-700 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading settings...</div>
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
            <Settings className="h-8 w-8 text-red-700" />
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
          {/* Team Management */}
          <Card>
            <CardHeader>
              <CardTitle>Team Management</CardTitle>
              <CardDescription>
                Manage your team members, roles, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-4">
                    Invite team members to collaborate on your farm. Assign roles to control access levels and permissions.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Users className="h-4 w-4" />
                    <span>Available roles: Owner, Manager, Member, Veterinarian, Read-Only</span>
                  </div>
                </div>
                <Link href="/settings/team">
                  <Button variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Team
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure notification preferences and reminders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-4">
                    Control how and when you receive notifications about farrowing, breeding, health records, and other important farm events.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Bell className="h-4 w-4" />
                    <span>Push notifications, email alerts, and quiet hours</span>
                  </div>
                </div>
                <Link href="/settings/notifications">
                  <Button variant="outline">
                    <Bell className="mr-2 h-4 w-4" />
                    Configure Notifications
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Ear Notch Auto-Tracker */}
          <Card>
            <CardHeader>
              <CardTitle>Ear Notch Auto-Tracker</CardTitle>
              <CardDescription>
                Automatically assign ear notches to piglets as they are created
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900 mb-2">
                  <strong>How it works:</strong> The system automatically assigns ear notches when you create piglets.
                </p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li><strong>Right ear</strong> = Litter number (same for all piglets in a litter)</li>
                  <li><strong>Left ear</strong> = Individual piglet number (1, 2, 3, etc.)</li>
                  <li>Example: First litter gets 1-1, 1-2, 1-3... Second litter gets 2-1, 2-2, 2-3...</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ear_notch_seed">Starting Litter Number (Seed)</Label>
                  <Input
                    id="ear_notch_seed"
                    type="number"
                    min="1"
                    value={settings?.ear_notch_current_litter || 1}
                    onChange={async (e) => {
                      const newValue = parseInt(e.target.value) || 1;
                      try {
                        await updateSettings({ ear_notch_current_litter: newValue });
                        toast.success('Litter number updated');
                      } catch (error) {
                        toast.error('Failed to update litter number');
                      }
                    }}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Set this if you&apos;ve already created litters on paper. Next litter will be this number.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Current Status</Label>
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <div className="text-sm space-y-1">
                      <p><strong>Next Litter:</strong> #{settings?.ear_notch_current_litter || 1}</p>
                      <p><strong>Next Piglets:</strong> {settings?.ear_notch_current_litter || 1}-1, {settings?.ear_notch_current_litter || 1}-2, {settings?.ear_notch_current_litter || 1}-3...</p>
                      {settings?.ear_notch_last_reset_date && (
                        <p className="text-muted-foreground">
                          <strong>Last Reset:</strong> {new Date(settings.ear_notch_last_reset_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    if (confirm('Reset ear notch tracker to start from litter 1?\n\nThis will reset the counter but will NOT change any existing piglet records.')) {
                      try {
                        await updateSettings({
                          ear_notch_current_litter: 1,
                          ear_notch_last_reset_date: new Date().toISOString()
                        });
                        toast.success('Ear notch tracker reset to litter 1');
                      } catch (error) {
                        toast.error('Failed to reset tracker');
                      }
                    }
                  }}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Reset to Litter 1
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  This resets the counter for future litters. It does not change existing piglet records.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* User Feedback & Bug Reports - Developer Only */}
          {user?.email === 'emorain@gmail.com' && (
            <Card>
              <CardHeader>
                <CardTitle>User Feedback & Bug Reports</CardTitle>
                <CardDescription>
                  View and manage feedback submitted by your team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-4">
                      Review bug reports, feature requests, and other feedback from your team members. Track progress and manage submissions.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MessageSquare className="h-4 w-4" />
                      <span>Bug reports, feature requests, and improvements</span>
                    </div>
                  </div>
                  <Link href="/admin/feedback">
                    <Button variant="outline">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      View Feedback
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

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

              <div className="space-y-2">
                <Label>Farm Logo</Label>
                <p className="text-sm text-muted-foreground">
                  Upload a custom logo to display in the app header (max 2MB)
                </p>
                <div className="flex items-start gap-4">
                  {formData.logo_url ? (
                    <div className="flex items-center gap-4">
                      <img
                        src={formData.logo_url}
                        alt="Farm logo"
                        className="h-16 w-16 object-contain border-2 border-gray-200 rounded"
                      />
                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Change Logo
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveLogo}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50">
                        <Image className="h-8 w-8 text-gray-400" />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {uploading ? 'Uploading...' : 'Upload Logo'}
                      </Button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>

              <div className="space-y-2 pt-4 border-t">
                <Label>Farm Map / Layout</Label>
                <p className="text-sm text-muted-foreground">
                  Upload an aerial view or layout map of your farm for Prop 12 compliance reports (max 5MB)
                </p>
                <div className="flex items-start gap-4">
                  {formData.farm_map_url ? (
                    <div className="flex items-start gap-4">
                      <img
                        src={formData.farm_map_url}
                        alt="Farm map"
                        className="h-32 w-48 object-cover border-2 border-gray-200 rounded"
                      />
                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => mapInputRef.current?.click()}
                          disabled={uploadingMap}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Change Map
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveFarmMap}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="h-32 w-48 border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50">
                        <Image className="h-12 w-12 text-gray-400" />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => mapInputRef.current?.click()}
                        disabled={uploadingMap}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {uploadingMap ? 'Uploading...' : 'Upload Farm Map'}
                      </Button>
                    </div>
                  )}
                  <input
                    ref={mapInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFarmMapUpload}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Tip: Screenshot from Google Maps satellite view, then annotate with building/barn labels
                </p>
              </div>
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
                    className="mt-1 h-4 w-4 text-red-700 focus:ring-red-600 border-gray-300 rounded"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
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
