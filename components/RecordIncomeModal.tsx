'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/lib/organization-context';
import { toast } from 'sonner';
import CurrencyInput from '@/components/CurrencyInput';

type RecordIncomeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const INCOME_TYPES = [
  { value: 'piglet_sale', label: 'Piglet Sale' },
  { value: 'cull_sow_sale', label: 'Cull Sow Sale' },
  { value: 'breeding_stock_sale', label: 'Breeding Stock Sale' },
  { value: 'boar_sale', label: 'Boar Sale' },
  { value: 'other', label: 'Other Income' },
];

const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'partial', label: 'Partially Paid' },
  { value: 'overdue', label: 'Overdue' },
];

export default function RecordIncomeModal({
  isOpen,
  onClose,
  onSuccess,
}: RecordIncomeModalProps) {
  const { selectedOrganizationId } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    income_date: new Date().toISOString().split('T')[0],
    income_type: 'piglet_sale',
    quantity: '',
    price_per_unit: '',
    total_amount: '',
    buyer_name: '',
    invoice_number: '',
    payment_status: 'pending',
    description: '',
  });

  // Auto-calculate total when quantity or price changes
  useEffect(() => {
    const qty = parseFloat(formData.quantity) || 0;
    const price = parseFloat(formData.price_per_unit) || 0;
    if (qty > 0 && price > 0) {
      setFormData(prev => ({
        ...prev,
        total_amount: (qty * price).toFixed(2),
      }));
    }
  }, [formData.quantity, formData.price_per_unit]);

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

      const total = parseFloat(formData.total_amount);
      if (isNaN(total) || total <= 0) {
        toast.error('Please enter a valid total amount');
        setLoading(false);
        return;
      }

      const incomeRecord = {
        user_id: user.id,
        organization_id: selectedOrganizationId,
        income_date: formData.income_date,
        income_type: formData.income_type,
        quantity: formData.quantity ? parseInt(formData.quantity) : null,
        price_per_unit: formData.price_per_unit ? parseFloat(formData.price_per_unit) : null,
        total_amount: total,
        buyer_name: formData.buyer_name || null,
        invoice_number: formData.invoice_number || null,
        payment_status: formData.payment_status,
        description: formData.description || null,
      };

      const { error } = await supabase
        .from('income_records')
        .insert(incomeRecord);

      if (error) throw error;

      toast.success('Income record created successfully');

      // Reset form
      setFormData({
        income_date: new Date().toISOString().split('T')[0],
        income_type: 'piglet_sale',
        quantity: '',
        price_per_unit: '',
        total_amount: '',
        buyer_name: '',
        invoice_number: '',
        payment_status: 'pending',
        description: '',
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating income record:', error);
      toast.error(error.message || 'Failed to create income record');
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
            Record Income
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
          {/* Income Date */}
          <div className="space-y-2">
            <Label htmlFor="income_date">
              Income Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="income_date"
              name="income_date"
              type="date"
              value={formData.income_date}
              onChange={handleChange}
              required
            />
          </div>

          {/* Income Type */}
          <div className="space-y-2">
            <Label htmlFor="income_type">
              Income Type <span className="text-red-500">*</span>
            </Label>
            <select
              id="income_type"
              name="income_type"
              value={formData.income_type}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {INCOME_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity and Price Per Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="Number of animals/items"
              />
            </div>

            <CurrencyInput
              id="price_per_unit"
              name="price_per_unit"
              value={formData.price_per_unit}
              onChange={(value) => setFormData({ ...formData, price_per_unit: value })}
              label="Price Per Unit"
              placeholder="0.00"
            />
          </div>

          {/* Total Amount */}
          <CurrencyInput
            id="total_amount"
            name="total_amount"
            value={formData.total_amount}
            onChange={(value) => setFormData({ ...formData, total_amount: value })}
            label="Total Amount"
            placeholder="0.00"
            required
          />

          {/* Buyer Name */}
          <div className="space-y-2">
            <Label htmlFor="buyer_name">Buyer Name</Label>
            <Input
              id="buyer_name"
              name="buyer_name"
              type="text"
              value={formData.buyer_name}
              onChange={handleChange}
              placeholder="Buyer or customer name"
            />
          </div>

          {/* Invoice Number and Payment Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Invoice Number</Label>
              <Input
                id="invoice_number"
                name="invoice_number"
                type="text"
                value={formData.invoice_number}
                onChange={handleChange}
                placeholder="INV-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_status">
                Payment Status <span className="text-red-500">*</span>
              </Label>
              <select
                id="payment_status"
                name="payment_status"
                value={formData.payment_status}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {PAYMENT_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description / Notes</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Additional details about this income..."
              rows={3}
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Recording...' : 'Record Income'}
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
