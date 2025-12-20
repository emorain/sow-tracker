'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Calendar, PiggyBank, Camera, Upload, Trash2, Edit, Save, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import RecordLitterForm from './RecordLitterForm';
import { HealthEventModal } from './HealthEventModal';
import EditFarrowingModal from './EditFarrowingModal';
import { EditBreedingModal } from './EditBreedingModal';
import { toast } from 'sonner';

type Sow = {
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
  sire_id: string | null;
  dam_id: string | null;
  sire_name: string | null;
  dam_name: string | null;
};

type Farrowing = {
  id: string;
  breeding_date: string;
  expected_farrowing_date: string;
  actual_farrowing_date: string | null;
  live_piglets: number | null;
  stillborn: number | null;
  mummified: number | null;
  notes: string | null;
  boar_id: string | null;
  breeding_method: 'natural' | 'ai' | null;
  boar_name: string | null;
  boar_ear_tag: string | null;
};

type MatrixTreatment = {
  id: string;
  batch_name: string;
  treatment_start_date: string;
  treatment_end_date: string;
  treatment_duration_days: number;
  expected_heat_date: string;
  actual_heat_date: string | null;
  bred: boolean;
  breeding_date: string | null;
  treatment_completed: boolean;
  dosage: string | null;
  lot_number: string | null;
  notes: string | null;
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

type AIDose = {
  id: string;
  dose_number: number;
  dose_date: string;
  dose_time: string;
  boar_id: string | null;
  boar_name: string | null;
  boar_ear_tag: string | null;
  notes: string | null;
};

type BreedingAttempt = {
  id: string;
  breeding_date: string;
  breeding_time: string | null;
  breeding_method: 'natural' | 'ai';
  boar_id: string | null;
  boar_description: string | null;
  pregnancy_check_date: string | null;
  pregnancy_confirmed: boolean | null;
  result: 'pending' | 'pregnant' | 'returned_to_heat' | 'aborted' | 'unknown' | null;
  farrowing_id: string | null;
  notes: string | null;
  boar_name: string | null;
  boar_ear_tag: string | null;
  created_at: string;
  ai_doses?: AIDose[];
};

type SowDetailModalProps = {
  sow: Sow | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: () => void;
};

export default function SowDetailModal({ sow, isOpen, onClose, onDelete }: SowDetailModalProps) {
  const [farrowings, setFarrowings] = useState<Farrowing[]>([]);
  const [breedingAttempts, setBreedingAttempts] = useState<BreedingAttempt[]>([]);
  const [matrixTreatments, setMatrixTreatments] = useState<MatrixTreatment[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showBreedingHistory, setShowBreedingHistory] = useState(false);
  const [showMatrixHistory, setShowMatrixHistory] = useState(false);
  const [showHealthHistory, setShowHealthHistory] = useState(false);
  const [showAddHealthRecord, setShowAddHealthRecord] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLitterForm, setShowLitterForm] = useState(false);
  const [activeFarrowingId, setActiveFarrowingId] = useState<string | null>(null);
  const [editingFarrowing, setEditingFarrowing] = useState<Farrowing | null>(null);
  const [isEditFarrowingModalOpen, setIsEditFarrowingModalOpen] = useState(false);
  const [editingBreeding, setEditingBreeding] = useState<BreedingAttempt | null>(null);
  const [isEditBreedingModalOpen, setIsEditBreedingModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    ear_tag: '',
    breed: '',
    birth_date: '',
    status: 'active' as 'active' | 'culled' | 'sold',
    right_ear_notch: '',
    left_ear_notch: '',
    registration_number: '',
    notes: '',
    sire_name: '',
    dam_name: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sow && isOpen) {
      fetchFarrowings();
      fetchBreedingAttempts();
      fetchMatrixTreatments();
      fetchHealthRecords();
      setCurrentPhotoUrl(sow.photo_url);
      setPhotoPreview(null);
      setPhotoFile(null);
    }
  }, [sow, isOpen]);

  const fetchFarrowings = async () => {
    if (!sow) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('farrowings')
        .select(`
          *,
          boars (name, ear_tag)
        `)
        .eq('sow_id', sow.id)
        .order('actual_farrowing_date', { ascending: false });

      if (error) throw error;

      // Format the data to include boar info
      const formattedData = (data || []).map((f: any) => ({
        id: f.id,
        breeding_date: f.breeding_date,
        expected_farrowing_date: f.expected_farrowing_date,
        actual_farrowing_date: f.actual_farrowing_date,
        live_piglets: f.live_piglets,
        stillborn: f.stillborn,
        mummified: f.mummified,
        notes: f.notes,
        boar_id: f.boar_id,
        breeding_method: f.breeding_method,
        boar_name: f.boars?.name || null,
        boar_ear_tag: f.boars?.ear_tag || null,
      }));

      setFarrowings(formattedData);
    } catch (err) {
      console.error('Failed to fetch farrowings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBreedingAttempts = async () => {
    if (!sow) return;

    try {
      const { data, error } = await supabase
        .from('breeding_attempts')
        .select(`
          *,
          boars (name, ear_tag)
        `)
        .eq('sow_id', sow.id)
        .order('breeding_date', { ascending: false });

      if (error) throw error;

      // Fetch AI doses for each breeding attempt
      const formattedData = await Promise.all((data || []).map(async (ba: any) => {
        let aiDoses: AIDose[] = [];

        // Only fetch AI doses if this was an AI breeding
        if (ba.breeding_method === 'ai') {
          const { data: dosesData, error: dosesError } = await supabase
            .from('ai_doses')
            .select(`
              *,
              boars (name, ear_tag)
            `)
            .eq('breeding_attempt_id', ba.id)
            .order('dose_number', { ascending: true });

          if (!dosesError && dosesData) {
            aiDoses = dosesData.map((dose: any) => ({
              id: dose.id,
              dose_number: dose.dose_number,
              dose_date: dose.dose_date,
              dose_time: dose.dose_time,
              boar_id: dose.boar_id,
              boar_name: dose.boars?.name || null,
              boar_ear_tag: dose.boars?.ear_tag || null,
              notes: dose.notes,
            }));
          }
        }

        return {
          id: ba.id,
          breeding_date: ba.breeding_date,
          breeding_time: ba.breeding_time,
          breeding_method: ba.breeding_method,
          boar_id: ba.boar_id,
          boar_description: ba.boar_description,
          pregnancy_check_date: ba.pregnancy_check_date,
          pregnancy_confirmed: ba.pregnancy_confirmed,
          result: ba.result,
          farrowing_id: ba.farrowing_id,
          notes: ba.notes,
          boar_name: ba.boars?.name || null,
          boar_ear_tag: ba.boars?.ear_tag || null,
          created_at: ba.created_at,
          ai_doses: aiDoses,
        };
      }));

      setBreedingAttempts(formattedData);
    } catch (err) {
      console.error('Failed to fetch breeding attempts:', err);
    }
  };

  const fetchMatrixTreatments = async () => {
    if (!sow) return;

    try {
      const { data, error} = await supabase
        .from('matrix_treatments')
        .select('*')
        .eq('sow_id', sow.id)
        .order('treatment_start_date', { ascending: false });

      if (error) throw error;
      setMatrixTreatments(data || []);
    } catch (err) {
      console.error('Failed to fetch Estrus Synchronization treatments:', err);
    }
  };


  const fetchHealthRecords = async () => {
    if (!sow) return;

    try {
      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .eq('sow_id', sow.id)
        .order('record_date', { ascending: false });

      if (error) throw error;
      setHealthRecords(data || []);
    } catch (err: any) {
      console.error('Failed to fetch health records:', err.message);
    }
  };

  const handleAddHealthRecord = async () => {
    if (!sow) return;

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
          animal_type: 'sow',
          sow_id: sow.id,
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

      // Reset form
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
      console.error('Error adding health record:', err);
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
      console.error('Error deleting health record:', err);
      toast.error(`Failed to delete health record: ${err.message}`);
    }
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInMonths = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;

    if (years > 0) {
      return `${years}y ${months}m`;
    }
    return `${months}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-red-100 text-red-900';
      case 'culled':
        return 'bg-red-100 text-red-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFarrowingSummary = () => {
    if (farrowings.length === 0) {
      return { total: 0, totalPiglets: 0, avgLitter: 0, totalStillborn: 0, totalMummified: 0, lastDate: null };
    }

    const totalPiglets = farrowings.reduce((sum, f) => sum + (f.live_piglets || 0), 0);
    const totalStillborn = farrowings.reduce((sum, f) => sum + (f.stillborn || 0), 0);
    const totalMummified = farrowings.reduce((sum, f) => sum + (f.mummified || 0), 0);
    const avgLitter = totalPiglets / farrowings.length;
    const lastFarrowing = farrowings[0]; // Already sorted by date descending

    return {
      total: farrowings.length,
      totalPiglets,
      avgLitter: Math.round(avgLitter * 10) / 10,
      totalStillborn,
      totalMummified,
      lastDate: lastFarrowing?.actual_farrowing_date,
      lastLiveCount: lastFarrowing?.live_piglets,
    };
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
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

  const uploadPhoto = async () => {
    if (!photoFile || !sow) return;

    setUploading(true);
    try {
      // Upload photo to Supabase Storage
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${sow.id}-${Date.now()}.${fileExt}`;
      const filePath = `sow-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('sow-photos')
        .upload(filePath, photoFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('sow-photos')
        .getPublicUrl(filePath);

      // Update sow record with new photo URL
      const { error: updateError } = await supabase
        .from('sows')
        .update({ photo_url: publicUrl })
        .eq('id', sow.id);

      if (updateError) throw updateError;

      // Update local state
      setCurrentPhotoUrl(publicUrl);
      setPhotoPreview(null);
      setPhotoFile(null);

      // Update the sow object (this will trigger a refresh in parent component)
      if (sow) {
        sow.photo_url = publicUrl;
      }

      toast.success('Photo uploaded successfully!');
    } catch (err: any) {
      console.error('Error uploading photo:', err);
      toast.error('Failed to upload photo: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async () => {
    if (!sow || !currentPhotoUrl) return;

    setUploading(true);
    try {
      // Update sow record to remove photo URL
      const { error: updateError } = await supabase
        .from('sows')
        .update({ photo_url: null })
        .eq('id', sow.id);

      if (updateError) throw updateError;

      // Update local state
      setCurrentPhotoUrl(null);

      // Update the sow object
      if (sow) {
        sow.photo_url = null;
      }

      toast.success('Photo deleted successfully!');
    } catch (err: any) {
      console.error('Error deleting photo:', err);
      toast.error('Failed to delete photo: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const deleteFarrowing = async (farrowingId: string) => {
    if (!sow) return;

    // Confirm deletion
    if (!confirm('Are you sure you want to delete this farrowing record? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('farrowings')
        .delete()
        .eq('id', farrowingId);

      if (error) throw error;

      toast.success('Farrowing record deleted successfully!');

      // Refresh farrowing list
      await fetchFarrowings();
    } catch (err: any) {
      console.error('Error deleting farrowing:', err);
      toast.error('Failed to delete farrowing: ' + (err.message || 'Unknown error'));
    }
  };

  const deleteSow = async () => {
    if (!sow) return;

    // Confirm deletion with strong warning
    const confirmMessage = `Are you sure you want to delete ${sow.name || sow.ear_tag}?\n\nThis will permanently delete:\n- The sow record\n- All farrowing records (${farrowings.length})\n- All piglet records\n- All estrus synchronization treatments\n- All location history\n\nThis action CANNOT be undone!`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      // Delete related records first to avoid foreign key constraint violations
      // Order matters: delete children before parents

      // 1. Delete piglets (depend on farrowings)
      const { error: pigletsError } = await supabase
        .from('piglets')
        .delete()
        .eq('user_id', user.id)
        .in('farrowing_id', farrowings.map(f => f.id));

      if (pigletsError) {
        console.error('Error deleting piglets:', pigletsError);
        // Continue anyway - might not have piglets
      }

      // 2. Delete farrowings (depend on sow)
      const { error: farrowingsError } = await supabase
        .from('farrowings')
        .delete()
        .eq('sow_id', sow.id);

      if (farrowingsError) throw farrowingsError;

      // 3. Delete estrus synchronization treatments
      const { error: matrixError } = await supabase
        .from('matrix_treatments')
        .delete()
        .eq('sow_id', sow.id);

      if (matrixError) {
        console.error('Error deleting estrus synchronization treatments:', matrixError);
        // Continue anyway
      }

      // 4. Delete location history (if table exists)
      const { error: locationError } = await supabase
        .from('sow_location_history')
        .delete()
        .eq('sow_id', sow.id);

      if (locationError) {
        console.error('Error deleting location history:', locationError);
        // Continue anyway - table might not exist
      }

      // 5. Finally delete the sow
      const { error: sowError } = await supabase
        .from('sows')
        .delete()
        .eq('id', sow.id);

      if (sowError) throw sowError;

      toast.success('Sow and all related records deleted successfully!');

      // Close modal and notify parent to refresh
      onClose();
      if (onDelete) {
        onDelete();
      }
    } catch (err: any) {
      console.error('Error deleting sow:', err);
      toast.error('Failed to delete sow: ' + (err.message || 'Unknown error'));
    }
  };


  const enterEditMode = async () => {
    if (!sow) return;
    setEditForm({
      name: sow.name || '',
      ear_tag: sow.ear_tag,
      breed: sow.breed,
      birth_date: sow.birth_date,
      status: sow.status,
      right_ear_notch: sow.right_ear_notch?.toString() || '',
      left_ear_notch: sow.left_ear_notch?.toString() || '',
      registration_number: sow.registration_number || '',
      notes: sow.notes || '',
      sire_name: sow.sire_name || '',
      dam_name: sow.dam_name || '',
    });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  const saveEdit = async () => {
    if (!sow) return;

    setLoading(true);
    try {
      // Validate required fields
      if (!editForm.ear_tag.trim()) {
        toast.error('Ear tag is required');
        setLoading(false);
        return;
      }

      if (!editForm.breed.trim()) {
        toast.error('Breed is required');
        setLoading(false);
        return;
      }

      // Prepare update data
      const updateData = {
        name: editForm.name.trim() || null,
        ear_tag: editForm.ear_tag.trim(),
        breed: editForm.breed.trim(),
        birth_date: editForm.birth_date,
        status: editForm.status,
        right_ear_notch: editForm.right_ear_notch ? parseInt(editForm.right_ear_notch) : null,
        left_ear_notch: editForm.left_ear_notch ? parseInt(editForm.left_ear_notch) : null,
        registration_number: editForm.registration_number.trim() || null,
        notes: editForm.notes.trim() || null,
        sire_name: editForm.sire_name.trim() || null,
        dam_name: editForm.dam_name.trim() || null,
      };

      const { error } = await supabase
        .from('sows')
        .update(updateData)
        .eq('id', sow.id);

      if (error) throw error;

      // Update local sow object
      Object.assign(sow, updateData);

      toast.success('Sow details updated successfully');
      setIsEditing(false);

      // Notify parent to refresh if needed
      if (onDelete) {
        onDelete();
      }
    } catch (err: any) {
      console.error('Error updating sow:', err);
      toast.error('Failed to update sow: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !sow) return null;

  const summary = getFarrowingSummary();
  const isGilt = farrowings.length === 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-none sm:rounded-lg shadow-xl w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
              <PiggyBank className="h-5 w-5 sm:h-6 sm:w-6 text-red-700 flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 break-words">
                  {sow.name || sow.ear_tag}
                </h2>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {isGilt && (
                    <span className="px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Gilt
                    </span>
                  )}
                  <span className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${getStatusColor(sow.status)}`}>
                    {sow.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={saveEdit}
                    disabled={loading}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1 sm:p-1.5 rounded transition-colors flex-shrink-0 disabled:opacity-50"
                    title="Save changes"
                  >
                    <Save className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={loading}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 p-1 sm:p-1.5 rounded transition-colors flex-shrink-0 disabled:opacity-50"
                    title="Cancel editing"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={enterEditMode}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 sm:p-1.5 rounded transition-colors flex-shrink-0"
                    title="Edit sow details"
                  >
                    <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  <button
                    onClick={deleteSow}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 sm:p-1.5 rounded transition-colors flex-shrink-0"
                    title="Delete sow and all records"
                  >
                    <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                  >
                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Photo Management */}
          <div className="space-y-2 sm:space-y-3">
            <label className="text-sm font-medium text-gray-700 block">Sow Photo</label>

            {/* Current Photo or Preview */}
            {(photoPreview || currentPhotoUrl) && (
              <div className="flex justify-center">
                <div className="relative inline-block w-full sm:w-auto">
                  <img
                    src={photoPreview || currentPhotoUrl || ''}
                    alt={sow.name || sow.ear_tag}
                    className="w-full sm:w-48 h-48 sm:h-48 rounded-lg object-cover border-2 border-gray-200"
                  />
                  {photoPreview ? (
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : currentPhotoUrl && (
                    <button
                      type="button"
                      onClick={deletePhoto}
                      disabled={uploading}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Photo Actions */}
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {!photoPreview && !currentPhotoUrl && (
                <>
                  <Button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Take Photo
                  </Button>
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photo
                  </Button>
                </>
              )}
              {photoPreview && (
                <Button
                  type="button"
                  onClick={uploadPhoto}
                  disabled={uploading}
                  className="bg-red-700 hover:bg-red-800 w-full sm:w-auto"
                  size="sm"
                >
                  {uploading ? 'Uploading...' : 'Save Photo'}
                </Button>
              )}
              {currentPhotoUrl && !photoPreview && (
                <>
                  <Button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Take New Photo
                  </Button>
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose from Gallery
                  </Button>
                </>
              )}
            </div>

            {/* Hidden camera input (opens camera directly) */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Hidden file input (opens gallery/file picker) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Basic Information */}
          {isEditing ? (
            <div className="space-y-4 border border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ear_tag">Ear Tag <span className="text-red-500">*</span></Label>
                  <Input
                    id="ear_tag"
                    name="ear_tag"
                    value={editForm.ear_tag}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label htmlFor="breed">Breed <span className="text-red-500">*</span></Label>
                  <Input
                    id="breed"
                    name="breed"
                    value={editForm.breed}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="birth_date">Birth Date <span className="text-red-500">*</span></Label>
                  <Input
                    id="birth_date"
                    name="birth_date"
                    type="date"
                    value={editForm.birth_date}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={editForm.status}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="active">Active</option>
                    <option value="culled">Culled</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="registration_number">Registration Number</Label>
                  <Input
                    id="registration_number"
                    name="registration_number"
                    value={editForm.registration_number}
                    onChange={handleEditChange}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label htmlFor="right_ear_notch">Right Ear Notch</Label>
                  <Input
                    id="right_ear_notch"
                    name="right_ear_notch"
                    type="number"
                    value={editForm.right_ear_notch}
                    onChange={handleEditChange}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label htmlFor="left_ear_notch">Left Ear Notch</Label>
                  <Input
                    id="left_ear_notch"
                    name="left_ear_notch"
                    type="number"
                    value={editForm.left_ear_notch}
                    onChange={handleEditChange}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label htmlFor="sire_name">Sire (Father)</Label>
                  <Input
                    id="sire_name"
                    name="sire_name"
                    value={editForm.sire_name}
                    onChange={handleEditChange}
                    placeholder="e.g., Duke, BOAR-001"
                  />
                </div>
                <div>
                  <Label htmlFor="dam_name">Dam (Mother)</Label>
                  <Input
                    id="dam_name"
                    name="dam_name"
                    value={editForm.dam_name}
                    onChange={handleEditChange}
                    placeholder="e.g., Bella, SOW-042"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={editForm.notes}
                  onChange={handleEditChange}
                  rows={3}
                  placeholder="Optional notes..."
                />
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Ear Tag</label>
                  <p className="text-base text-gray-900">{sow.ear_tag}</p>
                </div>
                {sow.name && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-base text-gray-900">{sow.name}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Breed</label>
                  <p className="text-base text-gray-900">{sow.breed}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Birth Date</label>
                  <p className="text-base text-gray-900">{formatDate(sow.birth_date)} ({calculateAge(sow.birth_date)})</p>
                </div>
                {(sow.right_ear_notch !== null || sow.left_ear_notch !== null) && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ear Notches</label>
                    <p className="text-base text-gray-900">
                      R: {sow.right_ear_notch ?? '-'} | L: {sow.left_ear_notch ?? '-'}
                    </p>
                  </div>
                )}
                {sow.registration_number && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Registration Number</label>
                    <p className="text-base text-gray-900">{sow.registration_number}</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {sow.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-base text-gray-900 whitespace-pre-wrap">{sow.notes}</p>
                </div>
              )}
            </>
          )}

          {/* Pedigree Section */}
          {(sow.sire_name || sow.dam_name) && (
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-base sm:text-lg font-semibold">Pedigree</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {sow.sire_name && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <span className="text-xs text-blue-600 font-medium uppercase">Sire (Father)</span>
                    <p className="font-medium text-gray-900 mt-1">
                      {sow.sire_name}
                    </p>
                  </div>
                )}
                {sow.dam_name && (
                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                    <span className="text-xs text-pink-600 font-medium uppercase">Dam (Mother)</span>
                    <p className="font-medium text-gray-900 mt-1">
                      {sow.dam_name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Farrowing Summary */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-red-700" />
              Farrowing Summary (Lifetime Totals)
            </h3>

            {loading ? (
              <p className="text-gray-600">Loading farrowing data...</p>
            ) : farrowings.length === 0 ? (
              <p className="text-gray-600">No farrowing records yet. This is a gilt.</p>
            ) : (
              <>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    <strong>{summary.total}</strong> farrowings •
                    <strong> {summary.totalPiglets}</strong> total piglets •
                    Avg <strong>{summary.avgLitter}</strong>/litter
                    {summary.lastDate && (
                      <> • Last: <strong>{formatDate(summary.lastDate)}</strong> ({summary.lastLiveCount} live)</>
                    )}
                  </p>
                  {(summary.totalStillborn > 0 || summary.totalMummified > 0) && (
                    <p className="text-sm text-gray-600 mt-1">
                      Stillborn: {summary.totalStillborn} | Mummified: {summary.totalMummified}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mb-4 flex-wrap">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      // Find if there's an active farrowing (expected but not recorded)
                      const activeFarrowing = farrowings.find(f => f.actual_farrowing_date === null);
                      setActiveFarrowingId(activeFarrowing?.id || null);
                      setShowLitterForm(true);
                    }}
                  >
                    Record Litter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    {showHistory ? 'Hide History' : 'View History'}
                  </Button>
                </div>

                {/* Expanded Farrowing History */}
                {showHistory && (
                  <div className="space-y-3">
                    {farrowings.map((farrowing, index) => (
                      <div
                        key={farrowing.id}
                        className="border rounded-lg p-4 bg-gray-50 relative"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">
                            Farrowing #{farrowings.length - index}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              {formatDate(farrowing.actual_farrowing_date)}
                            </span>
                            <button
                              onClick={() => {
                                setEditingFarrowing(farrowing);
                                setIsEditFarrowingModalOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 rounded transition-colors"
                              title="Edit this farrowing record"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteFarrowing(farrowing.id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-colors"
                              title="Delete this farrowing record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Breeding Date:</span>{' '}
                            <span className="text-gray-900">{formatDate(farrowing.breeding_date)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Expected Date:</span>{' '}
                            <span className="text-gray-900">{formatDate(farrowing.expected_farrowing_date)}</span>
                          </div>
                          {farrowing.boar_id && (
                            <div className="sm:col-span-2">
                              <span className="text-gray-600">Sire (Boar):</span>{' '}
                              <span className="text-gray-900 font-medium">
                                {farrowing.boar_name || farrowing.boar_ear_tag || 'Unknown'}
                              </span>
                              {farrowing.breeding_method && (
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  farrowing.breeding_method === 'ai'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {farrowing.breeding_method === 'ai' ? 'AI' : 'Natural'}
                                </span>
                              )}
                            </div>
                          )}
                          <div>
                            <span className="text-gray-600">Live Piglets:</span>{' '}
                            <span className="font-semibold text-red-800">{farrowing.live_piglets ?? 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Stillborn:</span>{' '}
                            <span className="text-gray-900">{farrowing.stillborn ?? 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Mummified:</span>{' '}
                            <span className="text-gray-900">{farrowing.mummified ?? 0}</span>
                          </div>
                        </div>
                        {farrowing.notes && (
                          <div className="mt-2 text-sm">
                            <span className="text-gray-600">Notes:</span>{' '}
                            <span className="text-gray-900">{farrowing.notes}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Breeding History */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-blue-600" />
              Breeding History
            </h3>

            {breedingAttempts.length === 0 ? (
              <p className="text-gray-600">No breeding attempts recorded.</p>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total Breeding Attempts</p>
                      <p className="text-2xl font-bold text-blue-900">{breedingAttempts.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Confirmed Pregnant</p>
                      <p className="text-2xl font-bold text-green-900">
                        {breedingAttempts.filter(ba => ba.result === 'pregnant').length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-600">
                    Showing {breedingAttempts.length} breeding {breedingAttempts.length === 1 ? 'attempt' : 'attempts'}
                  </p>
                  <Button
                    onClick={() => setShowBreedingHistory(!showBreedingHistory)}
                    variant="outline"
                    size="sm"
                  >
                    {showBreedingHistory ? 'Hide History' : 'View History'}
                  </Button>
                </div>

                {/* Expanded Breeding History */}
                {showBreedingHistory && (
                  <div className="space-y-3">
                    {breedingAttempts.map((breeding, index) => (
                      <div
                        key={breeding.id}
                        className="border rounded-lg p-4 bg-gray-50 relative"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">
                            Breeding #{breedingAttempts.length - index}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              {formatDate(breeding.breeding_date)}
                            </span>
                            {breeding.result && (
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  breeding.result === 'pregnant'
                                    ? 'bg-green-100 text-green-800'
                                    : breeding.result === 'returned_to_heat'
                                    ? 'bg-red-100 text-red-800'
                                    : breeding.result === 'aborted'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {breeding.result.replace('_', ' ').charAt(0).toUpperCase() + breeding.result.replace('_', ' ').slice(1)}
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingBreeding(breeding);
                                setIsEditBreedingModalOpen(true);
                              }}
                              className="h-8 px-2"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-600">Method:</span>
                            <span className="ml-2 font-medium text-gray-900 capitalize">
                              {breeding.breeding_method === 'ai' ? 'AI' : 'Natural'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Initial Sire:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {breeding.boar_name || breeding.boar_ear_tag || breeding.boar_description || 'Unknown'}
                            </span>
                          </div>
                          {breeding.breeding_time && (
                            <div>
                              <span className="text-gray-600">Time:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {formatTime(breeding.breeding_time)}
                              </span>
                            </div>
                          )}
                          {breeding.pregnancy_check_date && (
                            <div>
                              <span className="text-gray-600">Pregnancy Check:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {formatDate(breeding.pregnancy_check_date)}
                              </span>
                            </div>
                          )}
                          {breeding.pregnancy_confirmed !== null && (
                            <div>
                              <span className="text-gray-600">Result:</span>
                              <span className={`ml-2 font-medium ${breeding.pregnancy_confirmed ? 'text-green-700' : 'text-red-700'}`}>
                                {breeding.pregnancy_confirmed ? 'Confirmed Pregnant' : 'Not Pregnant'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* AI Doses Section */}
                        {breeding.breeding_method === 'ai' && breeding.ai_doses && breeding.ai_doses.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <h5 className="text-sm font-semibold text-gray-700 mb-2">AI Doses</h5>
                            <div className="space-y-2">
                              {breeding.ai_doses.map((dose) => (
                                <div key={dose.id} className="bg-white rounded border border-gray-200 p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-purple-700">
                                      Dose #{dose.dose_number}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatDate(dose.dose_date)} {formatTime(dose.dose_time)}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="text-gray-600">Sire:</span>
                                      <span className="ml-1 font-medium text-gray-900">
                                        {dose.boar_name || dose.boar_ear_tag || breeding.boar_name || breeding.boar_ear_tag || 'Same as initial'}
                                      </span>
                                    </div>
                                  </div>
                                  {dose.notes && (
                                    <div className="mt-2 text-xs text-gray-600">
                                      <span className="font-medium">Notes:</span> {dose.notes}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {breeding.notes && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Notes:</span> {breeding.notes}
                            </p>
                          </div>
                        )}

                        {breeding.farrowing_id && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-sm text-green-700 font-medium">
                              ✓ Resulted in successful farrowing
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Estrus Synchronization Treatment History */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Estrus Synchronization History
            </h3>

            {matrixTreatments.length === 0 ? (
              <p className="text-gray-600">No estrus synchronization treatments recorded.</p>
            ) : (
              <>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    <strong>{matrixTreatments.length}</strong> treatment{matrixTreatments.length !== 1 ? 's' : ''} recorded
                    {matrixTreatments[0] && (
                      <> • Last batch: <strong>{matrixTreatments[0].batch_name}</strong> on {formatDate(matrixTreatments[0].treatment_start_date)}</>
                    )}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Bred: {matrixTreatments.filter(t => t.bred).length} | Pending: {matrixTreatments.filter(t => !t.bred).length}
                  </p>
                </div>

                <div className="flex gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMatrixHistory(!showMatrixHistory)}
                  >
                    {showMatrixHistory ? 'Hide History' : 'View History'}
                  </Button>
                </div>

                {/* Expanded Estrus Synchronization History */}
                {showMatrixHistory && (
                  <div className="space-y-3">
                    {matrixTreatments.map((treatment) => (
                      <div
                        key={treatment.id}
                        className="border rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {treatment.batch_name}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            treatment.bred ? 'bg-red-100 text-red-900' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {treatment.bred ? 'Bred' : 'Pending'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Treatment Period:</span>{' '}
                            <span className="text-gray-900">
                              {formatDate(treatment.treatment_start_date)} → {formatDate(treatment.treatment_end_date)}
                            </span>
                            <span className="text-gray-500 text-xs ml-1">
                              ({treatment.treatment_duration_days} days)
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Expected Heat:</span>{' '}
                            <span className="text-gray-900">{formatDate(treatment.expected_heat_date)}</span>
                          </div>
                          {treatment.actual_heat_date && (
                            <div>
                              <span className="text-gray-600">Actual Heat:</span>{' '}
                              <span className="text-gray-900">{formatDate(treatment.actual_heat_date)}</span>
                            </div>
                          )}
                          {treatment.breeding_date && (
                            <div>
                              <span className="text-gray-600">Breeding Date:</span>{' '}
                              <span className="text-gray-900">{formatDate(treatment.breeding_date)}</span>
                            </div>
                          )}
                          {treatment.dosage && (
                            <div>
                              <span className="text-gray-600">Dosage:</span>{' '}
                              <span className="text-gray-900">{treatment.dosage}</span>
                            </div>
                          )}
                          {treatment.lot_number && (
                            <div>
                              <span className="text-gray-600">Lot Number:</span>{' '}
                              <span className="text-gray-900">{treatment.lot_number}</span>
                            </div>
                          )}
                        </div>
                        {treatment.notes && (
                          <div className="mt-2 text-sm">
                            <span className="text-gray-600">Notes:</span>{' '}
                            <span className="text-gray-900">{treatment.notes}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Health & Wellness Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-red-700" />
                Health & Wellness
                {healthRecords.length > 0 && (
                  <span className="text-sm text-gray-600 font-normal">
                    ({healthRecords.length} record{healthRecords.length !== 1 ? 's' : ''})
                  </span>
                )}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddHealthRecord(true)}
              >
                <Activity className="h-4 w-4 mr-1" />
                Add Event
              </Button>
            </div>

            {/* Add Health Record Form */}
            {showAddHealthRecord && (
              <div className="border rounded-lg p-4 mb-4 bg-gray-50 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Record Type <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={healthForm.record_type}
                      onChange={(e) => setHealthForm({ ...healthForm, record_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="vaccine">Vaccine</option>
                      <option value="treatment">Treatment</option>
                      <option value="vet_visit">Vet Visit</option>
                      <option value="observation">Observation</option>
                      <option value="injury">Injury</option>
                      <option value="procedure">Procedure</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      value={healthForm.record_date}
                      onChange={(e) => setHealthForm({ ...healthForm, record_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={healthForm.title}
                    onChange={(e) => setHealthForm({ ...healthForm, title: e.target.value })}
                    placeholder="e.g., Rabies Vaccine, Antibiotic Treatment"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={healthForm.description}
                    onChange={(e) => setHealthForm({ ...healthForm, description: e.target.value })}
                    placeholder="Detailed notes..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                    <input
                      type="text"
                      value={healthForm.dosage}
                      onChange={(e) => setHealthForm({ ...healthForm, dosage: e.target.value })}
                      placeholder="e.g., 5ml, 2 tablets"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={healthForm.cost}
                      onChange={(e) => setHealthForm({ ...healthForm, cost: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Next Due Date</label>
                    <input
                      type="date"
                      value={healthForm.next_due_date}
                      onChange={(e) => setHealthForm({ ...healthForm, next_due_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Administered By</label>
                    <input
                      type="text"
                      value={healthForm.administered_by}
                      onChange={(e) => setHealthForm({ ...healthForm, administered_by: e.target.value })}
                      placeholder="Person name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Veterinarian</label>
                    <input
                      type="text"
                      value={healthForm.veterinarian}
                      onChange={(e) => setHealthForm({ ...healthForm, veterinarian: e.target.value })}
                      placeholder="Vet name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleAddHealthRecord} className="bg-red-700 hover:bg-red-800">
                    Save Health Record
                  </Button>
                </div>
              </div>
            )}

            {/* Health Records List */}
            {healthRecords.length === 0 ? (
              <p className="text-gray-600">No health records yet.</p>
            ) : (
              <>
                <div className="flex gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHealthHistory(!showHealthHistory)}
                  >
                    {showHealthHistory ? 'Hide History' : 'View History'}
                  </Button>
                </div>

                {showHealthHistory && (
                  <div className="space-y-3">
                    {healthRecords.map((record) => {
                      const recordTypeColors: Record<string, string> = {
                        vaccine: 'bg-blue-100 text-blue-800',
                        treatment: 'bg-green-100 text-green-800',
                        vet_visit: 'bg-purple-100 text-purple-800',
                        observation: 'bg-gray-100 text-gray-800',
                        injury: 'bg-red-100 text-red-800',
                        procedure: 'bg-yellow-100 text-yellow-800',
                      };

                      return (
                        <div key={record.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900">{record.title}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${recordTypeColors[record.record_type] || 'bg-gray-100 text-gray-800'}`}>
                                {record.record_type.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">{formatDate(record.record_date)}</span>
                              <button
                                onClick={() => handleDeleteHealthRecord(record.id)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-colors"
                                title="Delete this health record"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {record.description && (
                            <p className="text-sm text-gray-700 mb-2">{record.description}</p>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            {record.dosage && (
                              <div>
                                <span className="text-gray-600">Dosage:</span>{' '}
                                <span className="text-gray-900">{record.dosage}</span>
                              </div>
                            )}
                            {record.cost && (
                              <div>
                                <span className="text-gray-600">Cost:</span>{' '}
                                <span className="text-gray-900">${record.cost.toFixed(2)}</span>
                              </div>
                            )}
                            {record.administered_by && (
                              <div>
                                <span className="text-gray-600">Administered By:</span>{' '}
                                <span className="text-gray-900">{record.administered_by}</span>
                              </div>
                            )}
                            {record.veterinarian && (
                              <div>
                                <span className="text-gray-600">Veterinarian:</span>{' '}
                                <span className="text-gray-900">{record.veterinarian}</span>
                              </div>
                            )}
                            {record.next_due_date && (
                              <div className="sm:col-span-2">
                                <span className="text-gray-600">Next Due:</span>{' '}
                                <span className="text-orange-600 font-medium">{formatDate(record.next_due_date)}</span>
                              </div>
                            )}
                            {(record as any).body_condition_score && (
                              <div className="sm:col-span-2">
                                <span className="text-gray-600">Body Condition Score:</span>{' '}
                                <span className={`font-medium ${
                                  (record as any).body_condition_score === 3 ? 'text-green-600' :
                                  (record as any).body_condition_score < 3 ? 'text-orange-600' :
                                  'text-red-600'
                                }`}>
                                  {(record as any).body_condition_score} - {
                                    (record as any).body_condition_score === 1 ? 'Emaciated' :
                                    (record as any).body_condition_score === 2 ? 'Thin' :
                                    (record as any).body_condition_score === 3 ? 'Ideal' :
                                    (record as any).body_condition_score === 4 ? 'Fat' :
                                    'Obese'
                                  }
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-4 sm:px-6 py-3 sm:py-4">
          <Button onClick={onClose} variant="outline" className="w-full sm:w-auto sm:float-right">
            Close
          </Button>
        </div>
      </div>

      {/* Record Litter Form */}
      {sow && (
        <RecordLitterForm
          sowId={sow.id}
          sowName={sow.name || sow.ear_tag}
          farrowingId={activeFarrowingId}
          isOpen={showLitterForm}
          onClose={() => setShowLitterForm(false)}
          onSuccess={() => {
            fetchFarrowings(); // Refresh farrowing data
          }}
        />
      )}

      {/* Health Event Modal */}
      {sow && showAddHealthRecord && (
        <HealthEventModal
          animalType="sow"
          animalId={sow.id}
          animalName={sow.name || sow.ear_tag}
          onClose={() => setShowAddHealthRecord(false)}
          onSuccess={() => {
            fetchHealthRecords(); // Refresh health records
            setShowAddHealthRecord(false);
          }}
        />
      )}

      {/* Edit Farrowing Modal */}
      {editingFarrowing && (
        <EditFarrowingModal
          isOpen={isEditFarrowingModalOpen}
          onClose={() => {
            setIsEditFarrowingModalOpen(false);
            setEditingFarrowing(null);
          }}
          onSuccess={() => {
            fetchFarrowings(); // Refresh farrowing data
          }}
          farrowingId={editingFarrowing.id}
          sowName={sow?.name || sow?.ear_tag || ''}
          initialData={{
            actual_farrowing_date: editingFarrowing.actual_farrowing_date || '',
            live_piglets: editingFarrowing.live_piglets || 0,
            stillborn: editingFarrowing.stillborn || 0,
            mummies: editingFarrowing.mummified || 0,
            notes: editingFarrowing.notes
          }}
        />
      )}

      {/* Edit Breeding Modal */}
      {editingBreeding && isEditBreedingModalOpen && (
        <EditBreedingModal
          breeding={editingBreeding}
          onClose={() => {
            setIsEditBreedingModalOpen(false);
            setEditingBreeding(null);
          }}
          onSuccess={() => {
            fetchBreedingAttempts(); // Refresh breeding data
          }}
        />
      )}
    </div>
  );
}
