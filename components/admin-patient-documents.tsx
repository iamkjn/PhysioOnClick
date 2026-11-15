// components/admin-patient-documents.tsx
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { FileText, Lock, TriangleAlert } from "lucide-react";
import { auth } from "@/lib/firebase";
import { SkeletonRow } from "@/components/skeleton";
import { useToast } from "@/components/toast-provider";
import {
  HISTORY_DOCUMENT_TYPES,
  displayUploadName,
  formatBytes,
  type HistoryEntry,
  type PatientUpload,
} from "@/lib/patient-documents";

interface Props {
  patientUid: string;
  personId: string;
}

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  HISTORY_DOCUMENT_TYPES.map((t) => [t.value, t.label]),
);

function formatDate(value: string): string {
  if (!value) return "";
  const d = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

async function idToken(): Promise<string> {
  const token = await auth?.currentUser?.getIdToken().catch(() => null);
  if (!token) throw new Error("Not signed in");
  return token;
}

async function fetchDocuments(
  patientUid: string,
  personId: string,
): Promise<{ history: HistoryEntry[]; uploads: PatientUpload[]; error: boolean }> {
  try {
    const params = new URLSearchParams({ uid: patientUid, person: personId });
    const res = await fetch(`/api/admin/patient-documents?${params}`, {
      headers: { Authorization: `Bearer ${await idToken()}` },
    });
    if (!res.ok) throw new Error(String(res.status));
    const json = (await res.json()) as { history: HistoryEntry[]; uploads: PatientUpload[] };
    return { history: json.history, uploads: json.uploads, error: false };
  } catch {
    return { history: [], uploads: [], error: true };
  }
}

export function AdminPatientDocuments({ patientUid, personId }: Props) {
  const toast = useToast();
  // Keyed by patient+person so switching person (PersonSwitcher) shows the
  // skeleton again instead of the previous person's documents, without a
  // synchronous setState reset inside the effect.
  const key = `${patientUid}|${personId}`;
  const [loaded, setLoaded] = useState<{
    key: string;
    history: HistoryEntry[];
    uploads: PatientUpload[];
    error: boolean;
  } | null>(null);
  const current = loaded?.key === key ? loaded : null;
  const history = current ? current.history : null;
  const uploads = current?.uploads ?? [];
  const loadError = current?.error ?? false;
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const isAccountHolder = personId === patientUid;

  const load = useCallback(async () => {
    const result = await fetchDocuments(patientUid, personId);
    setLoaded({ key: `${patientUid}|${personId}`, ...result });
  }, [patientUid, personId]);

  useEffect(() => {
    // Ignore a slow response for a person the admin has already switched away from.
    let cancelled = false;
    fetchDocuments(patientUid, personId).then((result) => {
      if (!cancelled) setLoaded({ key: `${patientUid}|${personId}`, ...result });
    });
    return () => {
      cancelled = true;
    };
  }, [patientUid, personId]);

  async function openDocument(storagePath: string) {
    // Open the tab synchronously (inside the click) so popup blockers allow it,
    // then point it at the fetched file once it arrives.
    const win = window.open("", "_blank");
    try {
      const params = new URLSearchParams({ uid: patientUid, path: storagePath });
      const res = await fetch(`/api/admin/patient-documents/file?${params}`, {
        headers: { Authorization: `Bearer ${await idToken()}` },
      });
      if (!res.ok) throw new Error(String(res.status));
      const type = res.headers.get("Content-Type") ?? "application/octet-stream";
      const url = URL.createObjectURL(new Blob([await res.blob()], { type }));
      if (win && type !== "application/octet-stream") {
        win.location.href = url;
      } else {
        win?.close();
        const a = document.createElement("a");
        a.href = url;
        a.download = displayUploadName(storagePath);
        a.click();
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      win?.close();
      toast.show("Could not open the document. Try again.", "error");
    }
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("uid", patientUid);
    data.set("personId", personId);
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch("/api/admin/patient-documents", {
        method: "POST",
        headers: { Authorization: `Bearer ${await idToken()}` },
        body: data,
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setFormError(json.error ?? "Could not save the document. Try again.");
        return;
      }
      form.reset();
      setAdding(false);
      toast.show("Document added to private history.", "success");
      await load();
    } catch {
      setFormError("Could not save the document. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel admin-patient-card stack" aria-labelledby="patient-documents-title">
      <div className="admin-patient-section-head">
        <div>
          <span className="dashboard-eyebrow admin-docs-eyebrow">
            <Lock aria-hidden="true" /> Private · admins only
          </span>
          <h2 id="patient-documents-title">History &amp; documents</h2>
        </div>
        <button
          type="button"
          className="button small secondary"
          aria-expanded={adding}
          onClick={() => {
            setAdding((v) => !v);
            setFormError("");
          }}
        >
          {adding ? "Cancel" : "Add document"}
        </button>
      </div>
      <p className="muted admin-docs-note">
        Hospital letters and reports for your reference. Never shown in the patient&apos;s app or to
        anyone using their login.
      </p>

      {adding && (
        <form className="assessment-review-form admin-docs-form" onSubmit={(e) => void handleAdd(e)}>
          <label>
            Title
            <input className="input" name="title" required minLength={2} maxLength={160} placeholder="e.g. Discharge letter, Crosshouse" />
          </label>
          <label>
            Document date
            <input className="input" name="documentDate" type="date" required />
          </label>
          <label>
            Type
            <select className="input" name="type" defaultValue="discharge-letter">
              {HISTORY_DOCUMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
          <label>
            From (hospital / clinic)
            <input className="input" name="source" maxLength={200} />
          </label>
          <label className="admin-docs-wide">
            Summary
            <textarea className="input" name="summary" rows={3} maxLength={4000} />
          </label>
          <label className="admin-docs-wide">
            Physio flags (precautions, red flags)
            <textarea className="input" name="physioFlags" rows={2} maxLength={2000} />
          </label>
          <label className="admin-docs-wide">
            File (PDF, PNG, JPG or WEBP, up to 10 MB)
            <input className="input" name="file" type="file" required accept=".pdf,.png,.jpg,.jpeg,.webp" />
          </label>
          {formError && <span className="field-error admin-docs-wide" role="alert">{formError}</span>}
          <div className="admin-docs-wide">
            <button type="submit" className="button small" disabled={saving}>
              {saving ? "Saving…" : "Save to private history"}
            </button>
          </div>
        </form>
      )}

      {history === null ? (
        <SkeletonRow count={2} />
      ) : loadError ? (
        <p className="field-error" role="alert" style={{ margin: 0 }}>
          Could not load documents.{" "}
          <button
            type="button"
            className="admin-outline-action"
            onClick={() => {
              setLoaded(null);
              void load();
            }}
          >
            Retry
          </button>
        </p>
      ) : history.length === 0 ? (
        <p className="muted" style={{ margin: 0, fontSize: "var(--text-sm)" }}>No history documents yet.</p>
      ) : (
        <ul className="admin-docs-list">
          {history.map((entry) => (
            <li key={entry.id} className="admin-doc-row">
              <div className="admin-doc-head">
                <span className="admin-patient-booking-icon" aria-hidden="true"><FileText /></span>
                <div>
                  <strong>{entry.title}</strong>
                  <span>
                    {[TYPE_LABEL[entry.type] ?? "Document", formatDate(entry.documentDate), entry.source]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
                <button
                  type="button"
                  className="button small"
                  onClick={() => void openDocument(entry.storagePath)}
                  aria-label={`View ${entry.title}`}
                >
                  View
                </button>
              </div>
              {entry.physioFlags && (
                <div className="admin-doc-flags">
                  <TriangleAlert aria-hidden="true" />
                  <p><strong>Physio flags:</strong> {entry.physioFlags}</p>
                </div>
              )}
              {(entry.summary || entry.pastMedicalHistory || entry.consultant) && (
                <details className="admin-doc-details">
                  <summary>Summary and medical history</summary>
                  {entry.summary && <p>{entry.summary}</p>}
                  {entry.pastMedicalHistory && (
                    <p><strong>Past medical history:</strong> {entry.pastMedicalHistory}</p>
                  )}
                  {entry.consultant && <p><strong>Consultant:</strong> {entry.consultant}</p>}
                </details>
              )}
            </li>
          ))}
        </ul>
      )}

      {isAccountHolder && history !== null && !loadError && (
        <div className="stack admin-docs-uploads">
          <h3>Files on their account</h3>
          <p className="muted admin-docs-note">Uploaded to the patient&apos;s own account. The patient can see these.</p>
          {uploads.length === 0 ? (
            <p className="muted" style={{ margin: 0, fontSize: "var(--text-sm)" }}>No files uploaded.</p>
          ) : (
            <ul className="admin-docs-list">
              {uploads.map((file) => (
                <li key={file.storagePath} className="admin-doc-row">
                  <div className="admin-doc-head">
                    <span className="admin-patient-booking-icon" aria-hidden="true"><FileText /></span>
                    <div>
                      <strong>{file.name}</strong>
                      <span>{[formatDate(file.updated), formatBytes(file.size)].filter(Boolean).join(" · ")}</span>
                    </div>
                    <button
                      type="button"
                      className="button small secondary"
                      onClick={() => void openDocument(file.storagePath)}
                      aria-label={`View ${file.name}`}
                    >
                      View
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
