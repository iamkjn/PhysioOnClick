import { NextResponse } from "next/server";
import { DecodedIdToken, downloadObject, getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

// Patient PDF download. Mirrors app/api/admin/invoice/[invoice] but authorizes
// by matching the caller's verified email to the invoice's `email` instead of
// requiring admin — so a patient can download their own invoices (including
// those for their dependents, which are paid under their email) but no one
// else's. Invoice Storage access is server-only (storage.rules denies clients).
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

  const { invoice } = await ctx.params;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Unavailable" }, { status: 500 });

  const snap = await db.collection("payments").where("invoiceNumber", "==", invoice).limit(1).get();
  if (snap.empty) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = snap.docs[0].data() as { invoicePdfPath?: string; email?: string; status?: string };

  // Authorize: the invoice must belong to the caller.
  const isOwner = !!decoded.email && !!data.email && decoded.email === data.email;
  if (!isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (data.status !== "paid" || !data.invoicePdfPath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bytes = await downloadObject(data.invoicePdfPath);
  if (!bytes) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice}.pdf"`,
    },
  });
}
