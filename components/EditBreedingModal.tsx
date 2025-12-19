'use client';

import { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useOrganization } from '@/lib/organization-context';

type BreedingAttempt = {
  id: string;
  breeding_date: string;
  breeding_time: string | null;
  breeding_method: 'natural' | 'ai';
  boar_id: string | null;
  boar_description: string | null;
  pregnancy_check_date: string | null;
  pregnancy_confirmed: boolean | null;
  result: 'pending' | 'pregnant' | 'returned_to_heat' | 'aborted' | 'unknown' | null;
  notes: string | null;
};

type Boar = {
  id: string;
  ear_tag: string;
  name: string | null;
  boar_type: 'live' | 'ai_semen';
};

type EditBreedingModalProps = {
  breeding: BreedingAttempt;
  onClose: () => void;
  onSuccess: () => void;
};

export function EditBreedingModal({ breeding, onClose, onSuccess }: EditBreedingModalProps) {
  const { selectedOrganizationId } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [boars, setBoars] = useState<Boar[]>([]);
  const [formData, setFormData] = useState({
    breeding_date: breeding.breeding_date,
    breeding_time: breeding.breeding_time || '',
    breeding_method: breeding.breeding_method,
    boar_id: breeding.boar_id || '',
    boar_description: breeding.boar_description || '',
    pregnancy_check_date: breeding.pregnancy_check_date || '',
    pregnancy_confirmed: breeding.pregnancy_confirmed,
    result: breeding.result || 'pending',
    notes: breeding.notes || '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      // Prepare update data
      const updateData: any = {
        breeding_date: formData.breeding_date,
        breeding_method: formData.breeding_method,
        result: formData.result,
        notes: formData.notes || null,
      };

      // Add breeding time if provided
      if (formData.breeding_time) {
        updateData.breeding_time = `${formData.breeding_date}T${formData.breeding_time}:00`;
      } else {
        updateData.breeding_time = null;
      }

      // Add boar info based on method
      if (formData.breeding_method === 'natural') {
        updateData.boar_id = formData.boar_id || null;
        updateData.boar_description = null;
      } else {
        updateData.boar_id = formData.boar_id || null;
        updateData.boar_description = formData.boar_description || null;
      }

      // Add pregnancy check info if provided
      if (formData.pregnancy_check_date) {
        updateData.pregnancy_check_date = formData.pregnancy_check_date;
        updateData.pregnancy_confirmed = formData.pregnancy_confirmed;
      } else {
        updateData.pregnancy_check_date = null;
        updateData.pregnancy_confirmed = null;
      }

      // Update breeding attempt
      const { error } = await supabase
        .from('breeding_attempts')
        .update(updateData)
        .eq('id', breeding.id)
        .eq('organization_id', selectedOrganizationId!);

      if (error) throw error;

      toast.success('Breeding record updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to update breeding:', error);
      toast.error(error.message || 'Failed to update breeding record');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-50 border-b px-6 py-4 flex items-center justify-between rounded-t-lg sticky top-0">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Edit Breeding Record</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="breeding_time">Breeding Time</Label>
              <Input
                id="breeding_time"
                name="breeding_time"
                type="time"
                value={formData.breeding_time}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="breeding_method">
              Breeding Method <span className="text-red-500">*</span>
            </Label>
            <select
              id="breeding_method"
              name="breeding_method"
              value={formData.breeding_method}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            >
              <option value="natural">Natural (Live Boar)</option>
              <option value="ai">AI (Artificial Insemination)</option>
            </select>
          </div>

          {formData.breeding_method === 'natural' ? (
            <div className="space-y-2">
              <Label htmlFor="boar_id">Boar</Label>
              <select
                id="boar_id"
                name="boar_id"
                value={formData.boar_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select a boar...</option>
                {boars
                  .filter((b) => b.boar_type === 'live')
                  .map((boar) => (
                    <option key={boar.id} value={boar.id}>
                      {boar.ear_tag}
                      {boar.name && ` - ${boar.name}`}
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="boar_id">Boar/Semen (Optional)</Label>
                <select
                  id="boar_id"
                  name="boar_id"
                  value={formData.boar_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select AI semen source...</option>
                  {boars
                    .filter((b) => b.boar_type === 'ai_semen')
                    .map((boar) => (
                      <option key={boar.id} value={boar.id}>
                        {boar.ear_tag}
                        {boar.name && ` - ${boar.name}`} (AI)
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="boar_description">
                  Or Enter Boar Description
                </Label>
                <Input
                  id="boar_description"
                  name="boar_description"
                  value={formData.boar_description}
                  onChange={handleChange}
                  placeholder="e.g., Hampshire boar from XYZ Farm"
                />
              </div>
            </>
          )}

          <div className="border-t pt-4 space-y-4">
            <h3 className="font-semibold text-gray-900">Pregnancy Check (Optional)</h3>

            <div className="space-y-2">
              <Label htmlFor="pregnancy_check_date">Pregnancy Check Date</Label>
              <Input
                id="pregnancy_check_date"
                name="pregnancy_check_date"
                type="date"
                value={formData.pregnancy_check_date}
                onChange={handleChange}
              />
            </div>

            {formData.pregnancy_check_date && (
              <div className="space-y-2">
                <Label>Pregnancy Result</Label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="pregnancy_confirmed"
                      value="true"
                      checked={formData.pregnancy_confirmed === true}
                      onChange={() =>
                        setFormData({ ...formData, pregnancy_confirmed: true })
                      }
                      className="mr-2"
                    />
                    Pregnant
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="pregnancy_confirmed"
                      value="false"
                      checked={formData.pregnancy_confirmed === false}
                      onChange={() =>
                        setFormData({ ...formData, pregnancy_confirmed: false })
                      }
                      className="mr-2"
                    />
                    Not Pregnant
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="result">Breeding Result</Label>
            <select
              id="result"
              name="result"
              value={formData.result}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="pending">Pending</option>
              <option value="pregnant">Pregnant</option>
              <option value="returned_to_heat">Returned to Heat</option>
              <option value="aborted">Aborted</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Optional notes about this breeding..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : 'Save Changes'}
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
