import { NextResponse } from "next/server";
import { FieldValue, getAdminDb } from "@/lib/firebase-admin";
import { requireAdminRequest } from "@/lib/admin-request";
import { UID_RE, noStore, parsePackageFields } from "@/lib/admin-packages-server";
import { readTreatmentPackage } from "@/lib/treatment-packages";

// Admin-only. Physio-arranged treatment packages (sessionPackages with
// manual: true). sessionPackages has no client rule, so the admin UI goes
// through these routes rather than the client SDK.

export async function GET(request: Request) {
  const gate = await requireAdminRequest(request);
  if ("error" in gate) return gate.error;

  const url = new URL(request.url);
  const uid = url.searchParams.get("uid") ?? "";
  const personId = url.searchParams.get("person") || uid;
  if (!UID_RE.test(uid) || !UID_RE.test(personId)) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Unavailable" }, { status: 500 });

  const snap = await db.collection("sessionPackages").where("ownerUid", "==", uid).limit(50).get();
  const packages = snap.docs
    .map((d) => ({ raw: d.data(), pkg: readTreatmentPackage(d.id, d.data()) }))
    .filter(({ raw, pkg }) => raw.manual === true && (pkg.patientId || uid) === personId)
    .map(({ pkg }) => pkg)
    .sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));

  return NextResponse.json({ packages }, { headers: noStore });
}

export async function POST(request: Request) {
  const gate = await requireAdminRequest(request);
  if ("error" in gate) return gate.error;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const uid = typeof body.uid === "string" ? body.uid : "";
  const personId = typeof body.personId === "string" && body.personId ? body.personId : uid;
  if (!UID_RE.test(uid) || !UID_RE.test(personId)) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const { fields, error } = parsePackageFields(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Unavailable" }, { status: 500 });

  const patientSnap = await db.collection("patients").doc(uid).get();
  if (!patientSnap.exists) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  const patient = patientSnap.data() ?? {};
  let patientName = typeof patient.displayName === "string" ? patient.displayName : "";
  if (personId !== uid) {
    const dep = await db.collection("dependents").doc(personId).get();
    if (!dep.exists || dep.data()?.ownerId !== uid) return NextResponse.json({ error: "Person not found" }, { status: 404 });
    patientName = String(dep.data()?.name ?? patientName);
  }

  const ref = await db.collection("sessionPackages").add({
    ownerUid: uid,
    patientId: personId,
    patientName,
    email: typeof patient.email === "string" ? patient.email : "",
    ...fields,
    usedSessions: 0,
    remainingSessions: fields.totalSessions,
    status: "active",
    manual: true,
    paymentStatus: (fields.pricePence ?? 0) > 0 ? "unpaid" : "paid",
    ...((fields.pricePence ?? 0) > 0 ? {} : { paidMethod: "no-charge" }),
    bookingUids: [],
    createdBy: gate.decoded.email ?? gate.decoded.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: ref.id }, { status: 201, headers: noStore });
}
