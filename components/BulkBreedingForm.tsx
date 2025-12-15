'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useOrganization } from '@/lib/organization-context';

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

type BulkBreedingFormProps = {
  sows: Sow[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function BulkBreedingForm({
  sows,
  isOpen,
  onClose,
  onSuccess,
}: BulkBreedingFormProps) {
  const { selectedOrganizationId } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [liveBoars, setLiveBoars] = useState<Boar[]>([]);
  const [aiSemen, setAiSemen] = useState<Boar[]>([]);

  const [formData, setFormData] = useState({
    breeding_method: 'natural' as 'natural' | 'ai',
    boar_source: 'system' as 'system' | 'other',
    boar_id: '',
    other_boar_description: '',
    breeding_date: new Date().toISOString().split('T')[0],
    breeding_time: new Date().toTimeString().slice(0, 5),
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

      const { data: boarsData, error } = await supabase
        .from('boars')
        .select('*')
        .eq('status', 'active')
        .order('ear_tag');

      if (error) throw error;

      const { data: breedingCounts } = await supabase
        .from('breeding_attempts')
        .select('boar_id')
        .eq('user_id', user.id);

      const countMap: Record<string, number> = {};
      (breedingCounts || []).forEach(b => {
        if (b.boar_id) {
          countMap[b.boar_id] = (countMap[b.boar_id] || 0) + 1;
        }
      });

      const boarsWithCounts = (boarsData || []).map(boar => ({
        ...boar,
        active_breedings: countMap[boar.id] || 0,
      }));

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
      boar_id: '',
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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (formData.boar_source === 'system' && !formData.boar_id) {
      errors.boar_id = `Please select a ${formData.breeding_method === 'natural' ? 'boar' : 'semen collection'}`;
    }

    if (formData.boar_source === 'other' && !formData.other_boar_description.trim()) {
      errors.other_boar_description = 'Please describe the boar/semen used';
    }

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

    if (!formData.breeding_time) {
      errors.breeding_time = 'Breeding time is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setFieldErrors({});

    if (!validateForm()) {
      setError('Please fix the errors below before submitting');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const breedingDateTime = `${formData.breeding_date}T${formData.breeding_time}:00`;
      const expectedFarrowingDate = new Date(formData.breeding_date);
      expectedFarrowingDate.setDate(expectedFarrowingDate.getDate() + 114);

      // Create breeding attempts for all selected sows
      const breedingAttempts = sows.map(sow => ({
        user_id: user.id,
        organization_id: selectedOrganizationId,
        sow_id: sow.id,
        boar_id: formData.boar_source === 'system' ? formData.boar_id : null,
        breeding_date: formData.breeding_date,
        breeding_time: breedingDateTime,
        breeding_method: formData.breeding_method,
        result: 'pending' as const,
        notes: formData.boar_source === 'other'
          ? `${formData.other_boar_description}${formData.notes ? '\n' + formData.notes : ''}`
          : formData.notes,
        // Natural breedings are complete immediately, AI breedings need dose completion
        breeding_cycle_complete: formData.breeding_method === 'natural',
        breeding_cycle_completed_at: formData.breeding_method === 'natural' ? new Date().toISOString() : null,
        last_dose_date: formData.breeding_date,
      }));

      const { data: insertedAttempts, error: breedingError } = await supabase
        .from('breeding_attempts')
        .insert(breedingAttempts)
        .select();

      if (breedingError) throw breedingError;

      // Create farrowing records for all breeding attempts
      const farrowings = (insertedAttempts || []).map(attempt => ({
        user_id: user.id,
        organization_id: selectedOrganizationId,
        sow_id: attempt.sow_id,
        breeding_attempt_id: attempt.id,
        breeding_date: formData.breeding_date,
        expected_farrowing_date: expectedFarrowingDate.toISOString().split('T')[0],
      }));

      const { error: farrowingError } = await supabase
        .from('farrowings')
        .insert(farrowings);

      if (farrowingError) throw farrowingError;

      // Apply breeding protocols for all sows
      const { data: protocols, error: protocolError } = await supabase
        .from('protocols')
        .select('id, protocol_tasks(*)')
        .eq('trigger_event', 'breeding')
        .eq('is_active', true);

      if (!protocolError && protocols && protocols.length > 0) {
        const allScheduledTasks = [];

        for (const protocol of protocols) {
          if (protocol.protocol_tasks && protocol.protocol_tasks.length > 0) {
            for (const sow of sows) {
              const scheduledTasks = protocol.protocol_tasks.map((task: any) => {
                const dueDate = new Date(formData.breeding_date);
                dueDate.setDate(dueDate.getDate() + task.days_offset);

                return {
                  user_id: user.id,
                  organization_id: selectedOrganizationId,
                  protocol_id: protocol.id,
                  protocol_task_id: task.id,
                  sow_id: sow.id,
                  task_name: task.task_name,
                  description: task.description,
                  due_date: dueDate.toISOString().split('T')[0],
                  is_completed: false,
                };
              });

              allScheduledTasks.push(...scheduledTasks);
            }
          }
        }

        if (allScheduledTasks.length > 0) {
          const { error: tasksError } = await supabase
            .from('scheduled_tasks')
            .insert(allScheduledTasks);

          if (tasksError) {
            console.error('Error creating scheduled tasks:', tasksError);
          }
        }
      }

      toast.success(
        `Successfully bred ${sows.length} sow${sows.length > 1 ? 's' : ''}. ` +
        `Check for pregnancy in 18-21 days.`
      );

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
      console.error('Error recording bulk breeding:', err);
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
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Bulk Breed Sows</h2>
            <p className="text-sm text-gray-600 mt-1">
              Breeding {sows.length} sow{sows.length > 1 ? 's' : ''} ({sows.map(s => s.ear_tag).join(', ')})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
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

            {/* Boar/Semen Dropdown */}
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
              </div>
            )}

            {/* Other Boar Description */}
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

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional notes about this breeding..."
                rows={3}
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900">
                Bulk Breeding {sows.length} Sows
              </p>
              <p className="text-xs text-blue-700 mt-1">
                This will create breeding records for all {sows.length} selected sows with the same boar, date, and time.
                Pregnancy checks will be due 18-21 days after the breeding date.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Recording...' : `Breed ${sows.length} Sow${sows.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
