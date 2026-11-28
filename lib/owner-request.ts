import { NextResponse } from "next/server";
import type { DecodedIdToken } from "@/lib/firebase-admin";
import { requireAdminRequest } from "@/lib/admin-request";
import { OWNER_EMAIL } from "@/lib/owner";

/** Admin AND the practice owner's own account. Other admins get 403. */
export async function requireOwnerRequest(
  request: Request,
): Promise<{ decoded: DecodedIdToken } | { error: NextResponse }> {
  const gate = await requireAdminRequest(request);
  if ("error" in gate) return gate;
  const owner = (process.env.OWNER_EMAIL || process.env.ADMIN_EMAIL || OWNER_EMAIL).toLowerCase();
  if ((gate.decoded.email ?? "").toLowerCase() !== owner) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return gate;
}
