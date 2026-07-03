/**
 * Nursery board — every weaned pig still on the farm, placed in its
 * classification lane. Classification (the "sort") is the pig's intended use;
 * it is independent of lifecycle status. A pig leaves this board when it is
 * finalized: sold, promoted to the breeding herd (retained), culled, or died.
 */
import { supabase } from "@/lib/supabase";
import { daysSince } from "@/lib/format";

export type Classification = "undecided" | "show" | "feeder" | "breeder" | "market";

export const CLASSIFICATIONS: { key: Classification; label: string; tone: string }[] = [
  { key: "undecided", label: "Undecided", tone: "bg-muted-foreground/50" },
  { key: "show", label: "Show", tone: "bg-info" },
  { key: "feeder", label: "Feeder", tone: "bg-soon" },
  { key: "breeder", label: "Breeder", tone: "bg-ok" },
  { key: "market", label: "Market", tone: "bg-due" },
];

const KEYS = CLASSIFICATIONS.map(c => c.key);

export interface NurseryPig {
  id: string;
  earTag: string | null;
  rightNotch: number | null;
  leftNotch: number | null;
  name: string | null;
  sex: string | null;
  classification: Classification;
  birthWeight: number | null;
  weaningWeight: number | null;
  weanedDate: string | null;
  castrationDate: string | null;
  earNotchDate: string | null;
  housingUnitId: string | null;
  farrowingId: string;
  birthDate: string | null; // farrowing's actual date
  ageDays: number | null;
  damTag: string | null;
  damName: string | null;
  latestWeight: number | null; // most recent weigh-in, if any
  photoUrl: string | null;
  status: string;             // 'weaned' | 'reserved'
  buyer: string | null;       // reservation buyer
  deposit: number | null;     // reservation deposit
}

export function pigLabel(p: Pick<NurseryPig, "earTag" | "rightNotch" | "leftNotch">): string {
  if (p.earTag) return p.earTag;
  if (p.rightNotch != null || p.leftNotch != null) return `${p.rightNotch ?? 0}-${p.leftNotch ?? 0}`;
  return "No ID";
}

export async function fetchNursery(orgId: string): Promise<Record<Classification, NurseryPig[]>> {
  const { data, error } = await supabase
    .from("piglets")
    .select(`id, ear_tag, right_ear_notch, left_ear_notch, name, sex, classification,
      birth_weight, weaning_weight, weaned_date, castration_date, ear_notch_date,
      housing_unit_id, farrowing_id, photo_url, status, buyer, deposit,
      farrowings!inner ( actual_farrowing_date, sows!inner ( ear_tag, name ) )`)
    .eq("organization_id", orgId)
    .in("status", ["weaned", "reserved"])  // reserved pigs stay on the board until sold
    .order("weaned_date", { ascending: false });
  if (error) throw error;

  // Latest weigh-in per pig (most recent weigh_date), for the card readout.
  const latestWeight: Record<string, number> = {};
  const ids = ((data as any[]) || []).map(r => r.id);
  if (ids.length) {
    const { data: weights } = await supabase
      .from("weight_log")
      .select("piglet_id, weigh_date, weight")
      .eq("organization_id", orgId)
      .in("piglet_id", ids)
      .order("weigh_date", { ascending: true });
    for (const w of (weights as any[]) || []) latestWeight[w.piglet_id] = Number(w.weight); // asc → last wins
  }

  const board: Record<Classification, NurseryPig[]> = {
    undecided: [], show: [], feeder: [], breeder: [], market: [],
  };
  for (const row of (data as any[]) || []) {
    const birthDate = row.farrowings?.actual_farrowing_date ?? null;
    const cls: Classification = KEYS.includes(row.classification) ? row.classification : "undecided";
    board[cls].push({
      id: row.id,
      earTag: row.ear_tag,
      rightNotch: row.right_ear_notch,
      leftNotch: row.left_ear_notch,
      name: row.name,
      sex: row.sex,
      classification: cls,
      birthWeight: row.birth_weight,
      weaningWeight: row.weaning_weight,
      weanedDate: row.weaned_date,
      castrationDate: row.castration_date,
      earNotchDate: row.ear_notch_date,
      housingUnitId: row.housing_unit_id,
      farrowingId: row.farrowing_id,
      birthDate,
      ageDays: birthDate ? daysSince(birthDate) : null,
      damTag: row.farrowings?.sows?.ear_tag ?? null,
      damName: row.farrowings?.sows?.name ?? null,
      latestWeight: latestWeight[row.id] ?? null,
      photoUrl: row.photo_url ?? null,
      status: row.status,
      buyer: row.buyer ?? null,
      deposit: row.deposit != null ? Number(row.deposit) : null,
    });
  }
  return board;
}
