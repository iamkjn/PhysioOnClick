// Guest checkout: a first-time visitor can book and pay without creating a
// password. components/booking-step-time.tsx signs them in with Firebase
// Anonymous Auth, so they get a real (temporary) uid that the pre-payment
// assessment is written under exactly like a full account's. After payment,
// /book/success offers a magic link (the existing /api/auth/magic-link flow);
// opening it in the same browser makes /auth/verify link that email to the
// SAME anonymous uid, turning it into a permanent account with the assessment
// already attached — no data migration.
//
// This module has no Firebase runtime imports (types only), so it is safe to
// import from client components, server routes and tests alike.

import type { User } from "firebase/auth";

// ── Client: who counts as "signed in" ──────────────────────────────────────

/**
 * An anonymous guest-checkout session is NOT a patient account. Every
 * "is someone signed in?" UI decision (header, home dashboard, portal gate,
 * booking flow) should see it as signed out, otherwise a guest would get an
 * empty patient dashboard. The session itself stays alive in the background so
 * the claim link can upgrade it later.
 */
export function accountUserOrNull(user: User | null): User | null {
  return user && !user.isAnonymous ? user : null;
}

// ── Client: remembering which guest session belongs to which email ─────────

const GUEST_BOOKING_KEY = "poc-guest-booking";

export type GuestBookingRecord = { uid: string; email: string };

export function normaliseGuestEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Remembers, in this browser only, that the anonymous session `uid` booked as
 * `email`. localStorage (not sessionStorage) because the claim link is usually
 * opened from an email client in a new tab. Best-effort: storage can be
 * unavailable, in which case the claim simply falls back to a normal sign-in.
 */
export function rememberGuestBooking(uid: string, email: string): void {
  try {
    window.localStorage.setItem(
      GUEST_BOOKING_KEY,
      JSON.stringify({ uid, email: normaliseGuestEmail(email) } satisfies GuestBookingRecord),
    );
  } catch {
    // Storage blocked (privacy mode, quota) — nothing to remember.
  }
}

export function readGuestBooking(): GuestBookingRecord | null {
  try {
    const raw = window.localStorage.getItem(GUEST_BOOKING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GuestBookingRecord> | null;
    if (!parsed || typeof parsed.uid !== "string" || typeof parsed.email !== "string") return null;
    if (!parsed.uid || !parsed.email) return null;
    return { uid: parsed.uid, email: parsed.email };
  } catch {
    return null;
  }
}

export function forgetGuestBooking(): void {
  try {
    window.localStorage.removeItem(GUEST_BOOKING_KEY);
  } catch {
    // Nothing to clear.
  }
}

/**
 * The guest record for `user`, but only if `user` is the anonymous session
 * this browser started for a guest booking.
 */
export function guestBookingFor(user: User | null): GuestBookingRecord | null {
  if (!user?.isAnonymous) return null;
  const record = readGuestBooking();
  return record && record.uid === user.uid ? record : null;
}

/**
 * True only when `user` is the anonymous session this browser started for a
 * guest booking made with exactly `email`. Guards shared devices: someone else
 * signing in on the same browser with a different email must NOT inherit the
 * previous guest's booking and clinical assessment.
 */
export function guestBookingMatches(user: User | null, email: string): boolean {
  const record = guestBookingFor(user);
  return Boolean(record && record.email === normaliseGuestEmail(email));
}

// ── Server: attaching an unclaimed guest booking to its assessment owner ───

/**
 * Booking fields that attach a paid booking to the uid that submitted its
 * pre-payment assessment. Used by the Stripe and Cal.com webhooks ONLY when no
 * account matched the attendee email (i.e. a guest who hasn't claimed an
 * account yet), and only after the assessment form update at
 * patients/{uid}/people/{personId}/assessmentForms/{formId} succeeded — which
 * proves that uid really wrote it (Firestore rules pin submittedByUid to the
 * writer). Without this, an unclaimed guest booking has no `bookedBy`, and
 * every admin screen keyed on it (bookings table, session view, Start Session)
 * shows the assessment as "Not submitted".
 */
export function guestBookingOwnerFields(input: {
  assessmentUid: string;
  assessmentPersonId: string;
  patientName: string;
}) {
  return {
    bookedBy: input.assessmentUid,
    patientType: input.assessmentPersonId === input.assessmentUid ? "self" : "dependent",
    patientId: input.assessmentPersonId,
    patientName: input.patientName,
    patientAvatarUrl: "",
  };
}
