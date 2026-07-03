'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from '@/lib/supabase';
import { Camera, Upload, X } from "lucide-react";
import Link from 'next/link';
import { toast } from 'sonner';

export default function AddBoarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    ear_tag: '',
    name: '',
    birth_date: '',
    breed: '',
    status: 'active' as 'active' | 'culled' | 'sold',
    ownership_type: 'owned' as 'owned' | 'borrowed' | 'rented',
    notes: '',
    right_ear_notch: '',
    left_ear_notch: '',
    registration_number: '',
    registration_status: 'unregistered' as 'unregistered' | 'pending' | 'registered',
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
      if (!user) {
        setError('You must be logged in to add a boar');
        setLoading(false);
        return;
      }

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
        setError('No organization found. Please contact support or create an organization first.');
        setLoading(false);
        return;
      }

      // Generate ear tag if not provided
      let earTag = formData.ear_tag.trim();
      if (!earTag) {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        earTag = `BOAR-${date}-${random}`;
      }

      // Insert the boar first (without files) to establish RLS permissions
      const { data: boarData, error: insertError} = await supabase
        .from('boars')
        .insert([{
          user_id: user.id,
          organization_id: orgMember.organization_id,
          ear_tag: earTag,
          name: formData.name || null,
          birth_date: formData.birth_date,
          breed: formData.breed,
          status: formData.status,
          ownership_type: formData.ownership_type,
          notes: formData.notes || null,
          right_ear_notch: formData.right_ear_notch ? parseInt(formData.right_ear_notch) : null,
          left_ear_notch: formData.left_ear_notch ? parseInt(formData.left_ear_notch) : null,
          registration_number: formData.registration_number || null,
          registration_status: formData.registration_status,
          sire_name: formData.sire_name || null,
          dam_name: formData.dam_name || null,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      let photoUrl: string | null = null;
      let registrationDocUrl: string | null = null;

      // Now upload files after boar record exists (for RLS permissions)
      if (photoFile && boarData) {
        const photoPath = `${user.id}/boars/${boarData.id}/photo-${Date.now()}.${photoFile.name.split('.').pop()}`;
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
      if (registrationFile && boarData) {
        const docPath = `${user.id}/boars/${boarData.id}/registration-${Date.now()}.${registrationFile.name.split('.').pop()}`;
        const { error: docError } = await supabase.storage
          .from('sow-tracker')
          .upload(docPath, registrationFile);

        if (docError) throw new Error(`Document upload failed: ${docError.message}`);

        const { data: { publicUrl } } = supabase.storage
          .from('sow-tracker')
          .getPublicUrl(docPath);
        registrationDocUrl = publicUrl;
      }

      // Update boar with file URLs if any were uploaded
      if ((photoUrl || registrationDocUrl) && boarData) {
        const { error: updateError } = await supabase
          .from('boars')
          .update({
            photo_url: photoUrl,
            registration_document_url: registrationDocUrl,
          })
          .eq('id', boarData.id);

        if (updateError) throw updateError;
      }

      toast.success('Boar added successfully!');
      router.push('/boars');
    } catch (err: any) {
      if (err.message?.includes('duplicate key') || err.code === '23505') {
        setError(`Ear tag "${formData.ear_tag}" is already in use. Please use a different ear tag or leave it blank to auto-generate.`);
      } else {
        setError(err.message || 'Failed to add boar');
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
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Add Boar</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Register a new boar in your farm management system
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-due-bg border border-due/30 text-due px-4 py-3 rounded-md">
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
                  placeholder="e.g., BOAR-025 (leave blank to auto-generate)"
                />
                <p className="text-sm text-muted-foreground">
                  Optional - unique identifier will be auto-generated if not provided
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Boar Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Duke, Max, Chief (optional)"
                />
                <p className="text-sm text-muted-foreground">
                  Optional friendly name for the boar
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

              <div className="space-y-2">
                <Label htmlFor="ownership_type">
                  Ownership Type <span className="text-red-500">*</span>
                </Label>
                <select
                  id="ownership_type"
                  name="ownership_type"
                  value={formData.ownership_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
                  required
                >
                  <option value="owned">Owned (Farm owns this boar)</option>
                  <option value="borrowed">Borrowed (Temporary from another farm)</option>
                  <option value="rented">Rented (Paid rental arrangement)</option>
                </select>
                <p className="text-sm text-muted-foreground">
                  Specify whether you own this boar or if it&apos;s borrowed/rented
                </p>
              </div>

              {/* Lineage/Pedigree Section */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-foreground mb-3">Lineage / Pedigree (Optional)</h3>
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
                  For registered purebred boars only
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration_status">Registration Status</Label>
                <select
                  id="registration_status"
                  name="registration_status"
                  value={formData.registration_status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="unregistered">Unregistered</option>
                  <option value="pending">Registration pending</option>
                  <option value="registered">Registered</option>
                </select>
                <p className="text-sm text-muted-foreground">
                  Whether papers are in hand, applied for, or not registered
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">Boar Photo</Label>

                {/* Photo Preview */}
                {photoPreview && (
                  <div className="relative inline-block">
                    <img
                      src={photoPreview}
                      alt="Boar preview"
                      className="max-w-xs rounded-lg border-2 border-border"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -top-2 -right-2 bg-brand text-brand-foreground rounded-full p-1 hover:bg-brand"
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

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional information about this boar..."
                  rows={4}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Adding Boar...' : 'Add Boar'}
                </Button>
                <Link href="/boars">
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
