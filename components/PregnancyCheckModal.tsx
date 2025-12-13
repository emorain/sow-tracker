'use client';

import { useState } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
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
  const { user } = useAuth();
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

  const handleConfirmPregnant = async () => {
    if (!confirm(`Confirm pregnancy for ${sow.name || sow.ear_tag}?`)) {
      return;
    }

    setProcessing(true);
    try {
      const expectedFarrowingDate = calculateExpectedFarrowingDate(breedingAttempt.breeding_date);

      // 1. Create farrowing record
      const { data: farrowingData, error: farrowingError } = await supabase
        .from('farrowings')
        .insert({
          user_id: user?.id,
          organization_id: selectedOrganizationId,
          sow_id: sow.id,
          breeding_date: breedingAttempt.breeding_date,
          expected_farrowing_date: expectedFarrowingDate,
          breeding_method: 'natural', // Get from breeding_attempt
          boar_id: breedingAttempt.boar_id,
          breeding_attempt_id: breedingAttempt.id,
          notes: notes || 'Pregnancy confirmed',
        })
        .select()
        .single();

      if (farrowingError) throw farrowingError;

      // 2. Update breeding attempt
      const { error: updateError } = await supabase
        .from('breeding_attempts')
        .update({
          pregnancy_confirmed: true,
          pregnancy_check_date: checkDate,
          result: 'pregnant',
          farrowing_id: farrowingData.id,
          notes: notes ? `${notes}\n\nPregnancy confirmed on ${checkDate}` : `Pregnancy confirmed on ${checkDate}`,
        })
        .eq('id', breedingAttempt.id);

      if (updateError) throw updateError;

      toast.success(`Pregnancy confirmed! Expected farrowing: ${new Date(expectedFarrowingDate).toLocaleDateString()}`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error confirming pregnancy:', error);
      toast.error(error.message || 'Failed to confirm pregnancy');
    } finally {
      setProcessing(false);
    }
  };

  const handleReturnToHeat = async () => {
    if (!confirm(`Mark ${sow.name || sow.ear_tag} as returned to heat? This means the breeding was unsuccessful.`)) {
      return;
    }

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

      toast.success('Marked as returned to heat. Ready to re-breed.');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating breeding attempt:', error);
      toast.error(error.message || 'Failed to update breeding attempt');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Pregnancy Check</h2>
            <p className="text-sm text-gray-600 mt-1">
              {sow.name || sow.ear_tag} - Day {breedingAttempt.days_since_breeding}
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
        <div className="p-6 space-y-6">
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Breeding Date:</strong>{' '}
              {new Date(breedingAttempt.breeding_date).toLocaleDateString()}
            </p>
            <p className="text-sm text-blue-900 mt-1">
              <strong>Days Since Breeding:</strong> {breedingAttempt.days_since_breeding} days
            </p>
            {breedingAttempt.days_since_breeding >= 18 && breedingAttempt.days_since_breeding <= 21 && (
              <p className="text-xs text-blue-700 mt-2">
                Optimal time for pregnancy check (18-21 days)
              </p>
            )}
            {breedingAttempt.days_since_breeding > 21 && (
              <p className="text-xs text-amber-700 mt-2">
                Pregnancy check is overdue. Check as soon as possible.
              </p>
            )}
          </div>

          {/* Check Date */}
          <div className="space-y-2">
            <Label htmlFor="check_date">
              Check Date <span className="text-red-500">*</span>
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
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              {processing ? 'Processing...' : 'Confirm Pregnant'}
            </Button>
            <Button
              onClick={handleReturnToHeat}
              disabled={processing}
              variant="outline"
              className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <XCircle className="mr-2 h-5 w-5" />
              {processing ? 'Processing...' : 'Returned to Heat'}
            </Button>
          </div>

          {/* Info Text */}
          <div className="text-xs text-gray-600 space-y-1">
            <p>
              <strong>Confirm Pregnant:</strong> Creates farrowing record with expected date (114
              days from breeding)
            </p>
            <p>
              <strong>Returned to Heat:</strong> Marks breeding unsuccessful, sow ready to
              re-breed
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50 rounded-b-lg">
          <Button type="button" variant="outline" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
