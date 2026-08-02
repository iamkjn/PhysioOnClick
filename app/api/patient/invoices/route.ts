import { NextResponse } from "next/server";
import { DecodedIdToken, getAdminAuth } from "@/lib/firebase-admin";
import { getInvoicesForEmail } from "@/lib/patient-invoices";

// Patient-facing list of their own paid invoices (self + all dependents, since
// dependent bookings are paid under the account holder's email). The `payments`
// collection is admin-only in firestore.rules, so this route reads it with the
// Admin SDK after verifying the caller's ID token and scopes the query to the
// caller's own email.
export async function GET(request: Request) {
  const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const auth = getAdminAuth();
  if (!auth) return NextResponse.json({ error: "Unavailable" }, { status: 500 });

  let decoded: DecodedIdToken;
  try {
    decoded = await auth.verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = decoded.email;
  if (!email) return NextResponse.json({ invoices: [] });

  const invoices = await getInvoicesForEmail(email);
  return NextResponse.json({ invoices });
}
