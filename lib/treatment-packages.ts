// Physio-arranged treatment packages: plans the physio sets up for a patient
// whose account the admin created (e.g. an elderly home-visit patient who
// doesn't book online). Stored in `sessionPackages` with `manual: true`, the
// same flag the patient portal and /api/package-sessions already honour, so
// the patient sees "N of M used" but can't self-book from it.
//
// Pure helpers only — safe to import from client and server code.
import { sessionPricePence } from "@/lib/home-visit-pricing";
import type { VisitType } from "@/lib/home-visit";

export const MAX_PACKAGE_SESSIONS = 60;
export const MAX_PACKAGE_PRICE_PENCE = 1_000_000; // £10,000 sanity cap

export type PackagePaymentStatus = "unpaid" | "link-ready" | "link-sent" | "paid";

export interface TreatmentPackage {
  id: string;
  title: string;
  visitType: VisitType;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  status: "active" | "complete";
  /** First session is charged as an initial assessment. */
  includesAssessment: boolean;
  startDate: string; // YYYY-MM-DD, "" when not set
  endDate: string; // YYYY-MM-DD, "" when not set
  pricePence: number; // 0 = no price set (e.g. free / not charged)
  paymentStatus: PackagePaymentStatus;
  paymentRequestId: string;
  paymentUrl: string;
  paymentLinkSentAt: string;
  paidAt: string;
  paidMethod: string;
  notes: string;
  patientId: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/**
 * The site's list price for a plan of `sessions` visits: the first visit at the
 * initial-assessment price (when it includes one), the rest at the follow-up
 * price, for the visit type. Home: £80 + £70 each; video: £50 + £40 each.
 * The admin can override this per package.
 */
export function suggestedPackagePricePence(input: {
  sessions: number;
  visitType: VisitType;
  includesAssessment: boolean;
}): number {
  const n = Math.max(0, Math.floor(input.sessions));
  if (n === 0) return 0;
  const followUp = sessionPricePence("follow-up", input.visitType);
  if (!input.includesAssessment) return followUp * n;
  return sessionPricePence("initial-assessment", input.visitType) + followUp * (n - 1);
}

/** Days from start to end inclusive, or 0 when either date is missing/invalid. */
export function daysInclusive(startDate: string, endDate: string): number {
  if (!isDateKey(startDate) || !isDateKey(endDate)) return 0;
  const ms = Date.parse(`${endDate}T12:00:00Z`) - Date.parse(`${startDate}T12:00:00Z`);
  return ms < 0 ? 0 : Math.round(ms / 86_400_000) + 1;
}

/** "Sun 15 Nov – Sat 21 Nov 2026" style range for emails and the pay page. */
export function formatDateRange(startDate: string, endDate: string): string {
  const fmt = (key: string, withYear: boolean) => {
    const d = new Date(`${key}T12:00:00Z`);
    const part = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-GB", { timeZone: "UTC", ...o });
    return `${part({ weekday: "short" })} ${d.getUTCDate()} ${part({ month: "short" })}${withYear ? ` ${d.getUTCFullYear()}` : ""}`;
  };
  if (isDateKey(startDate) && isDateKey(endDate)) return `${fmt(startDate, false)} – ${fmt(endDate, true)}`;
  if (isDateKey(startDate)) return `from ${fmt(startDate, true)}`;
  return "";
}

/** Read a sessionPackages doc into the admin shape, with safe defaults. */
export function readTreatmentPackage(id: string, data: Record<string, unknown>): TreatmentPackage {
  const str = (k: string) => (typeof data[k] === "string" ? (data[k] as string) : "");
  const num = (k: string) => (typeof data[k] === "number" && Number.isFinite(data[k]) ? (data[k] as number) : 0);
  const total = num("totalSessions");
  const used = num("usedSessions");
  const paymentStatus = str("paymentStatus");
  return {
    id,
    title: str("title") || "Treatment plan",
    visitType: data.visitType === "home" ? "home" : "video",
    totalSessions: total,
    usedSessions: used,
    remainingSessions: typeof data.remainingSessions === "number" ? num("remainingSessions") : Math.max(0, total - used),
    status: data.status === "complete" ? "complete" : "active",
    includesAssessment: data.includesAssessment === true,
    startDate: isDateKey(data.startDate) ? (data.startDate as string) : "",
    endDate: isDateKey(data.endDate) ? (data.endDate as string) : "",
    pricePence: num("pricePence"),
    paymentStatus: (["unpaid", "link-ready", "link-sent", "paid"] as const).includes(paymentStatus as PackagePaymentStatus)
      ? (paymentStatus as PackagePaymentStatus)
      : "unpaid",
    paymentRequestId: str("paymentRequestId"),
    paymentUrl: str("paymentUrl"),
    paymentLinkSentAt: str("paymentLinkSentAt"),
    paidAt: str("paidAt"),
    paidMethod: str("paidMethod"),
    notes: str("notes"),
    patientId: str("patientId"),
  };
}

export const PAYMENT_STATUS_LABEL: Record<PackagePaymentStatus, string> = {
  unpaid: "Not paid",
  "link-ready": "Payment link ready (not sent)",
  "link-sent": "Payment link sent",
  paid: "Paid",
};

/** "2026-11-16" + "12:00" in Europe/London → the matching UTC instant. */
export function londonWallTimeToDate(date: string, time: string): Date {
  const asUtc = new Date(`${date}T${time}:00Z`);
  const londonHour = Number(
    asUtc.toLocaleString("en-GB", { timeZone: "Europe/London", hour: "2-digit", hour12: false }),
  );
  const offsetHours = (londonHour - asUtc.getUTCHours() + 24) % 24; // 0 (GMT) or 1 (BST)
  return new Date(asUtc.getTime() - offsetHours * 3_600_000);
}
