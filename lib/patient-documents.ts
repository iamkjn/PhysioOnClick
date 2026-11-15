// Shared (client + server) shapes and rules for a patient's private clinical
// history documents (e.g. hospital discharge letters) and their own uploads.
//
// Where things live:
// - Admin-only history: file in Storage `clinical-history/{uid}/…` (no storage
//   rule matches it, so the catch-all denies every client — only the service
//   account reads it) + metadata in Firestore `admin/clinicalHistory/entries`.
//   Never put these under `patients/{uid}/**`: the patient (and anyone using
//   their login) can read that tree.
// - Patient uploads: Storage `patient-uploads/{uid}/…`, written by the patient
//   from components/upload-panel.tsx. The patient can see these.

export const HISTORY_PREFIX = "clinical-history/";
export const UPLOADS_PREFIX = "patient-uploads/";
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

/** Types an admin can upload, and the only types ever served inline. */
export const VIEWABLE_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export const HISTORY_DOCUMENT_TYPES = [
  { value: "discharge-letter", label: "Discharge letter" },
  { value: "referral", label: "Referral letter" },
  { value: "scan-report", label: "Scan / imaging report" },
  { value: "clinic-letter", label: "Clinic letter" },
  { value: "other", label: "Other" },
] as const;

export type HistoryEntry = {
  id: string;
  personId: string;
  type: string;
  title: string;
  documentDate: string;
  source?: string;
  consultant?: string;
  summary?: string;
  pastMedicalHistory?: string;
  physioFlags?: string;
  storagePath: string;
  contentType: string;
  size: number;
  uploadedBy?: string;
  uploadedAt?: string;
};

export type PatientUpload = {
  name: string;
  storagePath: string;
  size: number;
  contentType: string;
  updated: string;
};

export function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

/** Content type to serve for a stored object: only allow-listed types, else a download. */
export function safeContentType(path: string): string {
  return VIEWABLE_TYPES[fileExtension(path)] ?? "application/octet-stream";
}

export function safeFileName(name: string): string {
  const base = name
    .replace(/[/\\]/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return base || "document";
}

/**
 * True when `path` is a document of patient `uid` (history or their uploads).
 * Rejects traversal and anything outside the two prefixes so the file route
 * can't be used to read invoices, exports or another patient's tree by path.
 */
export function isPatientDocumentPath(path: string, uid: string): boolean {
  if (!uid || /[\\]|\.\.|\/\//.test(path) || path.includes("\0")) return false;
  return path.startsWith(`${HISTORY_PREFIX}${uid}/`) || path.startsWith(`${UPLOADS_PREFIX}${uid}/`);
}

/** Strips the `<timestamp>-` prefix upload-panel.tsx adds, for display. */
export function displayUploadName(storagePath: string): string {
  const file = storagePath.slice(storagePath.lastIndexOf("/") + 1);
  return file.replace(/^\d{10,}[-_]/, "");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
