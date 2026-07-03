'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Camera, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/lib/organization-context';
import { useSettings } from '@/lib/settings-context';

type Piglet = {
  id: string;
  ear_tag: string | null;
  right_ear_notch: number | null;
  left_ear_notch: number | null;
  birth_weight: number;
  weaning_weight: number;
  weaned_date: string;
  status: string;
  notes: string | null;
  sire_id: string | null;
  dam_id: string | null;
  registration_number?: string | null;
  registration_status?: string | null;
};

type PigletEditModalProps = {
  piglet: Piglet | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function PigletEditModal({
  piglet,
  isOpen,
  onClose,
  onSuccess,
}: PigletEditModalProps) {
  const { selectedOrganizationId } = useOrganization();
  const { settings } = useSettings();
  const wu = settings?.weight_unit || 'kg';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    ear_tag: '',
    right_ear_notch: '',
    left_ear_notch: '',
    birth_weight: '',
    weaning_weight: '',
    status: 'weaned',
    notes: '',
    sire_id: '',
    dam_id: '',
    registration_number: '',
    registration_status: 'unregistered',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [availableBoars, setAvailableBoars] = useState<any[]>([]);
  const [availableSows, setAvailableSows] = useState<any[]>([]);

  useEffect(() => {
    if (piglet && isOpen) {
      setFormData({
        ear_tag: piglet.ear_tag || '',
        right_ear_notch: piglet.right_ear_notch?.toString() || '',
        left_ear_notch: piglet.left_ear_notch?.toString() || '',
        birth_weight: piglet.birth_weight?.toString() || '',
        weaning_weight: piglet.weaning_weight?.toString() || '',
        status: piglet.status,
        notes: piglet.notes || '',
        sire_id: piglet.sire_id || '',
        dam_id: piglet.dam_id || '',
        registration_number: piglet.registration_number || '',
        registration_status: piglet.registration_status || 'unregistered',
      });
      setCurrentPhotoUrl((piglet as any).photo_url || null);
      setPhotoFile(null);
      setPhotoPreview(null);
      fetchLineageOptions();
    }
  }, [piglet, isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setCurrentPhotoUrl(null); // cleared → saved as null
    if (cameraRef.current) cameraRef.current.value = '';
    if (fileRef.current) fileRef.current.value = '';
  };

  // Upload a newly-picked photo and return the URL to persist; otherwise keep
  // whatever currentPhotoUrl is (null when the user removed it).
  const resolvePhotoUrl = async (): Promise<string | null> => {
    if (!photoFile || !piglet) return currentPhotoUrl;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return currentPhotoUrl;
    const path = `${user.id}/piglets/${piglet.id}/photo-${Date.now()}.${photoFile.name.split('.').pop()}`;
    const { error: upErr } = await supabase.storage.from('sow-tracker').upload(path, photoFile, { upsert: true });
    if (upErr) throw new Error(`Photo upload failed: ${upErr.message}`);
    return supabase.storage.from('sow-tracker').getPublicUrl(path).data.publicUrl;
  };

  const fetchLineageOptions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch available boars for sire selection
      const { data: boars, error: boarsError } = await supabase
        .from('boars')
        .select('id, ear_tag, name, breed')
        .eq('organization_id', selectedOrganizationId)
        .order('ear_tag');

      if (boarsError) throw boarsError;
      setAvailableBoars(boars || []);

      // Fetch available sows for dam selection
      const { data: sows, error: sowsError } = await supabase
        .from('sows')
        .select('id, ear_tag, name, breed')
        .eq('organization_id', selectedOrganizationId)
        .order('ear_tag');

      if (sowsError) throw sowsError;
      setAvailableSows(sows || []);
    } catch (err: any) {
      console.error('Failed to fetch lineage options:', err.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      if (!piglet) return;

      // Validate that at least one identification method is provided
      if (!formData.ear_tag && !formData.right_ear_notch && !formData.left_ear_notch) {
        setError('Please provide either an ear tag or ear notch');
        setLoading(false);
        return;
      }

      // Validate weights if provided (must be positive)
      if (formData.birth_weight && parseFloat(formData.birth_weight) <= 0) {
        setError('Birth weight must be greater than 0');
        setLoading(false);
        return;
      }

      if (formData.weaning_weight && parseFloat(formData.weaning_weight) <= 0) {
        setError('Weaning weight must be greater than 0');
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('piglets')
        .update({
          ear_tag: formData.ear_tag || null,
          right_ear_notch: formData.right_ear_notch ? parseInt(formData.right_ear_notch) : null,
          left_ear_notch: formData.left_ear_notch ? parseInt(formData.left_ear_notch) : null,
          birth_weight: formData.birth_weight ? parseFloat(formData.birth_weight) : null,
          weaning_weight: formData.weaning_weight ? parseFloat(formData.weaning_weight) : null,
          status: formData.status,
          notes: formData.notes || null,
          sire_id: formData.sire_id || null,
          dam_id: formData.dam_id || null,
          registration_number: formData.registration_number.trim() || null,
          registration_status: formData.registration_status,
          photo_url: await resolvePhotoUrl(),
        })
        .eq('id', piglet.id);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update piglet');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !piglet) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card text-card-foreground rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-card border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            Edit Piglet Details
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="bg-due-bg border border-due/30 text-due px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="bg-info-bg border border-info/25 rounded-lg p-3">
              <p className="text-sm text-info">
                Editing piglet: <strong>{piglet.ear_tag || `Notch ${piglet.right_ear_notch}-${piglet.left_ear_notch}`}</strong>
              </p>
            </div>

            {/* Photo */}
            <div className="space-y-2">
              <Label>Photo</Label>
              {(photoPreview || currentPhotoUrl) ? (
                <div className="relative inline-block">
                  <img src={photoPreview || currentPhotoUrl || ''} alt="Piglet"
                    className="h-32 w-32 object-cover rounded-lg border-2 border-border" />
                  <button type="button" onClick={removePhoto}
                    className="absolute -top-2 -right-2 bg-due text-white rounded-full p-1">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => cameraRef.current?.click()}>
                    <Camera className="mr-2 h-4 w-4" /> Take Photo
                  </Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={() => fileRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Upload
                  </Button>
                </div>
              )}
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </div>

            {/* Identification */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-foreground mb-3">Identification</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ear_tag">Ear Tag</Label>
                  <Input
                    id="ear_tag"
                    name="ear_tag"
                    type="text"
                    value={formData.ear_tag}
                    onChange={handleChange}
                    placeholder="e.g., P001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="right_ear_notch">Right Ear Notch</Label>
                  <Input
                    id="right_ear_notch"
                    name="right_ear_notch"
                    type="number"
                    min="0"
                    value={formData.right_ear_notch}
                    onChange={handleChange}
                    placeholder="0-9"
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
                    placeholder="0-9"
                  />
                </div>
              </div>
            </div>

            {/* Weights */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-foreground mb-3">Weight Data</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birth_weight">
                    Birth Weight ({wu}) (Optional)
                  </Label>
                  <Input
                    id="birth_weight"
                    name="birth_weight"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.birth_weight}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weaning_weight">
                    Weaning Weight ({wu}) (Optional)
                  </Label>
                  <Input
                    id="weaning_weight"
                    name="weaning_weight"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.weaning_weight}
                    onChange={handleChange}
                  />
                </div>
              </div>
              {formData.birth_weight && formData.weaning_weight && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Weight gain: <span className="font-medium text-brand">
                    +{(parseFloat(formData.weaning_weight) - parseFloat(formData.birth_weight)).toFixed(2)} {wu}
                  </span>
                </div>
              )}
            </div>

            {/* Lineage / Pedigree */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-foreground mb-3">Lineage / Pedigree (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sire_id">Sire (Father)</Label>
                  <select
                    id="sire_id"
                    name="sire_id"
                    value={formData.sire_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="">-- Select Boar --</option>
                    {availableBoars.map((boar) => (
                      <option key={boar.id} value={boar.id}>
                        {boar.ear_tag}{boar.name && ` - ${boar.name}`} ({boar.breed})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dam_id">Dam (Mother)</Label>
                  <select
                    id="dam_id"
                    name="dam_id"
                    value={formData.dam_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="">-- Select Sow --</option>
                    {availableSows.map((sow) => (
                      <option key={sow.id} value={sow.id}>
                        {sow.ear_tag}{sow.name && ` - ${sow.name}`} ({sow.breed})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Registration */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-foreground mb-3">Registration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registration_number">Registration #</Label>
                  <Input
                    id="registration_number"
                    name="registration_number"
                    value={formData.registration_number}
                    onChange={handleChange}
                    placeholder="Association reg. number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registration_status">Status</Label>
                  <select
                    id="registration_status"
                    name="registration_status"
                    value={formData.registration_status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="unregistered">Unregistered</option>
                    <option value="pending">Registration pending</option>
                    <option value="registered">Registered</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-foreground mb-3">Status</h3>
              <div className="space-y-2">
                <Label htmlFor="status">
                  Current Status <span className="text-due">*</span>
                </Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
                  required
                >
                  <option value="weaned">Weaned</option>
                  <option value="sold">Sold</option>
                  <option value="died">Died</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-foreground mb-3">Notes</h3>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any observations, treatments, or special information..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="border-t px-6 py-4 bg-secondary">
            <div className="flex gap-3">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
