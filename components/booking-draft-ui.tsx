"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { serviceLabelFor } from "@/lib/cal-services";
import { clearBookingDraft, useBookingDraft, type BookingDraft } from "@/lib/booking-draft";
import { trackGrowthEvent } from "@/lib/growth-tracking";

export const RESUME_HREF = "/book?resume=1";

/** "Tue 14 Oct · 10:30" in UK time. */
function slotLabel(iso: string) {
  const d = new Date(iso);
  const date = d
    .toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/London" })
    .replace(",", "");
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
  return `${date} · ${time}`;
}

export function draftSummary(draft: BookingDraft) {
  const parts = [serviceLabelFor(draft.serviceId, draft.visitType)];
  parts.push(draft.slot ? slotLabel(draft.slot) : "time not chosen yet");
  return parts.join(" · ");
}

export function discardDraft(where: string) {
  trackGrowthEvent("booking_draft_discarded", { where });
  clearBookingDraft();
}

/** Small "1" dot on the header Book links while a booking is in progress. */
export function BookingDraftBadge() {
  const draft = useBookingDraft();
  if (!draft) return null;
  return (
    <sup className="booking-draft-badge" aria-label="1 booking in progress">
      1
    </sup>
  );
}

const BANNER_DISMISS_KEY = "poc-booking-draft-banner-dismissed";

/** Site-wide nudge on any page but /book, dismissible for the session. */
export function BookingReturnBanner({ pathname }: { pathname: string | null }) {
  const draft = useBookingDraft();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(window.sessionStorage.getItem(BANNER_DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!draft || dismissed) return null;
  if (pathname?.startsWith("/book") || pathname?.startsWith("/admin")) return null;

  const hide = () => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(BANNER_DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  };

  return (
    <div className="booking-return-banner" role="region" aria-label="Unfinished booking">
      <div className="booking-return-banner-inner">
        <span className="booking-return-banner-text">
          You were booking <strong>{draftSummary(draft)}</strong>.
        </span>
        <Link
          href={RESUME_HREF}
          className="booking-return-banner-link"
          onClick={() => trackGrowthEvent("book_now_click", { source: "booking_return_banner" })}
        >
          Pick up where you left off →
        </Link>
        <button type="button" className="booking-return-banner-close" onClick={hide} aria-label="Hide this reminder">
          ×
        </button>
      </div>
    </div>
  );
}

/**
 * Shown on /book when a saved booking exists. `resumed` = it is already
 * loaded into the flow, so only the remove option is offered.
 */
export function BookingResumeCard({
  draft,
  resumed,
  onContinue,
  onRemove,
}: {
  draft: BookingDraft;
  resumed: boolean;
  onContinue: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="booking-resume-card" role="region" aria-label="Your saved booking">
      <div className="booking-resume-card-copy">
        <p className="booking-resume-card-eyebrow">{resumed ? "Picked up where you left off" : "You have a booking in progress"}</p>
        <p className="booking-resume-card-summary">{draftSummary(draft)}</p>
        {resumed && draft.visitType === "home" ? (
          <p className="booking-resume-card-note">Please confirm your visit address again — we don&rsquo;t store it.</p>
        ) : null}
      </div>
      <div className="booking-resume-card-actions">
        {resumed ? null : (
          <button type="button" className="button primary small" onClick={onContinue}>
            Continue booking
          </button>
        )}
        <button type="button" className="booking-resume-card-remove" onClick={onRemove}>
          {resumed ? "Remove and start over" : "Remove"}
        </button>
      </div>
    </div>
  );
}
