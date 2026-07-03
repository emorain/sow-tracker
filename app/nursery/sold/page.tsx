'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/lib/organization-context';
import { useSettings } from '@/lib/settings-context';
import { toast } from 'sonner';
import { ArrowLeft, DollarSign, Pencil } from 'lucide-react';
import SellPigletModal from '@/components/SellPigletModal';

type Sold = {
  id: string; ear_tag: string | null; name: string | null;
  right_ear_notch: number | null; left_ear_notch: number | null;
  sale_date: string | null; sale_price: number | null; sale_weight_lbs: number | null;
  buyer: string | null; sale_type: string | null; photo_url: string | null;
};

const label = (p: Sold) => p.name || p.ear_tag || (p.right_ear_notch != null || p.left_ear_notch != null ? `${p.right_ear_notch ?? 0}-${p.left_ear_notch ?? 0}` : 'No ID');
const channel = (t: string | null) => t === 'auction' ? 'Auction' : t === 'private' ? 'Private' : t === 'show' ? 'Show' : '';

export default function SoldPage() {
  const { selectedOrganizationId } = useOrganization();
  const { settings } = useSettings();
  const wu = settings?.weight_unit || 'lb';
  const [rows, setRows] = useState<Sold[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Sold | null>(null);

  const load = useCallback(async () => {
    if (!selectedOrganizationId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('piglets')
        .select('id, ear_tag, name, right_ear_notch, left_ear_notch, sale_date, sale_price, sale_weight_lbs, buyer, sale_type, photo_url')
        .eq('organization_id', selectedOrganizationId)
        .eq('status', 'sold')
        .order('sale_date', { ascending: false });
      if (error) throw error;
      setRows((data || []) as Sold[]);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load sold pigs');
    } finally {
      setLoading(false);
    }
  }, [selectedOrganizationId]);

  useEffect(() => { load(); }, [load]);

  const revenue = rows.reduce((s, r) => s + (r.sale_price || 0), 0);
  const pending = rows.filter(r => r.sale_price == null).length;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-4">
          <Link href="/nursery" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Nursery
          </Link>
        </div>
        <header className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight">Sold Pigs</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {loading ? 'Loading…' : `${rows.length} sold · $${revenue.toLocaleString()} recorded${pending ? ` · ${pending} awaiting auction price` : ''}`}
          </p>
        </header>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 rounded-xl border bg-card">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">No sold pigs yet</p>
            <p className="text-sm text-muted-foreground mt-1">Pigs you sell from the Nursery show up here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map(p => (
              <div key={p.id} className="rounded-lg border bg-card p-3.5 flex items-center gap-3">
                {p.photo_url
                  ? <img src={p.photo_url} alt="" className="h-10 w-10 rounded object-cover shrink-0" />
                  : <div className="h-10 w-10 rounded bg-secondary grid place-items-center text-lg shrink-0">🐖</div>}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-semibold text-sm">{label(p)}</span>
                    {p.sale_type && <span className="text-[10px] uppercase font-semibold text-muted-foreground">{channel(p.sale_type)}</span>}
                    {p.sale_price == null && <span className="px-2 py-0.5 rounded-full bg-soon-bg text-soon text-[11px] font-bold">price pending</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {p.buyer ? `${p.buyer} · ` : ''}
                    {p.sale_date ? new Date(p.sale_date).toLocaleDateString() : '—'}
                    {p.sale_weight_lbs != null ? ` · ${p.sale_weight_lbs} ${wu}` : ''}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold tabular-nums">{p.sale_price != null ? `$${p.sale_price.toLocaleString()}` : '—'}</div>
                  <button onClick={() => setEdit(p)} className="text-xs text-brand font-semibold inline-flex items-center gap-1 mt-0.5">
                    <Pencil className="h-3 w-3" /> Edit sale
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {edit && (
        <SellPigletModal pigId={edit.id} label={label(edit)}
          onClose={() => setEdit(null)} onSuccess={() => { setEdit(null); load(); }} />
      )}
    </div>
  );
}
