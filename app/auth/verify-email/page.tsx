"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { applyActionCode } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { resetCaredForCache } from "@/hooks/use-cared-for-patients";

type Stage = "confirming" | "confirmed" | "error";

// Landing page for the link /api/auth/verify-email sends (lib/email-verification.ts).
// Applies the one-time code in the browser, then — if this browser is signed in
// as that user — reloads the user and forces a fresh ID token, so the new
// email_verified claim (which carer access depends on) takes effect now rather
// than at the next hourly token refresh.
function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");
  const [stage, setStage] = useState<Stage>("confirming");
  const [signedIn, setSignedIn] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const firebaseAuth = auth;

    async function refreshSignedInUser(): Promise<boolean> {
      const user = firebaseAuth?.currentUser;
      if (!user) return false;
      await user.reload();
      await user.getIdToken(true);
      resetCaredForCache();
      return user.emailVerified;
    }

    (async () => {
      if (!firebaseAuth || !oobCode) {
        setStage("error");
        return;
      }
      // currentUser is only populated once Firebase has restored the session.
      await firebaseAuth.authStateReady();
      try {
        await applyActionCode(firebaseAuth, oobCode);
        const verified = await refreshSignedInUser().catch(() => false);
        setSignedIn(verified);
        setStage("confirmed");
      } catch {
        // A used or expired code — but if this account is already verified
        // (e.g. they clicked the link twice), that's still a success.
        const verified = await refreshSignedInUser().catch(() => false);
        setSignedIn(verified);
        setStage(verified ? "confirmed" : "error");
      }
    })();
  }, [oobCode]);

  return (
    <div className="site-shell">
      <section className="page-section" style={{ maxWidth: 480, margin: "80px auto", padding: "0 1rem" }}>
        <div className="panel" style={{ padding: "2rem" }}>
          {stage === "confirming" && (
            <div role="status" aria-live="polite">
              <h1>Confirming your email&hellip;</h1>
            </div>
          )}

          {stage === "confirmed" && (
            <div role="status" aria-live="polite">
              <h1>Email confirmed</h1>
              <p className="muted">
                Thank you. If a family member has given you access to help with their recovery, you&rsquo;ll find
                them under &ldquo;Caring for&rdquo; on your home page.
              </p>
              <Link href={signedIn ? "/" : "/patient"} className="button primary full-width" style={{ marginTop: "1rem" }}>
                {signedIn ? "Go to my home page" : "Sign in"}
              </Link>
            </div>
          )}

          {stage === "error" && (
            <div role="alert">
              <h1>This link has expired</h1>
              <p className="auth-status auth-status-error">
                It may have been used already. Sign in and we&rsquo;ll offer to send you a new one.
              </p>
              <Link href="/patient" className="button primary full-width" style={{ marginTop: "1rem" }}>
                Sign in
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function VerifyEmailPageWrapper() {
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
      <VerifyEmailPage />
    </Suspense>
  );
}
