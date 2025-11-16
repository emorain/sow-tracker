'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type WeanLitterModalProps = {
  farrowingId: string;
  sowName: string;
  sowEarTag: string;
  actualFarrowingDate: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type PigletData = {
  ear_tag: string;
  right_ear_notch: string;
  left_ear_notch: string;
  birth_weight: string;
  weaning_weight: string;
};

export default function WeanLitterModal({
  farrowingId,
  sowName,
  sowEarTag,
  actualFarrowingDate,
  isOpen,
  onClose,
  onSuccess,
}: WeanLitterModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [livePigletCount, setLivePigletCount] = useState<number>(0);
  const [weaningDate, setWeaningDate] = useState(new Date().toISOString().split('T')[0]);
  const [piglets, setPiglets] = useState<PigletData[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchLivePigletCount();
    }
  }, [isOpen, farrowingId]);

  const fetchLivePigletCount = async () => {
    try {
      // Get the live_piglets count from the farrowing record
      const { data, error } = await supabase
        .from('farrowings')
        .select('live_piglets')
        .eq('id', farrowingId)
        .single();

      if (error) throw error;

      const count = data?.live_piglets || 0;
      setLivePigletCount(count);

      // Initialize piglet data array with empty values
      setPiglets(Array(count).fill(null).map(() => ({
        ear_tag: '',
        right_ear_notch: '',
        left_ear_notch: '',
        birth_weight: '',
        weaning_weight: '',
      })));
    } catch (err) {
      console.error('Failed to fetch live piglet count:', err);
      setError('Failed to load farrowing data');
    }
  };

  const updatePiglet = (index: number, field: keyof PigletData, value: string) => {
    const updated = [...piglets];
    updated[index][field] = value;
    setPiglets(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate that all piglets have at least ear_tag or ear_notch and weights
      for (let i = 0; i < piglets.length; i++) {
        const piglet = piglets[i];
        if (!piglet.ear_tag && !piglet.right_ear_notch && !piglet.left_ear_notch) {
          setError(`Piglet ${i + 1}: Please provide either an ear tag or ear notch`);
          setLoading(false);
          return;
        }
        if (!piglet.birth_weight || parseFloat(piglet.birth_weight) <= 0) {
          setError(`Piglet ${i + 1}: Birth weight is required and must be greater than 0`);
          setLoading(false);
          return;
        }
        if (!piglet.weaning_weight || parseFloat(piglet.weaning_weight) <= 0) {
          setError(`Piglet ${i + 1}: Weaning weight is required and must be greater than 0`);
          setLoading(false);
          return;
        }
      }

      // Create individual piglet records
      const pigletRecords = piglets.map(piglet => ({
        farrowing_id: farrowingId,
        ear_tag: piglet.ear_tag || null,
        right_ear_notch: piglet.right_ear_notch ? parseInt(piglet.right_ear_notch) : null,
        left_ear_notch: piglet.left_ear_notch ? parseInt(piglet.left_ear_notch) : null,
        birth_weight: parseFloat(piglet.birth_weight),
        weaning_weight: parseFloat(piglet.weaning_weight),
        status: 'weaned',
        weaned_date: weaningDate,
      }));

      const { error: pigletsError } = await supabase
        .from('piglets')
        .insert(pigletRecords);

      if (pigletsError) throw pigletsError;

      // Update farrowing record with moved_out_of_farrowing_date
      const { error: farrowingError } = await supabase
        .from('farrowings')
        .update({ moved_out_of_farrowing_date: weaningDate })
        .eq('id', farrowingId);

      if (farrowingError) throw farrowingError;

      // Reset and close
      setWeaningDate(new Date().toISOString().split('T')[0]);
      setPiglets([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to wean litter');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const daysSinceFarrowing = Math.floor(
    (new Date().getTime() - new Date(actualFarrowingDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Wean Litter - Record Individual Piglets
          </h2>
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900">
                Sow: <strong>{sowName || sowEarTag}</strong>
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Farrowed {daysSinceFarrowing} days ago • {livePigletCount} piglet{livePigletCount !== 1 ? 's' : ''} to record
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weaning_date">
                Weaning Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="weaning_date"
                name="weaning_date"
                type="date"
                value={weaningDate}
                onChange={(e) => setWeaningDate(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Date when piglets were weaned and sow moved out
              </p>
            </div>

            {/* Individual Piglet Inputs */}
            {livePigletCount > 0 && (
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Individual Piglet Data
                  </h3>
                  <p className="text-xs text-gray-600 mb-4">
                    Enter identification and weight data for each piglet. At least one identification method (ear tag or notch) is required.
                  </p>
                </div>

                {piglets.map((piglet, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Piglet {index + 1}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor={`ear_tag_${index}`} className="text-xs">
                          Ear Tag
                        </Label>
                        <Input
                          id={`ear_tag_${index}`}
                          type="text"
                          value={piglet.ear_tag}
                          onChange={(e) => updatePiglet(index, 'ear_tag', e.target.value)}
                          placeholder="e.g., P001"
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`right_notch_${index}`} className="text-xs">
                          Right Notch
                        </Label>
                        <Input
                          id={`right_notch_${index}`}
                          type="number"
                          min="0"
                          value={piglet.right_ear_notch}
                          onChange={(e) => updatePiglet(index, 'right_ear_notch', e.target.value)}
                          placeholder="0-9"
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`left_notch_${index}`} className="text-xs">
                          Left Notch
                        </Label>
                        <Input
                          id={`left_notch_${index}`}
                          type="number"
                          min="0"
                          value={piglet.left_ear_notch}
                          onChange={(e) => updatePiglet(index, 'left_ear_notch', e.target.value)}
                          placeholder="0-9"
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`birth_weight_${index}`} className="text-xs">
                          Birth Weight (kg) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`birth_weight_${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={piglet.birth_weight}
                          onChange={(e) => updatePiglet(index, 'birth_weight', e.target.value)}
                          placeholder="1.5"
                          className="text-sm"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`weaning_weight_${index}`} className="text-xs">
                          Weaning Weight (kg) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`weaning_weight_${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={piglet.weaning_weight}
                          onChange={(e) => updatePiglet(index, 'weaning_weight', e.target.value)}
                          placeholder="6.5"
                          className="text-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="border-t px-6 py-4 bg-white">
            <div className="flex gap-3">
              <Button type="submit" disabled={loading || livePigletCount === 0} className="flex-1">
                {loading ? 'Recording Piglets...' : `Wean ${livePigletCount} Piglet${livePigletCount !== 1 ? 's' : ''}`}
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
