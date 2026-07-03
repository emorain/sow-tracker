'use client';

import { useState } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useOrganization } from '@/lib/organization-context';

type Sow = {
  id: string;
  ear_tag: string;
  name: string | null;
};

type BreedingAttempt = {
  id: string;
  breeding_date: string;
  days_since_breeding: number;
  boar_id?: string;
  breeding_method?: 'natural' | 'ai';
};

type PregnancyCheckModalProps = {
  sow: Sow;
  breedingAttempt: BreedingAttempt;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function PregnancyCheckModal({
  sow,
  breedingAttempt,
  isOpen,
  onClose,
  onSuccess,
}: PregnancyCheckModalProps) {
  const { selectedOrganizationId } = useOrganization();
  const [processing, setProcessing] = useState(false);
  const [checkDate, setCheckDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const calculateExpectedFarrowingDate = (breedingDate: string) => {
    const breeding = new Date(breedingDate);
    breeding.setDate(breeding.getDate() + 114); // Gestation period is ~114 days
    return breeding.toISOString().split('T')[0];
  };

  const label = sow.name || sow.ear_tag;

  const handleConfirmPregnant = async () => {
    setProcessing(true);
    try {
      const expectedFarrowingDate = calculateExpectedFarrowingDate(breedingAttempt.breeding_date);

      // Insert farrowing + update breeding attempt atomically (single transaction).
      // Returns the new farrowing id, which we keep so the action can be undone.
      const { data: farrowingId, error: rpcError } = await supabase.rpc('confirm_pregnancy', {
        p_breeding_attempt_id: breedingAttempt.id,
        p_sow_id: sow.id,
        p_organization_id: selectedOrganizationId,
        p_breeding_date: breedingAttempt.breeding_date,
        p_expected_farrowing_date: expectedFarrowingDate,
        p_breeding_method: breedingAttempt.breeding_method || 'natural',
        p_boar_id: breedingAttempt.boar_id ?? null,
        p_check_date: checkDate,
        p_notes: notes || '',
      });

      if (rpcError) throw rpcError;

      onSuccess();
      onClose();
      toast.success(`${label} confirmed pregnant · due ${new Date(expectedFarrowingDate).toLocaleDateString()}`, {
        duration: 8000,
        action: {
          label: 'Undo',
          onClick: async () => {
            // Deleting the farrowing fires the DB trigger that reverts the
            // breeding attempt to pending and clears the link — full undo.
            const { error } = await supabase
              .from('farrowings').delete()
              .eq('id', farrowingId as string)
              .eq('organization_id', selectedOrganizationId!);
            if (error) { toast.error('Could not undo — edit the breeding record instead'); return; }
            toast.success(`Undone — ${label} back to awaiting check`);
            onSuccess();
          },
        },
      });
    } catch (error: any) {
      console.error('Error confirming pregnancy:', error);
      toast.error(error.message || 'Failed to confirm pregnancy');
    } finally {
      setProcessing(false);
    }
  };

  const handleReturnToHeat = async () => {
    setProcessing(true);
    try {
      // Update breeding attempt
      const { error: updateError } = await supabase
        .from('breeding_attempts')
        .update({
          pregnancy_confirmed: false,
          pregnancy_check_date: checkDate,
          result: 'returned_to_heat',
          notes: notes ? `${notes}\n\nReturned to heat on ${checkDate}` : `Returned to heat on ${checkDate}`,
        })
        .eq('id', breedingAttempt.id);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
      toast.success(`${label} marked returned to heat · ready to re-breed`, {
        duration: 8000,
        action: {
          label: 'Undo',
          onClick: async () => {
            const { error } = await supabase
              .from('breeding_attempts')
              .update({ pregnancy_confirmed: null, pregnancy_check_date: null, result: 'pending' })
              .eq('id', breedingAttempt.id);
            if (error) { toast.error('Could not undo — edit the breeding record instead'); return; }
            toast.success(`Undone — ${label} back to awaiting check`);
            onSuccess();
          },
        },
      });
    } catch (error: any) {
      console.error('Error updating breeding attempt:', error);
      toast.error(error.message || 'Failed to update breeding attempt');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card text-card-foreground rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between sticky top-0 bg-card rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Pregnancy Check</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              <span className="font-mono">{sow.ear_tag}</span>
              {sow.name ? ` · ${sow.name}` : ''} · Day {breedingAttempt.days_since_breeding}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Box */}
          <div className="bg-info-bg border border-info/25 rounded-lg p-4">
            <p className="text-sm">
              <strong className="text-info">Breeding date:</strong>{' '}
              {new Date(breedingAttempt.breeding_date).toLocaleDateString()}
            </p>
            <p className="text-sm mt-1">
              <strong className="text-info">Days since breeding:</strong> {breedingAttempt.days_since_breeding} days
            </p>
            {breedingAttempt.days_since_breeding >= 18 && breedingAttempt.days_since_breeding <= 21 && (
              <p className="text-xs text-info mt-2">Optimal window for a pregnancy check (18–21 days).</p>
            )}
            {breedingAttempt.days_since_breeding > 21 && (
              <p className="text-xs text-due mt-2 font-medium">Pregnancy check is overdue — check as soon as possible.</p>
            )}
          </div>

          {/* Check Date */}
          <div className="space-y-2">
            <Label htmlFor="check_date">
              Check Date <span className="text-due">*</span>
            </Label>
            <Input
              id="check_date"
              type="date"
              value={checkDate}
              onChange={(e) => setCheckDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any observations about the pregnancy check..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <Button
              onClick={handleConfirmPregnant}
              disabled={processing}
              className="w-full bg-ok text-white hover:bg-ok/90"
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              {processing ? 'Processing…' : 'Confirm Pregnant'}
            </Button>
            <Button
              onClick={handleReturnToHeat}
              disabled={processing}
              variant="outline"
              className="w-full border-soon/40 text-soon hover:bg-soon-bg"
            >
              <XCircle className="mr-2 h-5 w-5" />
              {processing ? 'Processing…' : 'Returned to Heat'}
            </Button>
          </div>

          {/* Info Text */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong className="text-foreground">Confirm Pregnant:</strong> creates a farrowing record with the expected date (114 days from breeding).</p>
            <p><strong className="text-foreground">Returned to Heat:</strong> marks the breeding unsuccessful; the sow is ready to re-breed.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-secondary rounded-b-xl">
          <Button type="button" variant="outline" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
