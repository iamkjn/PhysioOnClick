import { NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase-admin";

// Tells a signed-in user whether their account already has a password.
// Accounts made through an emailed sign-in link (portal invites, magic links)
// have none; the client uses this to offer "create a password" after a link
// sign-in and to label the account page's password section.

export async function GET(request: Request) {
  const idToken = (request.headers.get("authorization") || "").replace("Bearer ", "").trim();
  if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const auth = getAdminAuth();
  if (!auth) return NextResponse.json({ error: "Server not configured" }, { status: 500 });

  let uid: string;
  try {
    uid = (await auth.verifyIdToken(idToken)).uid;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const hasPassword = await auth.hasPassword(uid);
    if (hasPassword === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ hasPassword });
  } catch (error) {
    console.error("password-status lookup failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 502 });
  }
}
