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

  try {
    const snap = await db.collection("bookings").where("email", "==", email).get();
    const batch = db.batch();
    snap.docs.forEach((d) => batch.update(d.ref, { patientUid: uid }));
    await batch.commit();
  } catch {
    // Non-blocking — portal access works even if linking fails
  }

  return NextResponse.json({ ok: true });
}
