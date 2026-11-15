import { NextResponse } from "next/server";
import { FieldValue, getAdminDb, listObjects, uploadObject } from "@/lib/firebase-admin";
import { requireAdminRequest } from "@/lib/admin-request";
import {
  HISTORY_DOCUMENT_TYPES,
  HISTORY_PREFIX,
  MAX_DOCUMENT_BYTES,
  UPLOADS_PREFIX,
  VIEWABLE_TYPES,
  displayUploadName,
  fileExtension,
  safeFileName,
  type HistoryEntry,
  type PatientUpload,
} from "@/lib/patient-documents";

// Admin-only. Lists / adds a patient's private clinical history documents and
// lists the files the patient uploaded to their own account. See
// lib/patient-documents.ts for where each lives and why.

const UID_RE = /^[A-Za-z0-9_-]{6,128}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const noStore = { "Cache-Control": "private, no-store" };

function entriesCollection() {
  const db = getAdminDb();
  return db ? db.collection("admin").doc("clinicalHistory").collection("entries") : null;
}

function toIso(value: unknown): string | undefined {
  if (value && typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof value === "string" ? value : undefined;
}

type UploadedFile = { name: string; size: number; type: string; arrayBuffer(): Promise<ArrayBuffer> };

function isUploadedFile(value: unknown): value is UploadedFile {
  return (
    typeof value === "object" && value !== null &&
    typeof (value as UploadedFile).name === "string" &&
    typeof (value as UploadedFile).size === "number" &&
    typeof (value as UploadedFile).arrayBuffer === "function"
  );
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export async function GET(request: Request) {
  const gate = await requireAdminRequest(request);
  if ("error" in gate) return gate.error;

  const url = new URL(request.url);
  const uid = url.searchParams.get("uid") ?? "";
  const personId = url.searchParams.get("person") || uid;
  if (!UID_RE.test(uid) || !UID_RE.test(personId)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const col = entriesCollection();
  if (!col) return NextResponse.json({ error: "Unavailable" }, { status: 500 });

  const snap = await col.where("patientUid", "==", uid).get();
  const history: HistoryEntry[] = snap.docs
    .map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        // Entries written before personId existed belong to the account holder.
        personId: str(d.personId) ?? uid,
        type: str(d.type) ?? "other",
        title: str(d.title) ?? "Document",
        documentDate: str(d.documentDate) ?? "",
        source: str(d.source),
        consultant: str(d.consultant),
        summary: str(d.summary),
        pastMedicalHistory: str(d.pastMedicalHistory),
        physioFlags: str(d.physioFlags),
        storagePath: str(d.storagePath) ?? "",
        contentType: str(d.contentType) ?? "application/octet-stream",
        size: typeof d.size === "number" ? d.size : 0,
        uploadedBy: str(d.uploadedBy),
        uploadedAt: toIso(d.uploadedAt),
      };
    })
    .filter((e) => e.personId === personId)
    .sort((a, b) => (b.documentDate || "").localeCompare(a.documentDate || ""));

  // Patient uploads are account-level (no person), so only show them on the
  // account holder's view.
  let uploads: PatientUpload[] = [];
  if (personId === uid) {
    const objects = await listObjects(`${UPLOADS_PREFIX}${uid}/`);
    uploads = objects
      .map((o) => ({
        name: displayUploadName(o.name),
        storagePath: o.name,
        size: o.size,
        contentType: o.contentType,
        updated: o.updated,
      }))
      .sort((a, b) => b.updated.localeCompare(a.updated));
  }

  return NextResponse.json({ history, uploads }, { headers: noStore });
}

export async function POST(request: Request) {
  const gate = await requireAdminRequest(request);
  if ("error" in gate) return gate.error;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a multipart form" }, { status: 400 });
  }

  const uid = String(form.get("uid") ?? "");
  const personId = String(form.get("personId") || uid);
  const title = String(form.get("title") ?? "").trim();
  const documentDate = String(form.get("documentDate") ?? "").trim();
  const type = String(form.get("type") ?? "other");
  const summary = String(form.get("summary") ?? "").trim();
  const physioFlags = String(form.get("physioFlags") ?? "").trim();
  const source = String(form.get("source") ?? "").trim();
  const file = form.get("file");

  if (!UID_RE.test(uid) || !UID_RE.test(personId)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (title.length < 2 || title.length > 160) {
    return NextResponse.json({ error: "Give the document a title." }, { status: 400 });
  }
  if (!DATE_RE.test(documentDate)) {
    return NextResponse.json({ error: "Give the document date." }, { status: 400 });
  }
  if (!HISTORY_DOCUMENT_TYPES.some((t) => t.value === type)) {
    return NextResponse.json({ error: "Unknown document type." }, { status: 400 });
  }
  if (summary.length > 4000 || physioFlags.length > 2000 || source.length > 200) {
    return NextResponse.json({ error: "Text is too long." }, { status: 400 });
  }
  // Duck-typed rather than `instanceof File`: the File class formData() hands
  // back isn't always the global one (undici vs. other realms).
  if (!isUploadedFile(file) || file.size === 0) {
    return NextResponse.json({ error: "Attach the document file." }, { status: 400 });
  }
  const contentType = VIEWABLE_TYPES[fileExtension(file.name)];
  if (!contentType || (file.type && file.type !== contentType)) {
    return NextResponse.json({ error: "Upload a PDF, PNG, JPG or WEBP file." }, { status: 400 });
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return NextResponse.json({ error: "Choose a file smaller than 10 MB." }, { status: 400 });
  }

  const col = entriesCollection();
  if (!col) return NextResponse.json({ error: "Unavailable" }, { status: 500 });

  const storagePath = `${HISTORY_PREFIX}${uid}/${documentDate}-${Date.now()}-${safeFileName(file.name)}`;
  const uploaded = await uploadObject(storagePath, new Uint8Array(await file.arrayBuffer()), contentType);
  if (!uploaded.ok) return NextResponse.json({ error: "Upload failed. Try again." }, { status: 502 });

  const ref = await col.add({
    patientUid: uid,
    personId,
    visibility: "admin-only",
    type,
    title,
    documentDate,
    ...(source ? { source } : {}),
    ...(summary ? { summary } : {}),
    ...(physioFlags ? { physioFlags } : {}),
    storagePath,
    contentType,
    size: file.size,
    uploadedBy: gate.decoded.email ?? "",
    uploadedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: ref.id, storagePath }, { status: 201, headers: noStore });
}
