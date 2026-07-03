/**
 * Shared formatting + date helpers.
 *
 * IMPORTANT: breeding/farrowing/task dates are stored as date-only strings
 * ('YYYY-MM-DD'). Passing those straight into `new Date('YYYY-MM-DD')` parses
 * them as UTC midnight, which renders as the *previous* day for users west of
 * UTC (all US timezones). Every helper here parses date-only values as LOCAL
 * dates so gestation math and displayed dates line up with the farmer's day.
 */

export const GESTATION_DAYS = 114;
export const PREGNANCY_CHECK_DAYS = 21; // typical check window after breeding

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Parse a value into a Date, treating 'YYYY-MM-DD' as a LOCAL calendar date. */
export function parseLocalDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (DATE_ONLY.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d); // local midnight, no TZ shift
  }
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/** Serialize a Date back to a date-only 'YYYY-MM-DD' string in local time. */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Today's local date at midnight. */
export function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Whole days from `a` to `b` (b - a). Negative if b is before a. */
export function daysBetween(a: string | Date | null, b: string | Date | null): number | null {
  const da = parseLocalDate(a);
  const db = parseLocalDate(b);
  if (!da || !db) return null;
  const MS = 1000 * 60 * 60 * 24;
  return Math.round((db.getTime() - da.getTime()) / MS);
}

/** Whole days since a past date (today - date). */
export function daysSince(date: string | Date | null): number | null {
  return daysBetween(date, today());
}

/** Whole days until a future date (date - today). Negative if past. */
export function daysUntil(date: string | Date | null): number | null {
  return daysBetween(today(), date);
}

/** Expected farrowing date = breeding date + 114 days. */
export function expectedFarrowingDate(breedingDate: string | Date | null): Date | null {
  const bred = parseLocalDate(breedingDate);
  if (!bred) return null;
  const d = new Date(bred);
  d.setDate(d.getDate() + GESTATION_DAYS);
  return d;
}

/** Add N days to a date-only value and return a date-only string. */
export function addDays(date: string | Date | null, days: number): string | null {
  const d = parseLocalDate(date);
  if (!d) return null;
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

/** Human date, e.g. "Jul 2, 2026". */
export function formatDate(value: string | Date | null, opts?: Intl.DateTimeFormatOptions): string {
  const d = parseLocalDate(value);
  if (!d) return "—";
  return d.toLocaleDateString(undefined, opts ?? { month: "short", day: "numeric", year: "numeric" });
}

/** Short date without year, e.g. "Jul 2". */
export function formatDateShort(value: string | Date | null): string {
  return formatDate(value, { month: "short", day: "numeric" });
}

/** Time from a timestamp, e.g. "3:45 PM". */
export function formatTime(value: string | Date | null): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** Age from a birth date, e.g. "2y 3m" or "5m". */
export function calculateAge(birthDate: string | Date | null): string {
  const birth = parseLocalDate(birthDate);
  if (!birth) return "—";
  const now = today();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) months = 0;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return years > 0 ? `${years}y ${rem}m` : `${rem}m`;
}

/** Sow lifecycle status color classes (active/culled/sold). */
export function sowStatusClasses(status: string): string {
  switch (status) {
    case "active":
      return "bg-ok-bg text-ok";
    case "culled":
      return "bg-due-bg text-due";
    case "sold":
      return "bg-info-bg text-info";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export type Urgency = "due" | "soon" | "ok" | "info" | "neutral";

/** Tailwind classes for an urgency pill/stripe. */
export function urgencyClasses(urgency: Urgency): { pill: string; stripe: string; text: string } {
  switch (urgency) {
    case "due":
      return { pill: "bg-due-bg text-due", stripe: "bg-due", text: "text-due" };
    case "soon":
      return { pill: "bg-soon-bg text-soon", stripe: "bg-soon", text: "text-soon" };
    case "ok":
      return { pill: "bg-ok-bg text-ok", stripe: "bg-ok", text: "text-ok" };
    case "info":
      return { pill: "bg-info-bg text-info", stripe: "bg-info", text: "text-info" };
    default:
      return { pill: "bg-muted text-muted-foreground", stripe: "bg-border", text: "text-muted-foreground" };
  }
}
