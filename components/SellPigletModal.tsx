'use client';

import { useEffect, useState } from 'react';
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

const SALE_TYPES = [
  { value: 'auction', label: 'Auction' },
  { value: 'private', label: 'Private sale' },
  { value: 'show', label: 'Show / jackpot' },
];

export default function SellPigletModal({ pigId, label, onClose, onSuccess }: Props) {
  const { selectedOrganizationId } = useOrganization();
  const { settings } = useSettings();
  const wu = settings?.weight_unit || 'lb';
  const [saleType, setSaleType] = useState('auction');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [price, setPrice] = useState('');
  const [weight, setWeight] = useState('');
  const [buyer, setBuyer] = useState('');
  const [notes, setNotes] = useState('');
  const [deposit, setDeposit] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Prefill from a reservation or a prior sale (so this doubles as "edit sale"
  // when adding auction results later).
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('piglets')
        .select('buyer, deposit, sale_type, notes, sale_price, sale_weight_lbs, sale_date')
        .eq('id', pigId).maybeSingle();
      if (data?.buyer) setBuyer(data.buyer);
      if (data?.sale_type) setSaleType(data.sale_type);
      if (data?.deposit != null) setDeposit(Number(data.deposit));
      if (data?.sale_price != null) setPrice(String(data.sale_price));
      if (data?.sale_weight_lbs != null) setWeight(String(data.sale_weight_lbs));
      if (data?.sale_date) setSaleDate(data.sale_date);
      if (data?.notes) setNotes(data.notes);
    })();
  }, [pigId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const priceNum = price === '' ? null : parseFloat(price);

      const { error } = await supabase
        .from('piglets')
        .update({
          status: 'sold',
          sale_date: saleDate,
          sold_date: saleDate,
          sale_price: priceNum,
          sale_weight_lbs: weight === '' ? null : parseFloat(weight),
          buyer: buyer.trim() || null,
          sale_type: saleType,
          notes: notes.trim() || null,
        })
        .eq('id', pigId)
        .eq('organization_id', selectedOrganizationId!);
      if (error) throw error;

      // Flow the sale into the financial ledger (only once we have a price —
      // auction results can be added later from the Sold list). Upsert on the
      // pig so adding/updating a price never duplicates the income row.
      if (priceNum != null && priceNum > 0 && user) {
        const payload = {
          income_date: saleDate,
          income_type: 'piglet_sale',
          quantity: 1,
          price_per_unit: priceNum,
          total_amount: priceNum,
          piglet_ids: [pigId],
          buyer_name: buyer.trim() || null,
          payment_status: 'paid',
          description: `${SALE_TYPES.find(s => s.value === saleType)?.label || 'Sale'} — ${label}`,
        };
        const { data: existingInc } = await supabase.from('income_records')
          .select('id').contains('piglet_ids', [pigId]).eq('income_type', 'piglet_sale')
          .eq('organization_id', selectedOrganizationId!).limit(1).maybeSingle();
        const { error: incErr } = existingInc
          ? await supabase.from('income_records').update(payload).eq('id', existingInc.id)
          : await supabase.from('income_records').insert({ ...payload, user_id: user.id, organization_id: selectedOrganizationId });
        if (incErr) console.error('Income row failed:', incErr.message);
      }

      toast.success(priceNum != null ? `${label} sold` : `${label} sold — add the price when auction results are in`);
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
      <div className="bg-card text-card-foreground rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-card">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">Sell Pig</h2>
            <p className="text-sm text-muted-foreground mt-0.5"><span className="font-mono">{label}</span></p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {deposit != null && deposit > 0 && (
            <div className="bg-info-bg border border-info/25 rounded-md p-3 text-sm text-info">
              Reserved with a ${deposit} deposit{buyer ? ` from ${buyer}` : ''}.
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sale_type">Channel</Label>
              <select id="sale_type" value={saleType} onChange={e => setSaleType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-brand">
                {SALE_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale_date">Sale Date <span className="text-due">*</span></Label>
              <Input id="sale_date" type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sale_price">Price ($)</Label>
              <Input id="sale_price" type="number" step="0.01" min="0" value={price}
                onChange={e => setPrice(e.target.value)} placeholder="Add later for auction" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale_weight">Weight ({wu})</Label>
              <Input id="sale_weight" type="number" step="0.1" min="0" value={weight}
                onChange={e => setWeight(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="buyer">Buyer</Label>
            <Input id="buyer" value={buyer} onChange={e => setBuyer(e.target.value)} placeholder="Buyer / bidder name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Optional" />
          </div>
          <p className="text-xs text-muted-foreground">
            Entering a price records it as income automatically. Leave it blank for an auction and add the result later from the Sold list.
          </p>
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
