"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Status = "pending" | "processing" | "paid" | "slot_unavailable" | "booking_failed";

function BookingResult() {
  const params = useSearchParams();
  const sessionId = params.get("session_id") ?? "";
  const [status, setStatus] = useState<Status>("pending");

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    let tries = 0;
    async function poll() {
      tries += 1;
      try {
        const res = await fetch(`/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`);
        const data = (await res.json()) as { status: Status };
        if (cancelled) return;
        setStatus(data.status);
        if ((data.status === "pending" || data.status === "processing") && tries < 10) {
          setTimeout(poll, 2000);
        }
      } catch {
        if (!cancelled && tries < 10) setTimeout(poll, 2000);
      }
    }
    poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const isWaiting = status === "pending" || status === "processing";
  const isFailed = status === "slot_unavailable" || status === "booking_failed";

  return (
    <main className="book-result">
      <div className="book-result-card">
        {status === "paid" && (
          <>
            <div className="book-result-icon book-result-icon--ok" aria-hidden="true">
              <svg viewBox="0 0 52 52">
                <circle className="brc-circle" cx="26" cy="26" r="24" />
                <path className="brc-check" d="M15 27 L23 35 L38 18" />
              </svg>
            </div>
            <h1 className="book-result-title">Payment received — you&apos;re booked</h1>
            <p className="book-result-text">
              Thank you. We&apos;ve confirmed your session and a confirmation email is on its way.
            </p>
            <div className="book-result-actions">
              <Link href="/" className="book-result-btn">Back to home</Link>
              <Link href="/patient/appointments" className="book-result-link">View my appointments</Link>
            </div>
          </>
        )}

        {isWaiting && (
          <>
            <div className="book-result-spinner" aria-hidden="true" />
            <h1 className="book-result-title">Confirming your booking…</h1>
            <p className="book-result-text">
              Your payment went through. We&apos;re just confirming your slot — this only takes a few seconds.
            </p>
          </>
        )}

        {isFailed && (
          <>
            <div className="book-result-icon book-result-icon--warn" aria-hidden="true">
              <svg viewBox="0 0 52 52">
                <circle className="brc-circle" cx="26" cy="26" r="24" />
                <path className="brc-bang" d="M26 15 L26 31" />
                <circle className="brc-dot" cx="26" cy="38" r="1.7" />
              </svg>
            </div>
            <h1 className="book-result-title">We hit a snag confirming your slot</h1>
            <p className="book-result-text">
              Your payment was received but we couldn&apos;t lock in that time. Our team will contact you to
              rebook or refund — or reach us now and we&apos;ll sort it straight away.
            </p>
            <div className="book-result-actions">
              <Link href="/" className="book-result-btn">Back to home</Link>
              <Link href="/contact" className="book-result-link">Get in touch now</Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="book-result">
          <div className="book-result-card">
            <div className="book-result-spinner" aria-hidden="true" />
            <h1 className="book-result-title">Loading…</h1>
          </div>
        </main>
      }
    >
      <BookingResult />
    </Suspense>
  );
}
