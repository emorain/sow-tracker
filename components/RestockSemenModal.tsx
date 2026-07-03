'use client';

import { useEffect, useState } from 'react';
import { X, Syringe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/lib/organization-context';
import { toast } from 'sonner';

type Props = {
  boarId: string;
  label: string;
  onClose: () => void;
  onSuccess: () => void;
};

// Restock buys more straws for a boar you ALREADY have — keeping one record per
// sire instead of a new duplicate every season. Straws are added to the running
// total and a depleted record is brought back to active.
export default function RestockSemenModal({ boarId, label, onClose, onSuccess }: Props) {
  const { selectedOrganizationId } = useOrganization();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<{ semen_straws: number; status: string }>({ semen_straws: 0, status: 'active' });
  const [form, setForm] = useState({
    add: '',
    collection_date: new Date().toISOString().split('T')[0],
    cost_per_straw: '',
    supplier: '',
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('boars')
        .select('semen_straws, status, cost_per_straw, supplier')
        .eq('id', boarId)
        .single();
      if (data) {
        setCurrent({ semen_straws: data.semen_straws || 0, status: data.status });
        setForm(f => ({
          ...f,
          cost_per_straw: data.cost_per_straw != null ? String(data.cost_per_straw) : '',
          supplier: data.supplier || '',
        }));
      }
      setReady(true);
    })();
  }, [boarId]);

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));
  const add = parseInt(form.add) || 0;
  const newTotal = current.semen_straws + add;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (add < 1) { toast.error('Enter how many straws you bought.'); return; }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('boars')
        .update({
          semen_straws: newTotal,
          status: 'active', // a restocked record is available again
          collection_date: form.collection_date || null,
          cost_per_straw: form.cost_per_straw === '' ? null : parseFloat(form.cost_per_straw),
          supplier: form.supplier.trim() || null,
        })
        .eq('id', boarId)
        .eq('organization_id', selectedOrganizationId!);
      if (error) throw error;
      toast.success(`Restocked ${label}: +${add} straw${add !== 1 ? 's' : ''} (${newTotal} total)`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to restock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card text-card-foreground rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Syringe className="h-5 w-5 text-info" />
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">Restock Semen</h2>
              <p className="text-sm text-muted-foreground"><span className="font-mono">{label}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {!ready ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4">
            <div className="bg-info-bg border border-info/25 rounded-lg p-3 text-sm text-info">
              Currently <strong>{current.semen_straws}</strong> straw{current.semen_straws !== 1 ? 's' : ''}
              {current.status === 'depleted' && ' · depleted'}. New straws are added to the same sire — no duplicate record.
            </div>

            <div className="space-y-2">
              <Label htmlFor="add">Straws purchased <span className="text-due">*</span></Label>
              <Input id="add" type="number" min="1" value={form.add} onChange={e => set('add', e.target.value)}
                placeholder="e.g. 10" required autoFocus />
              {add > 0 && (
                <p className="text-xs text-muted-foreground">New total: <strong>{newTotal}</strong> straws · record set to active</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="collection_date">Collection Date</Label>
                <Input id="collection_date" type="date" value={form.collection_date}
                  onChange={e => set('collection_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost_per_straw">Cost / Straw</Label>
                <Input id="cost_per_straw" type="number" step="0.01" min="0" value={form.cost_per_straw}
                  onChange={e => set('cost_per_straw', e.target.value)} placeholder="0.00" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input id="supplier" value={form.supplier} onChange={e => set('supplier', e.target.value)}
                placeholder="Who supplied this batch" />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Restocking…' : add > 0 ? `Add ${add} Straw${add !== 1 ? 's' : ''}` : 'Add Straws'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
