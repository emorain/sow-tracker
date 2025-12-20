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

type RecordExpenseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const EXPENSE_CATEGORIES = [
  { value: 'feed', label: 'Feed' },
  { value: 'veterinary', label: 'Veterinary' },
  { value: 'facilities', label: 'Facilities' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'labor', label: 'Labor' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'breeding', label: 'Breeding' },
  { value: 'other', label: 'Other' },
];

export default function RecordExpenseModal({
  isOpen,
  onClose,
  onSuccess,
}: RecordExpenseModalProps) {
  const { selectedOrganizationId } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    expense_category: 'feed',
    amount: '',
    description: '',
    vendor: '',
    invoice_number: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount');
        setLoading(false);
        return;
      }

      if (!formData.description.trim()) {
        toast.error('Please enter a description');
        setLoading(false);
        return;
      }

      const expenseRecord = {
        user_id: user.id,
        organization_id: selectedOrganizationId,
        expense_date: formData.expense_date,
        expense_category: formData.expense_category,
        amount: amount,
        description: formData.description.trim(),
        vendor: formData.vendor || null,
        invoice_number: formData.invoice_number || null,
        notes: formData.notes || null,
      };

      const { error } = await supabase
        .from('expense_records')
        .insert(expenseRecord);

      if (error) throw error;

      toast.success('Expense record created successfully');

      // Reset form
      setFormData({
        expense_date: new Date().toISOString().split('T')[0],
        expense_category: 'feed',
        amount: '',
        description: '',
        vendor: '',
        invoice_number: '',
        notes: '',
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating expense record:', error);
      toast.error(error.message || 'Failed to create expense record');
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
            Record Expense
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
          {/* Expense Date */}
          <div className="space-y-2">
            <Label htmlFor="expense_date">
              Expense Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="expense_date"
              name="expense_date"
              type="date"
              value={formData.expense_date}
              onChange={handleChange}
              required
            />
          </div>

          {/* Expense Category */}
          <div className="space-y-2">
            <Label htmlFor="expense_category">
              Category <span className="text-red-500">*</span>
            </Label>
            <select
              id="expense_category"
              name="expense_category"
              value={formData.expense_category}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {EXPENSE_CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <CurrencyInput
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={(value) => setFormData({ ...formData, amount: value })}
            label="Amount"
            placeholder="0.00"
            required
          />

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Input
              id="description"
              name="description"
              type="text"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of the expense"
              required
            />
          </div>

          {/* Vendor and Invoice Number */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor / Supplier</Label>
              <Input
                id="vendor"
                name="vendor"
                type="text"
                value={formData.vendor}
                onChange={handleChange}
                placeholder="Vendor name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_number">Invoice Number</Label>
              <Input
                id="invoice_number"
                name="invoice_number"
                type="text"
                value={formData.invoice_number}
                onChange={handleChange}
                placeholder="Invoice #"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes or details..."
              rows={3}
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Recording...' : 'Record Expense'}
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
