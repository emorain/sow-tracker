'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/lib/organization-context';
import { deriveStage } from '@/lib/pipeline';
import {
  formatDate, formatDateShort, calculateAge, daysSince, urgencyClasses,
} from '@/lib/format';
import { toast } from 'sonner';
import { ArrowLeft, ClipboardCheck, Baby } from 'lucide-react';
import PregnancyCheckModal from '@/components/PregnancyCheckModal';
import RecordLitterForm from '@/components/RecordLitterForm';

type Tab = 'overview' | 'breeding' | 'farrowings' | 'health';

export default function SowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { selectedOrganizationId } = useOrganization();
  const [tab, setTab] = useState<Tab>('overview');
  const [sow, setSow] = useState<any>(null);
  const [breedings, setBreedings] = useState<any[]>([]);
  const [dosesByAttempt, setDosesByAttempt] = useState<Record<string, any[]>>({});
  const [farrowings, setFarrowings] = useState<any[]>([]);
  const [health, setHealth] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pregCheck, setPregCheck] = useState<any>(null);
  const [litter, setLitter] = useState<{ farrowingId: string | null } | null>(null);

  const load = useCallback(async () => {
    if (!selectedOrganizationId || !id) return;
    setLoading(true);
    try {
      const [sowRes, brRes, faRes, heRes] = await Promise.all([
        supabase.from('sow_list_view').select('*').eq('id', id).eq('organization_id', selectedOrganizationId).maybeSingle(),
        supabase.from('breeding_attempts').select('*').eq('sow_id', id).order('breeding_date', { ascending: false }),
        supabase.from('farrowings').select('*').eq('sow_id', id).order('breeding_date', { ascending: false }),
        supabase.from('health_records').select('*').eq('sow_id', id).order('record_date', { ascending: false }),
      ]);
      setSow(sowRes.data);
      setBreedings(brRes.data || []);
      setFarrowings(faRes.data || []);
      setHealth(heRes.data || []);

      // group doses by attempt (fetch by attempt ids — ai_doses has no sow_id)
      const attemptIds = (brRes.data || []).map(b => b.id);
      if (attemptIds.length) {
        const { data: doses } = await supabase.from('ai_doses').select('*').in('breeding_attempt_id', attemptIds).order('dose_number');
        const map: Record<string, any[]> = {};
        (doses || []).forEach(d => { (map[d.breeding_attempt_id] ||= []).push(d); });
        setDosesByAttempt(map);
      } else {
        setDosesByAttempt({});
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to load sow');
    } finally {
      setLoading(false);
    }
  }, [id, selectedOrganizationId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Shell><div className="text-center py-16 text-muted-foreground text-sm">Loading…</div></Shell>;
  if (!sow) return <Shell><div className="text-center py-16 text-muted-foreground text-sm">Sow not found.</div></Shell>;

  const { sow: staged } = deriveStage(sow);
  const stageU = staged.urgency ? urgencyClasses(staged.urgency) : urgencyClasses('info');

  const openCheck = async () => {
    if (!sow.current_breeding_attempt_id) return;
    const { data: ba } = await supabase.from('breeding_attempts').select('*').eq('id', sow.current_breeding_attempt_id).single();
    const ds = sow.current_breeding_date ? (daysSince(sow.current_breeding_date) ?? 0) : 0;
    setPregCheck({ sow: { id: sow.id, ear_tag: sow.ear_tag, name: sow.name }, breedingAttempt: { ...ba, days_since_breeding: ds } });
  };
  const openLitter = async () => {
    const { data: f } = await supabase.from('farrowings').select('id').eq('sow_id', sow.id).is('actual_farrowing_date', null).order('breeding_date', { ascending: false }).limit(1).maybeSingle();
    setLitter({ farrowingId: f?.id ?? null });
  };

  const nextStep = getNextStep(staged.stage, sow, openCheck, openLitter);

  return (
    <Shell>
      {/* Header */}
      <div className="flex items-start gap-4 mb-1">
        <div className="grid place-items-center h-14 w-14 rounded-2xl bg-secondary text-2xl shrink-0">🐖</div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2 flex-wrap">
            <span className="font-mono">{sow.ear_tag}</span>
            {sow.name && <span className="text-muted-foreground font-normal">· {sow.name}</span>}
          </h1>
          <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-[13px] text-muted-foreground mt-1">
            {sow.breed && <span>{sow.breed}</span>}
            {sow.birth_date && <span>· {calculateAge(sow.birth_date)}</span>}
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${stageU.pill}`}>{staged.meta}</span>
            {(sow.right_ear_notch || sow.left_ear_notch) && (
              <span className="font-mono">Notch R{sow.right_ear_notch ?? '—'}/L{sow.left_ear_notch ?? '—'}</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b mt-5 mb-5">
        {(['overview', 'breeding', 'farrowings', 'health'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-[13.5px] font-semibold px-4 py-2.5 border-b-2 -mb-px capitalize transition-colors ${
              tab === t ? 'text-brand border-brand' : 'text-muted-foreground border-transparent hover:text-foreground'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div>
          {nextStep && (
            <div className="flex items-center gap-3 rounded-xl border bg-info-bg/40 p-3.5 mb-4">
              <div className="text-sm flex-1"><b className="text-info">Next step:</b> {nextStep.text}</div>
              {nextStep.action && (
                <button onClick={nextStep.action.onClick}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand text-brand-foreground text-xs font-semibold px-3.5 py-2">
                  <nextStep.action.icon className="h-3.5 w-3.5" />{nextStep.action.label}
                </button>
              )}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            <InfoCard title="Details">
              <KV k="Ear tag" v={sow.ear_tag} mono />
              <KV k="Breed" v={sow.breed || '—'} />
              <KV k="Ear notch" v={`R${sow.right_ear_notch ?? '—'} / L${sow.left_ear_notch ?? '—'}`} mono />
              <KV k="Housing" v={sow.housing_unit_name || '—'} />
              <KV k="Sire / Dam" v={`${sow.sire_name || '—'} / ${sow.dam_name || '—'}`} mono />
              <KV k="Registration" v={sow.registration_number || '—'} mono />
            </InfoCard>
            <InfoCard title="Lifetime">
              <KV k="Litters" v={String(sow.farrowing_count ?? 0)} mono />
              <KV k="Status" v={sow.status} />
              <KV k="Born" v={sow.birth_date ? formatDate(sow.birth_date) : '—'} />
              <KV k="Current cycle" v={sow.current_breeding_date ? `Bred ${formatDateShort(sow.current_breeding_date)}` : 'Open'} />
            </InfoCard>
          </div>
          {sow.notes && <InfoCard title="Notes" className="mt-3"><p className="text-sm">{sow.notes}</p></InfoCard>}
        </div>
      )}

      {tab === 'breeding' && (
        <Timeline empty="No breeding records yet.">
          {breedings.map(b => (
            <TL key={b.id}
              when={`${formatDate(b.breeding_date)} · ${b.breeding_method === 'ai' ? 'AI' : 'Natural'}`}
              what={resultLabel(b.result)}
              note={dosesNote(b, dosesByAttempt[b.id])} />
          ))}
        </Timeline>
      )}

      {tab === 'farrowings' && (
        <Timeline empty="No farrowings recorded yet.">
          {farrowings.filter(f => f.actual_farrowing_date).map(f => (
            <TL key={f.id}
              when={formatDate(f.actual_farrowing_date)}
              what={`${f.live_piglets ?? 0} live · ${f.stillborn ?? 0} stillborn · ${f.mummified ?? 0} mummified`}
              note={f.moved_out_of_farrowing_date ? `Weaned ${formatDate(f.moved_out_of_farrowing_date)}` : 'Currently nursing'} />
          ))}
        </Timeline>
      )}

      {tab === 'health' && (
        <Timeline empty="No health records yet.">
          {health.map(h => (
            <TL key={h.id}
              when={`${formatDate(h.record_date)}${h.record_type ? ' · ' + h.record_type : ''}`}
              what={h.title || h.record_type || 'Health record'}
              note={[h.description, h.dosage, h.veterinarian].filter(Boolean).join(' · ')} />
          ))}
        </Timeline>
      )}

      {pregCheck && (
        <PregnancyCheckModal sow={pregCheck.sow} breedingAttempt={pregCheck.breedingAttempt} isOpen
          onClose={() => setPregCheck(null)} onSuccess={() => { setPregCheck(null); load(); }} />
      )}
      {litter && (
        <RecordLitterForm sowId={sow.id} sowName={sow.name || sow.ear_tag} farrowingId={litter.farrowingId} isOpen
          onClose={() => setLitter(null)} onSuccess={() => { setLitter(null); load(); }} />
      )}
    </Shell>
  );
}

function getNextStep(stage: string, sow: any, openCheck: () => void, openLitter: () => void) {
  if (stage === 'bred') {
    const ds = daysSince(sow.current_breeding_date) ?? 0;
    if (ds >= 18) return { text: `Pregnancy check is due (bred ${ds} days ago). Confirm pregnant or mark returned to heat.`,
      action: { label: 'Pregnancy check', icon: ClipboardCheck, onClick: openCheck } };
    return { text: `Bred ${ds} days ago — pregnancy check opens around day 18.`, action: null };
  }
  if (stage === 'pregnant') return { text: 'Pregnant — record the litter once she farrows.',
    action: { label: 'Record litter', icon: Baby, onClick: openLitter } };
  if (stage === 'farrowing') return { text: 'Just farrowed — add or edit the litter and move to nursing.', action: null };
  if (stage === 'nursing') return { text: 'Nursing — wean from the Farrowing house when ready.', action: null };
  return { text: 'Open and ready to breed.', action: null };
}

function resultLabel(r: string | null) {
  switch (r) {
    case 'pregnant': return 'Confirmed pregnant';
    case 'farrowed': return 'Farrowed';
    case 'returned_to_heat': return 'Returned to heat';
    case 'aborted': return 'Aborted';
    case 'pending': return 'Bred — awaiting check';
    default: return 'Bred';
  }
}
function dosesNote(b: any, doses?: any[]) {
  const parts: string[] = [];
  if (b.boar_description) parts.push(b.boar_description);
  if (doses && doses.length) parts.push(`${doses.length} AI dose${doses.length > 1 ? 's' : ''}`);
  if (b.pregnancy_check_date) parts.push(`checked ${formatDateShort(b.pregnancy_check_date)}`);
  return parts.join(' · ');
}

/* ---- presentational bits ---- */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Link href="/pipeline" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to pipeline
        </Link>
        {children}
      </main>
    </div>
  );
}
function InfoCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border bg-card p-4 shadow-sm ${className}`}>
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2.5">{title}</h3>
      {children}
    </div>
  );
}
function KV({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between py-1.5 border-b last:border-0 text-[13.5px] gap-3">
      <span className="text-muted-foreground shrink-0">{k}</span>
      <span className={`font-semibold text-right ${mono ? 'font-mono' : ''}`}>{v}</span>
    </div>
  );
}
function Timeline({ children, empty }: { children: React.ReactNode; empty: string }) {
  const arr = Array.isArray(children) ? children : [children];
  const hasContent = arr.some(c => c);
  if (!hasContent) return <div className="text-sm text-muted-foreground py-8 text-center">{empty}</div>;
  return <div className="pl-1">{children}</div>;
}
function TL({ when, what, note }: { when: string; what: string; note?: string }) {
  return (
    <div className="relative pl-5 pb-4 border-l-2 border-border last:border-transparent">
      <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-background" />
      <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wide">{when}</div>
      <div className="text-sm font-semibold mt-0.5">{what}</div>
      {note && <div className="text-[12.5px] text-muted-foreground">{note}</div>}
    </div>
  );
}
