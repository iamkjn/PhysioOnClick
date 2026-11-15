import { NextResponse } from "next/server";
import { DecodedIdToken, getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { carerRelationshipFor, normalizeCarerEmail, type CaredForPatient } from "@/lib/carer-access";
import { formatPersonName } from "@/lib/name-format";

// Lists the patients the signed-in user is a carer for (lib/carer-access.ts):
// every patients/{uid} whose admin-managed `carerEmails` contains the caller's
// verified email. Server-side on purpose: carers have no read on the patient
// doc itself (it holds phone, DOB, address ids…), so this returns only what
// the person switcher needs — uid, display name and relationship.
export async function GET(request: Request) {
  const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const auth = getAdminAuth();
  const db = getAdminDb();
  if (!auth || !db) return NextResponse.json({ error: "Unavailable" }, { status: 500 });

  let decoded: DecodedIdToken;
  try {
    decoded = await auth.verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Same bar as firestore.rules isCarerOf(): an unverified email (e.g. a
  // password sign-up nobody confirmed) must never unlock someone's record.
  const email = normalizeCarerEmail(decoded.email);
  if (!email || decoded.email_verified !== true) {
    return NextResponse.json({ patients: [] });
  }

  try {
    const snap = await db.collection("patients").where("carerEmails", "array-contains", email).get();
    const patients: CaredForPatient[] = snap.docs
      .filter((d) => d.id !== decoded.uid)
      .map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          name: formatPersonName(data.displayName as string | undefined, "Patient"),
          relationship: carerRelationshipFor(data, email),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ patients });
  } catch (error) {
    console.error("carer-links lookup failed", error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
