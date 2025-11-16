'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type MoveToFarrowingFormProps = {
  sowId: string;
  sowName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function MoveToFarrowingForm({
  sowId,
  sowName,
  isOpen,
  onClose,
  onSuccess,
}: MoveToFarrowingFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    breeding_date: '',
    moved_to_farrowing_date: new Date().toISOString().split('T')[0],
    farrowing_crate: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      // Validate required fields
      if (!formData.breeding_date) {
        setError('Breeding date is required');
        setLoading(false);
        return;
      }

      if (!formData.farrowing_crate) {
        setError('Crate number is required');
        setLoading(false);
        return;
      }

      // Create new farrowing record with move-to-farrowing info
      const { error: insertError } = await supabase
        .from('farrowings')
        .insert([{
          sow_id: sowId,
          breeding_date: formData.breeding_date,
          moved_to_farrowing_date: formData.moved_to_farrowing_date,
          farrowing_crate: formData.farrowing_crate,
          // expected_farrowing_date will be auto-calculated by the trigger (breeding_date + 114 days)
        }]);

      if (insertError) throw insertError;

      // Reset form and close
      setFormData({
        breeding_date: '',
        moved_to_farrowing_date: new Date().toISOString().split('T')[0],
        farrowing_crate: '',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to move sow to farrowing');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-xl font-bold text-gray-900">
            Move to Farrowing House
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-900">
              Moving: <strong>{sowName}</strong>
            </p>
          </div>

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
              required
            />
            <p className="text-xs text-muted-foreground">
              When was this sow bred?
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="moved_to_farrowing_date">
              Move Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="moved_to_farrowing_date"
              name="moved_to_farrowing_date"
              type="date"
              value={formData.moved_to_farrowing_date}
              onChange={handleChange}
              required
            />
            <p className="text-xs text-muted-foreground">
              Date moved to farrowing house (defaults to today)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="farrowing_crate">
              Crate Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="farrowing_crate"
              name="farrowing_crate"
              type="text"
              value={formData.farrowing_crate}
              onChange={handleChange}
              placeholder="e.g., A1, B5, Crate 12"
              required
            />
            <p className="text-xs text-muted-foreground">
              Which crate is this sow assigned to?
            </p>
          </div>

          {/* Expected Farrowing Date Info */}
          {formData.breeding_date && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs font-medium text-green-900">
                Expected Farrowing Date:{' '}
                <strong>
                  {new Date(new Date(formData.breeding_date).getTime() + 114 * 24 * 60 * 60 * 1000)
                    .toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </strong>
              </p>
              <p className="text-xs text-green-700 mt-1">
                (114 days from breeding)
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Moving to Farrowing...' : 'Move to Farrowing'}
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
