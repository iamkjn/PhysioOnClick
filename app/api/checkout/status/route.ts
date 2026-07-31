import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id") ?? "";
  if (!sessionId) return NextResponse.json({ status: "pending" }, { status: 200 });

  const db = getAdminDb();
  if (!db) return NextResponse.json({ status: "pending" }, { status: 200 });

  const snap = await db
    .collection("payments")
    .where("stripeSessionId", "==", sessionId)
    .limit(1)
    .get();

  if (snap.empty) return NextResponse.json({ status: "pending" }, { status: 200 });

  const pay = snap.docs[0].data() as {
    status?: string;
    service?: string;
    calBookingUid?: string;
    invoiceNumber?: string;
    paidAt?: string;
  };
  return NextResponse.json(
    {
      status: pay.status ?? "pending",
      service: pay.service,
      calBookingUid: pay.calBookingUid,
      invoiceNumber: pay.invoiceNumber,
      paidAt: pay.paidAt,
    },
    { status: 200 }
  );
}
