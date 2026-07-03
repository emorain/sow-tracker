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

type AssignHousingModalProps = {
  sow: Sow;
  onClose: () => void;
  onSuccess: () => void;
  filterType?: string; // when set (e.g. 'farrowing'), only show units of this type
};

export default function AssignHousingModal({ sow, onClose, onSuccess, filterType }: AssignHousingModalProps) {
  const { selectedOrganizationId } = useOrganization();
  const [housingUnits, setHousingUnits] = useState<HousingUnit[]>([]);
  const [selectedHousingId, setSelectedHousingId] = useState<string>(sow.housing_unit_id || '');
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

      // If reason, notes, or move_date provided, update the latest location history entry
      if (reason || notes || moveDate) {
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

  // Optionally narrow to one housing type (e.g. only farrowing crates).
  const visibleUnits = filterType ? housingUnits.filter(u => u.type === filterType) : housingUnits;
  // A farrowing crate holds one sow, so when picking a crate a unit with no
  // explicit capacity is treated as single-occupancy; houses/pens with a set
  // max_capacity use it. Elsewhere, no capacity = no limit.
  const effectiveCapacity = (u: HousingUnit): number | null =>
    u.max_capacity != null ? u.max_capacity : filterType === 'farrowing' ? 1 : null;
  const isUnitFull = (u: HousingUnit): boolean => {
    if (u.id === sow.housing_unit_id) return false; // she can stay where she is
    const cap = effectiveCapacity(u);
    return cap != null && (u.current_sows || 0) >= cap;
  };

  // How many of the visible units still have room.
  const availableCount = visibleUnits.filter(u => !isUnitFull(u)).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card text-card-foreground rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-card">
          <div>
            <h2 className="text-xl font-bold text-foreground">Assign Housing</h2>
            <p className="text-sm text-muted-foreground">
              <span className="font-mono">{sow.ear_tag}</span>{sow.name ? ` · ${sow.name}` : ''}
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
          {/* Current Housing */}
          {currentHousing && (
            <div className="p-3 bg-info-bg border border-info/25 rounded-md">
              <div className="text-sm font-medium text-info">Current Housing</div>
              <div className="text-sm text-info mt-1">
                {getHousingDisplayName(currentHousing)}
                {currentHousing.square_footage && (
                  <span className="ml-2 text-xs">({currentHousing.square_footage} sq ft)</span>
                )}
              </div>
            </div>
          )}

          {/* Housing Selection */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {filterType === 'farrowing' ? 'Farrowing Crate' : 'New Housing Unit'} <span className="text-due">*</span>
            </label>
            <select
              value={selectedHousingId}
              onChange={(e) => setSelectedHousingId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-brand"
              required
            >
              <option value="">
                {filterType === 'farrowing' ? '-- Select an available crate --' : '-- Select Housing Unit --'}
              </option>
              {visibleUnits.map((unit) => {
                const isFull = isUnitFull(unit);
                const occ = unit.current_sows || 0;
                return (
                  <option key={unit.id} value={unit.id} disabled={isFull}>
                    {getHousingDisplayName(unit)}
                    {!filterType && unit.type ? ` (${unit.type})` : ''}
                    {unit.max_capacity != null
                      ? ` — ${occ}/${unit.max_capacity}`
                      : filterType !== 'farrowing' && occ > 0
                      ? ` — ${occ} in`
                      : ''}
                    {isFull ? ' · occupied' : ''}
                  </option>
                );
              })}
            </select>
            {filterType === 'farrowing' && availableCount === 0 && (
              <p className="text-xs text-due mt-1">No open farrowing crates — every crate is occupied.</p>
            )}
            {!filterType && (
              <p className="text-xs text-muted-foreground mt-1">Leave blank to remove from housing</p>
            )}
          </div>

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
              Date the sow was moved to this housing (for Prop 12 compliance)
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
