import { NextResponse } from "next/server";
import { downloadObject } from "@/lib/firebase-admin";
import { requireAdminRequest } from "@/lib/admin-request";
import { isPatientDocumentPath, safeContentType, safeFileName } from "@/lib/patient-documents";

// Admin-only. Streams one of a patient's documents (private history or their
// own uploads) for viewing. The type is re-derived from the extension against
// an allow-list rather than trusted from storage metadata: patient uploads are
// user-supplied, and anything not on the list goes out as a download, never
// rendered inline on our origin.
export async function GET(request: Request) {
  const gate = await requireAdminRequest(request);
  if ("error" in gate) return gate.error;

  const url = new URL(request.url);
  const uid = url.searchParams.get("uid") ?? "";
  const path = url.searchParams.get("path") ?? "";
  if (!isPatientDocumentPath(path, uid)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const bytes = await downloadObject(path);
  if (!bytes) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contentType = safeContentType(path);
  const inline = contentType !== "application/octet-stream";
  const filename = safeFileName(path.slice(path.lastIndexOf("/") + 1));

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
