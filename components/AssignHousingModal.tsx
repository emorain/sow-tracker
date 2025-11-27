'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { toast } from 'sonner';

type HousingUnit = {
  id: string;
  name: string;
  type: string;
  square_footage: number | null;
  building_name: string | null;
  pen_number: string | null;
  max_capacity: number | null;
  current_sows: number | null;
};

type Sow = {
  id: string;
  ear_tag: string;
  name: string | null;
  housing_unit_id: string | null;
};

type AssignHousingModalProps = {
  sow: Sow;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AssignHousingModal({ sow, onClose, onSuccess }: AssignHousingModalProps) {
  const [housingUnits, setHousingUnits] = useState<HousingUnit[]>([]);
  const [selectedHousingId, setSelectedHousingId] = useState<string>(sow.housing_unit_id || '');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHousingUnits();
  }, []);

  const fetchHousingUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('housing_unit_occupancy')
        .select('id, name, type, square_footage, building_name, pen_number, max_capacity, current_sows')
        .order('building_name, pen_number, name');

      if (error) throw error;
      setHousingUnits(data || []);
    } catch (err: any) {
      console.error('Error fetching housing units:', err);
      toast.error('Failed to load housing units');
    }
  };

  const getHousingDisplayName = (unit: HousingUnit) => {
    if (unit.building_name && unit.pen_number) {
      return `${unit.building_name} - Pen ${unit.pen_number}`;
    }
    return unit.name;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate capacity if assigning to a new housing unit
    if (selectedHousingId && selectedHousingId !== sow.housing_unit_id) {
      const selectedUnit = housingUnits.find(h => h.id === selectedHousingId);
      if (selectedUnit && selectedUnit.max_capacity) {
        const currentOccupancy = selectedUnit.current_sows || 0;
        const newOccupancy = currentOccupancy + 1;

        if (newOccupancy > selectedUnit.max_capacity) {
          toast.error(
            `Cannot assign ${sow.ear_tag} to ${getHousingDisplayName(selectedUnit)}. ` +
            `Current: ${currentOccupancy}, Max capacity: ${selectedUnit.max_capacity}.`
          );
          return;
        }
      }
    }

    setLoading(true);

    try {
      // Update sow's housing_unit_id
      // The trigger will automatically create location history entry
      const { error: updateError } = await supabase
        .from('sows')
        .update({
          housing_unit_id: selectedHousingId || null,
        })
        .eq('id', sow.id);

      if (updateError) throw updateError;

      // If reason or notes provided, update the latest location history entry
      if (reason || notes) {
        const { error: historyError } = await supabase
          .from('location_history')
          .update({
            reason: reason || null,
            notes: notes || null,
          })
          .eq('sow_id', sow.id)
          .eq('housing_unit_id', selectedHousingId)
          .is('moved_out_date', null);

        if (historyError) {
          console.error('Error updating location history:', historyError);
          // Don't throw - the main assignment still succeeded
        }
      }

      toast.success(`${sow.ear_tag} ${selectedHousingId ? 'assigned to housing' : 'removed from housing'}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error assigning housing:', err);
      toast.error(err.message || 'Failed to assign housing');
    } finally {
      setLoading(false);
    }
  };

  const currentHousing = housingUnits.find(h => h.id === sow.housing_unit_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold">Assign Housing</h2>
            <p className="text-sm text-gray-600">
              {sow.name || sow.ear_tag}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Current Housing */}
          {currentHousing && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="text-sm font-medium text-blue-900">Current Housing</div>
              <div className="text-sm text-blue-700 mt-1">
                {getHousingDisplayName(currentHousing)}
                {currentHousing.square_footage && (
                  <span className="ml-2 text-xs">({currentHousing.square_footage} sq ft)</span>
                )}
              </div>
            </div>
          )}

          {/* Housing Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Housing Unit *
            </label>
            <select
              value={selectedHousingId}
              onChange={(e) => setSelectedHousingId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            >
              <option value="">-- Select Housing Unit --</option>
              {housingUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {getHousingDisplayName(unit)}
                  {unit.type && ` (${unit.type})`}
                  {unit.max_capacity && ` - ${unit.current_sows || 0}/${unit.max_capacity} sows`}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to remove from housing
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Move (Optional)
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">-- Select Reason --</option>
              <option value="Initial Assignment">Initial Assignment</option>
              <option value="Breeding">Breeding</option>
              <option value="Farrowing">Farrowing</option>
              <option value="Weaning">Weaning</option>
              <option value="Medical">Medical</option>
              <option value="Space Management">Space Management</option>
              <option value="Group Change">Group Change</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Add any additional notes about this move..."
            />
          </div>

          {/* Info */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="text-xs text-yellow-800">
              <strong>Prop 12 Compliance:</strong> This move will be automatically logged in the location history for audit trail purposes.
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Assigning...' : 'Assign Housing'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
