'use client';

import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type HousingUnit = {
  id?: string;
  name: string;
  unit_number?: string;
  type: 'gestation' | 'farrowing' | 'breeding' | 'hospital' | 'quarantine' | 'other';
  length_feet?: number;
  width_feet?: number;
  square_footage?: number;
  max_capacity?: number;
  building_name?: string;
  notes?: string;
  measurement_date?: string;
  measured_by?: string;
  measurement_notes?: string;
};

type HousingUnitModalProps = {
  unit: HousingUnit | null;
  onClose: () => void;
  isProp12Enabled: boolean;
};

export function HousingUnitModal({ unit, onClose, isProp12Enabled }: HousingUnitModalProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<HousingUnit>({
    name: '',
    unit_number: '',
    type: 'gestation',
    length_feet: undefined,
    width_feet: undefined,
    square_footage: undefined,
    max_capacity: undefined,
    building_name: '',
    notes: '',
    measurement_date: '',
    measured_by: '',
    measurement_notes: ''
  });

  useEffect(() => {
    if (unit) {
      setFormData({
        ...unit,
        unit_number: unit.unit_number || '',
        building_name: unit.building_name || '',
        notes: unit.notes || '',
        measurement_date: unit.measurement_date || '',
        measured_by: unit.measured_by || '',
        measurement_notes: unit.measurement_notes || ''
      });
    }
  }, [unit]);

  // Auto-calculate square footage when length/width change
  useEffect(() => {
    if (formData.length_feet && formData.width_feet) {
      const calculated = formData.length_feet * formData.width_feet;
      setFormData(prev => ({ ...prev, square_footage: Math.round(calculated * 100) / 100 }));
    }
  }, [formData.length_feet, formData.width_feet]);

  // Auto-calculate max capacity for Prop 12 gestation units
  useEffect(() => {
    if (isProp12Enabled && formData.type === 'gestation' && formData.square_footage) {
      const calculated = Math.floor(formData.square_footage / 24);
      setFormData(prev => ({ ...prev, max_capacity: calculated }));
    }
  }, [isProp12Enabled, formData.type, formData.square_footage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter a unit name');
      return;
    }

    // Validation for Prop 12
    if (isProp12Enabled && formData.type === 'gestation' && !formData.square_footage) {
      toast.error('Square footage is required for gestation units when Prop 12 compliance is enabled');
      return;
    }

    setSaving(true);

    try {
      const dataToSave = {
        user_id: user?.id,
        name: formData.name.trim(),
        unit_number: formData.unit_number?.trim() || null,
        type: formData.type,
        length_feet: formData.length_feet || null,
        width_feet: formData.width_feet || null,
        square_footage: formData.square_footage || null,
        max_capacity: formData.max_capacity || null,
        building_name: formData.building_name?.trim() || null,
        notes: formData.notes?.trim() || null,
        measurement_date: formData.measurement_date || null,
        measured_by: formData.measured_by?.trim() || null,
        measurement_notes: formData.measurement_notes?.trim() || null
      };

      if (unit?.id) {
        // Update existing unit
        const { error } = await supabase
          .from('housing_units')
          .update(dataToSave)
          .eq('id', unit.id);

        if (error) throw error;
        toast.success('Housing unit updated successfully');
      } else {
        // Create new unit
        const { error } = await supabase
          .from('housing_units')
          .insert(dataToSave);

        if (error) throw error;
        toast.success('Housing unit created successfully');
      }

      onClose();
    } catch (error) {
      console.error('Failed to save housing unit:', error);
      toast.error('Failed to save housing unit');
    } finally {
      setSaving(false);
    }
  };

  const isGestation = formData.type === 'gestation';
  const showProp12Warning = isProp12Enabled && isGestation && !formData.square_footage;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {unit ? 'Edit Housing Unit' : 'Add Housing Unit'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Prop 12 Warning */}
          {showProp12Warning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-medium">Prop 12 Compliance Required</p>
                  <p className="mt-1">
                    Gestation units require square footage measurements for compliance tracking.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Unit Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Pen A1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_number">Unit Number (Optional)</Label>
                <Input
                  id="unit_number"
                  name="unit_number"
                  value={formData.unit_number}
                  onChange={handleChange}
                  placeholder="001"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">
                  Type <span className="text-red-500">*</span>
                </Label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="gestation">Gestation</option>
                  <option value="farrowing">Farrowing</option>
                  <option value="breeding">Breeding</option>
                  <option value="hospital">Hospital</option>
                  <option value="quarantine">Quarantine</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="building_name">Building Name (Optional)</Label>
                <Input
                  id="building_name"
                  name="building_name"
                  value={formData.building_name}
                  onChange={handleChange}
                  placeholder="Barn 1"
                />
              </div>
            </div>
          </div>

          {/* Measurements */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Measurements</h3>
              {isProp12Enabled && isGestation && (
                <span className="text-xs text-amber-600 font-medium">Required for Prop 12</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="length_feet">
                  Length (feet) {isProp12Enabled && isGestation && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="length_feet"
                  name="length_feet"
                  type="number"
                  step="0.01"
                  value={formData.length_feet || ''}
                  onChange={handleChange}
                  placeholder="20"
                  required={isProp12Enabled && isGestation}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="width_feet">
                  Width (feet) {isProp12Enabled && isGestation && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="width_feet"
                  name="width_feet"
                  type="number"
                  step="0.01"
                  value={formData.width_feet || ''}
                  onChange={handleChange}
                  placeholder="10"
                  required={isProp12Enabled && isGestation}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="square_footage">
                  Total Sq Ft {isProp12Enabled && isGestation && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="square_footage"
                  name="square_footage"
                  type="number"
                  step="0.01"
                  value={formData.square_footage || ''}
                  onChange={handleChange}
                  placeholder="200"
                  required={isProp12Enabled && isGestation}
                />
                {formData.length_feet && formData.width_feet && (
                  <p className="text-xs text-gray-500">Auto-calculated from L × W</p>
                )}
              </div>
            </div>

            {/* Measurement Documentation (Prop 12) */}
            {isProp12Enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="measurement_date">Measurement Date</Label>
                  <Input
                    id="measurement_date"
                    name="measurement_date"
                    type="date"
                    value={formData.measurement_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="measured_by">Measured By</Label>
                  <Input
                    id="measured_by"
                    name="measured_by"
                    value={formData.measured_by}
                    onChange={handleChange}
                    placeholder="John Smith"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="measurement_notes">Measurement Notes</Label>
                  <textarea
                    id="measurement_notes"
                    name="measurement_notes"
                    value={formData.measurement_notes}
                    onChange={handleChange}
                    placeholder="Notes about measurements, obstructions, etc."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Capacity */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-gray-900">Capacity</h3>

            <div className="space-y-2">
              <Label htmlFor="max_capacity">Maximum Capacity (sows)</Label>
              <Input
                id="max_capacity"
                name="max_capacity"
                type="number"
                value={formData.max_capacity || ''}
                onChange={handleChange}
                placeholder="10"
                readOnly={isProp12Enabled && isGestation && !!formData.square_footage}
              />
              {isProp12Enabled && isGestation && formData.square_footage && (
                <p className="text-xs text-gray-500">
                  Auto-calculated: {Math.floor(formData.square_footage / 24)} sows (24 sq ft per sow)
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-gray-900">Additional Information</h3>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional notes about this housing unit..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {unit ? 'Update' : 'Create'} Housing Unit
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
