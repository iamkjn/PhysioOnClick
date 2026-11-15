import { NextResponse } from "next/server";
import { getAdminAuth, type DecodedIdToken } from "@/lib/firebase-admin";

// Same check as app/api/admin/invoice/[invoice]/route.ts: admin claim or an
// ADMIN_EMAIL match, read per request. Distinguishes 401 (no/invalid token)
// from 403 (valid, not admin).
function isAdmin(decoded: DecodedIdToken): boolean {
  const adminEmail = process.env.ADMIN_EMAIL || "hello@physioonclick.co.uk";
  return decoded.admin === true || (!!decoded.email && decoded.email === adminEmail);
}

/** Returns the admin's decoded token, or the error response to send back. */
export async function requireAdminRequest(
  request: Request,
): Promise<{ decoded: DecodedIdToken } | { error: NextResponse }> {
  const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const auth = getAdminAuth();
  if (!auth) return { error: NextResponse.json({ error: "Unavailable" }, { status: 500 }) };

  let decoded: DecodedIdToken;
  try {
    decoded = await auth.verifyIdToken(token);
  } catch {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!isAdmin(decoded)) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { decoded };
}
