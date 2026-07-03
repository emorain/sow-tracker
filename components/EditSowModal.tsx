'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useOrganization } from '@/lib/organization-context';

type EditSowModalProps = {
  sow: any;
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditSowModal({ sow, onClose, onSuccess }: EditSowModalProps) {
  const { selectedOrganizationId } = useOrganization();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    ear_tag: sow.ear_tag || '',
    name: sow.name || '',
    breed: sow.breed || '',
    birth_date: sow.birth_date || '',
    status: (sow.status || 'active') as 'active' | 'culled' | 'sold',
    right_ear_notch: sow.right_ear_notch?.toString() || '',
    left_ear_notch: sow.left_ear_notch?.toString() || '',
    registration_number: sow.registration_number || '',
    registration_status: (sow.registration_status || 'unregistered') as 'unregistered' | 'pending' | 'registered',
    sire_name: sow.sire_name || '',
    dam_name: sow.dam_name || '',
    notes: sow.notes || '',
  });

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ear_tag.trim()) { toast.error('Ear tag is required'); return; }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('sows')
        .update({
          ear_tag: form.ear_tag.trim(),
          name: form.name.trim() || null,
          breed: form.breed.trim() || '',
          birth_date: form.birth_date || null,
          status: form.status,
          right_ear_notch: form.right_ear_notch ? parseInt(form.right_ear_notch) : null,
          left_ear_notch: form.left_ear_notch ? parseInt(form.left_ear_notch) : null,
          registration_number: form.registration_number.trim() || null,
          registration_status: form.registration_status,
          sire_name: form.sire_name.trim() || null,
          dam_name: form.dam_name.trim() || null,
          notes: form.notes.trim() || null,
        })
        .eq('id', sow.id)
        .eq('organization_id', selectedOrganizationId!);
      if (error) throw error;
      toast.success('Sow updated');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update sow');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b px-6 py-4 flex items-center justify-between sticky top-0 bg-card rounded-t-lg">
          <h2 className="text-lg font-bold">Edit Sow</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ear_tag">Ear Tag <span className="text-due">*</span></Label>
              <Input id="ear_tag" value={form.ear_tag} onChange={e => set('ear_tag', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="breed">Breed</Label>
              <Input id="breed" value={form.breed} onChange={e => set('breed', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="birth_date">Birth Date</Label>
              <Input id="birth_date" type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select id="status" value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm">
                <option value="active">Active</option>
                <option value="culled">Culled</option>
                <option value="sold">Sold</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="registration_number">Registration #</Label>
              <Input id="registration_number" value={form.registration_number} onChange={e => set('registration_number', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="registration_status">Registration Status</Label>
              <select id="registration_status" value={form.registration_status}
                onChange={e => set('registration_status', e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-brand">
                <option value="unregistered">Unregistered</option>
                <option value="pending">Registration pending</option>
                <option value="registered">Registered</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="right_ear_notch">Right Ear Notch</Label>
              <Input id="right_ear_notch" type="number" value={form.right_ear_notch} onChange={e => set('right_ear_notch', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="left_ear_notch">Left Ear Notch</Label>
              <Input id="left_ear_notch" type="number" value={form.left_ear_notch} onChange={e => set('left_ear_notch', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sire_name">Sire</Label>
              <Input id="sire_name" value={form.sire_name} onChange={e => set('sire_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dam_name">Dam</Label>
              <Input id="dam_name" value={form.dam_name} onChange={e => set('dam_name', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2 border-t">
            <Button type="submit" disabled={saving} className="flex-1">{saving ? 'Saving…' : 'Save Changes'}</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
