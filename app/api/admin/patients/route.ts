import { NextResponse } from "next/server";
import { FieldValue, getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { requireAdminRequest } from "@/lib/admin-request";
import { normalizeCarerEmail, normalizeCarerEmails } from "@/lib/carer-access";
import { formatPersonName } from "@/lib/name-format";
import { validateEmail } from "@/lib/validation";
import { isDateKey } from "@/lib/treatment-packages";

// Admin-only. Creates an account for a patient the physio looks after
// directly (for example an elderly home-visit patient who won't sign up
// themselves): a passwordless Firebase Auth user plus their `patients/{uid}`
// record, flagged `createdByAdmin` / `managedByPhysio`. Nothing is emailed —
// the admin sends a sign-in invite separately when they choose to.

function clean(value: unknown, max = 120): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
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

  const name = formatPersonName(clean(body.name), "");
  const email = normalizeCarerEmail(body.email);
  const dob = clean(body.dob, 10);
  const phoneNumber = clean(body.phoneNumber, 30);
  const carerName = clean(body.carerName);
  const carerEmail = normalizeCarerEmail(body.carerEmail);
  const carerRelationship = clean(body.carerRelationship, 40);

  if (!name) return NextResponse.json({ error: "Enter the patient's name." }, { status: 400 });
  if (!email || validateEmail(email) !== null) {
    return NextResponse.json({ error: "Enter a valid email for the patient." }, { status: 400 });
  }
  if (dob && !isDateKey(dob)) return NextResponse.json({ error: "Date of birth is not a valid date." }, { status: 400 });
  const carers = normalizeCarerEmails(carerEmail ? [carerEmail] : [], email);
  if (carers.error) return NextResponse.json({ error: carers.error }, { status: 400 });

  const db = getAdminDb();
  const auth = getAdminAuth();
  if (!db || !auth) return NextResponse.json({ error: "Unavailable" }, { status: 500 });

  // A patient may already have made their own account under another email
  // (e.g. starting a booking online), so an email-only check misses them.
  // Warn first; the admin resends with allowSameName once they've checked.
  if (body.allowSameName !== true) {
    const sameName = await db.collection("patients").where("displayName", "==", name).limit(5).get();
    const possibleDuplicates = sameName.docs
      .map((d) => ({ uid: d.id, name, email: String(d.data().email ?? "") }))
      .filter((d) => d.email.toLowerCase() !== email);
    if (possibleDuplicates.length) {
      return NextResponse.json(
        { error: `There is already an account for ${name}.`, possibleDuplicates },
        { status: 409 },
      );
    }
  }

  let uid: string;
  let existingAccount = false;
  try {
    const existing = await auth.getUserByEmail(email);
    if (existing) {
      uid = existing.uid;
      existingAccount = true;
    } else {
      uid = (await auth.createUser({ email, displayName: name })).uid;
    }
  } catch (error) {
    console.error("admin create patient: auth failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not create the sign-in account." }, { status: 502 });
  }

  const ref = db.collection("patients").doc(uid);
  const snap = await ref.get();
  if (snap.exists) {
    // Never overwrite a record that already exists — send the admin to it.
    return NextResponse.json({ error: "This patient already has an account.", uid, existing: true }, { status: 409 });
  }

  await ref.set({
    uid,
    email,
    displayName: name,
    photoUrl: "",
    authProvider: "admin",
    ...(dob ? { dob } : {}),
    ...(phoneNumber ? { phoneNumber } : {}),
    ...(carers.emails.length
      ? {
          carerEmails: carers.emails,
          carerContact: { name: carerName, email: carers.emails[0], relationship: carerRelationship },
          carerEmailsUpdatedAt: FieldValue.serverTimestamp(),
          carerEmailsUpdatedBy: gate.decoded.email ?? gate.decoded.uid,
        }
      : {}),
    createdByAdmin: true,
    managedByPhysio: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ uid, existingAccount }, { status: 201 });
}
