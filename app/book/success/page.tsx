"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Status = "pending" | "processing" | "paid" | "slot_unavailable" | "booking_failed";

export default function BookingSuccessPage() {
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

  return (
    <main className="book-panel" style={{ maxWidth: 560, margin: "0 auto", padding: "3rem 1.5rem" }}>
      {status === "paid" && (
        <>
          <h1 className="book-panel-title">Payment received — you&apos;re booked</h1>
          <p>Thank you. We&apos;ve confirmed your session and a confirmation email is on its way.</p>
          <Link href="/patient/appointments">View my appointments</Link>
        </>
      )}
      {(status === "pending" || status === "processing") && (
        <>
          <h1 className="book-panel-title">Confirming your booking…</h1>
          <p>Your payment went through. We&apos;re just confirming your slot — this takes a few seconds.</p>
        </>
      )}
      {(status === "slot_unavailable" || status === "booking_failed") && (
        <>
          <h1 className="book-panel-title">We hit a snag confirming your slot</h1>
          <p>
            Your payment was received but we couldn&apos;t lock in that time. Our team will contact you to
            rebook or refund. Please <Link href="/contact">get in touch</Link> if you&apos;d like to sort it now.
          </p>
        </>
      )}
    </main>
  );
}
