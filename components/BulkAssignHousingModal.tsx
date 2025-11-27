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
  floor_space_sqft: number | null;
  building_name: string | null;
  pen_number: string | null;
};

type Sow = {
  id: string;
  ear_tag: string;
  name: string | null;
  housing_unit_id: string | null;
};

type BulkAssignHousingModalProps = {
  sows: Sow[];
  onClose: () => void;
  onSuccess: () => void;
};

export default function BulkAssignHousingModal({ sows, onClose, onSuccess }: BulkAssignHousingModalProps) {
  const [housingUnits, setHousingUnits] = useState<HousingUnit[]>([]);
  const [selectedHousingId, setSelectedHousingId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHousingUnits();
  }, []);

  const fetchHousingUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('housing_units')
        .select('id, name, type, floor_space_sqft, building_name, pen_number')
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

    if (!selectedHousingId) {
      toast.error('Please select a housing unit');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      // Update all selected sows in a single operation
      // The trigger will automatically create location history entries for each sow
      const { error: updateError } = await supabase
        .from('sows')
        .update({
          housing_unit_id: selectedHousingId,
        })
        .in('id', sows.map(s => s.id))
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // If reason or notes provided, update the latest location history entries for all sows
      if (reason || notes) {
        // For each sow, update their latest location history entry
        for (const sow of sows) {
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
            console.error(`Error updating location history for sow ${sow.ear_tag}:`, historyError);
            // Don't throw - the main assignment still succeeded
          }
        }
      }

      toast.success(`${sows.length} sow${sows.length > 1 ? 's' : ''} assigned to housing successfully!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error assigning housing:', err);
      toast.error(err.message || 'Failed to assign housing');
    } finally {
      setLoading(false);
    }
  };

  const selectedHousing = housingUnits.find(h => h.id === selectedHousingId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold">Bulk Assign Housing</h2>
            <p className="text-sm text-gray-600">
              Moving {sows.length} sow{sows.length > 1 ? 's' : ''}
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
          {/* Selected Sows Summary */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md max-h-32 overflow-y-auto">
            <div className="text-sm font-medium text-blue-900 mb-1">Selected Sows</div>
            <div className="text-sm text-blue-700">
              {sows.map((sow, idx) => (
                <div key={sow.id}>
                  {idx > 0 && ', '}
                  {sow.ear_tag}
                </div>
              ))}
            </div>
          </div>

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
                  {unit.floor_space_sqft && ` - ${unit.floor_space_sqft} sq ft`}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Housing Info */}
          {selectedHousing && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="text-sm font-medium text-green-900">Selected Housing</div>
              <div className="text-sm text-green-700 mt-1">
                {getHousingDisplayName(selectedHousing)}
                {selectedHousing.floor_space_sqft && (
                  <span className="ml-2 text-xs">({selectedHousing.floor_space_sqft} sq ft total)</span>
                )}
              </div>
            </div>
          )}

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
              <strong>Prop 12 Compliance:</strong> All {sows.length} move{sows.length > 1 ? 's' : ''} will be automatically logged in the location history for audit trail purposes.
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
              {loading ? 'Assigning...' : `Assign ${sows.length} Sow${sows.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
