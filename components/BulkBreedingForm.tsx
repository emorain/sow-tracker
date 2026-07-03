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
    boar_id: '',
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
        .eq('organization_id', selectedOrganizationId!)
        .eq('status', 'active')
        .order('ear_tag');

      if (error) throw error;

      const { data: breedingCounts } = await supabase
        .from('breeding_attempts')
        .select('boar_id')
        .eq('organization_id', selectedOrganizationId);

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
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.boar_id) {
      errors.boar_id = `Please select a ${formData.breeding_method === 'natural' ? 'boar' : 'semen collection'}`;
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

      // For AI, each sow's initial insemination is dose #1 and consumes one
      // straw, so the batch needs one straw per sow. Verify up front.
      if (formData.breeding_method === 'ai') {
        const { data: boarData, error: boarError } = await supabase
          .from('boars')
          .select('semen_straws')
          .eq('id', formData.boar_id)
          .eq('organization_id', selectedOrganizationId!)
          .single();
        if (boarError) throw boarError;
        const available = boarData?.semen_straws || 0;
        if (available < sows.length) {
          setError(
            `Not enough straws: this AI semen has ${available} left but you selected ${sows.length} sow${sows.length === 1 ? '' : 's'}.`
          );
          setLoading(false);
          return;
        }
      }

      // Create breeding attempts for all selected sows
      const breedingAttempts = sows.map(sow => ({
        user_id: user.id,
        organization_id: selectedOrganizationId,
        sow_id: sow.id,
        boar_id: formData.boar_id,
        breeding_date: formData.breeding_date,
        breeding_time: breedingDateTime,
        breeding_method: formData.breeding_method,
        result: 'pending' as const,
        notes: formData.notes,
        // Natural breedings are complete immediately, AI breedings need dose completion
        breeding_cycle_complete: formData.breeding_method === 'natural',
        breeding_cycle_completed_at: formData.breeding_method === 'natural' ? new Date().toISOString() : null,
        last_dose_date: formData.breeding_date,
      }));

      // NOTE: No farrowing records are created here. Farrowings are created at
      // pregnancy confirmation (PregnancyCheckModal), matching the single-breeding
      // path in RecordBreedingForm. Creating them at breeding time caused duplicates.
      const { data: breedingRows, error: breedingError } = await supabase
        .from('breeding_attempts')
        .insert(breedingAttempts)
        .select('id');

      if (breedingError) throw breedingError;

      // For AI, record each initial insemination as dose #1. The ai_doses
      // insert trigger decrements one straw per dose (single source of truth).
      if (formData.breeding_method === 'ai' && breedingRows && breedingRows.length > 0) {
        const doses = breedingRows.map(row => ({
          user_id: user.id,
          organization_id: selectedOrganizationId,
          breeding_attempt_id: row.id,
          dose_number: 1,
          dose_date: formData.breeding_date,
          dose_time: breedingDateTime,
          boar_id: formData.boar_id,
          straws_used: 1,
        }));
        const { error: doseError } = await supabase.from('ai_doses').insert(doses);
        if (doseError) throw doseError;
      }

      // Apply breeding protocols for all sows
      const { data: protocols, error: protocolError } = await supabase
        .from('protocols')
        .select('id, protocol_tasks(*)')
        .eq('organization_id', selectedOrganizationId)
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
        boar_id: '',
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card text-card-foreground rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-card border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">Bulk Breed Sows</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Breeding {sows.length} sow{sows.length > 1 ? 's' : ''} (<span className="font-mono">{sows.map(s => s.ear_tag).join(', ')}</span>)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="bg-due-bg border border-due/30 text-due px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Breeding Method */}
            <div className="space-y-2">
              <Label>
                Breeding Method <span className="text-due">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleBreedingMethodChange('natural')}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    formData.breeding_method === 'natural'
                      ? 'border-brand bg-brand/10 text-foreground'
                      : 'border-input hover:border-muted-foreground'
                  }`}
                >
                  <div className="font-semibold">Natural</div>
                  <div className="text-xs text-muted-foreground mt-1">Live boar breeding</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleBreedingMethodChange('ai')}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    formData.breeding_method === 'ai'
                      ? 'border-brand bg-brand/10 text-foreground'
                      : 'border-input hover:border-muted-foreground'
                  }`}
                >
                  <div className="font-semibold">AI</div>
                  <div className="text-xs text-muted-foreground mt-1">Artificial insemination</div>
                </button>
              </div>
            </div>

            {/* Boar/Semen Selection */}
            <div className="space-y-2">
              <Label htmlFor="boar_id">
                Select {formData.breeding_method === 'natural' ? 'Boar' : 'AI Semen'}{' '}
                <span className="text-due">*</span>
              </Label>
              <select
                id="boar_id"
                name="boar_id"
                value={formData.boar_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand ${
                  fieldErrors.boar_id
                    ? 'border-due'
                    : 'border-input'
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
                <p className="text-xs text-due mt-1">{fieldErrors.boar_id}</p>
              )}
              {formData.breeding_method === 'ai' && availableBoars.length === 0 && (
                <p className="text-xs text-soon bg-soon-bg border border-soon/25 rounded px-3 py-2">
                  No AI semen available in inventory. Add AI semen to your inventory first, or add borrowed semen as a new record.
                </p>
              )}
            </div>

            {/* Breeding Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="breeding_date">
                  Breeding Date <span className="text-due">*</span>
                </Label>
                <Input
                  id="breeding_date"
                  name="breeding_date"
                  type="date"
                  value={formData.breeding_date}
                  onChange={handleChange}
                  className={fieldErrors.breeding_date ? 'border-due' : ''}
                  required
                />
                {fieldErrors.breeding_date && (
                  <p className="text-xs text-due mt-1">{fieldErrors.breeding_date}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="breeding_time">
                  Breeding Time <span className="text-due">*</span>
                </Label>
                <Input
                  id="breeding_time"
                  name="breeding_time"
                  type="time"
                  value={formData.breeding_time}
                  onChange={handleChange}
                  className={fieldErrors.breeding_time ? 'border-due' : ''}
                  required
                />
                {fieldErrors.breeding_time && (
                  <p className="text-xs text-due mt-1">{fieldErrors.breeding_time}</p>
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
            <div className="bg-info-bg border border-info/25 rounded-lg p-3">
              <p className="text-sm font-medium text-info">
                Bulk Breeding {sows.length} Sows
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This will create breeding records for all {sows.length} selected sows with the same boar, date, and time.
                Pregnancy checks will be due 18-21 days after the breeding date.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-secondary px-6 py-4 flex items-center justify-end gap-3 border-t rounded-b-xl">
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
              className="bg-brand text-brand-foreground hover:bg-brand/90"
            >
              {loading ? 'Recording...' : `Breed ${sows.length} Sow${sows.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
