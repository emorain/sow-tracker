'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface EditFarrowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  farrowingId: string;
  sowName: string;
  initialData: {
    actual_farrowing_date: string;
    live_piglets: number;
    stillborn: number;
    mummies: number;
    notes: string | null;
  };
}

export default function EditFarrowingModal({
  isOpen,
  onClose,
  onSuccess,
  farrowingId,
  sowName,
  initialData
}: EditFarrowingModalProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    actual_farrowing_date: '',
    live_piglets: 0,
    stillborn: 0,
    mummies: 0,
    notes: ''
  });

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        actual_farrowing_date: initialData.actual_farrowing_date || '',
        live_piglets: initialData.live_piglets || 0,
        stillborn: initialData.stillborn || 0,
        mummies: initialData.mummies || 0,
        notes: initialData.notes || ''
      });
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.actual_farrowing_date) {
      toast.error('Please enter a farrowing date');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('farrowings')
        .update({
          actual_farrowing_date: formData.actual_farrowing_date,
          live_piglets: parseInt(formData.live_piglets.toString()) || 0,
          stillborn: parseInt(formData.stillborn.toString()) || 0,
          mummies: parseInt(formData.mummies.toString()) || 0,
          notes: formData.notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', farrowingId);

      if (error) throw error;

      toast.success('Farrowing updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating farrowing:', error);
      toast.error('Failed to update farrowing');
    } finally {
      setSaving(false);
    }
  };

  const totalPiglets = parseInt(formData.live_piglets.toString()) +
                       parseInt(formData.stillborn.toString()) +
                       parseInt(formData.mummies.toString());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Farrowing Record</DialogTitle>
          <DialogDescription>
            Update farrowing details for {sowName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Farrowing Date */}
            <div>
              <Label htmlFor="farrowing-date" className="text-sm font-medium mb-2 block">
                Actual Farrowing Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="farrowing-date"
                type="date"
                value={formData.actual_farrowing_date}
                onChange={(e) => setFormData({ ...formData, actual_farrowing_date: e.target.value })}
                className="h-11 border-2"
                required
              />
            </div>

            {/* Piglet Counts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="live-piglets" className="text-sm font-medium mb-2 block">
                  Live Piglets
                </Label>
                <Input
                  id="live-piglets"
                  type="number"
                  min="0"
                  value={formData.live_piglets}
                  onChange={(e) => setFormData({ ...formData, live_piglets: parseInt(e.target.value) || 0 })}
                  className="h-11 border-2 text-center text-lg font-semibold"
                />
              </div>

              <div>
                <Label htmlFor="stillborn" className="text-sm font-medium mb-2 block">
                  Stillborn
                </Label>
                <Input
                  id="stillborn"
                  type="number"
                  min="0"
                  value={formData.stillborn}
                  onChange={(e) => setFormData({ ...formData, stillborn: parseInt(e.target.value) || 0 })}
                  className="h-11 border-2 text-center text-lg font-semibold"
                />
              </div>

              <div>
                <Label htmlFor="mummies" className="text-sm font-medium mb-2 block">
                  Mummies
                </Label>
                <Input
                  id="mummies"
                  type="number"
                  min="0"
                  value={formData.mummies}
                  onChange={(e) => setFormData({ ...formData, mummies: parseInt(e.target.value) || 0 })}
                  className="h-11 border-2 text-center text-lg font-semibold"
                />
              </div>
            </div>

            {/* Total */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-900">Total Piglets Born:</span>
                <span className="text-2xl font-bold text-blue-900">{totalPiglets}</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="text-sm font-medium mb-2 block">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes about the farrowing..."
                rows={3}
                className="border-2 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
