'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from '@/lib/supabase';
import { PiggyBank, ArrowLeft, Camera, Upload, X } from "lucide-react";
import Link from 'next/link';
import { toast } from 'sonner';

export default function AddSowPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    ear_tag: '',
    name: '',
    birth_date: '',
    breed: '',
    status: 'active' as 'active' | 'culled' | 'sold',
    notes: '',
    has_farrowed_before: false,
    right_ear_notch: '',
    left_ear_notch: '',
    registration_number: '',
    sire_name: '',
    dam_name: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [registrationFile, setRegistrationFile] = useState<File | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to add a sow');

      // Get user's current organization (or first available organization)
      let { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('is_current', true)
        .single();

      // If no current organization, get the first organization the user belongs to
      if (!orgMember) {
        const { data: firstOrg } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        orgMember = firstOrg;
      }

      if (!orgMember) {
        throw new Error('No organization found. Please contact support or create an organization first.');
      }

      // Generate ear tag if not provided
      let earTag = formData.ear_tag.trim();
      if (!earTag) {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        earTag = `AUTO-${date}-${random}`;
      }

      // Insert the sow first (without files) to establish RLS permissions
      const { data: sowData, error: insertError } = await supabase
        .from('sows')
        .insert([{
          user_id: user.id,
          organization_id: orgMember.organization_id,
          ear_tag: earTag,
          name: formData.name || null,
          birth_date: formData.birth_date,
          breed: formData.breed,
          status: formData.status,
          notes: formData.notes || null,
          right_ear_notch: formData.right_ear_notch ? parseInt(formData.right_ear_notch) : null,
          left_ear_notch: formData.left_ear_notch ? parseInt(formData.left_ear_notch) : null,
          registration_number: formData.registration_number || null,
          sire_name: formData.sire_name || null,
          dam_name: formData.dam_name || null,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      let photoUrl: string | null = null;
      let registrationDocUrl: string | null = null;

      // Now upload files after sow record exists (for RLS permissions)
      if (photoFile && sowData) {
        const photoPath = `${user.id}/sows/${sowData.id}/photo-${Date.now()}.${photoFile.name.split('.').pop()}`;
        const { error: photoError } = await supabase.storage
          .from('sow-tracker')
          .upload(photoPath, photoFile);

        if (photoError) throw new Error(`Photo upload failed: ${photoError.message}`);

        const { data: { publicUrl } } = supabase.storage
          .from('sow-tracker')
          .getPublicUrl(photoPath);
        photoUrl = publicUrl;
      }

      // Upload registration document if provided
      if (registrationFile && sowData) {
        const docPath = `${user.id}/sows/${sowData.id}/registration-${Date.now()}.${registrationFile.name.split('.').pop()}`;
        const { error: docError } = await supabase.storage
          .from('sow-tracker')
          .upload(docPath, registrationFile);

        if (docError) throw new Error(`Document upload failed: ${docError.message}`);

        const { data: { publicUrl } } = supabase.storage
          .from('sow-tracker')
          .getPublicUrl(docPath);
        registrationDocUrl = publicUrl;
      }

      // Update sow with file URLs if any were uploaded
      if ((photoUrl || registrationDocUrl) && sowData) {
        const { error: updateError } = await supabase
          .from('sows')
          .update({
            photo_url: photoUrl,
            registration_document_url: registrationDocUrl,
          })
          .eq('id', sowData.id);

        if (updateError) throw updateError;
      }

      // If the sow has farrowed before, create a placeholder farrowing record
      if (formData.has_farrowed_before && sowData) {
        const placeholderDate = new Date();
        placeholderDate.setFullYear(placeholderDate.getFullYear() - 1);
        const placeholderDateStr = placeholderDate.toISOString().split('T')[0];

        const { error: farrowingError } = await supabase
          .from('farrowings')
          .insert([{
            user_id: user.id,
            sow_id: sowData.id,
            breeding_date: placeholderDateStr,
            expected_farrowing_date: placeholderDateStr, // Will be overridden by trigger
            notes: 'Placeholder record - sow has farrowed before. Add actual farrowing details later.',
          }]);

        if (farrowingError) throw farrowingError;
      }

      // Success! Redirect to home
      router.push('/');
    } catch (err: any) {
      // Check for duplicate ear tag error
      if (err.message?.includes('duplicate key') || err.code === '23505') {
        setError(`Ear tag "${formData.ear_tag}" is already in use. Please use a different ear tag or leave it blank to auto-generate.`);
      } else {
        setError(err.message || 'Failed to add sow');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === 'checkbox' ? target.checked : target.value;

    setFormData({
      ...formData,
      [target.name]: value,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-red-700">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <PiggyBank className="h-8 w-8 text-red-700" />
            <h1 className="text-2xl font-bold text-gray-900">Sow Tracker</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add New Sow</CardTitle>
            <CardDescription>
              Register a new sow in your farm management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="ear_tag">Ear Tag</Label>
                <Input
                  id="ear_tag"
                  name="ear_tag"
                  value={formData.ear_tag}
                  onChange={handleChange}
                  placeholder="e.g., SOW-025 (leave blank to auto-generate)"
                />
                <p className="text-sm text-muted-foreground">
                  Optional - unique identifier will be auto-generated if not provided
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Sow Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Betsy, Willow (optional)"
                />
                <p className="text-sm text-muted-foreground">
                  Optional friendly name for the sow
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date">
                  Birth Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="birth_date"
                  name="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="breed">
                  Breed <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="breed"
                  name="breed"
                  value={formData.breed}
                  onChange={handleChange}
                  placeholder="e.g., Yorkshire, Landrace, Duroc"
                  required
                />
              </div>

              {/* Lineage/Pedigree Section */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Lineage / Pedigree (Optional)</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Track genetic history for breeding program and genealogy records
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sire_name">Sire (Father)</Label>
                    <Input
                      id="sire_name"
                      name="sire_name"
                      value={formData.sire_name}
                      onChange={handleChange}
                      placeholder="e.g., Duke, BOAR-001"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the name or ear tag of the sire
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dam_name">Dam (Mother)</Label>
                    <Input
                      id="dam_name"
                      name="dam_name"
                      value={formData.dam_name}
                      onChange={handleChange}
                      placeholder="e.g., Bella, SOW-042"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the name or ear tag of the dam
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="right_ear_notch">Right Ear Notch</Label>
                  <Input
                    id="right_ear_notch"
                    name="right_ear_notch"
                    type="number"
                    min="0"
                    value={formData.right_ear_notch}
                    onChange={handleChange}
                    placeholder="Number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="left_ear_notch">Left Ear Notch</Label>
                  <Input
                    id="left_ear_notch"
                    name="left_ear_notch"
                    type="number"
                    min="0"
                    value={formData.left_ear_notch}
                    onChange={handleChange}
                    placeholder="Number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration_number">Registration Number</Label>
                <Input
                  id="registration_number"
                  name="registration_number"
                  value={formData.registration_number}
                  onChange={handleChange}
                  placeholder="Purebred registration number (optional)"
                />
                <p className="text-sm text-muted-foreground">
                  For registered purebred sows only
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">Sow Photo</Label>

                {/* Photo Preview */}
                {photoPreview && (
                  <div className="relative inline-block">
                    <img
                      src={photoPreview}
                      alt="Sow preview"
                      className="max-w-xs rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Photo Options */}
                {!photoPreview && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      variant="outline"
                      className="flex-1"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Take Photo
                    </Button>
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="flex-1"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Photo
                    </Button>
                  </div>
                )}

                {/* Hidden camera input (opens camera directly) */}
                <Input
                  ref={cameraInputRef}
                  id="camera"
                  name="camera"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Hidden file input (opens gallery/file picker) */}
                <Input
                  ref={fileInputRef}
                  id="photo"
                  name="photo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <p className="text-sm text-muted-foreground">
                  Take a photo with your camera or upload an existing image (optional)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration_document">Registration Document</Label>
                <Input
                  id="registration_document"
                  name="registration_document"
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={(e) => setRegistrationFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground">
                  Upload registration paperwork (optional)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="culled">Culled</option>
                  <option value="sold">Sold</option>
                </Select>
              </div>

              <div className="flex items-center space-x-2 py-2">
                <input
                  type="checkbox"
                  id="has_farrowed_before"
                  name="has_farrowed_before"
                  checked={formData.has_farrowed_before}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-red-700 focus:ring-red-600"
                />
                <Label htmlFor="has_farrowed_before" className="cursor-pointer">
                  This sow has farrowed before
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional information about this sow..."
                  rows={4}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Adding Sow...' : 'Add Sow'}
                </Button>
                <Link href="/">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
