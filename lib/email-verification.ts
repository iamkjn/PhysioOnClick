// lib/email-verification.ts
//
// Email verification for password accounts. Firebase never verifies a
// password sign-up on its own, and carer access (firestore.rules isCarerOf,
// /api/patient/carer-links) only trusts a VERIFIED email — otherwise anyone
// could sign up with a carer's address and see the patient's record.
//
// Flow: POST /api/auth/verify-email (signed-in user's ID token) asks Firebase
// for a verification code and emails our own link,
// /auth/verify-email?oobCode=…, through Resend. That page applies the code in
// the browser and refreshes the ID token so email_verified is true at once.

/** Pulls the one-time code out of the action link Firebase returns. */
export function oobCodeFromLink(link: string): string | null {
  try {
    const code = new URL(link).searchParams.get("oobCode");
    return code && code.trim() ? code : null;
  } catch {
    return null;
  }
}

/** Our own landing page for a verification code (no Firebase-hosted widget). */
export function verifyEmailPageUrl(siteUrl: string, oobCode: string): string {
  const url = new URL("/auth/verify-email", siteUrl);
  url.searchParams.set("oobCode", oobCode);
  return url.toString();
}

export interface VerificationRequestResult {
  ok: boolean;
  alreadyVerified?: boolean;
  error?: string;
}

/** Client: ask the server to email the signed-in user a confirmation link. */
export async function requestEmailVerification(user: {
  getIdToken: () => Promise<string>;
}): Promise<VerificationRequestResult> {
  try {
    const token = await user.getIdToken();
    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = (await res.json().catch(() => ({}))) as VerificationRequestResult;
    if (!res.ok) return { ok: false, error: body.error || "Could not send the email. Please try again." };
    return { ok: true, alreadyVerified: body.alreadyVerified === true };
  } catch {
    return { ok: false, error: "Could not send the email. Please try again." };
  }
}
