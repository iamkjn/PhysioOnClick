// Server-only helpers shared by the /api/admin/packages routes.
import { NextResponse } from "next/server";
import { getAdminDb, type DocumentData } from "@/lib/firebase-admin";
import {
  MAX_PACKAGE_PRICE_PENCE,
  MAX_PACKAGE_SESSIONS,
  isDateKey,
} from "@/lib/treatment-packages";

export const UID_RE = /^[A-Za-z0-9_-]{6,128}$/;
export const noStore = { "Cache-Control": "no-store" };

export function cleanText(value: unknown, max = 200): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export type PackageFields = {
  title: string;
  visitType: "home" | "video";
  totalSessions: number;
  includesAssessment: boolean;
  startDate: string;
  endDate: string;
  pricePence: number;
  notes: string;
};

/**
 * Validates the editable package fields. `partial` allows a PATCH that only
 * sends some of them; missing ones are left out of the result.
 */
export function parsePackageFields(
  body: Record<string, unknown>,
  partial = false,
): { fields: Partial<PackageFields>; error: string | null } {
  const fields: Partial<PackageFields> = {};
  const has = (k: string) => Object.prototype.hasOwnProperty.call(body, k);

  if (has("title") || !partial) {
    const title = cleanText(body.title, 100);
    if (!title) return { fields, error: "Give the package a name." };
    fields.title = title;
  }
  if (has("visitType") || !partial) {
    if (body.visitType !== "home" && body.visitType !== "video") return { fields, error: "Choose home visit or video." };
    fields.visitType = body.visitType;
  }
  if (has("totalSessions") || !partial) {
    const n = Number(body.totalSessions);
    if (!Number.isInteger(n) || n < 1 || n > MAX_PACKAGE_SESSIONS) {
      return { fields, error: `Number of sessions must be 1–${MAX_PACKAGE_SESSIONS}.` };
    }
    fields.totalSessions = n;
  }
  if (has("includesAssessment") || !partial) fields.includesAssessment = body.includesAssessment === true;
  for (const key of ["startDate", "endDate"] as const) {
    if (has(key) || !partial) {
      const v = cleanText(body[key], 10);
      if (v && !isDateKey(v)) return { fields, error: "Dates must be valid." };
      fields[key] = v;
    }
  }
  if (fields.startDate && fields.endDate && fields.endDate < fields.startDate) {
    return { fields, error: "The end date is before the start date." };
  }
  if (has("pricePence") || !partial) {
    const p = Number(body.pricePence);
    if (!Number.isInteger(p) || p < 0 || p > MAX_PACKAGE_PRICE_PENCE) return { fields, error: "Enter a valid price." };
    fields.pricePence = p;
  }
  if (has("notes") || !partial) fields.notes = cleanText(body.notes, 600);
  return { fields, error: null };
}

/** Loads a manual package, or the error response to send back. */
export async function loadManualPackage(
  id: string,
): Promise<
  | { ok: true; db: NonNullable<ReturnType<typeof getAdminDb>>; data: DocumentData }
  | { ok: false; response: NextResponse }
> {
  if (!UID_RE.test(id)) return { ok: false, response: NextResponse.json({ error: "Bad request" }, { status: 400 }) };
  const db = getAdminDb();
  if (!db) return { ok: false, response: NextResponse.json({ error: "Unavailable" }, { status: 500 }) };
  const snap = await db.collection("sessionPackages").doc(id).get();
  if (!snap.exists) return { ok: false, response: NextResponse.json({ error: "Package not found" }, { status: 404 }) };
  const data = snap.data() ?? {};
  if (data.manual !== true) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Only physio-arranged packages can be managed here." }, { status: 400 }),
    };
  }
  return { ok: true, db, data };
}
