"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { collection, getDocs, query, updateDoc, where } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { ensurePatientRecord } from "@/lib/patient-account";

type Stage = "verifying" | "needs-email" | "signing-in" | "success" | "error";

function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stage, setStage] = useState<Stage>("verifying");
  const [emailInput, setEmailInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      void completeSignIn(decodeURIComponent(emailFromUrl), href);
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
      await linkBookingsToUser(email, credential.user.uid);
      setStage("success");
      setTimeout(() => router.push("/patient"), 1500);
    } catch (error) {
      const code = error instanceof FirebaseError ? error.code : "";
      if (code === "auth/invalid-action-code" || code === "auth/expired-action-code") {
        setErrorMessage("This link has expired or has already been used.");
      } else if (code === "auth/invalid-email") {
        setErrorMessage("The email address does not match the one used to book. Please try again.");
        setStage("needs-email");
        return;
      } else {
        setErrorMessage("Sign-in failed. Please request a new link.");
      }
      setStage("error");
    }
  }

  async function linkBookingsToUser(email: string, uid: string) {
    if (!db) return;
    try {
      const snap = await getDocs(query(collection(db, "bookings"), where("email", "==", email)));
      await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { patientUid: uid })));
    } catch {
      // Non-blocking — portal access works even if linking fails
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setIsSubmitting(true);
    await completeSignIn(emailInput.trim(), window.location.href);
    setIsSubmitting(false);
  }

  async function requestNewLink() {
    const email = emailInput.trim() || decodeURIComponent(searchParams.get("email") || "");
    if (!email) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setErrorMessage(`A new sign-in link has been sent to ${email}. Check your inbox.`);
      } else {
        setErrorMessage(data.error || "Could not send a new link. Please try again.");
      }
    } catch {
      setErrorMessage("Could not send a new link. Please try again.");
    }
    setIsSubmitting(false);
  }

  const linkSent = errorMessage.includes("has been sent to");

  return (
    <div className="site-shell">
      <section className="page-section" style={{ maxWidth: 480, margin: "80px auto", padding: "0 1rem" }}>
        <div className="panel" style={{ padding: "2rem" }}>
          {stage === "verifying" && (
            <>
              <h2>Verifying your link&hellip;</h2>
              <p className="muted">Just a moment while we check your sign-in link.</p>
            </>
          )}

          {stage === "needs-email" && (
            <>
              <h2>Confirm your email</h2>
              <p className="muted">
                For security, please enter the email address you used when booking your appointment.
              </p>
              <form onSubmit={handleEmailSubmit} style={{ marginTop: "1.5rem" }}>
                <label>
                  Email address
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    placeholder="patient@example.com"
                    style={{ width: "100%", marginTop: "0.5rem" }}
                  />
                </label>
                <button
                  className="button primary"
                  type="submit"
                  disabled={isSubmitting}
                  style={{ marginTop: "1rem", width: "100%" }}
                >
                  {isSubmitting ? "Signing you in…" : "Continue"}
                </button>
              </form>
            </>
          )}

          {stage === "signing-in" && (
            <>
              <h2>Signing you in&hellip;</h2>
              <p className="muted">Creating your patient account and linking your appointment.</p>
            </>
          )}

          {stage === "success" && (
            <>
              <h2>You are in!</h2>
              <p className="muted">Redirecting you to your patient portal&hellip;</p>
            </>
          )}

          {stage === "error" && (
            <>
              <h2>{linkSent ? "Link sent" : "Something went wrong"}</h2>
              <p className="muted">{errorMessage}</p>
              {!linkSent && (
                <>
                  <label style={{ marginTop: "1rem", display: "block" }}>
                    Your booking email
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="patient@example.com"
                      style={{ width: "100%", marginTop: "0.5rem" }}
                    />
                  </label>
                  <button
                    className="button primary"
                    onClick={requestNewLink}
                    disabled={isSubmitting || !emailInput.trim()}
                    style={{ marginTop: "1rem", width: "100%" }}
                  >
                    {isSubmitting ? "Sending…" : "Send me a new link"}
                  </button>
                </>
              )}
            </>
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
            <div className="panel" style={{ padding: "2rem" }}>
              <p>Loading&hellip;</p>
            </div>
          </section>
        </div>
      }
    >
      <VerifyPage />
    </Suspense>
  );
}
