'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/lib/organization-context';
import { toast } from 'sonner';
import { CLASSIFICATIONS, type Classification } from '@/lib/nursery';

const BLURB: Record<Classification, string> = {
  undecided: 'Not sorted yet.',
  show: 'Show-quality — destined to be sold as a show pig.',
  feeder: 'Lower quality — sold as a feeder pig.',
  breeder: 'Kept back to join the breeding herd.',
  market: 'Grown out for market / butcher.',
};

const TARGETS = CLASSIFICATIONS.filter(c => c.key !== 'undecided');

type Props = {
  pigId: string;
  label: string;
  current: Classification;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ClassifyPigletModal({ pigId, label, current, onClose, onSuccess }: Props) {
  const { selectedOrganizationId } = useOrganization();
  const [saving, setSaving] = useState<Classification | null>(null);

  const pick = async (c: Classification) => {
    if (c === current) { onClose(); return; }
    setSaving(c);
    const { error } = await supabase
      .from('piglets')
      .update({ classification: c })
      .eq('id', pigId)
      .eq('organization_id', selectedOrganizationId!);
    if (error) {
      toast.error(error.message || 'Failed to sort');
      setSaving(null);
      return;
    }
    toast.success(`${label} sorted as ${CLASSIFICATIONS.find(x => x.key === c)?.label}`);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card text-card-foreground rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">Sort Pig</h2>
            <p className="text-sm text-muted-foreground mt-0.5"><span className="font-mono">{label}</span></p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-4 space-y-2">
          {TARGETS.map(t => (
            <button
              key={t.key}
              onClick={() => pick(t.key)}
              disabled={saving !== null}
              className={`w-full text-left rounded-lg border p-3 transition-colors disabled:opacity-60 ${
                current === t.key ? 'border-brand bg-brand/10' : 'border-border hover:border-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${t.tone}`} />
                <span className="font-semibold text-sm text-foreground">{t.label}</span>
                {current === t.key && <span className="ml-auto text-[10px] font-semibold uppercase text-brand">current</span>}
                {saving === t.key && <span className="ml-auto text-xs text-muted-foreground">Saving…</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{BLURB[t.key]}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
