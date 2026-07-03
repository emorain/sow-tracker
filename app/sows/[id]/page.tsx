'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/lib/organization-context';
import { deriveStage } from '@/lib/pipeline';
import { formatDate, formatDateShort, calculateAge, daysSince, urgencyClasses } from '@/lib/format';
import { toast } from 'sonner';
import { ArrowLeft, ClipboardCheck, Baby, Pencil, Trash2, Camera, Plus, FlaskConical, X, HeartOff, RotateCcw, FileText, Scale } from 'lucide-react';
import PedigreeCertificate from '@/components/PedigreeCertificate';
import WeighInModal from '@/components/WeighInModal';
import { confirmDialog } from '@/components/confirm';
import PregnancyCheckModal from '@/components/PregnancyCheckModal';
import RecordLitterForm from '@/components/RecordLitterForm';
import EditSowModal from '@/components/EditSowModal';
import { EditBreedingModal } from '@/components/EditBreedingModal';
import EditFarrowingModal from '@/components/EditFarrowingModal';
import { AIDoseModal } from '@/components/AIDoseModal';
import { HealthEventModal } from '@/components/HealthEventModal';

type Tab = 'overview' | 'breeding' | 'farrowings' | 'health' | 'matrix';

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Overview', breeding: 'Breeding', farrowings: 'Farrowings', health: 'Health', matrix: 'Estrus Sync',
};

export default function SowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { selectedOrganizationId } = useOrganization();
  const fileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>('overview');
  const [sow, setSow] = useState<any>(null);
  const [breedings, setBreedings] = useState<any[]>([]);
  const [dosesByAttempt, setDosesByAttempt] = useState<Record<string, any[]>>({});
  const [farrowings, setFarrowings] = useState<any[]>([]);
  const [health, setHealth] = useState<any[]>([]);
  const [matrix, setMatrix] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Modal state
  const [pregCheck, setPregCheck] = useState<any>(null);
  const [litter, setLitter] = useState<{ farrowingId: string | null } | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editBreeding, setEditBreeding] = useState<any>(null);
  const [aiDose, setAiDose] = useState<{ breedingAttempt: any; doses: any[] } | null>(null);
  const [editFarrowing, setEditFarrowing] = useState<any>(null);
  const [showHealthAdd, setShowHealthAdd] = useState(false);
  const [showPedigree, setShowPedigree] = useState(false);
  const [showWeigh, setShowWeigh] = useState(false);

  const load = useCallback(async () => {
    if (!selectedOrganizationId || !id) { setLoading(false); return; }
    setLoading(true);
    try {
      const [sowRes, brRes, faRes, heRes, mxRes, regRes] = await Promise.all([
        supabase.from('sow_list_view').select('*').eq('id', id).eq('organization_id', selectedOrganizationId).maybeSingle(),
        supabase.from('breeding_attempts').select('*').eq('sow_id', id).order('breeding_date', { ascending: false }),
        supabase.from('farrowings').select('*').eq('sow_id', id).order('breeding_date', { ascending: false }),
        supabase.from('health_records').select('*').eq('sow_id', id).order('record_date', { ascending: false }),
        supabase.from('matrix_treatments').select('*').eq('sow_id', id).order('treatment_start_date', { ascending: false }),
        // registration_status isn't in sow_list_view, so fetch it from the table.
        supabase.from('sows').select('registration_status').eq('id', id).maybeSingle(),
      ]);
      // Stamp moved_to_farrowing_date (pending) and the active litter's live
      // count so the stage pill/next-step matches the Breeding Board
      // (sow_list_view carries neither field).
      const pendingFarrowing = (faRes.data || []).find(
        (f: any) => !f.actual_farrowing_date && !f.moved_out_of_farrowing_date,
      );
      const activeFarrowing = (faRes.data || []).find(
        (f: any) => f.actual_farrowing_date && !f.moved_out_of_farrowing_date,
      );
      const sowRow = sowRes.data
        ? {
            ...sowRes.data,
            moved_to_farrowing_date: pendingFarrowing?.moved_to_farrowing_date ?? null,
            active_farrowing_live_piglets: activeFarrowing ? activeFarrowing.live_piglets ?? 0 : null,
            registration_status: regRes.data?.registration_status ?? 'unregistered',
          }
        : sowRes.data;
      setSow(sowRow);
      setBreedings(brRes.data || []);
      setFarrowings(faRes.data || []);
      setHealth(heRes.data || []);
      setMatrix(mxRes.data || []);

      const attemptIds = (brRes.data || []).map(b => b.id);
      if (attemptIds.length) {
        const { data: doses } = await supabase.from('ai_doses').select('*').in('breeding_attempt_id', attemptIds).order('dose_number');
        const map: Record<string, any[]> = {};
        (doses || []).forEach(d => { (map[d.breeding_attempt_id] ||= []).push(d); });
        setDosesByAttempt(map);
      } else setDosesByAttempt({});
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
    const { data: ba, error } = await supabase.from('breeding_attempts').select('*').eq('id', sow.current_breeding_attempt_id).single();
    if (error || !ba) { toast.error('Could not load breeding record'); return; }
    const ds = sow.current_breeding_date ? (daysSince(sow.current_breeding_date) ?? 0) : 0;
    setPregCheck({ sow: { id: sow.id, ear_tag: sow.ear_tag, name: sow.name }, breedingAttempt: { ...ba, days_since_breeding: ds } });
  };
  const openLitter = async () => {
    const { data: f } = await supabase.from('farrowings').select('id').eq('sow_id', sow.id).is('actual_farrowing_date', null).order('breeding_date', { ascending: false }).limit(1).maybeSingle();
    setLitter({ farrowingId: f?.id ?? null });
  };
  const openDose = (b: any) => setAiDose({ breedingAttempt: b, doses: dosesByAttempt[b.id] || [] });

  const hasHistory = breedings.length > 0 || farrowings.length > 0;

  const handleDelete = async () => {
    // Animals with history are retired, not deleted — pedigree must survive.
    if (hasHistory) {
      toast.error('This sow has breeding/farrowing history. Use "Mark deceased" to retire her and keep the records.');
      return;
    }
    if (!(await confirmDialog({ title: 'Delete sow', message: `Delete ${sow.name || sow.ear_tag}? Use this only for a record created by mistake — it can't be undone.`, danger: true, confirmLabel: 'Delete' }))) return;
    const { error } = await supabase.rpc('delete_sow_cascade', { p_sow_id: sow.id, p_organization_id: selectedOrganizationId });
    if (error) { toast.error(error.message || 'Failed to delete'); return; }
    toast.success('Sow deleted');
    router.push('/breeding-board');
  };

  const toggleDeceased = async () => {
    const deceased = sow.status === 'deceased';
    const next = deceased ? 'active' : 'deceased';
    if (!deceased && !(await confirmDialog({
      title: 'Mark deceased',
      message: `Mark ${sow.name || sow.ear_tag} as deceased? Her records and pedigree stay intact — she just leaves the active herd. You can reactivate her later.`,
      confirmLabel: 'Mark deceased',
    }))) return;
    const { error } = await supabase.from('sows').update({ status: next }).eq('id', sow.id).eq('organization_id', selectedOrganizationId!);
    if (error) { toast.error(error.message || 'Failed to update'); return; }
    toast.success(deceased ? `${sow.name || sow.ear_tag} reactivated` : `${sow.name || sow.ear_tag} marked deceased`);
    load();
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${sow.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('sow-photos').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('sow-photos').getPublicUrl(path);
      const { error: updErr } = await supabase.from('sows').update({ photo_url: publicUrl }).eq('id', sow.id);
      if (updErr) throw updErr;
      toast.success('Photo updated');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removePhoto = async () => {
    if (!(await confirmDialog({ message: 'Remove this photo?', danger: true, confirmLabel: 'Remove' }))) return;
    const { error } = await supabase.from('sows').update({ photo_url: null }).eq('id', sow.id);
    if (error) { toast.error(error.message || 'Failed to remove photo'); return; }
    toast.success('Photo removed');
    load();
  };

  const deleteFarrowing = async (fid: string) => {
    if (!(await confirmDialog({ message: 'Delete this farrowing record? Piglet records for this litter will remain unless removed separately.', danger: true, confirmLabel: 'Delete' }))) return;
    const { error } = await supabase.from('farrowings').delete().eq('id', fid).eq('organization_id', selectedOrganizationId!);
    if (error) { toast.error(error.message || 'Failed to delete'); return; }
    toast.success('Farrowing deleted');
    load();
  };
  const deleteHealth = async (hid: string) => {
    if (!(await confirmDialog({ message: 'Delete this health record?', danger: true, confirmLabel: 'Delete' }))) return;
    const { error } = await supabase.from('health_records').delete().eq('id', hid).eq('organization_id', selectedOrganizationId!);
    if (error) { toast.error(error.message || 'Failed to delete'); return; }
    toast.success('Health record deleted');
    load();
  };

  const nextStep = getNextStep(staged.stage, sow, openCheck, openLitter);

  return (
    <Shell>
      {/* Header */}
      <div className="flex items-start gap-4 mb-1">
        <div className="relative shrink-0">
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="relative grid place-items-center h-14 w-14 rounded-2xl bg-secondary text-2xl overflow-hidden group"
            title="Change photo">
            {sow.photo_url ? <img src={sow.photo_url} alt="" className="h-full w-full object-cover" /> : '🐖'}
            <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 grid place-items-center transition-opacity">
              <Camera className="h-4 w-4 text-white" />
            </span>
          </button>
          {sow.photo_url && (
            <button onClick={removePhoto} title="Remove photo"
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-due text-white grid place-items-center shadow">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2 flex-wrap">
            <span className="font-mono">{sow.ear_tag}</span>
            {sow.name && <span className="text-muted-foreground font-normal">· {sow.name}</span>}
          </h1>
          <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-[13px] text-muted-foreground mt-1">
            {sow.breed && <span>{sow.breed}</span>}
            {sow.birth_date && <span>· {calculateAge(sow.birth_date)}</span>}
            {sow.status === 'deceased'
              ? <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-muted text-muted-foreground">Deceased</span>
              : <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${stageU.pill}`}>{staged.meta}</span>}
            {(sow.right_ear_notch || sow.left_ear_notch) && (
              <span className="font-mono">Notch R{sow.right_ear_notch ?? '—'}/L{sow.left_ear_notch ?? '—'}</span>
            )}
            {sow.registration_status === 'registered' && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-ok-bg text-ok">Registered</span>
            )}
            {sow.registration_status === 'pending' && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-soon-bg text-soon">Reg. pending</span>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setShowEdit(true)} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-secondary">
            <Pencil className="h-3.5 w-3.5" /><span className="hidden sm:inline">Edit</span>
          </button>
          <button onClick={() => setShowWeigh(true)} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-secondary">
            <Scale className="h-3.5 w-3.5" /><span className="hidden sm:inline">Weigh</span>
          </button>
          <button onClick={() => setShowPedigree(true)} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-secondary">
            <FileText className="h-3.5 w-3.5" /><span className="hidden sm:inline">Pedigree</span>
          </button>
          <button onClick={toggleDeceased} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-secondary">
            {sow.status === 'deceased'
              ? <><RotateCcw className="h-3.5 w-3.5" /><span className="hidden sm:inline">Reactivate</span></>
              : <><HeartOff className="h-3.5 w-3.5" /><span className="hidden sm:inline">Mark deceased</span></>}
          </button>
          {/* Delete stays for mistakes only; it's blocked (UI + DB) once she has history. */}
          {!hasHistory && (
            <button onClick={handleDelete} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold text-due hover:bg-due-bg">
              <Trash2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b mt-5 mb-5 overflow-x-auto">
        {(['overview', 'breeding', 'farrowings', 'health', 'matrix'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-[13.5px] font-semibold px-4 py-2.5 border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === t ? 'text-brand border-brand' : 'text-muted-foreground border-transparent hover:text-foreground'}`}>
            {TAB_LABELS[t]}
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
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand text-brand-foreground text-xs font-semibold px-3.5 py-2 shrink-0">
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
              note={dosesNote(b, dosesByAttempt[b.id])}
              actions={
                <>
                  {b.breeding_method === 'ai' && (
                    <RowBtn onClick={() => openDose(b)} icon={FlaskConical} label="Dose" />
                  )}
                  <RowBtn onClick={() => setEditBreeding(b)} icon={Pencil} label="Edit" />
                </>
              } />
          ))}
        </Timeline>
      )}

      {tab === 'farrowings' && (
        <div>
          {(() => {
            const recorded = farrowings.filter(f => f.actual_farrowing_date);
            if (recorded.length === 0) return null;
            const totLive = recorded.reduce((s, f) => s + (f.live_piglets || 0), 0);
            const totStill = recorded.reduce((s, f) => s + (f.stillborn || 0), 0);
            const totMum = recorded.reduce((s, f) => s + (f.mummified || 0), 0);
            const avg = (totLive / recorded.length).toFixed(1);
            return (
              <div className="flex flex-wrap gap-x-7 gap-y-3 rounded-xl bg-secondary px-5 py-3.5 mb-4">
                {[['Litters', recorded.length], ['Total live', totLive], ['Avg litter', avg], ['Stillborn', totStill], ['Mummified', totMum]].map(([label, val]) => (
                  <div key={label as string}>
                    <div className="text-lg font-bold font-mono tabular-nums leading-none">{val}</div>
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mt-1">{label}</div>
                  </div>
                ))}
              </div>
            );
          })()}
          <div className="flex justify-end mb-3">
            <button onClick={openLitter} className="inline-flex items-center gap-1.5 rounded-lg bg-brand text-brand-foreground text-xs font-semibold px-3.5 py-2">
              <Baby className="h-3.5 w-3.5" /> Record litter
            </button>
          </div>
          <Timeline empty="No farrowings recorded yet.">
            {farrowings.filter(f => f.actual_farrowing_date).map(f => (
              <TL key={f.id}
                when={formatDate(f.actual_farrowing_date)}
                what={`${f.live_piglets ?? 0} live · ${f.stillborn ?? 0} stillborn · ${f.mummified ?? 0} mummified`}
                note={f.moved_out_of_farrowing_date ? `Weaned ${formatDate(f.moved_out_of_farrowing_date)}` : 'Currently nursing'}
                actions={
                  <>
                    <RowBtn onClick={() => setEditFarrowing(f)} icon={Pencil} label="Edit" />
                    <RowBtn onClick={() => deleteFarrowing(f.id)} icon={Trash2} label="Delete" danger />
                  </>
                } />
            ))}
          </Timeline>
        </div>
      )}

      {tab === 'health' && (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => setShowHealthAdd(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand text-brand-foreground text-xs font-semibold px-3.5 py-2">
              <Plus className="h-3.5 w-3.5" /> Add record
            </button>
          </div>
          <Timeline empty="No health records yet.">
            {health.map(h => (
              <TL key={h.id}
                when={`${formatDate(h.record_date)}${h.record_type ? ' · ' + h.record_type : ''}`}
                what={h.title || h.record_type || 'Health record'}
                note={[
                  h.description,
                  h.dosage && `Dose: ${h.dosage}`,
                  h.administered_by && `By: ${h.administered_by}`,
                  h.veterinarian && `Vet: ${h.veterinarian}`,
                  h.cost && `Cost: ${h.cost}`,
                  h.next_due_date && `Next due: ${formatDateShort(h.next_due_date)}`,
                ].filter(Boolean).join(' · ')}
                actions={<RowBtn onClick={() => deleteHealth(h.id)} icon={Trash2} label="Delete" danger />} />
            ))}
          </Timeline>
        </div>
      )}

      {tab === 'matrix' && (
        <Timeline empty="No estrus synchronization records for this sow.">
          {matrix.map(m => (
            <TL key={m.id}
              when={`${formatDate(m.treatment_start_date || m.administration_date)}${m.batch_name ? ' · ' + m.batch_name : ''}`}
              what={m.bred ? `Bred ${m.breeding_date ? formatDateShort(m.breeding_date) : ''}`.trim()
                : m.actual_heat_date ? `In heat ${formatDateShort(m.actual_heat_date)}`
                : m.expected_heat_date ? `Expected heat ${formatDateShort(m.expected_heat_date)}` : 'Treatment recorded'}
              note={[
                m.treatment_duration_days && `${m.treatment_duration_days}-day treatment`,
                m.treatment_end_date && `ends ${formatDateShort(m.treatment_end_date)}`,
                m.dosage && `dose ${m.dosage}`,
                m.lot_number && `lot ${m.lot_number}`,
                m.notes,
              ].filter(Boolean).join(' · ')} />
          ))}
        </Timeline>
      )}

      {/* Modals */}
      {pregCheck && <PregnancyCheckModal sow={pregCheck.sow} breedingAttempt={pregCheck.breedingAttempt} isOpen onClose={() => setPregCheck(null)} onSuccess={() => { setPregCheck(null); load(); }} />}
      {litter && <RecordLitterForm sowId={sow.id} sowName={sow.name || sow.ear_tag} farrowingId={litter.farrowingId} isOpen onClose={() => setLitter(null)} onSuccess={() => { setLitter(null); load(); }} />}
      {showEdit && <EditSowModal sow={sow} onClose={() => setShowEdit(false)} onSuccess={() => { setShowEdit(false); load(); }} />}
      {showPedigree && <PedigreeCertificate animalType="sow" animalId={sow.id} isOpen onClose={() => setShowPedigree(false)} />}
      {showWeigh && <WeighInModal animalType="sow" animalId={sow.id} label={sow.ear_tag} birthDate={sow.birth_date} onClose={() => setShowWeigh(false)} />}
      {editBreeding && <EditBreedingModal breeding={editBreeding} onClose={() => setEditBreeding(null)} onSuccess={() => { setEditBreeding(null); load(); }} />}
      {aiDose && <AIDoseModal breedingAttempt={aiDose.breedingAttempt} existingDoses={aiDose.doses} onClose={() => setAiDose(null)} onSuccess={() => { setAiDose(null); load(); }} />}
      {editFarrowing && (
        <EditFarrowingModal isOpen farrowingId={editFarrowing.id} sowName={sow.name || sow.ear_tag}
          initialData={{
            actual_farrowing_date: editFarrowing.actual_farrowing_date || '',
            live_piglets: editFarrowing.live_piglets || 0,
            stillborn: editFarrowing.stillborn || 0,
            mummified: editFarrowing.mummified || 0,
            notes: editFarrowing.notes,
          }}
          onClose={() => setEditFarrowing(null)} onSuccess={() => { setEditFarrowing(null); load(); }} />
      )}
      {showHealthAdd && <HealthEventModal animalType="sow" animalId={sow.id} animalName={sow.name || sow.ear_tag} onClose={() => setShowHealthAdd(false)} onSuccess={() => { setShowHealthAdd(false); load(); }} />}
    </Shell>
  );
}

function getNextStep(stage: string, sow: any, openCheck: () => void, openLitter: () => void) {
  if (stage === 'bred') {
    const ds = daysSince(sow.current_breeding_date) ?? 0;
    if (ds >= 18) return { text: `Pregnancy check is due (bred ${ds} days ago). Confirm pregnant or mark returned to heat.`, action: { label: 'Pregnancy check', icon: ClipboardCheck, onClick: openCheck } };
    return { text: `Bred ${ds} days ago — pregnancy check opens around day 18.`, action: null };
  }
  if (stage === 'pregnant') return { text: 'Pregnant — move her to the farrowing house when it\'s time.', action: null };
  if (stage === 'farrowing') return { text: 'In the farrowing house — record the litter when she farrows.', action: { label: 'Record litter', icon: Baby, onClick: openLitter } };
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

/* ---- presentational ---- */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Link href="/breeding-board" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Breeding Board
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
  const arr = Array.isArray(children) ? children.flat() : [children];
  const hasContent = arr.some(Boolean);
  if (!hasContent) return <div className="text-sm text-muted-foreground py-8 text-center">{empty}</div>;
  return <div className="pl-1">{children}</div>;
}
function TL({ when, what, note, actions }: { when: string; what: string; note?: string; actions?: React.ReactNode }) {
  return (
    <div className="relative pl-5 pb-4 border-l-2 border-border last:border-transparent">
      <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-background" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wide">{when}</div>
          <div className="text-sm font-semibold mt-0.5">{what}</div>
          {note && <div className="text-[12.5px] text-muted-foreground">{note}</div>}
        </div>
        {actions && <div className="flex gap-1.5 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
function RowBtn({ onClick, icon: Icon, label, danger }: { onClick: () => void; icon: any; label: string; danger?: boolean }) {
  return (
    <button onClick={onClick} title={label}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold hover:bg-secondary ${danger ? 'text-due hover:bg-due-bg' : 'text-muted-foreground'}`}>
      <Icon className="h-3 w-3" />
    </button>
  );
}
