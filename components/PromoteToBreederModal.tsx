'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/lib/organization-context';
import { toast } from 'sonner';

type HousingUnit = { id: string; name: string; type: string; building_name: string | null; pen_number: string | null };

type Props = {
  pigId: string;
  label: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function PromoteToBreederModal({ pigId, label, onClose, onSuccess }: Props) {
  const { selectedOrganizationId } = useOrganization();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [housingUnits, setHousingUnits] = useState<HousingUnit[]>([]);

  // Carried-over pedigree we don't edit but must persist onto the herd record.
  const [carry, setCarry] = useState<{ sire_id: string | null; dam_id: string | null; sire_name: string | null; dam_name: string | null }>({
    sire_id: null, dam_id: null, sire_name: null, dam_name: null,
  });

  const [species, setSpecies] = useState<'sow' | 'boar'>('sow');
  const [form, setForm] = useState({
    ear_tag: '',
    name: '',
    breed: '',
    birth_date: '',
    right_ear_notch: '',
    left_ear_notch: '',
    registration_number: '',
    housing_unit_id: '',
  });

  useEffect(() => {
    (async () => {
      if (!selectedOrganizationId) return;
      try {
        const [{ data: pig, error: pigErr }, { data: units }] = await Promise.all([
          supabase.from('piglets')
            .select('ear_tag, name, sex, right_ear_notch, left_ear_notch, registration_number, sire_id, dam_id, sire_name, dam_name, housing_unit_id, farrowings!inner ( actual_farrowing_date )')
            .eq('id', pigId).single(),
          supabase.from('housing_units').select('id, name, type, building_name, pen_number')
            .eq('organization_id', selectedOrganizationId).order('name'),
        ]);
        if (pigErr) throw pigErr;
        setHousingUnits(units || []);

        // Default breed from the dam so the required field is usually pre-filled.
        let breed = '';
        if (pig?.dam_id) {
          const { data: dam } = await supabase.from('sows').select('breed').eq('id', pig.dam_id).maybeSingle();
          breed = dam?.breed || '';
        }

        setSpecies(pig?.sex === 'male' ? 'boar' : 'sow');
        setCarry({
          sire_id: pig?.sire_id ?? null, dam_id: pig?.dam_id ?? null,
          sire_name: pig?.sire_name ?? null, dam_name: pig?.dam_name ?? null,
        });
        setForm({
          ear_tag: pig?.ear_tag || '',
          name: pig?.name || '',
          breed,
          birth_date: (pig as any)?.farrowings?.actual_farrowing_date || '',
          right_ear_notch: pig?.right_ear_notch != null ? String(pig.right_ear_notch) : '',
          left_ear_notch: pig?.left_ear_notch != null ? String(pig.left_ear_notch) : '',
          registration_number: pig?.registration_number || '',
          housing_unit_id: pig?.housing_unit_id || '',
        });
        setReady(true);
      } catch (err: any) {
        setError(err.message || 'Failed to load pig');
        setReady(true);
      }
    })();
  }, [pigId, selectedOrganizationId]);

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));
  const housingName = (u: HousingUnit) => (u.building_name && u.pen_number ? `${u.building_name} - Pen ${u.pen_number}` : u.name);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.ear_tag.trim()) { setError('Ear tag is required for a herd animal.'); return; }
    if (!form.breed.trim()) { setError('Breed is required.'); return; }
    if (!form.birth_date) { setError('Birth date is required.'); return; }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('You must be logged in.'); setLoading(false); return; }

      const common = {
        user_id: user.id,
        organization_id: selectedOrganizationId,
        ear_tag: form.ear_tag.trim(),
        name: form.name.trim() || null,
        breed: form.breed.trim(),
        birth_date: form.birth_date,
        right_ear_notch: form.right_ear_notch === '' ? null : parseInt(form.right_ear_notch),
        left_ear_notch: form.left_ear_notch === '' ? null : parseInt(form.left_ear_notch),
        registration_number: form.registration_number.trim() || null,
        sire_id: carry.sire_id,
        dam_id: carry.dam_id,
        sire_name: carry.sire_name,
        dam_name: carry.dam_name,
        housing_unit_id: form.housing_unit_id || null,
        status: 'active',
      };

      const { error: insErr } = species === 'sow'
        ? await supabase.from('sows').insert(common)
        : await supabase.from('boars').insert({ ...common, boar_type: 'live' });
      if (insErr) throw insErr;

      // Retire the piglet record — it has graduated into the breeding herd.
      const { error: updErr } = await supabase
        .from('piglets')
        .update({ status: 'retained', classification: 'breeder' })
        .eq('id', pigId)
        .eq('organization_id', selectedOrganizationId!);
      if (updErr) {
        // Herd record was created; flag the loose end rather than hide it.
        toast.error('Herd record created, but retiring the piglet failed — check the nursery.');
      } else {
        toast.success(`${label} added to the ${species === 'sow' ? 'sow' : 'boar'} herd`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to promote pig');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card text-card-foreground rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-card">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">Keep as Breeder</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              <span className="font-mono">{label}</span> · graduates into the herd
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {!ready ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4">
            {error && (
              <div className="bg-due-bg border border-due/30 text-due px-4 py-3 rounded-md text-sm">{error}</div>
            )}

            {/* Species */}
            <div className="space-y-2">
              <Label>Add to herd as <span className="text-due">*</span></Label>
              <div className="grid grid-cols-2 gap-3">
                {(['sow', 'boar'] as const).map(s => (
                  <button key={s} type="button" onClick={() => setSpecies(s)}
                    className={`p-3 border-2 rounded-lg text-center transition-all ${
                      species === s ? 'border-brand bg-brand/10 text-foreground' : 'border-input hover:border-muted-foreground'
                    }`}>
                    <div className="font-semibold capitalize">{s}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s === 'sow' ? 'Female breeder' : 'Male breeder'}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ear_tag">Ear Tag <span className="text-due">*</span></Label>
                <Input id="ear_tag" value={form.ear_tag} onChange={e => set('ear_tag', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Optional" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="breed">Breed <span className="text-due">*</span></Label>
                <Input id="breed" value={form.breed} onChange={e => set('breed', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Birth Date <span className="text-due">*</span></Label>
                <Input id="birth_date" type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="right_ear_notch">Right Notch</Label>
                <Input id="right_ear_notch" type="number" min="0" max="99" value={form.right_ear_notch}
                  onChange={e => set('right_ear_notch', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="left_ear_notch">Left Notch</Label>
                <Input id="left_ear_notch" type="number" min="0" max="99" value={form.left_ear_notch}
                  onChange={e => set('left_ear_notch', e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration_number">Registration #</Label>
              <Input id="registration_number" value={form.registration_number}
                onChange={e => set('registration_number', e.target.value)} placeholder="Optional" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="housing_unit_id">Housing</Label>
              <select id="housing_unit_id" value={form.housing_unit_id} onChange={e => set('housing_unit_id', e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-brand">
                <option value="">-- None --</option>
                {housingUnits.map(u => (
                  <option key={u.id} value={u.id}>{housingName(u)}{u.type ? ` (${u.type})` : ''}</option>
                ))}
              </select>
            </div>

            <div className="bg-info-bg border border-info/25 rounded-md p-3 text-xs text-info">
              Sire &amp; dam pedigree is carried over automatically. The piglet record is retired once added.
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Adding…' : `Add to ${species} herd`}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
