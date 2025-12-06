'use client';

import { useState } from 'react';
import { X, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type HealthEventModalProps = {
  animalType: 'sow' | 'boar' | 'piglet';
  animalId: string;
  animalName: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function HealthEventModal({
  animalType,
  animalId,
  animalName,
  onClose,
  onSuccess,
}: HealthEventModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    record_type: 'vet_visit',
    record_date: new Date().toISOString().split('T')[0],
    title: '',
    description: '',
    dosage: '',
    cost: '',
    administered_by: '',
    veterinarian: '',
    next_due_date: '',
  });

  const recordTypes = [
    { value: 'vet_visit', label: 'Vet Visit' },
    { value: 'injury', label: 'Injury' },
    { value: 'procedure', label: 'Procedure' },
    { value: 'observation', label: 'General Observation' },
    { value: 'vaccine', label: 'Vaccine' },
    { value: 'treatment', label: 'Treatment' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      if (!formData.title.trim()) {
        toast.error('Title is required');
        return;
      }

      const recordData: any = {
        user_id: user.id,
        animal_type: animalType,
        record_type: formData.record_type,
        record_date: formData.record_date,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        dosage: formData.dosage.trim() || null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        administered_by: formData.administered_by.trim() || null,
        veterinarian: formData.veterinarian.trim() || null,
        next_due_date: formData.next_due_date || null,
      };

      // Set the appropriate animal ID based on type
      recordData[`${animalType}_id`] = animalId;

      const { error } = await supabase
        .from('health_records')
        .insert([recordData]);

      if (error) throw error;

      toast.success(`${recordTypes.find(t => t.value === formData.record_type)?.label} recorded successfully`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to record health event:', error);
      toast.error(error.message || 'Failed to record health event');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-green-50 border-b px-6 py-4 flex items-center justify-between rounded-t-lg sticky top-0">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Record Health Event - {animalName}
            </h2>
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
              <Label htmlFor="record_type">
                Event Type <span className="text-red-500">*</span>
              </Label>
              <select
                id="record_type"
                name="record_type"
                value={formData.record_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                {recordTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="record_date">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="record_date"
                name="record_date"
                type="date"
                value={formData.record_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Annual checkup, Hoof trim, Laceration on left leg"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed notes about the event, observations, treatment plan..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="veterinarian">Veterinarian</Label>
              <Input
                id="veterinarian"
                name="veterinarian"
                type="text"
                value={formData.veterinarian}
                onChange={handleChange}
                placeholder="Dr. Smith"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="administered_by">Administered By</Label>
              <Input
                id="administered_by"
                name="administered_by"
                type="text"
                value={formData.administered_by}
                onChange={handleChange}
                placeholder="Staff member name"
              />
            </div>
          </div>

          {(formData.record_type === 'vaccine' || formData.record_type === 'treatment') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  name="dosage"
                  type="text"
                  value={formData.dosage}
                  onChange={handleChange}
                  placeholder="e.g., 5ml, 2 tablets"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="next_due_date">Next Due Date</Label>
                <Input
                  id="next_due_date"
                  name="next_due_date"
                  type="date"
                  value={formData.next_due_date}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="cost">Cost ($)</Label>
            <Input
              id="cost"
              name="cost"
              type="number"
              step="0.01"
              min="0"
              value={formData.cost}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Recording...' : 'Record Event'}
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
