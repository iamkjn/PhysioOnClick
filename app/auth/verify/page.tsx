"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { ensurePatientRecord } from "@/lib/patient-account";
import { validateEmail, LIMITS } from "@/lib/validation";

type Stage = "verifying" | "needs-email" | "signing-in" | "success" | "error";

// Only these in-app destinations are legitimate post-sign-in landing spots.
// The emailed link (and its query string) is attacker-editable once it sits in an
// inbox, so this is validated here too, not just server-side when the link is issued.
const ALLOWED_RETURN_PATHS = new Set<string>(["/book", "/patient"]);

function sanitizeReturnPath(value: string | null): string {
  return value && ALLOWED_RETURN_PATHS.has(value) ? value : "/patient";
}

function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stage, setStage] = useState<Stage>("verifying");
  const [emailInput, setEmailInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Computed once per render from the URL, shared by the auto-redirect and
  // the manual "Continue now" fallback so both always agree on where to go.
  const destination = sanitizeReturnPath(searchParams.get("returnTo"));

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!auth) return;
    const href = window.location.href;
    if (!isSignInWithEmailLink(auth, href)) {
      setStage("error");
      setErrorMessage("This link is not a valid sign-in link.");
      return;
    }
    const emailFromUrl = searchParams.get("email");
    if (emailFromUrl) {
      void completeSignIn(emailFromUrl, href);
    } else {
      setStage("needs-email");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function completeSignIn(email: string, href: string) {
    if (!auth) return;
    setStage("signing-in");
    try {
      const credential = await signInWithEmailLink(auth, email, href);
      await ensurePatientRecord(credential.user, credential.user.displayName || "");
      const idToken = await credential.user.getIdToken();
      await fetch("/api/auth/link-bookings", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      }).catch(() => { /* non-blocking */ });
      setStage("success");
      redirectTimerRef.current = setTimeout(() => router.push(destination), 1500);
    } catch (error) {
      const code = error instanceof FirebaseError ? error.code : "";
      if (code === "auth/invalid-action-code" || code === "auth/expired-action-code") {
        setErrorMessage("This link has expired or has already been used.");
      } else if (code === "auth/invalid-email") {
        setErrorMessage("The email address does not match the one used to book. Please try again.");
        setStage("needs-email");
        setLinkSent(false);
        return;
      } else {
        setErrorMessage("Sign-in failed. Please request a new link.");
      }
      setStage("error");
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailErr = validateEmail(emailInput);
    if (emailErr) {
      setErrorMessage(emailErr);
      return;
    }
    setIsSubmitting(true);
    await completeSignIn(emailInput.trim(), window.location.href);
    setIsSubmitting(false);
  }

  async function requestNewLink() {
    const email = emailInput.trim() || searchParams.get("email") || "";
    const emailErr = validateEmail(email);
    if (emailErr) {
      setErrorMessage(emailErr);
      return;
    }
    setIsSubmitting(true);
    setLinkSent(false);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, returnTo: destination }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setErrorMessage(`A new sign-in link has been sent to ${email}. Check your inbox.`);
        setLinkSent(true);
      } else {
        setErrorMessage(data.error || "Could not send a new link. Please try again.");
      }
    } catch {
      setErrorMessage("Could not send a new link. Please try again.");
    }
    setIsSubmitting(false);
  }

  return (
    <div className="site-shell">
      <section className="page-section" style={{ maxWidth: 480, margin: "80px auto", padding: "0 1rem" }}>
        <div className="panel" style={{ padding: "2rem" }}>
          {stage === "verifying" && (
            <div role="status" aria-live="polite">
              <h1>Verifying your link&hellip;</h1>
              <p className="muted">Just a moment while we check your sign-in link.</p>
            </div>
          )}

          {stage === "needs-email" && (
            <>
              <h1>Confirm your email</h1>
              <p className="muted">
                For security, please enter the email address you used when booking your appointment.
              </p>
              {errorMessage && (
                <p className="auth-status auth-status-error" role="alert">
                  {errorMessage}
                </p>
              )}
              <form onSubmit={handleEmailSubmit} style={{ marginTop: "1.5rem" }}>
                <label htmlFor="verify-email-input">
                  Email address
                  <input
                    id="verify-email-input"
                    type="email"
                    autoComplete="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    maxLength={LIMITS.email}
                    placeholder="patient@example.com"
                    style={{ marginTop: "0.5rem" }}
                  />
                </label>
                <button
                  className="button primary full-width"
                  type="submit"
                  disabled={isSubmitting}
                  style={{ marginTop: "1rem" }}
                >
                  {isSubmitting ? "Signing you in…" : "Continue"}
                </button>
              </form>
            </>
          )}

          {stage === "signing-in" && (
            <div role="status" aria-live="polite">
              <h1>Signing you in&hellip;</h1>
              <p className="muted">Creating your patient account and linking your appointment.</p>
            </div>
          )}

          {stage === "success" && (
            <div role="status" aria-live="polite">
              <h1>You are in!</h1>
              <p className="muted">Redirecting you to your patient portal&hellip;</p>
              <button
                type="button"
                className="button primary full-width"
                style={{ marginTop: "1rem" }}
                onClick={() => {
                  if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
                  router.push(destination);
                }}
              >
                Continue now
              </button>
            </div>
          )}

          {stage === "error" && linkSent && (
            <div role="status" aria-live="polite">
              <h1>Link sent</h1>
              <p className="auth-status auth-status-success">{errorMessage}</p>
            </div>
          )}

          {stage === "error" && !linkSent && (
            <div role="alert">
              <h1>Something went wrong</h1>
              <p className="auth-status auth-status-error">{errorMessage}</p>
              <label htmlFor="verify-recovery-email" style={{ marginTop: "1rem", display: "block" }}>
                Your booking email
                <input
                  id="verify-recovery-email"
                  type="email"
                  autoComplete="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                  maxLength={LIMITS.email}
                  placeholder="patient@example.com"
                  style={{ marginTop: "0.5rem" }}
                />
              </label>
              <button
                className="button primary full-width"
                type="button"
                onClick={requestNewLink}
                disabled={isSubmitting || !emailInput.trim()}
                style={{ marginTop: "1rem" }}
              >
                {isSubmitting ? "Sending…" : "Send me a new link"}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function VerifyPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="site-shell">
          <section className="page-section" style={{ maxWidth: 480, margin: "80px auto", padding: "0 1rem" }}>
            <div className="panel" style={{ padding: "2rem" }} role="status" aria-live="polite">
              <p className="muted">Loading&hellip;</p>
            </div>
          </section>
        </div>
      }
    >
      <VerifyPage />
    </Suspense>
  );
}
