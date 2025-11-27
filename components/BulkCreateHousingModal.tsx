'use client';

import { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type BulkCreateHousingModalProps = {
  onClose: () => void;
  onSuccess: () => void;
  isProp12Enabled: boolean;
};

export function BulkCreateHousingModal({ onClose, onSuccess, isProp12Enabled }: BulkCreateHousingModalProps) {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    building_base_name: '',
    building_start: 1,
    building_end: 1,
    pen_start: 1,
    pen_end: 10,
    type: 'farrowing' as 'gestation' | 'farrowing' | 'breeding' | 'hospital' | 'quarantine' | 'other',
    capacity_per_unit: 1,
    floor_space_per_unit: undefined as number | undefined,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value
    });
  };

  const calculateTotalUnits = () => {
    const buildings = (formData.building_end - formData.building_start) + 1;
    const pensPerBuilding = (formData.pen_end - formData.pen_start) + 1;
    return buildings * pensPerBuilding;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.building_base_name.trim()) {
      toast.error('Please enter a building name');
      return;
    }

    if (formData.building_start > formData.building_end) {
      toast.error('Building start number must be less than or equal to end number');
      return;
    }

    if (formData.pen_start > formData.pen_end) {
      toast.error('Pen start number must be less than or equal to end number');
      return;
    }

    const totalUnits = calculateTotalUnits();

    // Warning for large bulk creates
    if (totalUnits > 500) {
      const confirm = window.confirm(
        `This will create ${totalUnits} housing units. This may take a minute. Continue?`
      );
      if (!confirm) return;
    }

    setCreating(true);

    try {
      const unitsToCreate = [];

      // Generate all combinations
      for (let building = formData.building_start; building <= formData.building_end; building++) {
        for (let pen = formData.pen_start; pen <= formData.pen_end; pen++) {
          const buildingName = formData.building_end === formData.building_start
            ? formData.building_base_name.trim()
            : `${formData.building_base_name.trim()} ${building}`;

          const penNumber = pen.toString();
          const unitName = `${buildingName} - Pen ${penNumber}`;

          unitsToCreate.push({
            user_id: user?.id,
            name: unitName,
            building_name: buildingName,
            pen_number: penNumber,
            type: formData.type,
            floor_space_sqft: formData.floor_space_per_unit || null,
            max_capacity: formData.capacity_per_unit || null,
            length_feet: null,
            width_feet: null,
            notes: 'Bulk created',
            measurement_date: null,
            measured_by: null,
            measurement_notes: null
          });
        }
      }

      // Insert in batches of 100 to avoid timeout
      const batchSize = 100;
      for (let i = 0; i < unitsToCreate.length; i += batchSize) {
        const batch = unitsToCreate.slice(i, i + batchSize);
        const { error } = await supabase
          .from('housing_units')
          .insert(batch);

        if (error) throw error;

        // Show progress for large operations
        if (unitsToCreate.length > 100) {
          const progress = Math.min(i + batchSize, unitsToCreate.length);
          toast.info(`Creating units: ${progress}/${unitsToCreate.length}`);
        }
      }

      toast.success(`Successfully created ${totalUnits} housing units!`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create housing units:', error);
      toast.error('Failed to create housing units');
    } finally {
      setCreating(false);
    }
  };

  const totalUnits = calculateTotalUnits();
  const isGestation = formData.type === 'gestation';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Bulk Create Housing Units
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
          {/* Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium">Bulk Creation</p>
                <p className="mt-1">
                  Create multiple housing units at once. Perfect for setting up farrowing houses
                  with many crates or large finishing buildings.
                </p>
              </div>
            </div>
          </div>

          {/* Building Configuration */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Building Configuration</h3>

            <div className="space-y-2">
              <Label htmlFor="building_base_name">
                Building Base Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="building_base_name"
                name="building_base_name"
                value={formData.building_base_name}
                onChange={handleChange}
                placeholder="Farrowing House"
                required
              />
              <p className="text-xs text-gray-500">
                Examples: &apos;Farrowing House&apos;, &apos;Finishing Building&apos;, &apos;Gestation Barn&apos;
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="building_start">Building Start Number</Label>
                <Input
                  id="building_start"
                  name="building_start"
                  type="number"
                  min="1"
                  value={formData.building_start}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="building_end">Building End Number</Label>
                <Input
                  id="building_end"
                  name="building_end"
                  type="number"
                  min="1"
                  value={formData.building_end}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Set both to 1 for a single building. For multiple buildings (e.g., 1-10),
              each will be numbered: &apos;Farrowing House 1&apos;, &apos;Farrowing House 2&apos;, etc.
            </p>
          </div>

          {/* Pen/Crate Configuration */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-gray-900">Pen/Crate Configuration</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pen_start">Pen Start Number</Label>
                <Input
                  id="pen_start"
                  name="pen_start"
                  type="number"
                  min="1"
                  value={formData.pen_start}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pen_end">Pen End Number</Label>
                <Input
                  id="pen_end"
                  name="pen_end"
                  type="number"
                  min="1"
                  value={formData.pen_end}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Each building will have pens numbered from start to end (e.g., Pen 1 through Pen 100)
            </p>
          </div>

          {/* Unit Settings */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-gray-900">Unit Settings</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">
                  Type <span className="text-red-500">*</span>
                </Label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                  required
                >
                  <option value="farrowing">Farrowing</option>
                  <option value="gestation">Gestation</option>
                  <option value="breeding">Breeding</option>
                  <option value="hospital">Hospital</option>
                  <option value="quarantine">Quarantine</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity_per_unit">Capacity Per Unit</Label>
                <Input
                  id="capacity_per_unit"
                  name="capacity_per_unit"
                  type="number"
                  min="1"
                  value={formData.capacity_per_unit || ''}
                  onChange={handleChange}
                  placeholder="1"
                />
                <p className="text-xs text-gray-500">
                  For farrowing crates: 1 sow per unit
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="floor_space_per_unit">
                Square Feet Per Unit (Optional)
                {isProp12Enabled && isGestation && <span className="text-red-500"> *</span>}
              </Label>
              <Input
                id="floor_space_per_unit"
                name="floor_space_per_unit"
                type="number"
                step="0.01"
                value={formData.floor_space_per_unit || ''}
                onChange={handleChange}
                placeholder="60"
                required={isProp12Enabled && isGestation}
              />
              <p className="text-xs text-gray-500">
                Typical farrowing crate: 60 sq ft. Group pens: 240+ sq ft
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm text-green-900">
              <p className="font-medium">This will create:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>
                  {formData.building_end - formData.building_start + 1} building(s)
                </li>
                <li>
                  {formData.pen_end - formData.pen_start + 1} pens per building
                </li>
                <li className="font-bold">
                  Total: {totalUnits} housing units
                </li>
              </ul>
              {totalUnits > 100 && (
                <p className="mt-2 text-xs text-amber-700">
                  Large operations may take a minute to create
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? `Creating ${totalUnits} units...` : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create {totalUnits} Units
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
