'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/lib/organization-context';
import { useSettings } from '@/lib/settings-context';
import { fetchNursery, pigLabel, CLASSIFICATIONS, type Classification, type NurseryPig } from '@/lib/nursery';
import { toast } from 'sonner';
import { ArrowLeftRight, DollarSign, Star, MoreVertical, Ban, Skull, FileText } from 'lucide-react';
import ClassifyPigletModal from '@/components/ClassifyPigletModal';
import SellPigletModal from '@/components/SellPigletModal';
import PromoteToBreederModal from '@/components/PromoteToBreederModal';
import PigletOutcomeModal from '@/components/PigletOutcomeModal';
import PedigreeCertificate from '@/components/PedigreeCertificate';

const COLS_KEY = 'nursery-visible-classes';
const ALL_VISIBLE: Record<Classification, boolean> = {
  undecided: true, show: true, feeder: true, breeder: true, market: true,
};

// The primary "next step" per lane.
type ActionKind = 'classify' | 'sell' | 'promote' | 'cull' | 'died' | 'pedigree';
const PRIMARY: Record<Classification, { label: string; icon: any; kind: ActionKind }> = {
  undecided: { label: 'Sort', icon: ArrowLeftRight, kind: 'classify' },
  show: { label: 'Sell', icon: DollarSign, kind: 'sell' },
  feeder: { label: 'Sell', icon: DollarSign, kind: 'sell' },
  market: { label: 'Sell', icon: DollarSign, kind: 'sell' },
  breeder: { label: 'Keep as breeder', icon: Star, kind: 'promote' },
};

// Every card can reach every outcome through the "more" menu.
const MENU: { label: string; kind: ActionKind; icon: any }[] = [
  { label: 'Sort', kind: 'classify', icon: ArrowLeftRight },
  { label: 'Sell', kind: 'sell', icon: DollarSign },
  { label: 'Keep as breeder', kind: 'promote', icon: Star },
  { label: 'Cull', kind: 'cull', icon: Ban },
  { label: 'Died', kind: 'died', icon: Skull },
  { label: 'View Pedigree', kind: 'pedigree', icon: FileText },
];

export default function NurseryPage() {
  const { selectedOrganizationId } = useOrganization();
  const { settings } = useSettings();
  const wu = settings?.weight_unit || 'lb';
  const [board, setBoard] = useState<Record<Classification, NurseryPig[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState<Record<Classification, boolean>>(ALL_VISIBLE);
  const [menuId, setMenuId] = useState<string | null>(null);

  // Active modal (only one at a time).
  const [modal, setModal] = useState<{ kind: ActionKind; pig: NurseryPig } | null>(null);

  const load = useCallback(async () => {
    if (!selectedOrganizationId) { setLoading(false); return; }
    setLoading(true);
    try {
      setBoard(await fetchNursery(selectedOrganizationId));
    } catch (e: any) {
      toast.error(e.message || 'Failed to load the nursery');
    } finally {
      setLoading(false);
    }
  }, [selectedOrganizationId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLS_KEY);
      if (raw) setVisible({ ...ALL_VISIBLE, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(COLS_KEY, JSON.stringify(visible)); } catch { /* ignore */ }
  }, [visible]);

  const toggleCol = (k: Classification) => setVisible(v => ({ ...v, [k]: !v[k] }));
  const showAllCols = () => setVisible(ALL_VISIBLE);
  const allVisible = CLASSIFICATIONS.every(c => visible[c.key]);
  const anyVisible = CLASSIFICATIONS.some(c => visible[c.key]);
  const shown = CLASSIFICATIONS.filter(c => visible[c.key]);

  const total = board ? Object.values(board).reduce((n, col) => n + col.length, 0) : 0;

  const openAction = (pig: NurseryPig, kind: ActionKind) => { setMenuId(null); setModal({ kind, pig }); };
  const done = () => { setModal(null); load(); };

  return (
    <div className="min-h-screen bg-background" onClick={() => setMenuId(null)}>
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <header className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight">Nursery</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {loading ? 'Loading…' : `${total} weaned pig${total !== 1 ? 's' : ''} growing — sort, sell, or keep as breeders`}
          </p>
        </header>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Loading the nursery…</div>
        ) : (
          <>
            {/* Column filter — same mobile-friendly pattern as the Breeding Board. */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button onClick={showAllCols} aria-pressed={allVisible}
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  allVisible ? 'bg-brand text-brand-foreground border-brand' : 'bg-card text-muted-foreground border-border hover:border-muted-foreground'
                }`}>All</button>
              {CLASSIFICATIONS.map(c => {
                const n = board?.[c.key]?.length ?? 0;
                const on = visible[c.key];
                return (
                  <button key={c.key} onClick={() => toggleCol(c.key)} aria-pressed={on}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      on ? 'bg-brand text-brand-foreground border-brand' : 'bg-card text-muted-foreground border-border hover:border-muted-foreground'
                    }`}>
                    <span className={`h-2 w-2 rounded-full ${c.tone} ${on ? '' : 'opacity-40'}`} />
                    {c.label}
                    <span className="tabular-nums opacity-70">{n}</span>
                  </button>
                );
              })}
            </div>

            {!anyVisible ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                No lanes selected — tap a category above to show it.
              </div>
            ) : total === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                No pigs in the nursery. Weaned litters land here to be sorted.
              </div>
            ) : (
              <div className="flex gap-3.5 overflow-x-auto pb-4">
                {shown.map(col => {
                  const pigs = board?.[col.key] ?? [];
                  return (
                    <div key={col.key} className="flex-1 min-w-[240px] max-w-[400px]">
                      <div className="flex items-center gap-2 mb-2.5 px-1">
                        <span className={`h-2 w-2 rounded-full ${col.tone}`} />
                        <span className="text-xs font-bold uppercase tracking-wide">{col.label}</span>
                        <span className="ml-auto text-xs font-semibold text-muted-foreground tabular-nums">{pigs.length}</span>
                      </div>
                      <div className="space-y-2">
                        {pigs.map(pig => (
                          <NurseryCard
                            key={pig.id}
                            pig={pig}
                            tone={col.tone}
                            wu={wu}
                            menuOpen={menuId === pig.id}
                            onToggleMenu={() => setMenuId(id => (id === pig.id ? null : pig.id))}
                            onAction={openAction}
                          />
                        ))}
                        {pigs.length === 0 && (
                          <div className="text-xs text-muted-foreground/60 italic px-1 py-3">None</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {modal?.kind === 'classify' && (
        <ClassifyPigletModal pigId={modal.pig.id} label={pigLabel(modal.pig)} current={modal.pig.classification}
          onClose={() => setModal(null)} onSuccess={done} />
      )}
      {modal?.kind === 'sell' && (
        <SellPigletModal pigId={modal.pig.id} label={pigLabel(modal.pig)} onClose={() => setModal(null)} onSuccess={done} />
      )}
      {modal?.kind === 'promote' && (
        <PromoteToBreederModal pigId={modal.pig.id} label={pigLabel(modal.pig)} onClose={() => setModal(null)} onSuccess={done} />
      )}
      {(modal?.kind === 'cull' || modal?.kind === 'died') && (
        <PigletOutcomeModal pigId={modal.pig.id} label={pigLabel(modal.pig)}
          kind={modal.kind === 'cull' ? 'culled' : 'died'}
          onClose={() => setModal(null)} onSuccess={done} />
      )}
      {modal?.kind === 'pedigree' && (
        <PedigreeCertificate animalType="piglet" animalId={modal.pig.id} isOpen onClose={() => setModal(null)} />
      )}
    </div>
  );
}

function SexBadge({ sex }: { sex: string | null }) {
  if (sex === 'male') return <span className="text-[10px] font-bold text-info">♂</span>;
  if (sex === 'female') return <span className="text-[10px] font-bold text-due">♀</span>;
  return <span className="text-[10px] font-bold text-muted-foreground">?</span>;
}

function NurseryCard({ pig, tone, wu, menuOpen, onToggleMenu, onAction }: {
  pig: NurseryPig; tone: string; wu: string;
  menuOpen: boolean; onToggleMenu: () => void;
  onAction: (pig: NurseryPig, kind: ActionKind) => void;
}) {
  const primary = PRIMARY[pig.classification];
  const dam = pig.damName || pig.damTag;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow" style={{ borderLeftWidth: 3 }}>
      <div className="flex items-center gap-2">
        <span className="font-mono font-semibold text-[13px]">{pigLabel(pig)}</span>
        <SexBadge sex={pig.sex} />
        <div className="ml-auto relative">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleMenu(); }}
            className="text-muted-foreground hover:text-foreground p-0.5 -mr-1"
            aria-label="More actions"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-6 z-10 w-44 rounded-md border bg-card shadow-lg py-1"
            >
              {MENU.map(m => (
                <button
                  key={m.kind}
                  onClick={() => onAction(pig, m.kind)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-secondary text-foreground"
                >
                  <m.icon className="h-3.5 w-3.5 text-muted-foreground" /> {m.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="text-[11.5px] mt-1 text-muted-foreground">
        {pig.ageDays != null ? `${pig.ageDays}d old` : 'age n/a'}
        {pig.weaningWeight != null ? ` · wean ${pig.weaningWeight} ${wu}` : ''}
      </div>
      {dam && <div className="text-[11px] text-muted-foreground/80 mt-0.5">Dam {dam}</div>}
      {primary && (
        <button
          onClick={() => onAction(pig, primary.kind)}
          className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-brand text-brand-foreground text-xs font-semibold py-1.5 hover:bg-brand/90 transition-colors"
        >
          <primary.icon className="h-3.5 w-3.5" /> {primary.label}
        </button>
      )}
    </div>
  );
}
