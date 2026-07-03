'use client';

import { useState, useEffect } from 'react';
import { X, Syringe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useOrganization } from '@/lib/organization-context';

type BreedingAttempt = {
  id: string;
  sow_id: string;
  boar_id?: string;
  breeding_date: string;
  breeding_time?: string;
  breeding_method: 'natural' | 'ai';
};

type AIDose = {
  id: string;
  dose_number: number;
  dose_date: string;
  dose_time?: string;
  boar_id?: string;
  notes?: string;
};

type Boar = {
  id: string;
  ear_tag: string;
  name?: string;
  boar_type: 'live' | 'ai_semen';
};

type AIDoseModalProps = {
  breedingAttempt: BreedingAttempt;
  existingDoses: AIDose[];
  onClose: () => void;
  onSuccess: () => void;
};

export function AIDoseModal({ breedingAttempt, existingDoses, onClose, onSuccess }: AIDoseModalProps) {
  const { selectedOrganizationId } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [boars, setBoars] = useState<Boar[]>([]);

  // Get the most recent boar - either from the last dose or initial breeding
  const getPreviousBoarId = () => {
    if (existingDoses.length > 0) {
      // Get the most recent dose's boar
      const lastDose = existingDoses[existingDoses.length - 1];
      return lastDose.boar_id || breedingAttempt.boar_id || '';
    }
    // No previous doses, use initial breeding boar
    return breedingAttempt.boar_id || '';
  };

  const [formData, setFormData] = useState({
    dose_date: new Date().toISOString().split('T')[0],
    dose_time: new Date().toTimeString().slice(0, 5),
    boar_id: getPreviousBoarId(),
    notes: '',
  });

  useEffect(() => {
    if (selectedOrganizationId) {
      fetchBoars();
    }
  }, [selectedOrganizationId]);

  const fetchBoars = async () => {
    if (!selectedOrganizationId) return;

    try {
      const { data, error } = await supabase
        .from('boars')
        .select('id, ear_tag, name, boar_type')
        .eq('organization_id', selectedOrganizationId)
        .eq('status', 'active')
        .order('ear_tag');

      if (error) throw error;
      setBoars(data || []);
    } catch (error) {
      console.error('Failed to fetch boars:', error);
    }
  };

  const getNextDoseNumber = () => {
    if (existingDoses.length === 0) return 1;
    return Math.max(...existingDoses.map(d => d.dose_number)) + 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const doseNumber = getNextDoseNumber();
      const doseTimestamp = `${formData.dose_date}T${formData.dose_time}:00`;
      const boarIdToUse = formData.boar_id || breedingAttempt.boar_id;

      // Check if we have sufficient straws and get current count
      let currentStraws = 0;
      if (boarIdToUse) {
        const { data: boarData, error: boarError } = await supabase
          .from('boars')
          .select('semen_straws')
          .eq('id', boarIdToUse)
          .eq('organization_id', selectedOrganizationId!)
          .single();

        if (boarError) throw boarError;

        currentStraws = boarData?.semen_straws || 0;
        if (currentStraws < 1) {
          toast.error('Insufficient semen straws available');
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase
        .from('ai_doses')
        .insert([{
          user_id: user.id,
          organization_id: selectedOrganizationId,
          breeding_attempt_id: breedingAttempt.id,
          dose_number: doseNumber,
          dose_date: formData.dose_date,
          dose_time: doseTimestamp,
          boar_id: boarIdToUse,
          notes: formData.notes || null,
        }]);

      if (error) throw error;

      // Straw inventory is decremented automatically by the
      // trg_adjust_straw_on_dose_insert trigger on ai_doses (atomic, race-free).

      // Update last_dose_date on the breeding attempt
      const { error: updateError } = await supabase
        .from('breeding_attempts')
        .update({
          last_dose_date: formData.dose_date
        })
        .eq('id', breedingAttempt.id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast.success(`Follow-up dose #${doseNumber} recorded successfully`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to record AI dose:', error);
      toast.error(error.message || 'Failed to record AI dose');
    } finally {
      setLoading(false);
    }
  };

  // She's out of standing heat — no more doses. Mark the AI cycle complete,
  // which starts the pregnancy-check countdown (~21 days from breeding).
  const completeCycle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('breeding_attempts')
        .update({
          breeding_cycle_complete: true,
          breeding_cycle_completed_at: new Date().toISOString(),
        })
        .eq('id', breedingAttempt.id)
        .eq('organization_id', selectedOrganizationId!);
      if (error) throw error;
      toast.success('Marked bred — pregnancy check will appear ~21 days after breeding.');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete cycle');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card text-card-foreground rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-info-bg border-b border-info/25 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center space-x-2">
            <Syringe className="h-5 w-5 text-info" />
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Record Follow-up AI Dose #{getNextDoseNumber()}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-info-bg border border-info/25 rounded-lg p-3 text-sm text-foreground">
            <p>
              <strong className="text-info">Initial breeding:</strong>{' '}
              {new Date(breedingAttempt.breeding_date).toLocaleDateString()}
              {breedingAttempt.breeding_time && (
                <span> at {new Date(breedingAttempt.breeding_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              )}
              {breedingAttempt.boar_id && boars.length > 0 && (
                <span>
                  {' - '}
                  {(() => {
                    const initialBoar = boars.find(b => b.id === breedingAttempt.boar_id);
                    return initialBoar ? `${initialBoar.name || initialBoar.ear_tag}` : 'Loading...';
                  })()}
                </span>
              )}
            </p>
            {existingDoses.length > 0 && (
              <>
                <p className="mt-1">
                  <strong className="text-info">Last attempt:</strong>{' '}
                  {new Date(existingDoses[existingDoses.length - 1].dose_date).toLocaleDateString()}
                  {existingDoses[existingDoses.length - 1].dose_time && (
                    <span> at {new Date(existingDoses[existingDoses.length - 1].dose_time!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                  {existingDoses[existingDoses.length - 1].boar_id && boars.length > 0 && (
                    <span>
                      {' - '}
                      {(() => {
                        const lastBoar = boars.find(b => b.id === existingDoses[existingDoses.length - 1].boar_id);
                        return lastBoar ? `${lastBoar.name || lastBoar.ear_tag}` : 'Loading...';
                      })()}
                    </span>
                  )}
                </p>
                <p className="mt-1">
                  <strong className="text-info">Previous doses:</strong> {existingDoses.length}
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dose_date">
                Dose Date <span className="text-due">*</span>
              </Label>
              <Input
                id="dose_date"
                name="dose_date"
                type="date"
                value={formData.dose_date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dose_time">
                Dose Time <span className="text-due">*</span>
              </Label>
              <Input
                id="dose_time"
                name="dose_time"
                type="time"
                value={formData.dose_time}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground -mt-2">
            Typically 24 hours after previous dose
          </p>

          <div className="space-y-2">
            <Label htmlFor="boar_id">Sire Boar</Label>
            <select
              id="boar_id"
              name="boar_id"
              value={formData.boar_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
            >
              {boars
                .filter((b) => b.boar_type === 'ai_semen')
                .map((boar) => (
                  <option key={boar.id} value={boar.id}>
                    {boar.ear_tag}
                    {boar.name && ` - ${boar.name}`}
                    {boar.id === getPreviousBoarId() && ' (Previous)'}
                  </option>
                ))}
            </select>
            <p className="text-sm text-muted-foreground">
              Defaults to previous dose&apos;s boar
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Optional notes about this dose..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-4">
            <div className="flex gap-3">
              <Button type="submit" disabled={loading} className="flex-1 bg-brand text-brand-foreground hover:bg-brand/90">
                {loading ? 'Recording...' : 'Record Dose (still in heat)'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
            <button
              type="button"
              onClick={completeCycle}
              disabled={loading}
              className="w-full text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-2 disabled:opacity-50"
            >
              She&apos;s out of heat — mark bred &amp; complete cycle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
