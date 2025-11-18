'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { X, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type Boar = {
  id: string;
  ear_tag: string;
  name: string | null;
  breed: string;
  boar_type: 'live' | 'ai_semen';
  semen_straws: number | null;
};

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
  const [boars, setBoars] = useState<Boar[]>([]);
  const [formData, setFormData] = useState({
    breeding_date: '',
    moved_to_farrowing_date: new Date().toISOString().split('T')[0],
    farrowing_crate: '',
    boar_id: '',
    breeding_method: 'natural' as 'natural' | 'ai',
  });

  useEffect(() => {
    if (isOpen) {
      fetchBoars();
    }
  }, [isOpen]);

  const fetchBoars = async () => {
    try {
      const { data, error } = await supabase
        .from('boars')
        .select('id, ear_tag, name, breed, boar_type, semen_straws')
        .eq('status', 'active')
        .order('boar_type', { ascending: false }) // AI semen first, then live
        .order('name');

      if (error) throw error;
      setBoars(data || []);
    } catch (err: any) {
      console.error('Failed to fetch boars:', err.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    // Auto-set breeding method based on selected boar
    if (name === 'boar_id' && value) {
      const selectedBoar = boars.find(b => b.id === value);
      if (selectedBoar) {
        setFormData(prev => ({
          ...prev,
          boar_id: value,
          breeding_method: selectedBoar.boar_type === 'ai_semen' ? 'ai' : 'natural',
        }));
      }
    }
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

      // Check AI semen inventory before breeding
      if (formData.boar_id && formData.breeding_method === 'ai') {
        const selectedBoar = boars.find(b => b.id === formData.boar_id);
        if (selectedBoar && selectedBoar.semen_straws !== null && selectedBoar.semen_straws <= 0) {
          setError('No semen straws available for this boar. Please restock or select a different boar.');
          setLoading(false);
          return;
        }
      }

      // Create new farrowing record with move-to-farrowing info
      const { error: insertError } = await supabase
        .from('farrowings')
        .insert([{
          sow_id: sowId,
          breeding_date: formData.breeding_date,
          moved_to_farrowing_date: formData.moved_to_farrowing_date,
          farrowing_crate: formData.farrowing_crate,
          boar_id: formData.boar_id || null,
          breeding_method: formData.breeding_method,
          // expected_farrowing_date will be auto-calculated by the trigger (breeding_date + 114 days)
        }]);

      if (insertError) throw insertError;

      // Show low inventory warning if AI semen is running low
      if (formData.breeding_method === 'ai' && formData.boar_id) {
        const selectedBoar = boars.find(b => b.id === formData.boar_id);
        if (selectedBoar && selectedBoar.semen_straws !== null) {
          const remainingStraws = selectedBoar.semen_straws - 1; // After decrement by trigger
          if (remainingStraws <= 3 && remainingStraws > 0) {
            toast.warning(`Low inventory: ${selectedBoar.name || selectedBoar.ear_tag} has only ${remainingStraws} straw${remainingStraws !== 1 ? 's' : ''} remaining`);
          }
        }
      }

      toast.success('Sow moved to farrowing successfully!');

      // Reset form and close
      setFormData({
        breeding_date: '',
        moved_to_farrowing_date: new Date().toISOString().split('T')[0],
        farrowing_crate: '',
        boar_id: '',
        breeding_method: 'natural',
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
            <Label htmlFor="boar_id">Boar Used</Label>
            <Select
              id="boar_id"
              name="boar_id"
              value={formData.boar_id}
              onChange={handleChange}
            >
              <option value="">Select a boar (optional)</option>
              {boars.map((boar) => {
                const displayName = boar.name || boar.ear_tag;
                const boarInfo = boar.boar_type === 'ai_semen'
                  ? `${displayName} (AI Semen - ${boar.semen_straws || 0} straws)`
                  : `${displayName} (Live Boar)`;
                const isOutOfStock = boar.boar_type === 'ai_semen' && (boar.semen_straws === null || boar.semen_straws <= 0);

                return (
                  <option key={boar.id} value={boar.id} disabled={isOutOfStock}>
                    {boarInfo} {isOutOfStock && '- OUT OF STOCK'}
                  </option>
                );
              })}
            </Select>
            <p className="text-xs text-muted-foreground">
              Select which boar (live or AI semen) was used for breeding
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="breeding_method">Breeding Method</Label>
            <Select
              id="breeding_method"
              name="breeding_method"
              value={formData.breeding_method}
              onChange={handleChange}
            >
              <option value="natural">Natural (Live Breeding)</option>
              <option value="ai">AI (Artificial Insemination)</option>
            </Select>
            {formData.breeding_method === 'ai' && formData.boar_id && (
              <div className="flex items-start gap-2 bg-purple-50 border border-purple-200 rounded p-2 mt-1">
                <AlertCircle className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-purple-800">
                  One straw will be automatically deducted from inventory when breeding is recorded.
                </p>
              </div>
            )}
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs font-medium text-green-900">
                Expected Farrowing Date:{' '}
                <strong>
                  {new Date(new Date(formData.breeding_date).getTime() + 114 * 24 * 60 * 60 * 1000)
                    .toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </strong>
              </p>
              <p className="text-xs text-red-800 mt-1">
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
