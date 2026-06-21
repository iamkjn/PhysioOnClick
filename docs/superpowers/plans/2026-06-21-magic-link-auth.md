# Magic Link Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-provision a patient portal account at booking time and embed a Firebase magic link in the confirmation email so patients can sign in with a single click — no password needed.

**Architecture:** The Firebase Admin SDK's `generateSignInWithEmailLink()` produces a one-time signed URL server-side during the booking flow; that URL is embedded as a button in the existing Resend confirmation email. Clicking it lands the patient on `/auth/verify`, which calls `signInWithEmailLink()` client-side, creates the Firebase Auth user on first use, and links all past bookings to the new UID. A separate `/api/auth/magic-link` endpoint lets patients request fresh links from the login page.

**Tech Stack:** Next.js 15 App Router, Firebase Admin SDK (`firebase-admin/auth`), Firebase Client SDK (`firebase/auth`), Resend (email), Firestore.

## Global Constraints

- No test suite — use manual verification steps with `npm run dev`
- Booking must succeed even if magic link generation fails (non-blocking)
- Magic link URL must use `NEXT_PUBLIC_SITE_URL` as base (already in env)
- Firebase Admin Auth must share the same initialized app as `getAdminDb()`
- Do not touch admin auth flow — only patient role is affected
- No new environment variables
- `firebase-admin/auth` is already available (part of the `firebase-admin` package)

---

### Task 1: Expose `getAdminAuth()` from `lib/firebase-admin.ts`

**Files:**
- Modify: `lib/firebase-admin.ts`

**Interfaces:**
- Produces: `getAdminAuth(): Auth | null` — returns Firebase Admin Auth instance or null on failure; `Auth` imported from `"firebase-admin/auth"`

- [ ] **Step 1: Add `getAdminAuth` export**

Replace the entire contents of `lib/firebase-admin.ts` with:

```typescript
import { readFileSync } from "node:fs";

import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function ensureAdminApp() {
  if (getApps().length) {
    return getApps()[0];
  }

  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || "physioonclick";
  const storageBucket = process.env.FIREBASE_ADMIN_STORAGE_BUCKET || "physioonclick.firebasestorage.app";

  if (rawServiceAccount) {
    return initializeApp({
      credential: cert(JSON.parse(rawServiceAccount)),
      projectId,
      storageBucket,
    });
  }

  if (serviceAccountPath) {
    return initializeApp({
      credential: cert(JSON.parse(readFileSync(serviceAccountPath, "utf8"))),
      projectId,
      storageBucket,
    });
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId,
    storageBucket,
  });
}

export function getAdminDb() {
  try {
    ensureAdminApp();
    return getFirestore();
  } catch {
    return null;
  }
}

export function getAdminAuth() {
  try {
    ensureAdminApp();
    return getAuth();
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | tail -20
```

Expected: no new type errors. If you see `Cannot find module 'firebase-admin/auth'`, run `npm ls firebase-admin` — it should be installed. If not: `npm install firebase-admin`.

- [ ] **Step 3: Commit**

```bash
git add lib/firebase-admin.ts
git commit -m "feat: export getAdminAuth from firebase-admin helper"
```

---

### Task 2: Generate magic link at booking time and embed it in the confirmation email

**Files:**
- Modify: `app/api/booking/route.ts`

**Interfaces:**
- Consumes: `getAdminAuth(): Auth | null` from `lib/firebase-admin`
- Produces: No new exports — internal change to `POST /api/booking` behaviour

- [ ] **Step 1: Add the `getAdminAuth` import**

At the top of `app/api/booking/route.ts`, update the import from `@/lib/firebase-admin`:

```typescript
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
```

- [ ] **Step 2: Update `sendBookingEmail` signature and HTML**

Change the function signature to accept a `portalLink` parameter:

```typescript
async function sendBookingEmail(
  payload: BookingPayload,
  appointmentLabel: string,
  meetLink: string | null,
  portalLink: string | null,
)
```

Add the `portalSection` variable immediately after `meetSection` is defined:

```typescript
const portalSection = portalLink
  ? `<div style="margin: 24px 0; text-align: center;">
      <a href="${portalLink}"
         style="display: inline-block; background: linear-gradient(135deg, #0891B2, #0E7490);
                color: white; text-decoration: none; padding: 14px 32px;
                border-radius: 8px; font-weight: bold; font-size: 15px;">
        Access your patient portal →
      </a>
      <p style="margin: 10px 0 0; font-size: 12px; color: #6B8FA0;">
        This link signs you in automatically. It expires after 24 hours and can only be used once.
      </p>
    </div>`
  : "";
```

In the `emailHtml` template string, add `${portalSection}` between `${meetSection}` and the cancellation warning `<div>`:

```typescript
        ${meetSection}
        ${portalSection}

        <div style="margin-top: 24px; padding: 16px 20px; background: #FFF9EC; ...">
```

- [ ] **Step 3: Generate the magic link in the POST handler**

Inside the `try` block that writes to Firestore (after `db.collection("bookings").add(...)` and before `sendBookingEmail`), add:

```typescript
    let portalLink: string | null = null;
    try {
      const adminAuth = getAdminAuth();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      if (adminAuth) {
        portalLink = await adminAuth.generateSignInWithEmailLink(payload.email, {
          url: `${siteUrl}/auth/verify?email=${encodeURIComponent(payload.email)}`,
          handleCodeInApp: true,
        });
      }
    } catch {
      // Non-blocking — booking proceeds without portal link
    }
```

Then update the `sendBookingEmail` call to pass `portalLink`:

```typescript
      const result = await sendBookingEmail(payload, appointmentLabel, meetLink, portalLink);
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npm run build 2>&1 | tail -20
```

Expected: no type errors.

- [ ] **Step 5: Manual smoke test**

Before testing, complete the one-time Firebase console step: **Authentication → Sign-in methods → Email/Password → enable "Email link (passwordless sign-in)" → Save**.

Start the dev server: `npm run dev`. Submit a test booking. Confirm:
- Booking saves to Firestore `bookings`
- Confirmation email arrives
- Email contains an "Access your patient portal →" button (if Firebase Email Link is enabled and `NEXT_PUBLIC_SITE_URL` is set)
- If Firebase Email Link is not yet enabled, the booking email still sends — just without the portal button

- [ ] **Step 6: Commit**

```bash
git add app/api/booking/route.ts
git commit -m "feat: embed magic sign-in link in booking confirmation email"
```

---

### Task 3: Create `/auth/verify` page

This client-side page handles the Firebase email link click. It confirms the URL is a valid sign-in link, signs the patient in, creates their Firestore patient record, links existing bookings to their UID by email match, then redirects to `/patient`.

**Files:**
- Create: `app/auth/verify/page.tsx`

**Interfaces:**
- Consumes: `ensurePatientRecord(user: User, preferredName?: string): Promise<void>` from `lib/patient-account`
- Consumes: `auth`, `db` from `lib/firebase`
- Consumes: `isSignInWithEmailLink`, `signInWithEmailLink` from `firebase/auth`
- Consumes: `collection`, `getDocs`, `query`, `updateDoc`, `where` from `firebase/firestore`

- [ ] **Step 1: Create the page file**

Create `app/auth/verify/page.tsx`:

```typescript
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
              <h2>Verifying your link…</h2>
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
              <h2>Signing you in…</h2>
              <p className="muted">Creating your patient account and linking your appointment.</p>
            </>
          )}

          {stage === "success" && (
            <>
              <h2>You are in!</h2>
              <p className="muted">Redirecting you to your patient portal…</p>
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
              <p>Loading…</p>
            </div>
          </section>
        </div>
      }
    >
      <VerifyPage />
    </Suspense>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | tail -20
```

Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add app/auth/verify/page.tsx
git commit -m "feat: add /auth/verify page for magic link sign-in"
```

---

### Task 4: Create `/api/auth/magic-link` endpoint

Patients can request a fresh sign-in link from the login page or the error state on `/auth/verify`. This route generates a new link and sends it via Resend. An in-memory Map rate-limits to one request per email per 60 seconds.

**Files:**
- Create: `app/api/auth/magic-link/route.ts`

**Interfaces:**
- Consumes: `getAdminAuth(): Auth | null` from `lib/firebase-admin`
- Produces: `POST /api/auth/magic-link` — accepts `{ email: string }`, returns `{ ok: true }` or `{ error: string }`

- [ ] **Step 1: Create the route file**

Create `app/api/auth/magic-link/route.ts`:

```typescript
import { NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase-admin";

const rateLimitMap = new Map<string, number>();

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string };
  const email = String(body.email || "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }

  const now = Date.now();
  const lastSent = rateLimitMap.get(email) ?? 0;
  if (now - lastSent < 60_000) {
    return NextResponse.json(
      { error: "Please wait a moment before requesting another link." },
      { status: 429 },
    );
  }

  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    return NextResponse.json({ error: "Authentication service is not available." }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  let portalLink: string;
  try {
    portalLink = await adminAuth.generateSignInWithEmailLink(email, {
      url: `${siteUrl}/auth/verify?email=${encodeURIComponent(email)}`,
      handleCodeInApp: true,
    });
  } catch {
    return NextResponse.json({ error: "Could not generate a sign-in link. Please try again." }, { status: 500 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Email service is not configured." }, { status: 500 });
  }

  const from = process.env.ENQUIRY_EMAIL_FROM || "PhysioOnClick <onboarding@resend.dev>";

  const emailHtml = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #10233A; line-height: 1.6; max-width: 600px;">
      <div style="background: linear-gradient(135deg, #0891B2, #0E7490); padding: 28px 32px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; color: white; font-size: 22px;">PhysioOnClick</h1>
        <p style="margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Your sign-in link</p>
      </div>
      <div style="padding: 28px 32px; background: white; border: 1px solid #E8F6FA; border-top: none; border-radius: 0 0 12px 12px;">
        <p>Here is your sign-in link for PhysioOnClick. Click the button below to access your patient portal.</p>
        <div style="margin: 24px 0; text-align: center;">
          <a href="${portalLink}"
             style="display: inline-block; background: linear-gradient(135deg, #0891B2, #0E7490);
                    color: white; text-decoration: none; padding: 14px 32px;
                    border-radius: 8px; font-weight: bold; font-size: 15px;">
            Access your patient portal →
          </a>
          <p style="margin: 10px 0 0; font-size: 12px; color: #6B8FA0;">
            This link expires after 24 hours and can only be used once.
          </p>
        </div>
        <p style="color: #6B8FA0; font-size: 13px;">
          If you did not request this link, you can safely ignore this email.<br /><br />
          — The PhysioOnClick Team
        </p>
      </div>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Your PhysioOnClick sign-in link",
      html: emailHtml,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to send email. Please try again." }, { status: 500 });
  }

  rateLimitMap.set(email, now);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | tail -20
```

Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/auth/magic-link/route.ts
git commit -m "feat: add /api/auth/magic-link endpoint for on-demand sign-in links"
```

---

### Task 5: Add "Send me a sign-in link" option to the patient auth panel

The patient login page currently shows Google + email/password. Add a third path: "Send me a sign-in link". The patient enters their email, the panel hits `/api/auth/magic-link`, and confirms the link was sent.

**Files:**
- Modify: `components/auth-panel.tsx`

**Interfaces:**
- Consumes: `POST /api/auth/magic-link` — `{ email: string }` → `{ ok: true } | { error: string }`

- [ ] **Step 1: Extend the `mode` state type**

Find this line:

```typescript
const [mode, setMode] = useState<"signin" | "signup">("signin");
```

Replace with:

```typescript
const [mode, setMode] = useState<"signin" | "signup" | "magic-link">("signin");
```

- [ ] **Step 2: Add the `handleMagicLink` handler**

Add this function inside the component, just before the `return` statement:

```typescript
  async function handleMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    if (!email) return;
    try {
      setIsSubmitting(true);
      setStatus("Sending your sign-in link…", "info");
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setStatus(data.error || "Could not send the link. Please try again.", "error");
      } else {
        setStatus(`Sign-in link sent to ${email}. Check your inbox.`, "success");
      }
    } catch {
      setStatus("Could not send the link. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }
```

- [ ] **Step 3: Replace the `return (...)` block**

Replace the entire `return (...)` with:

```typescript
  return (
    <div className="panel auth-panel">
      <div className="auth-panel-header">
        <span className="auth-panel-eyebrow">{role === "admin" ? "Secure admin access" : "Patient access"}</span>
        <h3>
          {role === "admin"
            ? "Admin login"
            : isSignup
            ? "Create your account"
            : mode === "magic-link"
            ? "Sign in with a link"
            : "Sign in to continue"}
        </h3>
        <p className="muted">
          {role === "admin"
            ? "Use your secure admin credentials to access bookings, enquiries and patient operations."
            : mode === "magic-link"
            ? "Enter your booking email and we will send you a sign-in link. No password needed."
            : "Use the same email you want to use for bookings, saved blogs, rehab updates and secure uploads."}
        </p>
      </div>

      {isPatient && mode !== "magic-link" ? (
        <div className="auth-provider-stack">
          <button className="auth-provider-button auth-provider-google" disabled={isSubmitting} onClick={handleGoogleSignIn} type="button">
            <span className="auth-provider-icon" aria-hidden="true">G</span>
            <span>Continue with Google</span>
          </button>
          <div className="auth-divider">
            <span>or use email &amp; password</span>
          </div>
        </div>
      ) : null}

      {mode === "magic-link" ? (
        <form className="auth-form" onSubmit={handleMagicLink}>
          <label>
            Email
            <input type="email" name="email" required placeholder="patient@example.com" />
          </label>
          <button className="button primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : "Send sign-in link"}
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleAuth}>
          {isSignup && isPatient ? (
            <label>
              Full name
              <input type="text" name="fullName" required minLength={2} placeholder="Your full name" />
            </label>
          ) : null}
          <label>
            Email
            <input type="email" name="email" required placeholder={role === "admin" ? "admin@physioonclick.co.uk" : "patient@example.com"} />
          </label>
          <label>
            Password
            <input type="password" name="password" required minLength={8} />
          </label>
          <button className="button primary" type="submit">
            {isSubmitting ? "Please wait..." : isSignup ? "Create patient account" : "Continue"}
          </button>
        </form>
      )}

      {isPatient ? (
        <div className="auth-panel-footer">
          {mode === "magic-link" ? (
            <>
              <span className="muted">Prefer a password?</span>
              <button className="text-button" onClick={() => setMode("signin")} type="button">Sign in with password</button>
            </>
          ) : (
            <>
              <span className="muted">{isSignup ? "Already have an account?" : "Need a patient account?"}</span>
              <button className="text-button" onClick={() => setMode(isSignup ? "signin" : "signup")} type="button">
                {isSignup ? "Use sign in" : "Create account"}
              </button>
            </>
          )}
        </div>
      ) : null}

      {isPatient && mode !== "magic-link" ? (
        <div className="auth-panel-footer" style={{ marginTop: "0.5rem" }}>
          <span className="muted">Booked before? No password?</span>
          <button className="text-button" onClick={() => setMode("magic-link")} type="button">
            Send me a sign-in link
          </button>
        </div>
      ) : null}

      <p className={`auth-status auth-status-${messageTone}`}>{message}</p>
    </div>
  );
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npm run build 2>&1 | tail -20
```

Expected: no type errors.

- [ ] **Step 5: Full end-to-end manual test**

Run `npm run dev` and verify:

1. Go to `/patient` — the auth panel shows a "Send me a sign-in link" link below the form
2. Click it — the panel switches to the email-only form with heading "Sign in with a link"
3. Enter an email and submit — status message reads "Sign-in link sent to …"
4. Open the email — it contains an "Access your patient portal →" button
5. Click the button — you land on `/auth/verify` and are redirected to `/patient`
6. Check Firestore: a new user appears in the `users` and `patients` collections
7. Check Firestore `bookings`: any past bookings with that email now have `patientUid` set
8. Submit a new booking with the same email — the confirmation email contains the portal button
9. Click that button — you sign in and land in `/patient`
10. Confirm existing email+password and Google sign-in still work correctly

- [ ] **Step 6: Commit**

```bash
git add components/auth-panel.tsx
git commit -m "feat: add magic link sign-in option to patient auth panel"
```

---

## Firebase Console Setup (one-time, do before testing)

1. Open [Firebase Console](https://console.firebase.google.com) → your project → **Authentication** → **Sign-in methods**
2. Find **Email/Password** → click → enable the **Email link (passwordless sign-in)** toggle → **Save**
3. Under **Authorized domains**, confirm your production domain (e.g. `physioonclick.co.uk`) is listed — `localhost` is there by default for local dev

Without this step, `generateSignInWithEmailLink` throws and the booking email sends without the portal button — which is the correct graceful fallback.
