import { NextResponse } from "next/server";
import { resolvePlanAccess } from "@/lib/patient-plan-access";
import { formatDateRange, readTreatmentPackage } from "@/lib/treatment-packages";

// The patient's (or their carer's) view of physio-arranged treatment plans
// that carry a price: total, paid or due. sessionPackages has no client rule,
// so this is the only read path. Never returns the payment token or notes.

export async function GET(request: Request) {
  const owner = new URL(request.url).searchParams.get("owner") ?? "";
  const access = await resolvePlanAccess(request, owner);
  if (!access.ok) return NextResponse.json({ error: "Unavailable" }, { status: access.status });
  if (!access.managedByPhysio) return NextResponse.json({ plans: [] }, { headers: { "Cache-Control": "no-store" } });

  const snap = await access.db.collection("sessionPackages").where("ownerUid", "==", owner).limit(50).get();
  const plans = snap.docs
    .filter((d) => d.data().manual === true)
    .map((d) => readTreatmentPackage(d.id, d.data()))
    .filter((p) => p.pricePence > 0 && p.paidMethod !== "no-charge")
    .map((p) => ({
      id: p.id,
      title: p.title,
      visitType: p.visitType,
      totalSessions: p.totalSessions,
      usedSessions: p.usedSessions,
      datesLine: formatDateRange(p.startDate, p.endDate),
      amountPence: p.pricePence,
      paid: p.paymentStatus === "paid",
      paidAt: p.paidAt,
    }))
    .sort((a, b) => Number(a.paid) - Number(b.paid));

  return NextResponse.json({ plans }, { headers: { "Cache-Control": "no-store" } });
}
