import { NextResponse } from "next/server";
import { FieldValue } from "@/lib/firebase-admin";
import { requireAdminRequest } from "@/lib/admin-request";
import { loadManualPackage, noStore, parsePackageFields } from "@/lib/admin-packages-server";

// Admin-only. Edit a physio-arranged package (name, dates, sessions, price, notes).

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminRequest(request);
  if ("error" in gate) return gate.error;
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const { fields, error } = parsePackageFields(body, true);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const loaded = await loadManualPackage(id);
  if (!loaded.ok) return loaded.response;
  const { db, data } = loaded;

  const used = Number(data.usedSessions ?? 0);
  const update: Record<string, unknown> = { ...fields, updatedAt: FieldValue.serverTimestamp() };

  if (fields.totalSessions !== undefined) {
    if (fields.totalSessions < used) {
      return NextResponse.json({ error: `${used} sessions are already recorded.` }, { status: 400 });
    }
    update.remainingSessions = fields.totalSessions - used;
    update.status = fields.totalSessions - used <= 0 ? "complete" : "active";
  }
  if (fields.pricePence !== undefined && fields.pricePence !== Number(data.pricePence ?? 0)) {
    if (data.paymentStatus === "paid" && data.paidMethod !== "no-charge") {
      return NextResponse.json({ error: "This package is already paid; its price can't change." }, { status: 400 });
    }
    if (fields.pricePence === 0) {
      update.paymentStatus = "paid";
      update.paidMethod = "no-charge";
    } else if (data.paidMethod === "no-charge") {
      update.paymentStatus = data.paymentRequestId ? "link-ready" : "unpaid";
      update.paidMethod = "";
    }
  }

  await db.collection("sessionPackages").doc(id).update(update);
  return NextResponse.json({ ok: true }, { headers: noStore });
}
