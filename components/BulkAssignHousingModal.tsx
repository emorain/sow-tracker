'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/lib/organization-context';

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

type BulkAssignHousingModalProps = {
  sows: Sow[];
  onClose: () => void;
  onSuccess: () => void;
};

export default function BulkAssignHousingModal({ sows, onClose, onSuccess }: BulkAssignHousingModalProps) {
  const { selectedOrganizationId } = useOrganization();
  const [housingUnits, setHousingUnits] = useState<HousingUnit[]>([]);
  const [selectedHousingId, setSelectedHousingId] = useState<string>('');
  const [moveDate, setMoveDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedOrganizationId) {
      fetchHousingUnits();
    }
  }, [selectedOrganizationId]);

  const fetchHousingUnits = async () => {
    if (!selectedOrganizationId) return;

    try {
      const { data, error } = await supabase
        .from('housing_unit_occupancy')
        .select('*')
        .eq('organization_id', selectedOrganizationId)
        .order('name');

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

    // Validate capacity
    const selectedUnit = housingUnits.find(h => h.id === selectedHousingId);
    if (selectedUnit && selectedUnit.max_capacity) {
      const currentOccupancy = selectedUnit.current_sows || 0;
      const newOccupancy = currentOccupancy + sows.length;

      if (newOccupancy > selectedUnit.max_capacity) {
        toast.error(
          `Cannot assign ${sows.length} sow${sows.length > 1 ? 's' : ''} to ${getHousingDisplayName(selectedUnit)}. ` +
          `Current: ${currentOccupancy}, Max capacity: ${selectedUnit.max_capacity}. ` +
          `This would result in ${newOccupancy} sows (${newOccupancy - selectedUnit.max_capacity} over capacity).`
        );
        return;
      }
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

      // If reason, notes, or move_date provided, update the latest location history entries for all sows
      if (reason || notes || moveDate) {
        // For each sow, update their latest location history entry
        for (const sow of sows) {
          const { error: historyError } = await supabase
            .from('location_history')
            .update({
              moved_in_date: moveDate,
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card text-card-foreground rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-card">
          <div>
            <h2 className="text-xl font-bold text-foreground">Bulk Assign Housing</h2>
            <p className="text-sm text-muted-foreground">
              Moving {sows.length} sow{sows.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Selected Sows Summary */}
          <div className="p-3 bg-info-bg border border-info/25 rounded-md max-h-32 overflow-y-auto">
            <div className="text-sm font-medium text-info mb-1">Selected Sows</div>
            <div className="text-sm text-info font-mono">
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
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              New Housing Unit <span className="text-due">*</span>
            </label>
            <select
              value={selectedHousingId}
              onChange={(e) => setSelectedHousingId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-brand"
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
          </div>

          {/* Selected Housing Info */}
          {selectedHousing && (
            <>
              {(() => {
                const currentOccupancy = selectedHousing.current_sows || 0;
                const newOccupancy = currentOccupancy + sows.length;
                const maxCapacity = selectedHousing.max_capacity;
                const wouldExceed = maxCapacity && newOccupancy > maxCapacity;

                return (
                  <div className={`p-3 border rounded-md ${wouldExceed ? 'bg-due-bg border-due/25' : 'bg-ok-bg border-ok/25'}`}>
                    <div className={`text-sm font-medium ${wouldExceed ? 'text-due' : 'text-ok'}`}>
                      Selected Housing
                    </div>
                    <div className={`text-sm mt-1 ${wouldExceed ? 'text-due' : 'text-ok'}`}>
                      {getHousingDisplayName(selectedHousing)}
                      {maxCapacity && (
                        <div className="mt-1">
                          <span className="font-medium">Capacity:</span> {currentOccupancy}/{maxCapacity} sows
                          {wouldExceed && (
                            <div className="mt-1 text-xs font-bold">
                              ⚠️ Warning: Adding {sows.length} sow{sows.length > 1 ? 's' : ''} would result in {newOccupancy} sows ({newOccupancy - maxCapacity} over capacity)
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </>
          )}

          {/* Move Date */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Move Date <span className="text-due">*</span>
            </label>
            <input
              type="date"
              value={moveDate}
              onChange={(e) => setMoveDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-brand"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Date the sows were moved to this housing (for Prop 12 compliance)
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Reason for Move (Optional)
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-brand"
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
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="Add any additional notes about this move..."
            />
          </div>

          {/* Info */}
          <div className="p-3 bg-soon-bg border border-soon/25 rounded-md">
            <div className="text-xs text-soon">
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
