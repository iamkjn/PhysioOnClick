"use client";

import Link from "next/link";
import { useMemo, type RefObject } from "react";

import { bookServiceFor } from "@/lib/cal-services";
import { founder } from "@/lib/site-data";
import { formatSlotChip, type BookingConfirmation } from "@/components/booking-flow";

function icsStamp(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** ponytail: a data-URI .ics beats pulling in a calendar dependency, and it
 *  works for Apple/Outlook/Google alike. */
function calendarHref(title: string, startIso: string, minutes: number) {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + minutes * 60_000);
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PhysioOnClick//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${startIso}-physioonclick`,
    `DTSTAMP:${icsStamp(start)}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${title} · PhysioOnClick`,
    `DESCRIPTION:Online physiotherapy session with ${founder.name}.`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`;
}

type Props = {
  confirmation: BookingConfirmation;
  titleRef?: RefObject<HTMLHeadingElement | null>;
};

export function BookingStepDone({ confirmation, titleRef }: Props) {
  const service = useMemo(() => bookServiceFor(confirmation.serviceId), [confirmation.serviceId]);
  const firstName = confirmation.name.trim().split(/\s+/)[0] || "there";

  return (
    <div className="book-done">
      <aside className="book-done-left">
        <span className="book-done-check" aria-hidden="true">
          ✓
        </span>
        <h1 className="book-done-title" ref={titleRef} tabIndex={-1}>
          You&rsquo;re booked in, {firstName}.
        </h1>
        <p className="book-done-text">
          We&rsquo;ve emailed your confirmation and a link to join the session. You can reschedule free of
          charge up to 24 hours before.
        </p>
        <div className="book-done-actions">
          <a
            className="book-action-outline"
            href={calendarHref(service.title, confirmation.start, service.minutes)}
            download="physioonclick-session.ics"
            aria-label="Add to calendar (downloads a calendar file)"
          >
            Add to calendar
          </a>
          <Link className="book-action-solid" href="/patient/appointments">
            Go to my portal
          </Link>
        </div>
      </aside>

      <section className="book-done-right">
        <p className="book-panel-eyebrow">Confirmed</p>
        <h2 className="book-panel-title">Your session</h2>

        <div className="book-summary-card">
          <div className="book-summary-row">
            <span className="book-summary-label">Service</span>
            <span className="book-summary-value">{service.title}</span>
          </div>
          <div className="book-summary-row">
            <span className="book-summary-label">When</span>
            <span className="book-summary-value">{formatSlotChip(confirmation.start)}</span>
          </div>
          <div className="book-summary-row">
            {/* No checkout route exists, so this is what's owed — not what's been charged. */}
            <span className="book-summary-label">Total</span>
            <span className="book-summary-value">£{service.price}</span>
          </div>
        </div>

        <p className="book-next-title">What happens next</p>
        <ol className="book-next-list">
          <li className="book-next-item">
            <span className="book-next-num" aria-hidden="true">
              1
            </span>
            <span className="book-next-text">
              Fill in your intake form. It takes about 2 minutes and helps {founder.name} prepare.
            </span>
          </li>
          <li className="book-next-item">
            <span className="book-next-num" aria-hidden="true">
              2
            </span>
            <span className="book-next-text">
              Join the video call at your booked time using the link in your email.
            </span>
          </li>
          <li className="book-next-item">
            <span className="book-next-num" aria-hidden="true">
              3
            </span>
            <span className="book-next-text">
              Receive your plan and exercises in your portal straight after the session.
            </span>
          </li>
        </ol>
      </section>
    </div>
  );
}
