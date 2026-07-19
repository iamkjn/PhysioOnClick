import { NextResponse } from "next/server";

import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const idToken = authHeader.replace("Bearer ", "").trim();
  if (!idToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminAuth = getAdminAuth();
  const db = getAdminDb();
  if (!adminAuth || !db) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  let uid: string;
  let email: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    uid = decoded.uid;
    email = decoded.email || "";
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (!email) {
    return NextResponse.json({ ok: true }); // no email, nothing to link
  }

  // Normalize to match the lowercase/trimmed email the webhook now writes on
  // new bookings. Historical booking docs written before that fix may still
  // hold mixed-case emails and won't match this query — see route notes.
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const snap = await db.collection("bookings").where("email", "==", normalizedEmail).get();
    const batch = db.batch();
    snap.docs.forEach((d) => {
      const data = d.data();
      // bookedBy is what getPatientBookings() and firestore.rules actually check —
      // a prior version wrote patientUid here instead, which meant guest bookings
      // never linked to the account after sign-up.
      batch.update(d.ref, {
        bookedBy: uid,
        patientType: data.patientType ?? "self",
        patientId: data.patientId ?? uid,
      });
    });
    await batch.commit();
  } catch {
    // Non-blocking — portal access works even if linking fails
  }

  return NextResponse.json({ ok: true });
}
