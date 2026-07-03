'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useOrganization } from '@/lib/organization-context';
import { fetchPipeline, STAGES, type Stage, type PipelineSow } from '@/lib/pipeline';
import { urgencyClasses } from '@/lib/format';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import RecordBreedingForm from '@/components/RecordBreedingForm';

export default function BreedingBoardPage() {
  const { selectedOrganizationId } = useOrganization();
  const [board, setBoard] = useState<Record<Stage, PipelineSow[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [breedingSow, setBreedingSow] = useState<PipelineSow | null>(null);

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
                    {sows.map(sow => <PipelineCard key={sow.id} sow={sow} tone={col.tone} onBreed={setBreedingSow} />)}
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

      {breedingSow && (
        <RecordBreedingForm
          sow={{ id: breedingSow.id, ear_tag: breedingSow.earTag, name: breedingSow.name }}
          isOpen={true}
          onClose={() => setBreedingSow(null)}
          onSuccess={() => { setBreedingSow(null); load(); }}
        />
      )}
    </div>
  );
}

function PipelineCard({ sow, tone, onBreed }: { sow: PipelineSow; tone: string; onBreed: (s: PipelineSow) => void }) {
  const u = sow.urgency ? urgencyClasses(sow.urgency) : null;
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
      {sow.stage === 'open' && (
        <button
          onClick={() => onBreed(sow)}
          className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-brand text-brand-foreground text-xs font-semibold py-1.5 hover:bg-brand/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Breed
        </button>
      )}
    </div>
  );
}
