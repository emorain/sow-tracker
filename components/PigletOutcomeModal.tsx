'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/lib/organization-context';
import { toast } from 'sonner';

type Kind = 'culled' | 'died';

type Props = {
  pigId: string;
  label: string;
  kind: Kind;
  onClose: () => void;
  onSuccess: () => void;
};

const COPY: Record<Kind, { title: string; verb: string; dateCol: string }> = {
  culled: { title: 'Cull Pig', verb: 'Cull', dateCol: 'culled_date' },
  died: { title: 'Record Death', verb: 'Record death', dateCol: 'died_date' },
};

export default function PigletOutcomeModal({ pigId, label, kind, onClose, onSuccess }: Props) {
  const { selectedOrganizationId } = useOrganization();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const copy = COPY[kind];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Append the reason to existing notes rather than overwriting.
      const { data: existing } = await supabase.from('piglets').select('notes').eq('id', pigId).single();
      const stamped = notes.trim()
        ? [existing?.notes, `${copy.verb}: ${notes.trim()}`].filter(Boolean).join('\n')
        : existing?.notes ?? null;

      const patch: Record<string, any> = { status: kind, notes: stamped };
      patch[copy.dateCol] = date;

      const { error } = await supabase
        .from('piglets')
        .update(patch)
        .eq('id', pigId)
        .eq('organization_id', selectedOrganizationId!);
      if (error) throw error;

      toast.success(`${label}: ${copy.verb.toLowerCase()} recorded`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card text-card-foreground rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">{copy.title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5"><span className="font-mono">{label}</span></p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="outcome_date">Date <span className="text-due">*</span></Label>
            <Input id="outcome_date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="outcome_notes">Reason / Notes</Label>
            <Textarea id="outcome_notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder={kind === 'culled' ? 'Why is this pig being culled?' : 'Cause of death, if known…'} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving…' : copy.verb}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
