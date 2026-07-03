'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/lib/organization-context';
import { fetchPipeline, STAGES, type Stage, type PipelineSow } from '@/lib/pipeline';
import { urgencyClasses, daysSince, today, toDateString } from '@/lib/format';
import { toast } from 'sonner';
import { Plus, ClipboardCheck, Baby, LogOut, Home } from 'lucide-react';
import RecordBreedingForm from '@/components/RecordBreedingForm';
import PregnancyCheckModal from '@/components/PregnancyCheckModal';
import RecordLitterForm from '@/components/RecordLitterForm';
import WeanLitterModal from '@/components/WeanLitterModal';
import AssignHousingModal from '@/components/AssignHousingModal';

// Each stage's next action on the board.
const STAGE_ACTION: Record<Stage, { label: string; icon: any } | null> = {
  open: { label: 'Breed', icon: Plus },
  bred: { label: 'Check', icon: ClipboardCheck },
  pregnant: { label: 'Move to farrowing', icon: Home },
  farrowing: { label: 'Record litter', icon: Baby },
  nursing: { label: 'Wean', icon: LogOut },
};

export default function BreedingBoardPage() {
  const { selectedOrganizationId } = useOrganization();
  const [board, setBoard] = useState<Record<Stage, PipelineSow[]> | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [breedingSow, setBreedingSow] = useState<PipelineSow | null>(null);
  const [pregCheck, setPregCheck] = useState<{ sow: any; breedingAttempt: any } | null>(null);
  const [litter, setLitter] = useState<{ sowId: string; sowName: string; farrowingId: string | null } | null>(null);
  const [wean, setWean] = useState<{ farrowingId: string; sowName: string; sowEarTag: string; actualFarrowingDate: string } | null>(null);
  const [moveSow, setMoveSow] = useState<{ id: string; ear_tag: string; name: string | null; housing_unit_id: string | null; farrowingId: string | null } | null>(null);

  const load = useCallback(async () => {
    if (!selectedOrganizationId) return;
    setLoading(true);
    try {
      setBoard(await fetchPipeline(selectedOrganizationId));
    } catch (e: any) {
      toast.error(e.message || 'Failed to load the board');
    } finally {
      setLoading(false);
    }
  }, [selectedOrganizationId]);

  useEffect(() => { load(); }, [load]);

  const total = board ? Object.values(board).reduce((n, col) => n + col.length, 0) : 0;

  // --- per-stage action handlers (reuse the hardened modals) ---
  const openCheck = async (sow: PipelineSow) => {
    if (!sow.breedingAttemptId) { toast.error('No active breeding record'); return; }
    const { data: ba, error } = await supabase.from('breeding_attempts').select('*').eq('id', sow.breedingAttemptId).single();
    if (error || !ba) { toast.error('Could not load breeding record'); return; }
    const ds = sow.breedingDate ? (daysSince(sow.breedingDate) ?? 0) : 0;
    setPregCheck({ sow: { id: sow.id, ear_tag: sow.earTag, name: sow.name }, breedingAttempt: { ...ba, days_since_breeding: ds } });
  };
  const openLitter = async (sow: PipelineSow) => {
    const { data: f } = await supabase.from('farrowings').select('id').eq('sow_id', sow.id)
      .is('actual_farrowing_date', null).order('breeding_date', { ascending: false }).limit(1).maybeSingle();
    setLitter({ sowId: sow.id, sowName: sow.name || sow.earTag, farrowingId: f?.id ?? null });
  };
  const openMove = async (sow: PipelineSow) => {
    // The pending farrowing record we'll stamp with the move date.
    const { data: f } = await supabase.from('farrowings').select('id').eq('sow_id', sow.id)
      .is('actual_farrowing_date', null).order('breeding_date', { ascending: false }).limit(1).maybeSingle();
    setMoveSow({ id: sow.id, ear_tag: sow.earTag, name: sow.name, housing_unit_id: sow.housingUnitId, farrowingId: f?.id ?? null });
  };
  const openWean = async (sow: PipelineSow) => {
    const { data: f } = await supabase.from('farrowings').select('id, actual_farrowing_date').eq('sow_id', sow.id)
      .not('actual_farrowing_date', 'is', null).is('moved_out_of_farrowing_date', null)
      .order('actual_farrowing_date', { ascending: false }).limit(1).maybeSingle();
    if (!f) { toast.error('No active litter to wean'); return; }
    setWean({ farrowingId: f.id, sowName: sow.name || sow.earTag, sowEarTag: sow.earTag, actualFarrowingDate: f.actual_farrowing_date });
  };

  const act = (sow: PipelineSow) => {
    switch (sow.stage) {
      case 'open': setBreedingSow(sow); break;
      case 'bred': openCheck(sow); break;
      case 'pregnant':
        openMove(sow);
        break;
      case 'farrowing': openLitter(sow); break;
      case 'nursing': openWean(sow); break;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <header className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight">Breeding Board</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {loading ? 'Loading…' : `${total} active sows by reproductive stage`}
          </p>
        </header>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Loading the herd…</div>
        ) : (
          <div className="flex gap-3.5 overflow-x-auto pb-4">
            {STAGES.map(col => {
              const sows = board?.[col.key] ?? [];
              return (
                <div key={col.key} className="flex-none w-[240px]">
                  <div className="flex items-center gap-2 mb-2.5 px-1">
                    <span className={`h-2 w-2 rounded-full ${col.tone}`} />
                    <span className="text-xs font-bold uppercase tracking-wide">{col.label}</span>
                    <span className="ml-auto text-xs font-semibold text-muted-foreground tabular-nums">{sows.length}</span>
                  </div>
                  <div className="space-y-2">
                    {sows.map(sow => <PipelineCard key={sow.id} sow={sow} tone={col.tone} onAct={act} />)}
                    {sows.length === 0 && (
                      <div className="text-xs text-muted-foreground/60 italic px-1 py-3">None</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Wired modals */}
      {breedingSow && (
        <RecordBreedingForm
          sow={{ id: breedingSow.id, ear_tag: breedingSow.earTag, name: breedingSow.name }}
          isOpen onClose={() => setBreedingSow(null)} onSuccess={() => { setBreedingSow(null); load(); }} />
      )}
      {pregCheck && (
        <PregnancyCheckModal sow={pregCheck.sow} breedingAttempt={pregCheck.breedingAttempt} isOpen
          onClose={() => setPregCheck(null)} onSuccess={() => { setPregCheck(null); load(); }} />
      )}
      {litter && (
        <RecordLitterForm sowId={litter.sowId} sowName={litter.sowName} farrowingId={litter.farrowingId} isOpen
          onClose={() => setLitter(null)} onSuccess={() => { setLitter(null); load(); }} />
      )}
      {wean && (
        <WeanLitterModal farrowingId={wean.farrowingId} sowName={wean.sowName} sowEarTag={wean.sowEarTag}
          actualFarrowingDate={wean.actualFarrowingDate} isOpen
          onClose={() => setWean(null)} onSuccess={() => { setWean(null); load(); }} />
      )}
      {moveSow && (
        <AssignHousingModal sow={moveSow} filterType="farrowing"
          onClose={() => setMoveSow(null)}
          onSuccess={async () => {
            // Stamp the farrowing record so she advances to the Farrowing column.
            if (moveSow.farrowingId) {
              await supabase.from('farrowings')
                .update({ moved_to_farrowing_date: toDateString(today()) })
                .eq('id', moveSow.farrowingId);
            }
            setMoveSow(null);
            load();
          }} />
      )}
    </div>
  );
}

function PipelineCard({ sow, tone, onAct }: { sow: PipelineSow; tone: string; onAct: (s: PipelineSow) => void }) {
  const u = sow.urgency ? urgencyClasses(sow.urgency) : null;
  const action = STAGE_ACTION[sow.stage];
  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow" style={{ borderLeftWidth: 3 }}>
      <Link href={`/sows/${sow.id}`} className="block">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-[13px]">{sow.earTag}</span>
          {sow.name && <span className="text-[13px] text-muted-foreground truncate">· {sow.name}</span>}
          {sow.isGilt && <span className="ml-auto text-[10px] font-semibold text-muted-foreground uppercase">gilt</span>}
        </div>
        <div className={`text-[11.5px] mt-1 ${u ? u.text : 'text-muted-foreground'}`}>{sow.meta}</div>
        {sow.progress !== null && (
          <div className="h-1 rounded-full bg-secondary mt-2 overflow-hidden">
            <div className={`h-full rounded-full ${tone}`} style={{ width: `${sow.progress}%` }} />
          </div>
        )}
      </Link>
      {action && (
        <button
          onClick={() => onAct(sow)}
          className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-brand text-brand-foreground text-xs font-semibold py-1.5 hover:bg-brand/90 transition-colors"
        >
          <action.icon className="h-3.5 w-3.5" /> {action.label}
        </button>
      )}
    </div>
  );
}
