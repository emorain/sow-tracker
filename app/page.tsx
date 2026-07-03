'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/lib/settings-context';
import { useOrganization } from '@/lib/organization-context';
import { fetchTodayData, type TodayData, type TodayItem } from '@/lib/today';
import { urgencyClasses } from '@/lib/format';
import { toast } from 'sonner';
import { Plus, ClipboardCheck, Baby, Syringe, FlaskConical, ArrowRight, CheckCircle2 } from 'lucide-react';
import PregnancyCheckModal from '@/components/PregnancyCheckModal';
import RecordLitterForm from '@/components/RecordLitterForm';
import { AIDoseModal } from '@/components/AIDoseModal';

const KIND_ICON = {
  pregnancy_check: ClipboardCheck,
  farrowing: Baby,
  ai_cycle: FlaskConical,
  heat: Syringe,
  matrix_dose: Syringe,
} as const;

export default function TodayPage() {
  const { settings } = useSettings();
  const { selectedOrganizationId } = useOrganization();
  const farmName = settings?.farm_name || 'your farm';

  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [pregCheck, setPregCheck] = useState<{ sow: any; breedingAttempt: any } | null>(null);
  const [litter, setLitter] = useState<{ sowId: string; sowName: string; farrowingId: string | null } | null>(null);
  const [aiDose, setAiDose] = useState<{ breedingAttempt: any; doses: any[] } | null>(null);

  const load = useCallback(async () => {
    if (!selectedOrganizationId) { setLoading(false); return; }
    setLoading(true);
    try {
      setData(await fetchTodayData(selectedOrganizationId));
    } catch (e: any) {
      toast.error(e.message || 'Failed to load today');
    } finally {
      setLoading(false);
    }
  }, [selectedOrganizationId]);

  useEffect(() => { load(); }, [load]);

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  // --- action handlers: open the existing (hardened) modals ---
  const openPregnancyCheck = async (item: TodayItem) => {
    if (!item.breedingAttemptId) return;
    const { data: ba, error } = await supabase
      .from('breeding_attempts').select('*').eq('id', item.breedingAttemptId).single();
    if (error || !ba) { toast.error('Could not load breeding record'); return; }
    const ds = item.breedingDate
      ? Math.floor((Date.now() - new Date(item.breedingDate).getTime()) / 86400000) : 0;
    setPregCheck({
      sow: { id: item.sowId, ear_tag: item.earTag, name: item.name },
      breedingAttempt: { ...ba, days_since_breeding: ds },
    });
  };

  const openRecordLitter = async (item: TodayItem) => {
    if (!item.sowId) return;
    const { data: f } = await supabase
      .from('farrowings').select('id').eq('sow_id', item.sowId)
      .is('actual_farrowing_date', null).order('breeding_date', { ascending: false }).limit(1).maybeSingle();
    setLitter({ sowId: item.sowId, sowName: item.name || item.earTag, farrowingId: f?.id ?? null });
  };

  const openAiDose = async (item: TodayItem) => {
    if (!item.breedingAttemptId) return;
    const [{ data: ba }, { data: doses }] = await Promise.all([
      supabase.from('breeding_attempts').select('*').eq('id', item.breedingAttemptId).single(),
      supabase.from('ai_doses').select('*').eq('breeding_attempt_id', item.breedingAttemptId).order('dose_number'),
    ]);
    if (!ba) { toast.error('Could not load breeding record'); return; }
    setAiDose({ breedingAttempt: ba, doses: doses || [] });
  };

  // Record today's Matrix dose for the whole batch, inline from the worklist —
  // this is the daily "give the dose during feeding" action. Idempotent.
  const doseBatch = async (item: TodayItem) => {
    if (!item.treatmentIds?.length || !selectedOrganizationId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('You must be logged in'); return; }
    const date = new Date().toISOString().split('T')[0];
    const rows = item.treatmentIds.map(id => ({
      matrix_treatment_id: id,
      organization_id: selectedOrganizationId,
      user_id: user.id,
      dose_date: date,
    }));
    const { error } = await supabase
      .from('matrix_doses')
      .upsert(rows, { onConflict: 'matrix_treatment_id,dose_date', ignoreDuplicates: true });
    if (error) { toast.error(error.message || 'Failed to record doses'); return; }
    toast.success(`Dosed ${item.treatmentIds.length} sow${item.treatmentIds.length !== 1 ? 's' : ''} for today`);
    load();
  };

  const act = (item: TodayItem) => {
    if (item.kind === 'pregnancy_check') openPregnancyCheck(item);
    else if (item.kind === 'farrowing') openRecordLitter(item);
    else if (item.kind === 'ai_cycle') openAiDose(item);
    else if (item.kind === 'matrix_dose') doseBatch(item);
  };

  const due = (data?.items || []).filter(i => i.urgency === 'due');
  const soon = (data?.items || []).filter(i => i.urgency === 'soon');
  const s = data?.stats;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Today</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{todayLabel} · {farmName}</p>
        </header>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Loading your day…</div>
        ) : (data && data.items.length === 0) ? (
          <div className="text-center py-16 rounded-xl border bg-card">
            <CheckCircle2 className="h-12 w-12 text-ok mx-auto mb-3" />
            <p className="font-semibold">All caught up</p>
            <p className="text-sm text-muted-foreground mt-1">No checks, farrowings, or heats need attention right now.</p>
          </div>
        ) : (
          <>
            {due.length > 0 && (
              <FeedGroup color="due" label="Needs attention now" count={due.length}>
                {due.map(item => <ActionCard key={item.id} item={item} onAct={act} />)}
              </FeedGroup>
            )}
            {soon.length > 0 && (
              <FeedGroup color="soon" label="Coming up this week" count={soon.length}>
                {soon.map(item => <ActionCard key={item.id} item={item} onAct={act} />)}
              </FeedGroup>
            )}
          </>
        )}

        {/* Quick add */}
        <div className="flex flex-wrap gap-2 mt-2 mb-8">
          <QuickLink href="/sows" label="Record breeding" />
          <QuickLink href="/farrowings/active" label="Farrowing house" />
          <QuickLink href="/sows/new" label="Register sow" />
        </div>

        {/* Herd at a glance */}
        {s && (
          <>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">
              Herd at a glance
            </div>
            <div className="flex flex-wrap gap-x-7 gap-y-3 rounded-xl bg-secondary px-5 py-4">
              <Stat n={s.activeSows} label="Active sows" href="/sows" />
              <Stat n={s.bred} label="Bred" />
              <Stat n={s.pregnant} label="Pregnant" />
              <Stat n={s.farrowing} label="Farrowing" href="/farrowings/active" />
              <Stat n={s.nursing} label="Nursing" />
              <Stat n={s.nursingPiglets} label="Nursing piglets" href="/piglets/nursing" />
              <Stat n={s.openAiCycles} label="AI cycles open" />
            </div>
          </>
        )}
      </main>

      {/* Wired modals */}
      {pregCheck && (
        <PregnancyCheckModal
          sow={pregCheck.sow}
          breedingAttempt={pregCheck.breedingAttempt}
          isOpen={true}
          onClose={() => setPregCheck(null)}
          onSuccess={() => { setPregCheck(null); load(); }}
        />
      )}
      {litter && (
        <RecordLitterForm
          sowId={litter.sowId}
          sowName={litter.sowName}
          farrowingId={litter.farrowingId}
          isOpen={true}
          onClose={() => setLitter(null)}
          onSuccess={() => { setLitter(null); load(); }}
        />
      )}
      {aiDose && (
        <AIDoseModal
          breedingAttempt={aiDose.breedingAttempt}
          existingDoses={aiDose.doses}
          onClose={() => setAiDose(null)}
          onSuccess={() => { setAiDose(null); load(); }}
        />
      )}
    </div>
  );
}

function FeedGroup({ color, label, count, children }: {
  color: 'due' | 'soon'; label: string; count: number; children: React.ReactNode;
}) {
  const u = urgencyClasses(color);
  return (
    <section className="mb-7">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`h-2.5 w-2.5 rounded-full ${u.stripe}`} />
        <h2 className={`text-xs font-bold uppercase tracking-wide ${u.text}`}>{label}</h2>
        <span className="text-xs font-semibold text-muted-foreground tabular-nums">{count}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function ActionCard({ item, onAct }: { item: TodayItem; onAct: (i: TodayItem) => void }) {
  const u = urgencyClasses(item.urgency);
  const Icon = KIND_ICON[item.kind];
  const isLink = item.kind === 'heat';

  const inner = (
    <div className="flex items-center gap-3.5 rounded-xl border bg-card p-3 pr-3.5 shadow-sm">
      <span className={`self-stretch w-1 rounded-full ${u.stripe} -my-3 -ml-3 mr-1`} />
      <div className="grid place-items-center h-10 w-10 rounded-lg bg-secondary shrink-0">
        <Icon className="h-5 w-5 text-brand" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-semibold text-sm">{item.earTag}</span>
          {item.name && <span className="text-sm text-muted-foreground">· {item.name}</span>}
          <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-full ${u.pill}`}>{item.pill}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{item.meta}</div>
      </div>
      <div className="shrink-0">
        <span className="inline-flex items-center gap-1 rounded-lg bg-brand text-brand-foreground text-xs font-semibold px-3 py-2">
          {item.title}<ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  );

  if (isLink && item.href) return <Link href={item.href} className="block">{inner}</Link>;
  return <button onClick={() => onAct(item)} className="block w-full text-left">{inner}</button>;
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href}
      className="inline-flex items-center gap-2 rounded-lg border border-dashed bg-card px-3.5 py-2.5 text-sm font-semibold hover:bg-secondary transition-colors">
      <Plus className="h-4 w-4 text-brand" />{label}
    </Link>
  );
}

function Stat({ n, label, href }: { n: number; label: string; href?: string }) {
  const body = (
    <div>
      <div className="text-xl font-bold font-mono tabular-nums leading-none">{n}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mt-1">{label}</div>
    </div>
  );
  return href ? <Link href={href} className="hover:opacity-70 transition-opacity">{body}</Link> : body;
}
