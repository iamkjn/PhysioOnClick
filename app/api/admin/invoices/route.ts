import { NextResponse } from "next/server";

import { listInvoices } from "@/app/admin/actions";

/**
 * Thin REST wrapper around the `listInvoices` server action, for the mobile
 * app (which can't call Next.js Server Actions directly). Auth: `Authorization:
 * Bearer <idToken>` — `listInvoices` itself verifies admin access.
 */
export async function GET(request: Request) {
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await listInvoices(token);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ invoices: result.invoices });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
