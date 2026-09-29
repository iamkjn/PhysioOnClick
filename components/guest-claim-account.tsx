"use client";

import { useEffect, useState } from "react";

import { auth } from "@/lib/firebase";
import { guestBookingFor } from "@/lib/guest-booking";

/**
 * The email a guest booked with, if this browser is still holding that
 * guest-checkout (anonymous) session — otherwise null, including for anyone
 * signed in to a real account. Drives the "save your booking" offer on
 * /book/success.
 */
export function useGuestBookingEmail(): string | null {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const firebaseAuth = auth;
    if (!firebaseAuth) return;
    let cancelled = false;
    firebaseAuth
      .authStateReady()
      .then(() => {
        if (!cancelled) setEmail(guestBookingFor(firebaseAuth.currentUser)?.email ?? null);
      })
      .catch(() => {
        // No session info — just don't offer the claim.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return email;
}

type SendState = "idle" | "sending" | "sent" | "error";

/**
 * Post-payment offer for a guest to turn their booking into an account. Sends
 * the existing passwordless magic link (/api/auth/magic-link, unchanged);
 * opening it in this browser upgrades the guest session in place — see
 * signInOrClaimGuestAccount in app/auth/verify/page.tsx.
 */
export function GuestClaimAccount({ email }: { email: string }) {
  const [state, setState] = useState<SendState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function sendLink() {
    setState("sending");
    setErrorMessage("");
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, returnTo: "/patient" }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setState("sent");
        return;
      }
      setErrorMessage(data.error || "We couldn't send the link. Please try again.");
      setState("error");
    } catch {
      setErrorMessage("We couldn't send the link. Please try again.");
      setState("error");
    }
  }

  return (
    <section className="book-claim" aria-labelledby="book-claim-title">
      <h2 id="book-claim-title" className="book-claim-title">
        Save your booking to an account
      </h2>
      {state === "sent" ? (
        <p className="book-claim-text" role="status">
          Sent to <strong>{email}</strong>. Open the link in this browser to keep today&apos;s booking and
          assessment together in your new account.
        </p>
      ) : (
        <>
          <p className="book-claim-text">
            Manage your appointment and see your session notes and exercises in one place. We&apos;ll email a
            secure sign-in link to <strong>{email}</strong> — no password needed.
          </p>
          {state === "error" ? (
            <p className="book-claim-error" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <button
            type="button"
            className="book-result-btn book-claim-btn"
            onClick={sendLink}
            disabled={state === "sending"}
          >
            {state === "sending" ? "Sending…" : "Email me a sign-in link"}
          </button>
        </>
      )}
    </section>
  );
}
