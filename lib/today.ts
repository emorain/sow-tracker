/**
 * Today worklist — derives "what needs doing" from the reproductive data the
 * app already has (sow_list_view + matrix_treatments), so the home screen is an
 * action list instead of a stat grid.
 */
import { supabase } from "@/lib/supabase";
import {
  daysSince,
  daysUntil,
  expectedFarrowingDate,
  formatDateShort,
  toDateString,
} from "@/lib/format";

export type TodayKind = "pregnancy_check" | "farrowing" | "ai_cycle" | "heat";
export type Urgency = "due" | "soon";

export interface TodayItem {
  id: string;
  kind: TodayKind;
  urgency: Urgency;
  sowId: string | null;
  earTag: string;
  name: string | null;
  breedingAttemptId: string | null;
  breedingDate: string | null;
  breedingMethod: "natural" | "ai" | null;
  title: string;
  pill: string;
  meta: string;
  href?: string;
}

export interface HerdStats {
  activeSows: number;
  bred: number;
  pregnant: number;
  farrowing: number;
  nursing: number;
  nursingPiglets: number;
  openAiCycles: number;
}

export interface TodayData {
  items: TodayItem[];
  stats: HerdStats;
}

const KIND_RANK: Record<TodayKind, number> = {
  pregnancy_check: 0,
  farrowing: 1,
  heat: 2,
  ai_cycle: 3,
};

export async function fetchTodayData(orgId: string): Promise<TodayData> {
  const [sowsRes, matrixRes, pigletRes] = await Promise.all([
    supabase.from("sow_list_view").select("*").eq("organization_id", orgId),
    supabase
      .from("matrix_treatments")
      .select("sow_id, batch_name, expected_heat_date, bred")
      .eq("organization_id", orgId)
      .eq("bred", false),
    supabase
      .from("piglets")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "nursing"),
  ]);

  // Surface real query failures instead of silently rendering an empty
  // "all caught up" worklist and a zeroed herd.
  if (sowsRes.error) throw sowsRes.error;
  if (matrixRes.error) throw matrixRes.error;

  const rows = (sowsRes.data || []) as any[];
  const items: TodayItem[] = [];
  const stats: HerdStats = {
    activeSows: 0,
    bred: 0,
    pregnant: 0,
    farrowing: 0,
    nursing: 0,
    nursingPiglets: pigletRes.count || 0,
    openAiCycles: 0,
  };

  for (const r of rows) {
    if (r.status !== "active") continue;
    stats.activeSows++;

    const bredDate: string | null = r.current_breeding_date ?? null;
    const confirmed = r.pregnancy_confirmed; // true | false | null
    const hasActiveFarrowing: boolean = !!r.has_active_farrowing;
    const method = (r.current_breeding_method || null) as "natural" | "ai" | null;

    // Herd stage tally
    if (hasActiveFarrowing) {
      const d = daysSince(r.active_farrowing_date) ?? 0;
      if (d <= 2) stats.farrowing++;
      else stats.nursing++;
    } else if (bredDate && confirmed === true) {
      stats.pregnant++;
    } else if (bredDate && confirmed !== true && confirmed !== false) {
      stats.bred++;
    }

    const base = {
      sowId: r.id as string,
      earTag: r.ear_tag as string,
      name: (r.name ?? null) as string | null,
      breedingAttemptId: (r.current_breeding_attempt_id ?? null) as string | null,
      breedingDate: bredDate,
      breedingMethod: method,
    };

    let addedCheck = false;

    // Pregnancy check due — bred, not yet checked, not yet farrowed
    if (bredDate && !hasActiveFarrowing && (confirmed === null || confirmed === undefined)) {
      const ds = daysSince(bredDate) ?? 0;
      if (ds >= 18) {
        addedCheck = true;
        const overdue = ds - 21;
        items.push({
          ...base,
          id: `chk-${r.id}`,
          kind: "pregnancy_check",
          urgency: ds >= 21 ? "due" : "soon",
          title: "Pregnancy check",
          pill: `CHECK · DAY ${ds}`,
          meta:
            `Bred ${formatDateShort(bredDate)} · ` +
            (ds < 21 ? "check window opens soon" : overdue > 0 ? `overdue by ${overdue}d` : "optimal check window"),
        });
      }
    }

    // Farrowing due — confirmed pregnant, approaching or past the 114-day date
    if (bredDate && !hasActiveFarrowing && confirmed === true) {
      const exp = expectedFarrowingDate(bredDate);
      const du = exp ? daysUntil(toDateString(exp)) : null;
      const ds = daysSince(bredDate) ?? 0;
      if (exp && du !== null && du <= 5) {
        items.push({
          ...base,
          id: `far-${r.id}`,
          kind: "farrowing",
          urgency: du <= 0 ? "due" : "soon",
          title: "Record litter",
          pill: `DAY ${ds}`,
          meta:
            du <= 0
              ? `Expected ${formatDateShort(exp)} · past due`
              : `Due ${formatDateShort(exp)} · in ${du}d`,
        });
      }
    }

    // Open AI cycle — needs a dose logged or the cycle completed.
    // Counted in stats always; only surfaced as its own item before the
    // pregnancy-check window opens, so a sow never shows two rows at once.
    if (
      bredDate &&
      !hasActiveFarrowing &&
      method === "ai" &&
      r.breeding_cycle_complete === false &&
      confirmed !== true
    ) {
      stats.openAiCycles++;
      if (!addedCheck) {
        items.push({
          ...base,
          id: `ai-${r.id}`,
          kind: "ai_cycle",
          urgency: "soon",
          title: "AI cycle open",
          pill: "AI · LOG DOSE",
          meta: `Bred ${formatDateShort(bredDate)} · log today's dose or complete the cycle`,
        });
      }
    }
  }

  // Heat / matrix batches — grouped, within the next week (or just past)
  const matrix = (matrixRes.data || []) as any[];
  const byBatch: Record<string, { count: number; minHeat: string | null }> = {};
  for (const m of matrix) {
    if (!m.expected_heat_date) continue;
    const du = daysUntil(m.expected_heat_date);
    if (du === null || du > 7 || du < -3) continue;
    const key = m.batch_name || "Matrix batch";
    byBatch[key] = byBatch[key] || { count: 0, minHeat: null };
    byBatch[key].count++;
    if (!byBatch[key].minHeat || m.expected_heat_date < byBatch[key].minHeat!)
      byBatch[key].minHeat = m.expected_heat_date;
  }
  for (const [batch, info] of Object.entries(byBatch)) {
    const du = daysUntil(info.minHeat) ?? 0;
    items.push({
      id: `heat-${batch}`,
      kind: "heat",
      urgency: du <= 0 ? "due" : "soon",
      sowId: null,
      earTag: batch,
      name: null,
      breedingAttemptId: null,
      breedingDate: null,
      breedingMethod: null,
      title: "Breed batch",
      pill: du <= 0 ? "HEAT NOW" : `HEAT · ${du}d`,
      meta: `${info.count} sow${info.count > 1 ? "s" : ""} ready · ${
        du <= 0 ? "in heat now" : `heat ${formatDateShort(info.minHeat)}`
      }`,
      href: "/matrix/batches",
    });
  }

  items.sort((a, b) =>
    a.urgency === b.urgency ? KIND_RANK[a.kind] - KIND_RANK[b.kind] : a.urgency === "due" ? -1 : 1
  );

  return { items, stats };
}
