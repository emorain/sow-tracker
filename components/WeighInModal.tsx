'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Scale, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/lib/organization-context';
import { useSettings } from '@/lib/settings-context';
import { toast } from 'sonner';

type AnimalType = 'sow' | 'boar' | 'piglet';

type Props = {
  animalType: AnimalType;
  animalId: string;
  label: string;
  birthDate?: string | null;
  birthWeight?: number | null; // piglet's birth weight, used as the ADG-since-birth anchor
  targetWeight?: number | null; // piglets only
  onClose: () => void;
  onSuccess?: () => void; // refresh parent (latest weight may have changed)
};

type Row = { id: string; weigh_date: string; weight: number; notes: string | null };

const fkCol = (t: AnimalType) => (t === 'sow' ? 'sow_id' : t === 'boar' ? 'boar_id' : 'piglet_id');
const daysBetween = (a: string, b: string) => Math.max(0, (Date.parse(b) - Date.parse(a)) / 86_400_000);
const fmt = (n: number) => (Math.round(n * 100) / 100).toString();

export default function WeighInModal({
  animalType, animalId, label, birthDate, birthWeight, targetWeight, onClose, onSuccess,
}: Props) {
  const { selectedOrganizationId } = useOrganization();
  const { settings } = useSettings();
  const wu = settings?.weight_unit || 'lb';
  const [rows, setRows] = useState<Row[]>([]);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [target, setTarget] = useState(targetWeight != null ? String(targetWeight) : '');

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('weight_log')
      .select('id, weigh_date, weight, notes')
      .eq(fkCol(animalType), animalId)
      .order('weigh_date', { ascending: true });
    setRows((data || []).map((r: any) => ({ ...r, weight: Number(r.weight) })));
    // Self-load the saved target so callers don't have to thread it through.
    if (animalType === 'piglet') {
      const { data: p } = await supabase.from('piglets').select('target_weight').eq('id', animalId).maybeSingle();
      if (p?.target_weight != null) setTarget(String(p.target_weight));
    }
    setReady(true);
  }, [animalType, animalId]);

  useEffect(() => { load(); }, [load]);

  // Growth series: birth point first (piglets, if known) then every weigh-in.
  const points = [
    ...(animalType === 'piglet' && birthWeight != null && birthDate
      ? [{ date: birthDate, weight: birthWeight }]
      : []),
    ...rows.map(r => ({ date: r.weigh_date, weight: r.weight })),
  ];
  const latest = points[points.length - 1] ?? null;
  const first = points[0] ?? null;
  const spanDays = first && latest ? daysBetween(first.date, latest.date) : 0;
  const overallAdg = first && latest && spanDays > 0 ? (latest.weight - first.weight) / spanDays : null;
  const prev = points.length >= 2 ? points[points.length - 2] : null;
  const recentDays = prev && latest ? daysBetween(prev.date, latest.date) : 0;
  const recentAdg = prev && latest && recentDays > 0 ? (latest.weight - prev.weight) / recentDays : null;

  const targetNum = target === '' ? null : parseFloat(target);
  const adgForProjection = recentAdg ?? overallAdg;
  let projection: string | null = null;
  if (targetNum != null && latest && adgForProjection && adgForProjection > 0 && latest.weight < targetNum) {
    const daysToGo = (targetNum - latest.weight) / adgForProjection;
    const proj = new Date(Date.now() + daysToGo * 86_400_000);
    projection = `~${Math.round(daysToGo)} days to ${fmt(targetNum)} ${wu} (around ${proj.toLocaleDateString()})`;
  } else if (targetNum != null && latest && latest.weight >= targetNum) {
    projection = `At/over target (${fmt(targetNum)} ${wu})`;
  }

  const addWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    if (!(w > 0)) { toast.error('Enter a weight greater than 0.'); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('You must be logged in'); setSaving(false); return; }
      const { error } = await supabase.from('weight_log').insert({
        animal_type: animalType,
        [fkCol(animalType)]: animalId,
        weigh_date: date,
        weight: w,
        notes: note.trim() || null,
        user_id: user.id,
        organization_id: selectedOrganizationId,
      });
      if (error) throw error;
      setWeight(''); setNote('');
      await load();
      onSuccess?.();
      toast.success('Weight recorded');
    } catch (err: any) {
      toast.error(err.message || 'Failed to record weight');
    } finally {
      setSaving(false);
    }
  };

  const removeRow = async (id: string) => {
    const { error } = await supabase.from('weight_log').delete().eq('id', id).eq('organization_id', selectedOrganizationId!);
    if (error) { toast.error(error.message || 'Failed to delete'); return; }
    await load();
    onSuccess?.();
  };

  const saveTarget = async () => {
    if (animalType !== 'piglet') return;
    const t = target === '' ? null : parseFloat(target);
    const { error } = await supabase.from('piglets').update({ target_weight: t }).eq('id', animalId).eq('organization_id', selectedOrganizationId!);
    if (error) { toast.error(error.message || 'Failed to save target'); return; }
    toast.success('Target weight saved');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card text-card-foreground rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-card">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-brand" />
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">Weight</h2>
              <p className="text-sm text-muted-foreground"><span className="font-mono">{label}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Latest" value={latest ? `${fmt(latest.weight)} ${wu}` : '—'} />
            <Stat label="Gain/day" value={recentAdg != null ? `${fmt(recentAdg)} ${wu}` : overallAdg != null ? `${fmt(overallAdg)} ${wu}` : '—'} />
            <Stat label="Weigh-ins" value={String(rows.length)} />
          </div>

          {/* Target (show pigs) */}
          {animalType === 'piglet' && (
            <div className="rounded-lg border p-3">
              <Label htmlFor="target" className="text-xs">Target show weight (optional)</Label>
              <div className="flex gap-2 mt-1">
                <Input id="target" type="number" step="0.1" min="0" value={target}
                  onChange={e => setTarget(e.target.value)} placeholder={`e.g. 260`} className="flex-1" />
                <Button type="button" variant="outline" size="sm" onClick={saveTarget}>Save</Button>
              </div>
              {projection && <p className="text-xs text-info mt-2">{projection}</p>}
            </div>
          )}

          {/* Add weight */}
          <form onSubmit={addWeight} className="rounded-lg border p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="weigh_date" className="text-xs">Date</Label>
                <Input id="weigh_date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="weight" className="text-xs">Weight ({wu})</Label>
                <Input id="weight" type="number" step="0.1" min="0" value={weight}
                  onChange={e => setWeight(e.target.value)} placeholder="0" required autoFocus />
              </div>
            </div>
            <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optional)" />
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Saving…' : 'Add Weight'}
            </Button>
          </form>

          {/* History */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">History</div>
            {!ready ? (
              <p className="text-sm text-muted-foreground py-3 text-center">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-3 text-center">No weigh-ins yet.</p>
            ) : (
              <div className="space-y-1">
                {[...rows].reverse().map((r, i, arr) => {
                  // Δ/day vs the chronologically previous weigh-in (arr is reversed).
                  const older = arr[i + 1];
                  const gain = older ? (r.weight - older.weight) / (daysBetween(older.weigh_date, r.weigh_date) || 1) : null;
                  return (
                    <div key={r.id} className="flex items-center gap-3 text-sm rounded-md border px-3 py-2">
                      <span className="text-muted-foreground w-24 tabular-nums">{new Date(r.weigh_date).toLocaleDateString()}</span>
                      <span className="font-semibold tabular-nums">{fmt(r.weight)} {wu}</span>
                      {gain != null && <span className="text-xs text-muted-foreground">{gain >= 0 ? '+' : ''}{fmt(gain)}/day</span>}
                      {r.notes && <span className="text-xs text-muted-foreground truncate">· {r.notes}</span>}
                      <button onClick={() => removeRow(r.id)} className="ml-auto text-muted-foreground hover:text-due" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary px-3 py-2">
      <div className="text-sm font-bold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</div>
    </div>
  );
}
