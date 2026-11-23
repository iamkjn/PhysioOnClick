/**
 * Calendar days for the admin Growth tab. Counts start again from 0 at
 * midnight UK time (the practice is in Glasgow), so a "day" is a UK date,
 * written as a "YYYY-MM-DD" key, and covers midnight to midnight in
 * Europe/London, whether that's GMT or BST.
 */

export const GROWTH_TIME_ZONE = "Europe/London";

const DAY_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

function parts(key: string) {
  const match = key.match(DAY_KEY_PATTERN);
  if (!match) return null;
  const [, y, m, d] = match;
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return { year, month, day };
}

/** True for a real calendar date written as "YYYY-MM-DD". */
export function isDayKey(value: unknown): value is string {
  return typeof value === "string" && parts(value) !== null;
}

/** The UK date of an instant, e.g. 23:30 UTC on 14 July → "2026-07-15" (BST). */
export function londonDayKey(date: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: GROWTH_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** How far UK clock time is ahead of UTC at this instant, in ms (0 in GMT, 1h in BST). */
function londonOffsetMs(timestamp: number): number {
  const fields = new Intl.DateTimeFormat("en-GB", {
    timeZone: GROWTH_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(timestamp));
  const get = (type: string) => Number(fields.find((field) => field.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(timestamp / 1000) * 1000;
}

/** The UTC instant of UK midnight at the start of a day. */
function londonMidnight(key: string): number {
  const p = parts(key);
  if (!p) throw new Error(`Not a day key: ${key}`);
  const utcMidnight = Date.UTC(p.year, p.month - 1, p.day);
  // UK clocks change at 1am/2am, never at midnight, so one correction is enough.
  const first = utcMidnight - londonOffsetMs(utcMidnight);
  return utcMidnight - londonOffsetMs(first);
}

/**
 * The span of a UK day as ISO strings, for a Firestore range on createdAtIso:
 * start is inclusive, end is exclusive (the next day's midnight).
 */
export function londonDayRange(key: string): { startIso: string; endIso: string } {
  return {
    startIso: new Date(londonMidnight(key)).toISOString(),
    endIso: new Date(londonMidnight(shiftDayKey(key, 1))).toISOString(),
  };
}

/** "2026-11-30" + 1 → "2026-12-01". */
export function shiftDayKey(key: string, days: number): string {
  const p = parts(key);
  if (!p) throw new Error(`Not a day key: ${key}`);
  return new Date(Date.UTC(p.year, p.month - 1, p.day + days)).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  const a = parts(from);
  const b = parts(to);
  if (!a || !b) return 0;
  return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / DAY_MS);
}

/** "Today", "Yesterday", or the date itself, for headings and stat labels. */
export function dayLabel(key: string, todayKey: string): string {
  const diff = daysBetween(key, todayKey);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  const p = parts(key);
  if (!p) return key;
  const date = new Date(Date.UTC(p.year, p.month - 1, p.day, 12));
  const weekday = date.toLocaleDateString("en-GB", { timeZone: "UTC", weekday: "short" });
  const month = date.toLocaleDateString("en-GB", { timeZone: "UTC", month: "short" });
  return `${weekday} ${p.day} ${month} ${p.year}`;
}
