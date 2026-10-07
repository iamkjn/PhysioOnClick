"use client";

import { useEffect, useState } from "react";

import type { BookServiceId } from "@/lib/site-data";
import type { FocusArea } from "@/lib/cal-services";
import type { VisitType } from "@/lib/home-visit";

/**
 * An unfinished booking, kept in this browser so a patient who leaves /book
 * can pick up where they stopped (header badge, return banner, resume card).
 *
 * Deliberately holds no personal data: no name, email, address, postcode,
 * assessment answers or payment details — only what the patient chose.
 */
export type BookingDraft = {
  v: 1;
  serviceId: BookServiceId;
  focusAreas: FocusArea[];
  visitType: VisitType;
  /** ISO start of the chosen slot; null until one is picked. */
  slot: string | null;
  /** Furthest step reached (a draft only exists once step 1 is done). */
  step: 2;
  savedAt: number;
};

const KEY = "poc-booking-draft";
const CHANGE_EVENT = "poc-booking-draft-change";
export const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const SERVICE_IDS: BookServiceId[] = ["initial-assessment", "follow-up", "bundle-4", "bundle-8"];

/** Validates a parsed draft; drops expired drafts and slots already in the past. */
export function parseDraft(raw: unknown, now = Date.now()): BookingDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Partial<BookingDraft>;
  if (d.v !== 1 || !d.serviceId || !SERVICE_IDS.includes(d.serviceId)) return null;
  if (typeof d.savedAt !== "number" || now - d.savedAt > DRAFT_TTL_MS) return null;
  const visitType: VisitType = d.visitType === "home" ? "home" : "video";
  const slotTime = typeof d.slot === "string" ? Date.parse(d.slot) : NaN;
  return {
    v: 1,
    serviceId: d.serviceId,
    focusAreas: Array.isArray(d.focusAreas) ? d.focusAreas : [],
    visitType,
    slot: Number.isFinite(slotTime) && slotTime > now ? (d.slot as string) : null,
    step: 2,
    savedAt: d.savedAt,
  };
}

function notify() {
  try {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // no window (tests/SSR)
  }
}

export function loadBookingDraft(): BookingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const draft = parseDraft(JSON.parse(raw));
    if (!draft) window.localStorage.removeItem(KEY);
    return draft;
  } catch {
    return null;
  }
}

export function saveBookingDraft(draft: Omit<BookingDraft, "v" | "step" | "savedAt">) {
  if (typeof window === "undefined") return;
  try {
    const full: BookingDraft = { ...draft, v: 1, step: 2, savedAt: Date.now() };
    window.localStorage.setItem(KEY, JSON.stringify(full));
  } catch {
    // storage blocked (private mode): resume just isn't offered
  }
  notify();
}

export function clearBookingDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  notify();
}

/** Live view of the saved draft, kept in sync across components and tabs. */
export function useBookingDraft(): BookingDraft | null {
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  useEffect(() => {
    const refresh = () => setDraft(loadBookingDraft());
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY || e.key === null) refresh();
    };
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return draft;
}
