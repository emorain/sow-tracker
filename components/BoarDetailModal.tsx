'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { X, Calendar, PiggyBank, Camera, Upload, Trash2, Edit2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useOrganization } from '@/lib/organization-context';

type Boar = {
  id: string;
  ear_tag: string;
  name: string | null;
  birth_date: string;
  breed: string;
  status: 'active' | 'culled' | 'sold';
  photo_url: string | null;
  right_ear_notch: number | null;
  left_ear_notch: number | null;
  registration_number: string | null;
  notes: string | null;
  created_at: string;
  sire_name: string | null;
  dam_name: string | null;
};

type Breeding = {
  id: string;
  sow_ear_tag: string;
  sow_name: string | null;
  breeding_date: string;
  expected_farrowing_date: string;
  actual_farrowing_date: string | null;
  breeding_method: 'natural' | 'ai' | null;
};

type HealthRecord = {
  id: string;
  record_type: string;
  record_date: string;
  title: string;
  description: string | null;
  dosage: string | null;
  cost: number | null;
  administered_by: string | null;
  veterinarian: string | null;
  next_due_date: string | null;
  created_at: string;
};

type BoarDetailModalProps = {
  boar: Boar | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
};

export default function BoarDetailModal({ boar, isOpen, onClose, onUpdate }: BoarDetailModalProps) {
  const { selectedOrganizationId } = useOrganization();
  const [breedings, setBreedings] = useState<Breeding[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    breed: '',
    status: 'active' as 'active' | 'culled' | 'sold',
    notes: '',
    right_ear_notch: '',
    left_ear_notch: '',
    registration_number: '',
    sire_name: '',
    dam_name: '',
  });

  // Health records state
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [showHealthHistory, setShowHealthHistory] = useState(false);
  const [showAddHealthRecord, setShowAddHealthRecord] = useState(false);
  const [healthForm, setHealthForm] = useState({
    record_type: 'vaccine',
    record_date: new Date().toISOString().split('T')[0],
    title: '',
    description: '',
    dosage: '',
    cost: '',
    administered_by: '',
    veterinarian: '',
    next_due_date: '',
  });

  useEffect(() => {
    if (boar && isOpen) {
      fetchBreedings();
      fetchHealthRecords();
      setCurrentPhotoUrl(boar.photo_url);
      setPhotoPreview(null);
      setPhotoFile(null);
      setShowAddHealthRecord(false);
      setEditForm({
        name: boar.name || '',
        breed: boar.breed,
        status: boar.status,
        notes: boar.notes || '',
        right_ear_notch: boar.right_ear_notch?.toString() || '',
        left_ear_notch: boar.left_ear_notch?.toString() || '',
        registration_number: boar.registration_number || '',
        sire_name: boar.sire_name || '',
        dam_name: boar.dam_name || '',
      });
      setHealthForm({
        record_type: 'vaccine',
        record_date: new Date().toISOString().split('T')[0],
        title: '',
        description: '',
        dosage: '',
        cost: '',
        administered_by: '',
        veterinarian: '',
        next_due_date: '',
      });
    }
  }, [boar, isOpen]);

  const fetchBreedings = async () => {
    if (!boar) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('farrowings')
        .select(`
          id,
          breeding_date,
          expected_farrowing_date,
          actual_farrowing_date,
          sows (ear_tag, name)
        `)
        .eq('boar_id', boar.id)
        .order('breeding_date', { ascending: false });

      if (error) throw error;

      const formattedBreedings = (data || []).map((b: any) => ({
        id: b.id,
        sow_ear_tag: b.sows?.ear_tag || 'Unknown',
        sow_name: b.sows?.name,
        breeding_date: b.breeding_date,
        expected_farrowing_date: b.expected_farrowing_date,
        actual_farrowing_date: b.actual_farrowing_date,
        breeding_method: b.breeding_method,
      }));

      setBreedings(formattedBreedings);
    } catch (err: any) {
      toast.error(`Failed to fetch breedings: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthRecords = async () => {
    if (!boar) return;

    try {
      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .eq('boar_id', boar.id)
        .order('record_date', { ascending: false });

      if (error) throw error;
      setHealthRecords(data || []);
    } catch (err: any) {
      console.error('Failed to fetch health records:', err.message);
    }
  };

  const enterEditMode = () => {
    if (!boar) return;

    setEditForm({
      name: boar.name || '',
      breed: boar.breed,
      status: boar.status,
      notes: boar.notes || '',
      right_ear_notch: boar.right_ear_notch?.toString() || '',
      left_ear_notch: boar.left_ear_notch?.toString() || '',
      registration_number: boar.registration_number || '',
      sire_name: boar.sire_name || '',
      dam_name: boar.dam_name || '',
    });

    setIsEditing(true);
  };

  const handleAddHealthRecord = async () => {
    if (!boar) return;

    if (!healthForm.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const { error } = await supabase
        .from('health_records')
        .insert([{
          user_id: user.id,
          organization_id: selectedOrganizationId,
          animal_type: 'boar',
          boar_id: boar.id,
          record_type: healthForm.record_type,
          record_date: healthForm.record_date,
          title: healthForm.title.trim(),
          description: healthForm.description.trim() || null,
          dosage: healthForm.dosage.trim() || null,
          cost: healthForm.cost ? parseFloat(healthForm.cost) : null,
          administered_by: healthForm.administered_by.trim() || null,
          veterinarian: healthForm.veterinarian.trim() || null,
          next_due_date: healthForm.next_due_date || null,
        }]);

      if (error) throw error;

      toast.success('Health record added successfully!');
      setShowAddHealthRecord(false);
      setHealthForm({
        record_type: 'vaccine',
        record_date: new Date().toISOString().split('T')[0],
        title: '',
        description: '',
        dosage: '',
        cost: '',
        administered_by: '',
        veterinarian: '',
        next_due_date: '',
      });
      fetchHealthRecords();
    } catch (err: any) {
      toast.error(`Failed to add health record: ${err.message}`);
    }
  };

  const handleDeleteHealthRecord = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this health record?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('health_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      toast.success('Health record deleted successfully!');
      fetchHealthRecords();
    } catch (err: any) {
      toast.error(`Failed to delete health record: ${err.message}`);
    }
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
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadPhoto = async () => {
    if (!photoFile || !boar) return;

    setUploading(true);
    try {
      const photoPath = `boars/${boar.ear_tag}/photo-${Date.now()}.${photoFile.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('sow-tracker')
        .upload(photoPath, photoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('sow-tracker')
        .getPublicUrl(photoPath);

      const { error: updateError } = await supabase
        .from('boars')
        .update({ photo_url: publicUrl })
        .eq('id', boar.id);

      if (updateError) throw updateError;

      setCurrentPhotoUrl(publicUrl);
      setPhotoFile(null);
      setPhotoPreview(null);
      toast.success('Photo uploaded successfully!');
      onUpdate?.();
    } catch (err: any) {
      toast.error(`Failed to upload photo: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!boar) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('boars')
        .update({
          name: editForm.name || null,
          breed: editForm.breed,
          status: editForm.status,
          notes: editForm.notes || null,
          right_ear_notch: editForm.right_ear_notch ? parseInt(editForm.right_ear_notch) : null,
          left_ear_notch: editForm.left_ear_notch ? parseInt(editForm.left_ear_notch) : null,
          registration_number: editForm.registration_number || null,
          sire_name: editForm.sire_name || null,
          dam_name: editForm.dam_name || null,
        })
        .eq('id', boar.id);

      if (error) throw error;

      toast.success('Boar updated successfully!');
      setIsEditing(false);
      onUpdate?.();
    } catch (err: any) {
      toast.error(`Failed to update boar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInMonths = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;
    if (years > 0) return `${years}y ${months}m`;
    return `${months}m`;
  };

  if (!isOpen || !boar) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-none sm:rounded-lg shadow-xl w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-3 sm:py-4 z-10">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <PiggyBank className="h-6 w-6 sm:h-8 sm:w-8 text-red-700" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 break-words">
                  {boar.name || boar.ear_tag}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 break-words">
                  {boar.name ? `Tag: ${boar.ear_tag} • ` : ''}
                  {boar.breed} • {calculateAge(boar.birth_date)} old
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Photo Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold">Photo</h3>
              {!isEditing && (
                <Button
                  onClick={enterEditMode}
                  variant="outline"
                  size="sm"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>

            {photoPreview ? (
              <div className="relative inline-block">
                <img
                  src={photoPreview}
                  alt="New photo preview"
                  className="max-w-full sm:max-w-xs rounded-lg border-2 border-gray-200"
                />
                <button
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="mt-2 flex gap-2">
                  <Button onClick={uploadPhoto} disabled={uploading} size="sm">
                    {uploading ? 'Uploading...' : 'Save Photo'}
                  </Button>
                  <Button onClick={removePhoto} variant="outline" size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : currentPhotoUrl ? (
              <div>
                <img
                  src={currentPhotoUrl}
                  alt={boar.name || boar.ear_tag}
                  className="max-w-full sm:max-w-xs rounded-lg border-2 border-gray-200"
                />
                <div className="mt-2 flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={() => cameraInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Take New Photo
                  </Button>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload New Photo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => cameraInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Take Photo
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Photo
                </Button>
              </div>
            )}

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Basic Info - Edit Mode */}
          {isEditing ? (
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Edit Boar Details</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_name">Name</Label>
                  <Input
                    id="edit_name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Boar name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_breed">Breed</Label>
                  <Input
                    id="edit_breed"
                    value={editForm.breed}
                    onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_status">Status</Label>
                  <Select
                    id="edit_status"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                  >
                    <option value="active">Active</option>
                    <option value="culled">Culled</option>
                    <option value="sold">Sold</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_reg">Registration Number</Label>
                  <Input
                    id="edit_reg"
                    value={editForm.registration_number}
                    onChange={(e) => setEditForm({ ...editForm, registration_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_right_notch">Right Ear Notch</Label>
                  <Input
                    id="edit_right_notch"
                    type="number"
                    value={editForm.right_ear_notch}
                    onChange={(e) => setEditForm({ ...editForm, right_ear_notch: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_left_notch">Left Ear Notch</Label>
                  <Input
                    id="edit_left_notch"
                    type="number"
                    value={editForm.left_ear_notch}
                    onChange={(e) => setEditForm({ ...editForm, left_ear_notch: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_sire_name">Sire (Father)</Label>
                  <Input
                    id="edit_sire_name"
                    value={editForm.sire_name}
                    onChange={(e) => setEditForm({ ...editForm, sire_name: e.target.value })}
                    placeholder="e.g., Duke, BOAR-001"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_dam_name">Dam (Mother)</Label>
                  <Input
                    id="edit_dam_name"
                    value={editForm.dam_name}
                    onChange={(e) => setEditForm({ ...editForm, dam_name: e.target.value })}
                    placeholder="e.g., Bella, SOW-042"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit_notes">Notes</Label>
                <Textarea
                  id="edit_notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            /* Basic Info - View Mode */
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-semibold">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Ear Tag:</span>
                  <p className="font-medium break-words">{boar.ear_tag}</p>
                </div>
                <div>
                  <span className="text-gray-600">Name:</span>
                  <p className="font-medium break-words">{boar.name || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Birth Date:</span>
                  <p className="font-medium">{formatDate(boar.birth_date)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Age:</span>
                  <p className="font-medium">{calculateAge(boar.birth_date)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Breed:</span>
                  <p className="font-medium">{boar.breed}</p>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <p className="font-medium capitalize">{boar.status}</p>
                </div>
                {boar.registration_number && (
                  <div className="sm:col-span-2">
                    <span className="text-gray-600">Registration:</span>
                    <p className="font-medium break-words">{boar.registration_number}</p>
                  </div>
                )}
                {(boar.right_ear_notch || boar.left_ear_notch) && (
                  <div>
                    <span className="text-gray-600">Ear Notches:</span>
                    <p className="font-medium">
                      Right: {boar.right_ear_notch || '—'}, Left: {boar.left_ear_notch || '—'}
                    </p>
                  </div>
                )}
              </div>
              {boar.notes && (
                <div>
                  <span className="text-gray-600 text-sm">Notes:</span>
                  <p className="mt-1 text-sm bg-gray-50 p-3 rounded break-words">{boar.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Pedigree Section */}
          {!isEditing && (boar.sire_name || boar.dam_name) && (
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-semibold">Pedigree</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {boar.sire_name && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <span className="text-xs text-blue-600 font-medium uppercase">Sire (Father)</span>
                    <p className="font-medium text-gray-900 mt-1">
                      {boar.sire_name}
                    </p>
                  </div>
                )}
                {boar.dam_name && (
                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                    <span className="text-xs text-pink-600 font-medium uppercase">Dam (Mother)</span>
                    <p className="font-medium text-gray-900 mt-1">
                      {boar.dam_name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Breeding History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold">
                Breeding History ({breedings.length})
              </h3>
              {breedings.length > 0 && (
                <Button
                  onClick={() => setShowHistory(!showHistory)}
                  variant="ghost"
                  size="sm"
                >
                  {showHistory ? 'Hide' : 'Show'}
                </Button>
              )}
            </div>

            {showHistory && breedings.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {breedings.map((breeding) => (
                  <div key={breeding.id} className="bg-gray-50 p-3 rounded-lg text-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">
                            {breeding.sow_name || breeding.sow_ear_tag}
                          </p>
                          {breeding.breeding_method && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              breeding.breeding_method === 'ai'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {breeding.breeding_method === 'ai' ? 'AI' : 'Natural'}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600">
                          Bred: {formatDate(breeding.breeding_date)}
                        </p>
                      </div>
                      <div className="text-right">
                        {breeding.actual_farrowing_date ? (
                          <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-900 text-xs">
                            Farrowed {formatDate(breeding.actual_farrowing_date)}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs">
                            Due {formatDate(breeding.expected_farrowing_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {breedings.length === 0 && (
              <p className="text-sm text-gray-600">No breeding records yet</p>
            )}
          </div>

          {/* Health & Wellness */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold">
                Health & Wellness ({healthRecords.length})
              </h3>
              <div className="flex gap-2">
                {healthRecords.length > 0 && (
                  <Button
                    onClick={() => setShowHealthHistory(!showHealthHistory)}
                    variant="ghost"
                    size="sm"
                  >
                    {showHealthHistory ? 'Hide' : 'Show'}
                  </Button>
                )}
                <Button
                  onClick={() => setShowAddHealthRecord(!showAddHealthRecord)}
                  variant="outline"
                  size="sm"
                >
                  {showAddHealthRecord ? 'Cancel' : 'Add Record'}
                </Button>
              </div>
            </div>

            {/* Add Health Record Form */}
            {showAddHealthRecord && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-blue-900">Add Health Record</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="record_type">Type</Label>
                    <Select
                      id="record_type"
                      value={healthForm.record_type}
                      onChange={(e) => setHealthForm({ ...healthForm, record_type: e.target.value })}
                    >
                      <option value="vaccine">Vaccine</option>
                      <option value="treatment">Treatment/Medication</option>
                      <option value="vet_visit">Vet Visit</option>
                      <option value="observation">Health Observation</option>
                      <option value="injury">Injury</option>
                      <option value="procedure">Procedure</option>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="record_date">Date</Label>
                    <Input
                      id="record_date"
                      type="date"
                      value={healthForm.record_date}
                      onChange={(e) => setHealthForm({ ...healthForm, record_date: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Title/Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    value={healthForm.title}
                    onChange={(e) => setHealthForm({ ...healthForm, title: e.target.value })}
                    placeholder="e.g., Rabies Vaccine, Antibiotic Treatment"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description/Notes</Label>
                  <Textarea
                    id="description"
                    value={healthForm.description}
                    onChange={(e) => setHealthForm({ ...healthForm, description: e.target.value })}
                    placeholder="Additional details..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="dosage">Dosage</Label>
                    <Input
                      id="dosage"
                      value={healthForm.dosage}
                      onChange={(e) => setHealthForm({ ...healthForm, dosage: e.target.value })}
                      placeholder="e.g., 5ml"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cost">Cost ($)</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={healthForm.cost}
                      onChange={(e) => setHealthForm({ ...healthForm, cost: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="next_due_date">Next Due Date</Label>
                    <Input
                      id="next_due_date"
                      type="date"
                      value={healthForm.next_due_date}
                      onChange={(e) => setHealthForm({ ...healthForm, next_due_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="administered_by">Administered By</Label>
                    <Input
                      id="administered_by"
                      value={healthForm.administered_by}
                      onChange={(e) => setHealthForm({ ...healthForm, administered_by: e.target.value })}
                      placeholder="Person's name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="veterinarian">Veterinarian</Label>
                    <Input
                      id="veterinarian"
                      value={healthForm.veterinarian}
                      onChange={(e) => setHealthForm({ ...healthForm, veterinarian: e.target.value })}
                      placeholder="Vet's name"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAddHealthRecord} size="sm">
                    Save Record
                  </Button>
                  <Button onClick={() => setShowAddHealthRecord(false)} variant="outline" size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Health Records List */}
            {showHealthHistory && healthRecords.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {healthRecords.map((record) => (
                  <div key={record.id} className="bg-gray-50 p-3 rounded-lg text-sm border-l-4 border-blue-500">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {record.record_type.replace('_', ' ')}
                          </span>
                          <p className="font-medium">{record.title}</p>
                        </div>
                        <p className="text-gray-600 mb-1">
                          {formatDate(record.record_date)}
                        </p>
                        {record.description && (
                          <p className="text-gray-700 text-xs mb-1">{record.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                          {record.dosage && <span>Dosage: {record.dosage}</span>}
                          {record.cost && <span>Cost: ${record.cost}</span>}
                          {record.administered_by && <span>By: {record.administered_by}</span>}
                          {record.veterinarian && <span>Vet: {record.veterinarian}</span>}
                        </div>
                        {record.next_due_date && (
                          <p className="text-xs text-orange-600 mt-1">
                            Next due: {formatDate(record.next_due_date)}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleDeleteHealthRecord(record.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {healthRecords.length === 0 && !showAddHealthRecord && (
              <p className="text-sm text-gray-600">No health records yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
