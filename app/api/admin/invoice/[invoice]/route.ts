import { NextResponse } from "next/server";
import { DecodedIdToken, downloadObject, getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

// Mirrors requireAdmin's check in app/admin/actions.ts (admin claim or
// ADMIN_EMAIL match) rather than importing it directly — that helper throws
// a single generic "Unauthorized" for both missing/invalid tokens and
// non-admin callers, but this route needs to tell those apart (401 vs 403).
// ADMIN_EMAIL is read inside the function (not hoisted to module scope) so
// it reflects the env at request time rather than at first import.
function isAdmin(decoded: DecodedIdToken): boolean {
  const adminEmail = process.env.ADMIN_EMAIL || "hello@physioonclick.co.uk";
  return decoded.admin === true || (!!decoded.email && decoded.email === adminEmail);
}

export async function GET(request: Request, ctx: { params: Promise<{ invoice: string }> }) {
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
  if (!isAdmin(decoded)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { invoice } = await ctx.params;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Unavailable" }, { status: 500 });

  const snap = await db.collection("payments").where("invoiceNumber", "==", invoice).limit(1).get();
  if (snap.empty) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const path = (snap.docs[0].data() as { invoicePdfPath?: string }).invoicePdfPath;
  if (!path) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bytes = await downloadObject(path);
  if (!bytes) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice}.pdf"`,
    },
  });
}
