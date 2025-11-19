'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Sow = {
  id: string;
  ear_tag: string;
  name: string | null;
};

type MatrixTreatmentFormProps = {
  selectedSows: Sow[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function MatrixTreatmentForm({
  selectedSows,
  isOpen,
  onClose,
  onSuccess,
}: MatrixTreatmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    batch_name: '',
    administration_date: new Date().toISOString().split('T')[0],
    days_until_heat: '5',
    dosage: '',
    lot_number: '',
    notes: '',
  });

  // Auto-generate batch name based on date when form opens
  useEffect(() => {
    if (isOpen && !formData.batch_name) {
      const date = new Date().toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        batch_name: `Matrix-${date}`,
      }));
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const calculateExpectedHeatDate = () => {
    const adminDate = new Date(formData.administration_date);
    const daysToAdd = parseInt(formData.days_until_heat) || 5;
    adminDate.setDate(adminDate.getDate() + daysToAdd);
    return adminDate.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to create matrix treatments');
        setLoading(false);
        return;
      }

      if (selectedSows.length === 0) {
        setError('No sows selected');
        setLoading(false);
        return;
      }

      if (!formData.batch_name.trim()) {
        setError('Batch name is required');
        setLoading(false);
        return;
      }

      const expectedHeatDate = calculateExpectedHeatDate();

      // Create matrix treatment records for all selected sows
      const treatments = selectedSows.map(sow => ({
        user_id: user.id,
        sow_id: sow.id,
        batch_name: formData.batch_name.trim(),
        administration_date: formData.administration_date,
        expected_heat_date: expectedHeatDate,
        dosage: formData.dosage || null,
        lot_number: formData.lot_number || null,
        notes: formData.notes || null,
      }));

      const { error: insertError } = await supabase
        .from('matrix_treatments')
        .insert(treatments);

      if (insertError) throw insertError;

      // Reset form
      setFormData({
        batch_name: '',
        administration_date: new Date().toISOString().split('T')[0],
        days_until_heat: '5',
        dosage: '',
        lot_number: '',
        notes: '',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record Matrix treatment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-2xl font-bold text-gray-900">
            Record Matrix Treatment
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Selected Sows */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              Selected Sows ({selectedSows.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedSows.map(sow => (
                <span
                  key={sow.id}
                  className="px-2 py-1 bg-white border border-blue-300 rounded text-sm text-blue-900"
                >
                  {sow.name || sow.ear_tag}
                </span>
              ))}
            </div>
          </div>

          {/* Batch Name */}
          <div className="space-y-2">
            <Label htmlFor="batch_name">
              Batch Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="batch_name"
              name="batch_name"
              type="text"
              value={formData.batch_name}
              onChange={handleChange}
              placeholder="e.g., Matrix-2025-01-15, January Batch"
              required
            />
            <p className="text-xs text-muted-foreground">
              Identifier for this synchronized group
            </p>
          </div>

          {/* Administration Date */}
          <div className="space-y-2">
            <Label htmlFor="administration_date">
              Administration Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="administration_date"
              name="administration_date"
              type="date"
              value={formData.administration_date}
              onChange={handleChange}
              required
            />
          </div>

          {/* Days Until Heat */}
          <div className="space-y-2">
            <Label htmlFor="days_until_heat">
              Days Until Expected Heat
            </Label>
            <Input
              id="days_until_heat"
              name="days_until_heat"
              type="number"
              min="3"
              max="10"
              value={formData.days_until_heat}
              onChange={handleChange}
            />
            <p className="text-xs text-muted-foreground">
              Typically 5-7 days after administration (default: 5)
            </p>
          </div>

          {/* Expected Heat Date Display */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-900">
              Expected Heat Date:{' '}
              <strong>
                {new Date(calculateExpectedHeatDate()).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </strong>
            </p>
            <p className="text-xs text-red-800 mt-1">
              ({formData.days_until_heat} days from administration)
            </p>
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage</Label>
              <Input
                id="dosage"
                name="dosage"
                type="text"
                value={formData.dosage}
                onChange={handleChange}
                placeholder="e.g., 5ml"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lot_number">Lot Number</Label>
              <Input
                id="lot_number"
                name="lot_number"
                type="text"
                value={formData.lot_number}
                onChange={handleChange}
                placeholder="Product lot #"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional observations..."
              rows={3}
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Recording...' : `Record Treatment (${selectedSows.length} sows)`}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
