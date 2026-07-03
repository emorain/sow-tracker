/**
 * Pipeline board — every active sow placed in its reproductive stage, derived
 * from sow_list_view. One board replaces the scattered /breeding,
 * /breeding/bred-sows, and /farrowings/active pages.
 */
import { supabase } from "@/lib/supabase";
import {
  daysSince,
  daysUntil,
  expectedFarrowingDate,
  formatDateShort,
  toDateString,
  GESTATION_DAYS,
  type Urgency,
} from "@/lib/format";

export type Stage = "open" | "bred" | "pregnant" | "farrowing" | "nursing";

export const STAGES: { key: Stage; label: string; tone: string }[] = [
  { key: "open", label: "Open", tone: "bg-muted-foreground/50" },
  { key: "bred", label: "Bred", tone: "bg-info" },
  { key: "pregnant", label: "Pregnant", tone: "bg-ok" },
  { key: "farrowing", label: "Farrowing", tone: "bg-due" },
  { key: "nursing", label: "Nursing", tone: "bg-soon" },
];

export interface PipelineSow {
  id: string;
  earTag: string;
  name: string | null;
  stage: Stage;
  meta: string;
  progress: number | null; // 0-100 gestation, else null
  urgency: Urgency | null;
  isGilt: boolean;
  breedingAttemptId: string | null;
  breedingDate: string | null;
  housingUnitId: string | null;
  housingUnitType: string | null;
  // Farrowed but no surviving piglets — she's still in the crate with nothing to
  // nurse, so she sits in Farrowing with a "move out" action instead of "wean".
  awaitingMoveOut: boolean;
}

export function deriveStage(row: any): { stage: Stage; sow: PipelineSow } {
  const bredDate: string | null = row.current_breeding_date ?? null;
  const confirmed = row.pregnancy_confirmed; // true | false | null
  const hasActiveFarrowing = !!row.has_active_farrowing;
  // Explicit "moved to the farrowing house" event (a farrowing row with a
  // moved_to_farrowing_date), NOT the sow's current housing — a sow may already
  // sit in a farrowing pen without having been moved there to farrow.
  const movedToFarrowing = !!row.moved_to_farrowing_date;
  const isGilt = (row.farrowing_count || 0) === 0;

  let stage: Stage = "open";
  let meta = isGilt ? "Gilt · not yet bred" : "Ready to breed";
  let progress: number | null = null;
  let urgency: Urgency | null = null;
  let awaitingMoveOut = false;

  if (hasActiveFarrowing) {
    // Litter recorded (actual_farrowing_date set). With live piglets she's
    // nursing; with none surviving there's nothing to nurse, so she stays in
    // the farrowing house until moved out. Either way the Farrowing column's
    // "Record litter" action never lingers after farrowing.
    const d = daysSince(row.active_farrowing_date) ?? 0;
    const live = row.active_farrowing_live_piglets;
    if (typeof live === "number" && live <= 0) {
      stage = "farrowing";
      awaitingMoveOut = true;
      meta = "No live piglets · move her out";
      urgency = "soon";
    } else {
      stage = "nursing";
      meta = d === 0 ? "Farrowed today" : `Day ${d} nursing`;
      if (d >= 18) urgency = "soon"; // approaching wean
    }
  } else if (confirmed === true && movedToFarrowing) {
    // Confirmed pregnant AND explicitly moved to the farrowing house, awaiting
    // birth. She's in the Farrowing column even before the litter is recorded.
    stage = "farrowing";
    const exp = expectedFarrowingDate(bredDate);
    const ds = daysSince(bredDate) ?? 0;
    const du = exp ? daysUntil(toDateString(exp)) : null;
    progress = Math.min(100, Math.round((ds / GESTATION_DAYS) * 100));
    meta = exp ? `In farrowing house · due ${formatDateShort(exp)}` : "In farrowing house";
    if (du !== null && du <= 0) urgency = "due";
    else if (du !== null && du <= 5) urgency = "soon";
  } else if (bredDate && confirmed === true) {
    stage = "pregnant";
    const exp = expectedFarrowingDate(bredDate);
    const ds = daysSince(bredDate) ?? 0;
    const du = exp ? daysUntil(toDateString(exp)) : null;
    progress = Math.min(100, Math.round((ds / GESTATION_DAYS) * 100));
    meta = exp ? `Day ${ds} · due ${formatDateShort(exp)}` : `Day ${ds}`;
    // Approaching the date — time to move her to the farrowing house.
    if (du !== null && du <= 7) urgency = "soon";
  } else if (bredDate && confirmed !== false) {
    stage = "bred";
    const ds = daysSince(bredDate) ?? 0;
    progress = Math.min(100, Math.round((ds / GESTATION_DAYS) * 100));
    if (ds >= 21) { meta = `Day ${ds} · check overdue`; urgency = "due"; }
    else if (ds >= 18) { meta = `Day ${ds} · check due`; urgency = "due"; }
    else { meta = `Bred ${formatDateShort(bredDate)}`; }
  } else if (bredDate && confirmed === false) {
    stage = "open";
    meta = "Returned to heat · re-breed";
    urgency = "soon";
  }

  return {
    stage,
    sow: {
      id: row.id, earTag: row.ear_tag, name: row.name ?? null, stage, meta, progress, urgency, isGilt,
      breedingAttemptId: row.current_breeding_attempt_id ?? null,
      breedingDate: bredDate,
      housingUnitId: row.housing_unit_id ?? null,
      housingUnitType: row.housing_unit_type ?? null,
      awaitingMoveOut,
    },
  };
}

export async function fetchPipeline(orgId: string): Promise<Record<Stage, PipelineSow[]>> {
  const [sowsRes, farrowRes] = await Promise.all([
    supabase.from("sow_list_view").select("*").eq("organization_id", orgId).eq("status", "active").order("ear_tag"),
    // Open farrowings (not yet weaned). sow_list_view carries neither
    // moved_to_farrowing_date nor the litter's live count, so we derive both
    // here: pending rows (no actual date) tell us who's been moved to the
    // farrowing house; farrowed rows tell us the surviving-piglet count.
    supabase.from("farrowings").select("sow_id, moved_to_farrowing_date, actual_farrowing_date, live_piglets")
      .eq("organization_id", orgId).is("moved_out_of_farrowing_date", null),
  ]);
  if (sowsRes.error) throw sowsRes.error;

  const movedMap: Record<string, string> = {};
  const liveMap: Record<string, number> = {};
  for (const f of farrowRes.data || []) {
    if (f.actual_farrowing_date == null) {
      if (f.moved_to_farrowing_date) movedMap[f.sow_id] = f.moved_to_farrowing_date;
    } else {
      liveMap[f.sow_id] = f.live_piglets ?? 0;
    }
  }

  const board: Record<Stage, PipelineSow[]> = {
    open: [], bred: [], pregnant: [], farrowing: [], nursing: [],
  };
  for (const row of sowsRes.data || []) {
    row.moved_to_farrowing_date = movedMap[row.id] ?? null;
    row.active_farrowing_live_piglets = row.id in liveMap ? liveMap[row.id] : null;
    const { stage, sow } = deriveStage(row);
    board[stage].push(sow);
  }
  // within a column, most-urgent first
  const rank = { due: 0, soon: 1 } as Record<string, number>;
  for (const k of Object.keys(board) as Stage[]) {
    board[k].sort((a, b) => (rank[a.urgency ?? "z"] ?? 2) - (rank[b.urgency ?? "z"] ?? 2));
  }
  return board;
}
