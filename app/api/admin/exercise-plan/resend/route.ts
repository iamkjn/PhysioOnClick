import { NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase-admin";

/**
 * Admin "Resend plan email" — a thin, authenticated proxy to the cron-guarded
 * POST /api/exercise-plan/generate (Task 6).
 *
 * The browser must never hold `CRON_SECRET`, so the admin dashboard calls here
 * with a Firebase idToken and this route forwards the request server-side with
 * the secret and `force: true` (bypassing the `planEmailedAt` idempotency
 * guard so a resend actually re-sends).
 *
 * Auth: `Authorization: Bearer <idToken>` -> `verifyIdToken`; the token email
 * must equal `ADMIN_EMAIL` (default `hello@physioonclick.co.uk`). 401 for a
 * missing/invalid token, 403 for a valid-but-not-admin token. `ADMIN_EMAIL` is
 * read at request time (not hoisted) so it reflects the current env.
 */
export async function POST(request: Request) {
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const auth = getAdminAuth();
  if (!token || !auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let email = "";
  try {
    const decoded = await auth.verifyIdToken(token);
    email = decoded.email ?? "";
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (email !== (process.env.ADMIN_EMAIL ?? "hello@physioonclick.co.uk")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { summaryId } = (await request.json().catch(() => ({}))) as { summaryId?: string };
  if (!summaryId) {
    return NextResponse.json({ error: "Missing summaryId" }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const res = await fetch(`${siteUrl}/api/exercise-plan/generate`, {
      method: "POST",
      headers: {
        "x-cron-secret": process.env.CRON_SECRET ?? "",
        "content-type": "application/json",
      },
      body: JSON.stringify({ summaryId, force: true }),
    });
    const data = await res.json().catch(() => ({ ok: true }));
    return NextResponse.json(data, { status: res.ok ? 200 : 502 });
  } catch (err) {
    console.error("admin/exercise-plan/resend: forward to generate failed", err);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
