'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/lib/organization-context';
import { toast } from 'sonner';
import CurrencyInput from '@/components/CurrencyInput';

type RecordFeedModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultAnimalGroup?: string;
};

const ANIMAL_GROUPS = [
  { value: 'gestation', label: 'Gestation Sows' },
  { value: 'farrowing', label: 'Farrowing Sows' },
  { value: 'nursery', label: 'Nursery Piglets' },
  { value: 'boars', label: 'Boars' },
  { value: 'other', label: 'Other' },
];

export default function RecordFeedModal({
  isOpen,
  onClose,
  onSuccess,
  defaultAnimalGroup = 'gestation',
}: RecordFeedModalProps) {
  const { selectedOrganizationId } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    record_date: new Date().toISOString().split('T')[0],
    feed_type: '',
    animal_group: defaultAnimalGroup,
    quantity_lbs: '',
    cost_per_unit: '',
    total_cost: '',
    supplier: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      // Auto-calculate total cost if quantity and cost per unit are provided
      if (name === 'quantity_lbs' || name === 'cost_per_unit') {
        const qty = parseFloat(name === 'quantity_lbs' ? value : newData.quantity_lbs) || 0;
        const costPerUnit = parseFloat(name === 'cost_per_unit' ? value : newData.cost_per_unit) || 0;
        if (qty > 0 && costPerUnit > 0) {
          newData.total_cost = (qty * costPerUnit).toFixed(2);
        }
      }

      return newData;
    });
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

      const totalCost = parseFloat(formData.total_cost);
      if (isNaN(totalCost) || totalCost <= 0) {
        toast.error('Please enter a valid total cost');
        setLoading(false);
        return;
      }

      const quantity = parseFloat(formData.quantity_lbs);
      if (isNaN(quantity) || quantity <= 0) {
        toast.error('Please enter a valid quantity');
        setLoading(false);
        return;
      }

      if (!formData.feed_type.trim()) {
        toast.error('Please enter a feed type');
        setLoading(false);
        return;
      }

      const feedRecord = {
        user_id: user.id,
        organization_id: selectedOrganizationId,
        record_date: formData.record_date,
        feed_type: formData.feed_type.trim(),
        animal_group: formData.animal_group,
        quantity_lbs: quantity,
        cost_per_unit: formData.cost_per_unit ? parseFloat(formData.cost_per_unit) : null,
        total_cost: totalCost,
        supplier: formData.supplier || null,
        notes: formData.notes || null,
      };

      const { error: feedError } = await supabase
        .from('feed_records')
        .insert(feedRecord);

      if (feedError) throw feedError;

      // Also create an expense record for this feed purchase
      const expenseRecord = {
        user_id: user.id,
        organization_id: selectedOrganizationId,
        expense_date: formData.record_date,
        expense_category: 'feed',
        amount: totalCost,
        description: `Feed: ${formData.feed_type} for ${ANIMAL_GROUPS.find(g => g.value === formData.animal_group)?.label}`,
        vendor: formData.supplier || null,
        notes: formData.notes || null,
      };

      const { error: expenseError } = await supabase
        .from('expense_records')
        .insert(expenseRecord);

      if (expenseError) {
        console.error('Error creating expense record:', expenseError);
        // Don't fail the whole operation if expense record creation fails
      }

      toast.success('Feed record created successfully');

      // Reset form
      setFormData({
        record_date: new Date().toISOString().split('T')[0],
        feed_type: '',
        animal_group: defaultAnimalGroup,
        quantity_lbs: '',
        cost_per_unit: '',
        total_cost: '',
        supplier: '',
        notes: '',
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating feed record:', error);
      toast.error(error.message || 'Failed to create feed record');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-2xl font-bold text-gray-900">
            Record Feed
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {/* Record Date */}
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

          {/* Feed Type */}
          <div className="space-y-2">
            <Label htmlFor="feed_type">
              Feed Type <span className="text-red-500">*</span>
            </Label>
            <Input
              id="feed_type"
              name="feed_type"
              type="text"
              value={formData.feed_type}
              onChange={handleChange}
              placeholder="e.g., Lactation Feed, Grower Feed, Corn"
              required
            />
          </div>

          {/* Animal Group */}
          <div className="space-y-2">
            <Label htmlFor="animal_group">
              Animal Group <span className="text-red-500">*</span>
            </Label>
            <select
              id="animal_group"
              name="animal_group"
              value={formData.animal_group}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {ANIMAL_GROUPS.map(group => (
                <option key={group.value} value={group.value}>
                  {group.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity and Cost Per Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity_lbs">
                Quantity (lbs) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity_lbs"
                name="quantity_lbs"
                type="number"
                step="0.01"
                min="0"
                value={formData.quantity_lbs}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </div>

            <CurrencyInput
              id="cost_per_unit"
              name="cost_per_unit"
              value={formData.cost_per_unit}
              onChange={(value) => handleChange({ target: { name: 'cost_per_unit', value } } as any)}
              label="Cost Per Pound"
              placeholder="0.00"
            />
          </div>

          {/* Total Cost */}
          <CurrencyInput
            id="total_cost"
            name="total_cost"
            value={formData.total_cost}
            onChange={(value) => setFormData({ ...formData, total_cost: value })}
            label="Total Cost"
            placeholder="0.00"
            required
          />

          {/* Supplier */}
          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier</Label>
            <Input
              id="supplier"
              name="supplier"
              type="text"
              value={formData.supplier}
              onChange={handleChange}
              placeholder="Feed supplier or vendor"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes about this feed purchase..."
              rows={3}
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Recording...' : 'Record Feed'}
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
