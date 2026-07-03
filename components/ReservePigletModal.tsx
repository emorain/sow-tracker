'use client';

import { useState } from 'react';
import { X, BookMarked } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/lib/organization-context';
import { toast } from 'sonner';

type Props = {
  pigId: string;
  label: string;
  onClose: () => void;
  onSuccess: () => void;
};

// Pre-buy: a buyer puts a deposit on a pig before the auction. The pig stays on
// the farm (status 'reserved') until the sale is completed.
export default function ReservePigletModal({ pigId, label, onClose, onSuccess }: Props) {
  const { selectedOrganizationId } = useOrganization();
  const [buyer, setBuyer] = useState('');
  const [deposit, setDeposit] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyer.trim()) { toast.error('Enter the buyer.'); return; }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('piglets')
        .update({
          status: 'reserved',
          buyer: buyer.trim(),
          deposit: deposit === '' ? null : parseFloat(deposit),
          notes: notes.trim() || null,
        })
        .eq('id', pigId)
        .eq('organization_id', selectedOrganizationId!);
      if (error) throw error;
      toast.success(`${label} reserved for ${buyer.trim()}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reserve');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card text-card-foreground rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-brand" />
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">Reserve Pig</h2>
              <p className="text-sm text-muted-foreground"><span className="font-mono">{label}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="buyer">Buyer <span className="text-due">*</span></Label>
            <Input id="buyer" value={buyer} onChange={e => setBuyer(e.target.value)} placeholder="Who's holding the pig" required autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deposit">Deposit ($)</Label>
            <Input id="deposit" type="number" step="0.01" min="0" value={deposit} onChange={e => setDeposit(e.target.value)} placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" />
          </div>
          <p className="text-xs text-muted-foreground">
            The pig stays on the farm marked <strong>Reserved</strong>. Complete the sale later to record the final price.
          </p>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">{loading ? 'Saving…' : 'Reserve'}</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
