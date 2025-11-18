'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type NursingPiglet = {
  id: string;
  ear_tag: string | null;
  right_ear_notch: number | null;
  left_ear_notch: number | null;
  sex: string | null;
  birth_weight: number | null;
  ear_notch_date: string | null;
  castration_date: string | null;
  status: string;
  notes: string | null;
  farrowing: {
    sow: {
      id: string;
      ear_tag: string;
      name: string | null;
    };
    actual_farrowing_date: string;
  };
};

type NursingPigletModalProps = {
  piglet: NursingPiglet | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function NursingPigletModal({
  piglet,
  isOpen,
  onClose,
  onSuccess,
}: NursingPigletModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    ear_tag: '',
    right_ear_notch: '',
    left_ear_notch: '',
    sex: 'unknown',
    birth_weight: '',
    ear_notch_date: '',
    castration_date: '',
    status: 'nursing',
    notes: '',
  });

  useEffect(() => {
    if (piglet && isOpen) {
      setFormData({
        ear_tag: piglet.ear_tag || '',
        right_ear_notch: piglet.right_ear_notch?.toString() || '',
        left_ear_notch: piglet.left_ear_notch?.toString() || '',
        sex: piglet.sex || 'unknown',
        birth_weight: piglet.birth_weight?.toString() || '',
        ear_notch_date: piglet.ear_notch_date || '',
        castration_date: piglet.castration_date || '',
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

      // Validate birth weight if provided
      if (formData.birth_weight && parseFloat(formData.birth_weight) <= 0) {
        setError('Birth weight must be greater than 0');
        setLoading(false);
        return;
      }

      // Validate castration date only applies to males
      if (formData.castration_date && formData.sex !== 'male') {
        setError('Only male piglets can have a castration date');
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('piglets')
        .update({
          ear_tag: formData.ear_tag || null,
          right_ear_notch: formData.right_ear_notch ? parseInt(formData.right_ear_notch) : null,
          left_ear_notch: formData.left_ear_notch ? parseInt(formData.left_ear_notch) : null,
          sex: formData.sex,
          birth_weight: formData.birth_weight ? parseFloat(formData.birth_weight) : null,
          ear_notch_date: formData.ear_notch_date || null,
          castration_date: formData.castration_date || null,
          status: formData.status,
          notes: formData.notes || null,
          // Add specific date fields when status changes
          ...(formData.status === 'died' && { died_date: new Date().toISOString().split('T')[0] }),
          ...(formData.status === 'culled' && { culled_date: new Date().toISOString().split('T')[0] }),
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

  const getAge = () => {
    const birth = new Date(piglet.farrowing.actual_farrowing_date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - birth.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Manage Nursing Piglet
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
                Mother: <strong>{piglet.farrowing.sow.name || piglet.farrowing.sow.ear_tag}</strong>
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Age: {getAge()} days • Born {new Date(piglet.farrowing.actual_farrowing_date).toLocaleDateString()}
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

            {/* Basic Information */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sex">
                    Sex
                  </Label>
                  <select
                    id="sex"
                    name="sex"
                    value={formData.sex}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value="unknown">Unknown</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth_weight">
                    Birth Weight (kg)
                  </Label>
                  <Input
                    id="birth_weight"
                    name="birth_weight"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.birth_weight}
                    onChange={handleChange}
                    placeholder="1.5"
                  />
                </div>
              </div>
            </div>

            {/* Events */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Events & Procedures</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ear_notch_date">Ear Notch Date</Label>
                  <Input
                    id="ear_notch_date"
                    name="ear_notch_date"
                    type="date"
                    value={formData.ear_notch_date}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Typically done days 1-3 after birth
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="castration_date">
                    Castration Date {formData.sex === 'male' && <span className="text-xs text-gray-500">(Male only)</span>}
                  </Label>
                  <Input
                    id="castration_date"
                    name="castration_date"
                    type="date"
                    value={formData.castration_date}
                    onChange={handleChange}
                    disabled={formData.sex !== 'male'}
                  />
                  <p className="text-xs text-muted-foreground">
                    Typically done pre-weaning
                  </p>
                </div>
              </div>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                  required
                >
                  <option value="nursing">Nursing</option>
                  <option value="died">Died</option>
                  <option value="culled">Culled</option>
                </select>
                {formData.status !== 'nursing' && (
                  <p className="text-xs text-amber-600 mt-2">
                    Note: Changing status will automatically record today&apos;s date for this event.
                  </p>
                )}
              </div>
            </div>

            {/* Notes and Treatments */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Notes & Treatments</h3>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Record treatments, antibiotics, illnesses, observations, or any other important information..."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Include details about any antibiotics, treatments, illnesses, or special observations
                </p>
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
