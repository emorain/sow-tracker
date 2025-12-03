'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type Sow = {
  id: string;
  ear_tag: string;
  name: string | null;
};

type Boar = {
  id: string;
  ear_tag: string;
  name: string | null;
  breed: string;
  boar_type: 'live' | 'ai_semen';
  semen_straws: number | null;
  supplier: string | null;
  active_breedings?: number;
};

type RecordBreedingFormProps = {
  sow: Sow;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  matrixTreatmentId?: string | null; // Optional: if coming from Matrix batches
};

export default function RecordBreedingForm({
  sow,
  isOpen,
  onClose,
  onSuccess,
  matrixTreatmentId,
}: RecordBreedingFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [liveBoars, setLiveBoars] = useState<Boar[]>([]);
  const [aiSemen, setAiSemen] = useState<Boar[]>([]);

  const [formData, setFormData] = useState({
    breeding_method: 'natural' as 'natural' | 'ai',
    boar_source: 'system' as 'system' | 'other', // system boar/semen or other
    boar_id: '',
    other_boar_description: '',
    breeding_date: new Date().toISOString().split('T')[0],
    breeding_time: new Date().toTimeString().slice(0, 5), // HH:MM format
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchBoars();
    }
  }, [isOpen]);

  const fetchBoars = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch boars
      const { data: boarsData, error } = await supabase
        .from('boars')
        .select('*')
        .eq('status', 'active')
        .order('ear_tag');

      if (error) throw error;

      // Fetch active breeding counts (not yet farrowed)
      const { data: breedingCounts } = await supabase
        .from('breeding_attempts')
        .select('boar_id')
        .eq('user_id', user.id);

      // Count active breedings per boar
      const countMap: Record<string, number> = {};
      (breedingCounts || []).forEach(b => {
        if (b.boar_id) {
          countMap[b.boar_id] = (countMap[b.boar_id] || 0) + 1;
        }
      });

      // Add counts to boar data
      const boarsWithCounts = (boarsData || []).map(boar => ({
        ...boar,
        active_breedings: countMap[boar.id] || 0,
      }));

      // Separate live boars and AI semen
      const live = boarsWithCounts.filter(b => b.boar_type === 'live');
      const ai = boarsWithCounts.filter(b => b.boar_type === 'ai_semen');

      setLiveBoars(live);
      setAiSemen(ai);
    } catch (err: any) {
      console.error('Error fetching boars:', err);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBreedingMethodChange = (method: 'natural' | 'ai') => {
    setFormData(prev => ({
      ...prev,
      breeding_method: method,
      boar_id: '', // Reset selection when method changes
      boar_source: 'system',
      other_boar_description: '',
    }));
  };

  const handleBoarSourceChange = (source: 'system' | 'other') => {
    setFormData(prev => ({
      ...prev,
      boar_source: source,
      boar_id: '',
      other_boar_description: '',
    }));
  };

  const calculateExpectedFarrowingDate = (breedingDate: string) => {
    const breeding = new Date(breedingDate);
    breeding.setDate(breeding.getDate() + 114); // Gestation period is ~114 days
    return breeding.toISOString().split('T')[0];
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate boar selection
    if (formData.boar_source === 'system' && !formData.boar_id) {
      errors.boar_id = `Please select a ${formData.breeding_method === 'natural' ? 'boar' : 'semen collection'}`;
    }

    // Validate other boar description
    if (formData.boar_source === 'other' && !formData.other_boar_description.trim()) {
      errors.other_boar_description = 'Please describe the boar/semen used';
    }

    // Validate breeding date
    if (!formData.breeding_date) {
      errors.breeding_date = 'Breeding date is required';
    } else {
      const breedingDate = new Date(formData.breeding_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (breedingDate > today) {
        errors.breeding_date = 'Breeding date cannot be in the future';
      }
    }

    // Validate breeding time
    if (!formData.breeding_time) {
      errors.breeding_time = 'Breeding time is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setError(null);
    setFieldErrors({});

    // Validate form
    if (!validateForm()) {
      setError('Please fix the errors below before submitting');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to record breeding');
        setLoading(false);
        return;
      }

      // Validation
      if (formData.boar_source === 'system' && !formData.boar_id) {
        setError('Please select a boar or AI semen');
        setLoading(false);
        return;
      }

      if (formData.boar_source === 'other' && !formData.other_boar_description.trim()) {
        setError('Please enter a description for the other boar/semen');
        setLoading(false);
        return;
      }

      // Check if AI semen has sufficient straws
      if (formData.boar_source === 'system' && formData.breeding_method === 'ai' && formData.boar_id) {
        const selectedSemen = aiSemen.find(b => b.id === formData.boar_id);
        if (selectedSemen && (selectedSemen.semen_straws || 0) < 1) {
          setError('Insufficient semen straws available');
          setLoading(false);
          return;
        }
      }

      // Create notes with boar info if "other" is selected
      let breedingNotes = formData.notes;
      let boarDescription = null;

      if (formData.boar_source === 'other') {
        const sourceType = formData.breeding_method === 'natural' ? 'Boar' : 'AI Semen';
        boarDescription = `${sourceType}: ${formData.other_boar_description}`;
        breedingNotes = `${boarDescription}${formData.notes ? '\n\n' + formData.notes : ''}`;
      }

      // Combine date and time into timestamp
      const breedingTimestamp = `${formData.breeding_date}T${formData.breeding_time}:00`;

      // Create breeding attempt record (NOT a farrowing yet - that comes after pregnancy check)
      const breedingAttemptData = {
        user_id: user.id,
        sow_id: sow.id,
        breeding_date: formData.breeding_date,
        breeding_time: breedingTimestamp,
        breeding_method: formData.breeding_method,
        boar_id: formData.boar_source === 'system' && formData.boar_id ? formData.boar_id : null,
        boar_description: boarDescription,
        result: 'pending', // Will be updated after pregnancy check
        pregnancy_confirmed: null, // Not yet checked
        notes: breedingNotes,
        // Natural breedings are complete immediately, AI breedings need dose completion
        breeding_cycle_complete: formData.breeding_method === 'natural',
        breeding_cycle_completed_at: formData.breeding_method === 'natural' ? new Date().toISOString() : null,
        last_dose_date: formData.breeding_date, // For natural, it's the breeding date
      };

      const { error: breedingError } = await supabase
        .from('breeding_attempts')
        .insert(breedingAttemptData);

      if (breedingError) throw breedingError;

      // If this came from Matrix treatment, update the matrix_treatments record
      if (matrixTreatmentId) {
        const { error: matrixError } = await supabase
          .from('matrix_treatments')
          .update({
            actual_heat_date: formData.breeding_date,
            bred: true,
            breeding_date: formData.breeding_date,
          })
          .eq('id', matrixTreatmentId);

        if (matrixError) {
          console.error('Error updating matrix treatment:', matrixError);
          // Don't fail the whole operation if matrix update fails
        }
      }

      // Apply breeding protocol - get active breeding protocols
      const { data: protocols, error: protocolError } = await supabase
        .from('protocols')
        .select('id, protocol_tasks(*)')
        .eq('trigger_event', 'breeding')
        .eq('is_active', true);

      if (protocolError) {
        console.error('Error fetching breeding protocols:', protocolError);
      } else if (protocols && protocols.length > 0) {
        // Create scheduled tasks for each protocol
        for (const protocol of protocols) {
          if (protocol.protocol_tasks && protocol.protocol_tasks.length > 0) {
            const scheduledTasks = protocol.protocol_tasks.map((task: any) => {
              const dueDate = new Date(formData.breeding_date);
              dueDate.setDate(dueDate.getDate() + task.days_offset);

              return {
                user_id: user.id,
                protocol_id: protocol.id,
                protocol_task_id: task.id,
                sow_id: sow.id,
                task_name: task.task_name,
                description: task.description,
                due_date: dueDate.toISOString().split('T')[0],
                is_completed: false,
              };
            });

            const { error: tasksError } = await supabase
              .from('scheduled_tasks')
              .insert(scheduledTasks);

            if (tasksError) {
              console.error('Error creating scheduled tasks:', tasksError);
            }
          }
        }
      }

      toast.success('Breeding attempt recorded successfully. Check for pregnancy in 18-21 days.');

      // Reset form
      setFormData({
        breeding_method: 'natural',
        boar_source: 'system',
        boar_id: '',
        other_boar_description: '',
        breeding_date: new Date().toISOString().split('T')[0],
        breeding_time: new Date().toTimeString().slice(0, 5),
        notes: '',
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error recording breeding:', err);
      setError(err.message || 'Failed to record breeding');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const availableBoars = formData.breeding_method === 'natural' ? liveBoars : aiSemen;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Record Breeding</h2>
            <p className="text-sm text-gray-600 mt-1">
              {sow.name || sow.ear_tag}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Breeding Method */}
            <div className="space-y-2">
              <Label>
                Breeding Method <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleBreedingMethodChange('natural')}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    formData.breeding_method === 'natural'
                      ? 'border-red-600 bg-red-50 text-red-900'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold">Natural</div>
                  <div className="text-xs text-gray-600 mt-1">Live boar breeding</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleBreedingMethodChange('ai')}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    formData.breeding_method === 'ai'
                      ? 'border-red-600 bg-red-50 text-red-900'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold">AI</div>
                  <div className="text-xs text-gray-600 mt-1">Artificial insemination</div>
                </button>
              </div>
            </div>

            {/* Boar/Semen Source */}
            <div className="space-y-2">
              <Label>
                {formData.breeding_method === 'natural' ? 'Boar Selection' : 'Semen Selection'}{' '}
                <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleBoarSourceChange('system')}
                  className={`p-3 border-2 rounded-lg text-center transition-all ${
                    formData.boar_source === 'system'
                      ? 'border-red-600 bg-red-50 text-red-900'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-sm font-medium">From System</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleBoarSourceChange('other')}
                  className={`p-3 border-2 rounded-lg text-center transition-all ${
                    formData.boar_source === 'other'
                      ? 'border-red-600 bg-red-50 text-red-900'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-sm font-medium">Other/Borrowed</div>
                </button>
              </div>
            </div>

            {/* Boar/Semen Dropdown (if "From System" selected) */}
            {formData.boar_source === 'system' && (
              <div className="space-y-2">
                <Label htmlFor="boar_id">
                  Select {formData.breeding_method === 'natural' ? 'Boar' : 'AI Semen'}{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <select
                  id="boar_id"
                  name="boar_id"
                  value={formData.boar_id}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    fieldErrors.boar_id
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-red-500'
                  }`}
                  required
                >
                  <option value="">-- Select --</option>
                  {availableBoars.map(boar => {
                    // Build a comprehensive display string
                    const parts = [boar.ear_tag];
                    if (boar.name) parts.push(`- ${boar.name}`);
                    if (boar.breed) parts.push(`(${boar.breed})`);

                    if (boar.boar_type === 'ai_semen') {
                      if (boar.semen_straws !== null) {
                        parts.push(`• ${boar.semen_straws} straws`);
                      }
                      if (boar.supplier) parts.push(`• ${boar.supplier}`);
                    }

                    if (boar.active_breedings !== undefined && boar.active_breedings > 0) {
                      parts.push(`• ${boar.active_breedings} active breedings`);
                    }

                    return (
                      <option key={boar.id} value={boar.id}>
                        {parts.join(' ')}
                      </option>
                    );
                  })}
                </select>
                {fieldErrors.boar_id && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.boar_id}</p>
                )}
                {formData.breeding_method === 'ai' && availableBoars.length === 0 && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    No AI semen available in inventory. Select &quot;Other/Borrowed&quot; or add AI semen to your inventory first.
                  </p>
                )}
              </div>
            )}

            {/* Other Boar/Semen Description (if "Other" selected) */}
            {formData.boar_source === 'other' && (
              <div className="space-y-2">
                <Label htmlFor="other_boar_description">
                  {formData.breeding_method === 'natural' ? 'Boar' : 'Semen'} Description{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="other_boar_description"
                  name="other_boar_description"
                  type="text"
                  value={formData.other_boar_description}
                  onChange={handleChange}
                  placeholder={
                    formData.breeding_method === 'natural'
                      ? 'e.g., Borrowed Duroc from Smith Farm'
                      : 'e.g., Hampshire semen from neighbor, 2 straws'
                  }
                  className={fieldErrors.other_boar_description ? 'border-red-500' : ''}
                  required
                />
                {fieldErrors.other_boar_description && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.other_boar_description}</p>
                )}
                {!fieldErrors.other_boar_description && (
                  <p className="text-xs text-gray-600">
                    Enter details about the {formData.breeding_method === 'natural' ? 'boar' : 'semen'}
                    (source, breed, etc.)
                  </p>
                )}
              </div>
            )}

            {/* Breeding Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="breeding_date">
                  Breeding Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="breeding_date"
                  name="breeding_date"
                  type="date"
                  value={formData.breeding_date}
                  onChange={handleChange}
                  className={fieldErrors.breeding_date ? 'border-red-500' : ''}
                  required
                />
                {fieldErrors.breeding_date && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.breeding_date}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="breeding_time">
                  Breeding Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="breeding_time"
                  name="breeding_time"
                  type="time"
                  value={formData.breeding_time}
                  onChange={handleChange}
                  className={fieldErrors.breeding_time ? 'border-red-500' : ''}
                  required
                />
                {fieldErrors.breeding_time && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.breeding_time}</p>
                )}
              </div>
            </div>

            {/* Pregnancy Check Reminder */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm font-medium text-amber-900">
                Pregnancy Check Reminder
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Check for pregnancy 18-21 days after breeding. If pregnant, expected farrowing date will be 114 days from breeding date.
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional observations about the breeding..."
                rows={3}
              />
            </div>
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="border-t px-6 py-4 bg-white">
            <div className="flex gap-3">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Recording...' : 'Record Breeding'}
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
