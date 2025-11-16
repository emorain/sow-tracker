'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
  });

  useEffect(() => {
    if (piglet && isOpen) {
      setFormData({
        ear_tag: piglet.ear_tag || '',
        right_ear_notch: piglet.right_ear_notch?.toString() || '',
        left_ear_notch: piglet.left_ear_notch?.toString() || '',
        birth_weight: piglet.birth_weight.toString(),
        weaning_weight: piglet.weaning_weight.toString(),
        status: piglet.status,
        notes: piglet.notes || '',
      });
    }
  }, [piglet, isOpen]);

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

      // Validate weights
      if (!formData.birth_weight || parseFloat(formData.birth_weight) <= 0) {
        setError('Birth weight must be greater than 0');
        setLoading(false);
        return;
      }

      if (!formData.weaning_weight || parseFloat(formData.weaning_weight) <= 0) {
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
          birth_weight: parseFloat(formData.birth_weight),
          weaning_weight: parseFloat(formData.weaning_weight),
          status: formData.status,
          notes: formData.notes || null,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Edit Piglet Details
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
              <p className="text-sm text-blue-900">
                Editing piglet: <strong>{piglet.ear_tag || `Notch ${piglet.right_ear_notch}-${piglet.left_ear_notch}`}</strong>
              </p>
            </div>

            {/* Identification */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Identification</h3>
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
              <h3 className="font-semibold text-gray-900 mb-3">Weight Data</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birth_weight">
                    Birth Weight (kg) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="birth_weight"
                    name="birth_weight"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.birth_weight}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weaning_weight">
                    Weaning Weight (kg) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="weaning_weight"
                    name="weaning_weight"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.weaning_weight}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              {formData.birth_weight && formData.weaning_weight && (
                <div className="mt-2 text-sm text-gray-600">
                  Weight gain: <span className="font-medium text-green-600">
                    +{(parseFloat(formData.weaning_weight) - parseFloat(formData.birth_weight)).toFixed(2)} kg
                  </span>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Status</h3>
              <div className="space-y-2">
                <Label htmlFor="status">
                  Current Status <span className="text-red-500">*</span>
                </Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
              <h3 className="font-semibold text-gray-900 mb-3">Notes</h3>
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
          <div className="border-t px-6 py-4 bg-white">
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
