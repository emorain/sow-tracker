'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Syringe, Calendar, DollarSign, Package, X } from 'lucide-react';
import { toast } from 'sonner';

type BulkVaccineModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedAnimals: Array<{ id: string; ear_tag?: string | null; name?: string | null }>;
  animalType: 'sow' | 'boar' | 'piglet';
  onSuccess: () => void;
};

export default function BulkVaccineModal({
  isOpen,
  onClose,
  selectedAnimals,
  animalType,
  onSuccess,
}: BulkVaccineModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vaccine_name: '',
    vaccine_type: '',
    dosage: '',
    batch_number: '',
    manufacturer: '',
    administration_route: '',
    vaccination_date: new Date().toISOString().split('T')[0],
    next_due_date: '',
    cost_per_animal: '',
    veterinarian: '',
    notes: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || selectedAnimals.length === 0) return;

    setLoading(true);
    try {
      const costPerAnimal = parseFloat(formData.cost_per_animal) || 0;

      // Create health records for each selected animal
      const healthRecords = selectedAnimals.map((animal) => ({
        user_id: user.id,
        animal_type: animalType,
        [`${animalType}_id`]: animal.id,
        record_type: 'vaccine',
        title: formData.vaccine_name,
        description: `Vaccine Type: ${formData.vaccine_type}
Dosage: ${formData.dosage}
Batch Number: ${formData.batch_number}
Manufacturer: ${formData.manufacturer}
Administration Route: ${formData.administration_route}
Veterinarian: ${formData.veterinarian}
${formData.notes ? `\nNotes: ${formData.notes}` : ''}`,
        record_date: formData.vaccination_date,
        next_due_date: formData.next_due_date || null,
        cost: costPerAnimal,
        veterinarian: formData.veterinarian || null,
        medication_name: formData.vaccine_name,
        dosage: formData.dosage || null,
      }));

      const { error } = await supabase
        .from('health_records')
        .insert(healthRecords);

      if (error) throw error;

      toast.success(`Successfully recorded vaccination for ${selectedAnimals.length} ${animalType}(s)`);
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error recording vaccinations:', error);
      toast.error('Failed to record vaccinations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      vaccine_name: '',
      vaccine_type: '',
      dosage: '',
      batch_number: '',
      manufacturer: '',
      administration_route: '',
      vaccination_date: new Date().toISOString().split('T')[0],
      next_due_date: '',
      cost_per_animal: '',
      veterinarian: '',
      notes: '',
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Syringe className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-semibold">
              Bulk Vaccination - {selectedAnimals.length} {animalType}(s)
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Vaccine Information */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="font-semibold text-gray-900">Vaccine Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vaccine_name">
                  Vaccine Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="vaccine_name"
                  type="text"
                  value={formData.vaccine_name}
                  onChange={(e) => setFormData({ ...formData, vaccine_name: e.target.value })}
                  placeholder="e.g., PCV2 Vaccine"
                  required
                />
              </div>

              <div>
                <Label htmlFor="vaccine_type">Vaccine Type</Label>
                <Input
                  id="vaccine_type"
                  type="text"
                  value={formData.vaccine_type}
                  onChange={(e) => setFormData({ ...formData, vaccine_type: e.target.value })}
                  placeholder="e.g., Modified Live, Killed"
                />
              </div>

              <div>
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  type="text"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  placeholder="e.g., 2 mL IM"
                />
              </div>

              <div>
                <Label htmlFor="administration_route">Administration Route</Label>
                <Input
                  id="administration_route"
                  type="text"
                  value={formData.administration_route}
                  onChange={(e) => setFormData({ ...formData, administration_route: e.target.value })}
                  placeholder="e.g., Intramuscular, Subcutaneous"
                />
              </div>

              <div>
                <Label htmlFor="batch_number">
                  <Package className="inline h-4 w-4 mr-1" />
                  Batch/Lot Number
                </Label>
                <Input
                  id="batch_number"
                  type="text"
                  value={formData.batch_number}
                  onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                  placeholder="e.g., LOT123456"
                />
              </div>

              <div>
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="e.g., Zoetis, Merck"
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4 border-b pb-4">
            <h3 className="font-semibold text-gray-900">Dates</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vaccination_date">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Vaccination Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="vaccination_date"
                  type="date"
                  value={formData.vaccination_date}
                  onChange={(e) => setFormData({ ...formData, vaccination_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="next_due_date">
                  Next Due Date (Booster)
                </Label>
                <Input
                  id="next_due_date"
                  type="date"
                  value={formData.next_due_date}
                  onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  If booster is required, set the next vaccination date
                </p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Additional Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cost_per_animal">
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  Cost Per Animal ($)
                </Label>
                <Input
                  id="cost_per_animal"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_per_animal}
                  onChange={(e) => setFormData({ ...formData, cost_per_animal: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="veterinarian">Administered By</Label>
                <Input
                  id="veterinarian"
                  type="text"
                  value={formData.veterinarian}
                  onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
                  placeholder="Veterinarian or technician name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes or observations..."
                rows={3}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Summary:</strong> Recording vaccination for {selectedAnimals.length} {animalType}(s)
            </p>
            {formData.cost_per_animal && (
              <p className="text-sm text-blue-900 mt-1">
                <strong>Total Cost:</strong> ${(parseFloat(formData.cost_per_animal) * selectedAnimals.length).toFixed(2)}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Recording...' : 'Record Vaccinations'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
