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
}

export function deriveStage(row: any): { stage: Stage; sow: PipelineSow } {
  const bredDate: string | null = row.current_breeding_date ?? null;
  const confirmed = row.pregnancy_confirmed; // true | false | null
  const hasActiveFarrowing = !!row.has_active_farrowing;
  const isGilt = (row.farrowing_count || 0) === 0;

  let stage: Stage = "open";
  let meta = isGilt ? "Gilt · not yet bred" : "Ready to breed";
  let progress: number | null = null;
  let urgency: Urgency | null = null;

  if (hasActiveFarrowing) {
    const d = daysSince(row.active_farrowing_date) ?? 0;
    if (d <= 2) {
      stage = "farrowing";
      meta = `Farrowed ${formatDateShort(row.active_farrowing_date)}`;
    } else {
      stage = "nursing";
      meta = `Day ${d} nursing`;
      if (d >= 18) urgency = "soon"; // approaching wean
    }
  } else if (bredDate && confirmed === true) {
    stage = "pregnant";
    const exp = expectedFarrowingDate(bredDate);
    const ds = daysSince(bredDate) ?? 0;
    const du = exp ? daysUntil(toDateString(exp)) : null;
    progress = Math.min(100, Math.round((ds / GESTATION_DAYS) * 100));
    meta = exp ? `Day ${ds} · due ${formatDateShort(exp)}` : `Day ${ds}`;
    if (du !== null && du <= 0) urgency = "due";
    else if (du !== null && du <= 5) urgency = "soon";
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
    },
  };
}

export async function fetchPipeline(orgId: string): Promise<Record<Stage, PipelineSow[]>> {
  const { data, error } = await supabase
    .from("sow_list_view")
    .select("*")
    .eq("organization_id", orgId)
    .eq("status", "active")
    .order("ear_tag");
  if (error) throw error;

  const board: Record<Stage, PipelineSow[]> = {
    open: [], bred: [], pregnant: [], farrowing: [], nursing: [],
  };
  for (const row of data || []) {
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
