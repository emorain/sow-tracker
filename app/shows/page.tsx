'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/lib/organization-context';
import { toast } from 'sonner';
import { Trophy, Plus, Award, DollarSign } from 'lucide-react';
import ShowResultModal from '@/components/ShowResultModal';

type Row = {
  id: string;
  animal_type: string;
  show_name: string;
  show_date: string;
  show_class: string | null;
  placement: string | null;
  premium: number | null;
  judge: string | null;
  sow: { ear_tag: string; name: string | null } | null;
  boar: { ear_tag: string; name: string | null } | null;
  piglet: { ear_tag: string | null; name: string | null } | null;
};

const animalLabel = (r: Row): string => {
  const a = r.sow || r.boar || r.piglet;
  if (!a) return 'Unknown';
  return a.name || (a as any).ear_tag || 'No ID';
};

export default function ShowsPage() {
  const { selectedOrganizationId } = useOrganization();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    if (!selectedOrganizationId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('show_results')
        .select('id, animal_type, show_name, show_date, show_class, placement, premium, judge, sow:sows(ear_tag,name), boar:boars(ear_tag,name), piglet:piglets(ear_tag,name)')
        .eq('organization_id', selectedOrganizationId)
        .order('show_date', { ascending: false });
      if (error) throw error;
      setRows((data || []) as any);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load show results');
    } finally {
      setLoading(false);
    }
  }, [selectedOrganizationId]);

  useEffect(() => { load(); }, [load]);

  const shows = new Set(rows.map(r => `${r.show_name}|${r.show_date}`)).size;
  const champions = rows.filter(r => /champion/i.test(r.placement || '')).length;
  const premiums = rows.reduce((sum, r) => sum + (r.premium || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <header className="flex items-start justify-between gap-4 mb-5 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Show Results</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {loading ? 'Loading…' : `${rows.length} result${rows.length !== 1 ? 's' : ''} on the record`}
            </p>
          </div>
          <button onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold px-3.5 py-2">
            <Plus className="h-4 w-4" /> Add Result
          </button>
        </header>

        {/* Resume summary */}
        {!loading && rows.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Stat icon={Trophy} label="Shows" value={String(shows)} />
            <Stat icon={Award} label="Championships" value={String(champions)} />
            <Stat icon={DollarSign} label="Premiums" value={`$${premiums.toLocaleString()}`} />
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 rounded-xl border bg-card">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">No show results yet</p>
            <p className="text-sm text-muted-foreground mt-1">Record a placing — including on pigs you&apos;ve sold when a buyer reports back.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map(r => (
              <div key={r.id} className="rounded-lg border bg-card p-3.5 flex items-start gap-3">
                <div className="grid place-items-center h-10 w-10 rounded-lg bg-secondary shrink-0">
                  <Trophy className="h-5 w-5 text-brand" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-semibold text-sm">{animalLabel(r)}</span>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">{r.animal_type}</span>
                    {r.placement && <span className="px-2 py-0.5 rounded-full bg-ok-bg text-ok text-[11px] font-bold">{r.placement}</span>}
                  </div>
                  <div className="text-sm mt-0.5">{r.show_name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {new Date(r.show_date).toLocaleDateString()}
                    {r.show_class ? ` · ${r.show_class}` : ''}
                    {r.premium != null ? ` · $${r.premium}` : ''}
                    {r.judge ? ` · Judge ${r.judge}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {adding && (
        <ShowResultModal onClose={() => setAdding(false)} onSuccess={load} />
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3 flex items-center gap-3">
      <Icon className="h-5 w-5 text-brand shrink-0" />
      <div>
        <div className="text-lg font-bold tabular-nums leading-none">{value}</div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mt-1">{label}</div>
      </div>
    </div>
  );
}
