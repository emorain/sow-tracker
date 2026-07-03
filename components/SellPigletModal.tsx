'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/lib/organization-context';
import { useSettings } from '@/lib/settings-context';
import { toast } from 'sonner';

type Props = {
  pigId: string;
  label: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function SellPigletModal({ pigId, label, onClose, onSuccess }: Props) {
  const { selectedOrganizationId } = useOrganization();
  const { settings } = useSettings();
  const wu = settings?.weight_unit || 'lb';
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [price, setPrice] = useState('');
  const [weight, setWeight] = useState('');
  const [buyer, setBuyer] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: existing } = await supabase.from('piglets').select('notes').eq('id', pigId).single();
      const notes = buyer.trim()
        ? [existing?.notes, `Sold to: ${buyer.trim()}`].filter(Boolean).join('\n')
        : existing?.notes ?? null;

      const { error } = await supabase
        .from('piglets')
        .update({
          status: 'sold',
          sale_date: saleDate,
          sold_date: saleDate,
          sale_price: price === '' ? null : parseFloat(price),
          sale_weight_lbs: weight === '' ? null : parseFloat(weight),
          notes,
        })
        .eq('id', pigId)
        .eq('organization_id', selectedOrganizationId!);
      if (error) throw error;

      toast.success(`${label} marked sold`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card text-card-foreground rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">Sell Pig</h2>
            <p className="text-sm text-muted-foreground mt-0.5"><span className="font-mono">{label}</span></p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sale_date">Sale Date <span className="text-due">*</span></Label>
            <Input id="sale_date" type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sale_price">Price ($)</Label>
              <Input id="sale_price" type="number" step="0.01" min="0" value={price}
                onChange={e => setPrice(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale_weight">Weight ({wu})</Label>
              <Input id="sale_weight" type="number" step="0.1" min="0" value={weight}
                onChange={e => setWeight(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="buyer">Buyer (optional)</Label>
            <Textarea id="buyer" value={buyer} onChange={e => setBuyer(e.target.value)} rows={2}
              placeholder="Who bought it — kept with the pig's notes." />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving…' : 'Mark Sold'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
