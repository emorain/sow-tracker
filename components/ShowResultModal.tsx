'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Trophy, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/lib/organization-context';
import { toast } from 'sonner';

type AnimalType = 'sow' | 'boar' | 'piglet';
type Animal = { type: AnimalType; id: string; label: string };

type Props = {
  animal?: Animal;      // preset from a detail page; omit to search (reaches sold pigs)
  onClose: () => void;
  onSuccess?: () => void;
};

type Result = {
  id: string; show_name: string; show_date: string; show_class: string | null;
  placement: string | null; premium: number | null; judge: string | null; notes: string | null;
};

const PLACEMENTS = ['Grand Champion', 'Reserve Champion', 'Breed Champion', 'Division Champion', 'Class Winner', '1st', '2nd', '3rd', '4th', '5th'];
const fkCol = (t: AnimalType) => (t === 'sow' ? 'sow_id' : t === 'boar' ? 'boar_id' : 'piglet_id');

export default function ShowResultModal({ animal, onClose, onSuccess }: Props) {
  const { selectedOrganizationId } = useOrganization();
  const [selected, setSelected] = useState<Animal | null>(animal ?? null);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<Animal[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    show_name: '', show_date: new Date().toISOString().split('T')[0],
    show_class: '', placement: '', premium: '', judge: '', notes: '',
  });
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const loadResults = useCallback(async () => {
    if (!selected) { setResults([]); return; }
    const { data } = await supabase
      .from('show_results')
      .select('id, show_name, show_date, show_class, placement, premium, judge, notes')
      .eq(fkCol(selected.type), selected.id)
      .order('show_date', { ascending: false });
    setResults((data || []) as Result[]);
  }, [selected]);

  useEffect(() => { loadResults(); }, [loadResults]);

  // Animal search across all sows/boars/piglets (sold pigs included).
  const search = async (q: string) => {
    setQuery(q);
    if (q.trim().length < 1 || !selectedOrganizationId) { setMatches([]); return; }
    const like = `%${q.trim()}%`;
    const [s, b, p] = await Promise.all([
      supabase.from('sows').select('id, ear_tag, name').eq('organization_id', selectedOrganizationId).or(`ear_tag.ilike.${like},name.ilike.${like}`).limit(6),
      supabase.from('boars').select('id, ear_tag, name').eq('organization_id', selectedOrganizationId).or(`ear_tag.ilike.${like},name.ilike.${like}`).limit(6),
      supabase.from('piglets').select('id, ear_tag, name').eq('organization_id', selectedOrganizationId).or(`ear_tag.ilike.${like},name.ilike.${like}`).limit(8),
    ]);
    const mk = (rows: any[] | null, type: AnimalType): Animal[] =>
      (rows || []).map(r => ({ type, id: r.id, label: `${r.name || r.ear_tag || 'No ID'}${r.name && r.ear_tag ? ` · ${r.ear_tag}` : ''}` }));
    setMatches([...mk(s.data, 'sow'), ...mk(b.data, 'boar'), ...mk(p.data, 'piglet')]);
  };

  const addResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) { toast.error('Pick an animal first.'); return; }
    if (!form.show_name.trim()) { toast.error('Show name is required.'); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('You must be logged in'); setSaving(false); return; }
      const { error } = await supabase.from('show_results').insert({
        animal_type: selected.type,
        [fkCol(selected.type)]: selected.id,
        show_name: form.show_name.trim(),
        show_date: form.show_date,
        show_class: form.show_class.trim() || null,
        placement: form.placement.trim() || null,
        premium: form.premium === '' ? null : parseFloat(form.premium),
        judge: form.judge.trim() || null,
        notes: form.notes.trim() || null,
        user_id: user.id,
        organization_id: selectedOrganizationId,
      });
      if (error) throw error;
      setForm({ show_name: '', show_date: new Date().toISOString().split('T')[0], show_class: '', placement: '', premium: '', judge: '', notes: '' });
      await loadResults();
      onSuccess?.();
      toast.success('Show result recorded');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save result');
    } finally {
      setSaving(false);
    }
  };

  const removeResult = async (id: string) => {
    const { error } = await supabase.from('show_results').delete().eq('id', id).eq('organization_id', selectedOrganizationId!);
    if (error) { toast.error(error.message || 'Failed to delete'); return; }
    await loadResults();
    onSuccess?.();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card text-card-foreground rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-card">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-brand" />
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">Show Results</h2>
              {selected && <p className="text-sm text-muted-foreground"><span className="font-mono">{selected.label}</span></p>}
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Animal picker (only when not preset) */}
          {!animal && (
            <div className="space-y-2">
              <Label>Animal</Label>
              {selected ? (
                <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span><span className="font-mono">{selected.label}</span> <span className="text-muted-foreground">· {selected.type}</span></span>
                  <button className="text-xs text-brand font-semibold" onClick={() => { setSelected(null); setQuery(''); }}>Change</button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={query} onChange={e => search(e.target.value)} placeholder="Search any pig by tag or name (incl. sold)" className="pl-9" />
                  {matches.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border bg-card shadow-lg max-h-56 overflow-y-auto">
                      {matches.map(m => (
                        <button key={`${m.type}-${m.id}`} onClick={() => { setSelected(m); setMatches([]); setQuery(''); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-secondary flex items-center justify-between">
                          <span className="font-mono">{m.label}</span>
                          <span className="text-xs text-muted-foreground">{m.type}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Add form */}
          <form onSubmit={addResult} className="rounded-lg border p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <Label htmlFor="show_name" className="text-xs">Show <span className="text-due">*</span></Label>
                <Input id="show_name" value={form.show_name} onChange={e => set('show_name', e.target.value)} placeholder="e.g. County Fair Jr. Show" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="show_date" className="text-xs">Date <span className="text-due">*</span></Label>
                <Input id="show_date" type="date" value={form.show_date} onChange={e => set('show_date', e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="show_class" className="text-xs">Class</Label>
                <Input id="show_class" value={form.show_class} onChange={e => set('show_class', e.target.value)} placeholder="e.g. Lightweight Barrow" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="placement" className="text-xs">Placement</Label>
                <Input id="placement" list="placements" value={form.placement} onChange={e => set('placement', e.target.value)} placeholder="e.g. 1st / Grand Champion" />
                <datalist id="placements">{PLACEMENTS.map(p => <option key={p} value={p} />)}</datalist>
              </div>
              <div className="space-y-1">
                <Label htmlFor="premium" className="text-xs">Premium ($)</Label>
                <Input id="premium" type="number" step="0.01" min="0" value={form.premium} onChange={e => set('premium', e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <Input value={form.judge} onChange={e => set('judge', e.target.value)} placeholder="Judge (optional)" />
            <Input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Note (optional)" />
            <Button type="submit" disabled={saving || !selected} className="w-full">
              {saving ? 'Saving…' : 'Add Show Result'}
            </Button>
          </form>

          {/* History */}
          {selected && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Record</div>
              {results.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3 text-center">No results yet.</p>
              ) : (
                <div className="space-y-1">
                  {results.map(r => (
                    <div key={r.id} className="flex items-start gap-3 text-sm rounded-md border px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{r.show_name}</span>
                          {r.placement && <span className="px-1.5 py-0.5 rounded bg-ok-bg text-ok text-[11px] font-bold">{r.placement}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(r.show_date).toLocaleDateString()}
                          {r.show_class ? ` · ${r.show_class}` : ''}
                          {r.premium != null ? ` · $${r.premium}` : ''}
                          {r.judge ? ` · Judge ${r.judge}` : ''}
                        </div>
                      </div>
                      <button onClick={() => removeResult(r.id)} className="text-muted-foreground hover:text-due" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
