// components/admin-treatment-packages.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, Copy, Link2, Mail, Package, Pencil, Plus } from "lucide-react";
import { auth } from "@/lib/firebase";
import { formatPounds } from "@/lib/home-visit-pricing";
import {
  PAYMENT_STATUS_LABEL,
  daysInclusive,
  formatDateRange,
  suggestedPackagePricePence,
  type TreatmentPackage,
} from "@/lib/treatment-packages";
import { todayKey } from "@/lib/recovery";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SkeletonRow } from "@/components/skeleton";
import { useToast } from "@/components/toast-provider";

interface Props {
  patientUid: string;
  personId: string;
  patientName: string;
  /** Called after a visit is recorded so the bookings list can refresh. */
  onVisitRecorded?: () => void;
  /** Reports the loaded packages (admin summary: planned visits, amount due). */
  onPackagesChange?: (packages: TreatmentPackage[]) => void;
}

type FormState = {
  title: string;
  visitType: "home" | "video";
  totalSessions: string;
  includesAssessment: boolean;
  startDate: string;
  endDate: string;
  price: string; // pounds, as typed
  notes: string;
};

const EMPTY_FORM: FormState = {
  title: "Home visit treatment plan",
  visitType: "home",
  totalSessions: "4",
  includesAssessment: true,
  startDate: "",
  endDate: "",
  price: "",
  notes: "",
};

async function adminFetch(path: string, init?: RequestInit) {
  const token = await auth?.currentUser?.getIdToken().catch(() => null);
  if (!token) throw new Error("You're signed out. Sign in again.");
  const res = await fetch(path, {
    ...init,
    headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : "Something went wrong.");
  return json;
}

function toForm(p: TreatmentPackage): FormState {
  return {
    title: p.title,
    visitType: p.visitType,
    totalSessions: String(p.totalSessions),
    includesAssessment: p.includesAssessment,
    startDate: p.startDate,
    endDate: p.endDate,
    price: p.pricePence ? String(p.pricePence / 100) : "0",
    notes: p.notes,
  };
}

function suggestion(form: FormState): number {
  return suggestedPackagePricePence({
    sessions: Number(form.totalSessions) || 0,
    visitType: form.visitType,
    includesAssessment: form.includesAssessment,
  });
}

export function AdminTreatmentPackages({ patientUid, personId, patientName, onVisitRecorded, onPackagesChange }: Props) {
  const toast = useToast();
  const [packages, setPackages] = useState<TreatmentPackage[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [recording, setRecording] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [sendTarget, setSendTarget] = useState<TreatmentPackage | null>(null);
  const [paidTarget, setPaidTarget] = useState<TreatmentPackage | null>(null);
  const [paidMethod, setPaidMethod] = useState("bank-transfer");

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const json = await adminFetch(
        `/api/admin/packages?uid=${encodeURIComponent(patientUid)}&person=${encodeURIComponent(personId)}`,
      );
      const list = (json.packages as TreatmentPackage[]) ?? [];
      setPackages(list);
      onPackagesChange?.(list);
    } catch {
      setPackages([]);
      setLoadError(true);
    }
  }, [patientUid, personId, onPackagesChange]);

  useEffect(() => {
    setPackages(null);
    setEditing(null);
    setRecording(null);
    void load();
  }, [load]);

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "Something went wrong.", "error");
    } finally {
      setBusy(null);
    }
  }

  async function createLink(p: TreatmentPackage) {
    await run(`link:${p.id}`, async () => {
      const json = await adminFetch(`/api/admin/packages/${p.id}/payment`, {
        method: "POST",
        body: JSON.stringify({ action: "create-link" }),
      });
      await load();
      const url = String(json.url ?? "");
      await navigator.clipboard?.writeText(url).catch(() => {});
      toast.show("Payment link ready and copied. It has NOT been sent.", "success");
    });
  }

  async function sendLink(p: TreatmentPackage) {
    await run(`send:${p.id}`, async () => {
      const json = await adminFetch(`/api/admin/packages/${p.id}/payment`, {
        method: "POST",
        body: JSON.stringify({ action: "send-link" }),
      });
      const sent = (json.sent as string[]) ?? [];
      const failed = (json.failed as string[]) ?? [];
      toast.show(
        failed.length ? `Sent to ${sent.join(", ")}. Failed: ${failed.join(", ")}.` : `Payment link emailed to ${sent.join(", ")}.`,
        failed.length ? "error" : "success",
      );
      await load();
    });
  }

  async function markPaid(p: TreatmentPackage, method: string) {
    await run(`paid:${p.id}`, async () => {
      await adminFetch(`/api/admin/packages/${p.id}/payment`, {
        method: "POST",
        body: JSON.stringify({ action: "mark-paid", method }),
      });
      toast.show("Marked as paid.", "success");
      await load();
    });
  }

  return (
    <section className="panel stack admin-packages" aria-labelledby="admin-packages-title">
      <div className="admin-packages__head">
        <div>
          <h2 id="admin-packages-title"><Package aria-hidden="true" /> Treatment packages</h2>
          <p className="muted admin-packages__hint">
            Plans you arrange yourself. Record each visit here; the patient sees &quot;N of M used&quot; but can&apos;t
            book from it. Payment links are only emailed when you press &quot;Email link&quot;.
          </p>
        </div>
        {editing !== "new" && (
          <button type="button" className="button small secondary" onClick={() => setEditing("new")}>
            <Plus aria-hidden="true" /> New package
          </button>
        )}
      </div>

      {editing === "new" && (
        <PackageForm
          initial={EMPTY_FORM}
          submitLabel="Create package"
          onCancel={() => setEditing(null)}
          onSubmit={async (body) => {
            await adminFetch("/api/admin/packages", {
              method: "POST",
              body: JSON.stringify({ uid: patientUid, personId, ...body }),
            });
            toast.show("Package created.", "success");
            setEditing(null);
            await load();
          }}
        />
      )}

      {packages === null ? (
        <SkeletonRow count={2} />
      ) : loadError ? (
        <p className="muted admin-packages__hint">Couldn&apos;t load packages. Refresh to try again.</p>
      ) : packages.length === 0 && editing !== "new" ? (
        <p className="muted admin-packages__hint">No physio-arranged packages for {patientName || "this patient"} yet.</p>
      ) : (
        <ul className="admin-packages__list">
          {packages.map((p) => {
            const dates = formatDateRange(p.startDate, p.endDate);
            const paid = p.paymentStatus === "paid";
            return (
              <li key={p.id} className="admin-package-card">
                {editing === p.id ? (
                  <PackageForm
                    initial={toForm(p)}
                    submitLabel="Save changes"
                    priceLocked={paid && p.paidMethod !== "no-charge"}
                    onCancel={() => setEditing(null)}
                    onSubmit={async (body) => {
                      await adminFetch(`/api/admin/packages/${p.id}`, { method: "PATCH", body: JSON.stringify(body) });
                      toast.show("Package updated.", "success");
                      setEditing(null);
                      await load();
                    }}
                  />
                ) : (
                  <>
                    <div className="admin-package-card__top">
                      <div>
                        <h3>{p.title}</h3>
                        <p className="muted">
                          {p.visitType === "home" ? "Home visits" : "Video sessions"}
                          {dates ? ` · ${dates}` : ""}
                        </p>
                      </div>
                      <button type="button" className="text-button" onClick={() => setEditing(p.id)} aria-label={`Edit ${p.title}`}>
                        <Pencil aria-hidden="true" /> Edit
                      </button>
                    </div>

                    <div className="admin-package-card__stats">
                      <span><strong>{p.usedSessions}</strong> of {p.totalSessions} done</span>
                      <span><strong>{p.remainingSessions}</strong> remaining</span>
                      <span><strong>{p.pricePence ? formatPounds(p.pricePence) : "No charge"}</strong></span>
                      <span className={`admin-package-pay admin-package-pay--${p.paymentStatus}`}>
                        {p.paidMethod === "no-charge" ? "No charge" : PAYMENT_STATUS_LABEL[p.paymentStatus]}
                        {paid && p.paidMethod && p.paidMethod !== "no-charge" ? ` (${p.paidMethod.replace("-", " ")})` : ""}
                      </span>
                    </div>
                    {p.notes && <p className="admin-package-card__notes">{p.notes}</p>}

                    {p.paymentUrl && !paid && (
                      <div className="admin-package-link">
                        <code>{p.paymentUrl}</code>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() =>
                            void navigator.clipboard
                              ?.writeText(p.paymentUrl)
                              .then(() => toast.show("Link copied.", "success"))
                              .catch(() => toast.show("Couldn't copy. Select the link and copy it.", "error"))
                          }
                        >
                          <Copy aria-hidden="true" /> Copy
                        </button>
                      </div>
                    )}

                    {recording === p.id ? (
                      <VisitForm
                        onCancel={() => setRecording(null)}
                        onSubmit={async (body) => {
                          const json = await adminFetch(`/api/admin/packages/${p.id}/visit`, {
                            method: "POST",
                            body: JSON.stringify(body),
                          });
                          toast.show(`Session ${json.sessionNumber} of ${p.totalSessions} recorded.`, "success");
                          setRecording(null);
                          await load();
                          onVisitRecorded?.();
                        }}
                      />
                    ) : (
                      <div className="admin-package-card__actions">
                        <button
                          type="button"
                          className="button small primary"
                          disabled={p.remainingSessions <= 0}
                          onClick={() => setRecording(p.id)}
                        >
                          <CalendarCheck aria-hidden="true" /> {p.remainingSessions <= 0 ? "All sessions recorded" : "Record visit done"}
                        </button>
                        {!paid && p.pricePence > 0 && !p.paymentUrl && (
                          <button type="button" className="button small secondary" disabled={busy === `link:${p.id}`} onClick={() => void createLink(p)}>
                            <Link2 aria-hidden="true" /> {busy === `link:${p.id}` ? "Creating…" : "Create payment link"}
                          </button>
                        )}
                        {!paid && p.paymentUrl && (
                          <button type="button" className="button small secondary" disabled={busy === `send:${p.id}`} onClick={() => setSendTarget(p)}>
                            <Mail aria-hidden="true" /> {busy === `send:${p.id}` ? "Sending…" : p.paymentStatus === "link-sent" ? "Email link again" : "Email link"}
                          </button>
                        )}
                        {!paid && p.pricePence > 0 && (
                          <button type="button" className="text-button" disabled={busy === `paid:${p.id}`} onClick={() => setPaidTarget(p)}>
                            Mark as paid…
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        isOpen={sendTarget !== null}
        title="Email the payment link?"
        body={
          sendTarget
            ? `Emails ${patientName || "the patient"} and any carers on their record a link to pay ${formatPounds(sendTarget.pricePence)} for "${sendTarget.title}".`
            : ""
        }
        confirmLabel="Send email"
        onCancel={() => setSendTarget(null)}
        onConfirm={() => {
          const target = sendTarget;
          setSendTarget(null);
          if (target) void sendLink(target);
        }}
      />

      {paidTarget && (
        <div className="admin-package-paid-dialog panel stack" role="dialog" aria-label="Mark as paid">
          <p>
            Record that {formatPounds(paidTarget.pricePence)} for &quot;{paidTarget.title}&quot; was paid another way.
          </p>
          <label>
            How was it paid?
            <select className="input" value={paidMethod} onChange={(e) => setPaidMethod(e.target.value)}>
              <option value="bank-transfer">Bank transfer</option>
              <option value="cash">Cash</option>
              <option value="card-in-person">Card in person</option>
              <option value="other">Other</option>
            </select>
          </label>
          <div className="admin-package-card__actions">
            <button
              type="button"
              className="button small primary"
              onClick={() => {
                const target = paidTarget;
                setPaidTarget(null);
                void markPaid(target, paidMethod);
              }}
            >
              Mark as paid
            </button>
            <button type="button" className="text-button" onClick={() => setPaidTarget(null)}>Cancel</button>
          </div>
        </div>
      )}
    </section>
  );
}

function PackageForm({
  initial,
  submitLabel,
  priceLocked = false,
  onSubmit,
  onCancel,
}: {
  initial: FormState;
  submitLabel: string;
  priceLocked?: boolean;
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [priceTouched, setPriceTouched] = useState(initial.price !== "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const listPrice = suggestion(form);
  const shownPrice = priceTouched ? form.price : String(listPrice / 100);
  const span = daysInclusive(form.startDate, form.endDate);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const pounds = Number(shownPrice);
    if (!Number.isFinite(pounds) || pounds < 0) {
      setError("Enter a valid price.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        title: form.title,
        visitType: form.visitType,
        totalSessions: Number(form.totalSessions),
        includesAssessment: form.includesAssessment,
        startDate: form.startDate,
        endDate: form.endDate,
        notes: form.notes,
        ...(priceLocked ? {} : { pricePence: Math.round(pounds * 100) }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-package-form stack" onSubmit={(e) => void submit(e)}>
      <div className="admin-package-form__grid">
        <label className="admin-package-form__wide">
          Package name
          <input className="input" required maxLength={100} value={form.title} onChange={(e) => update("title", e.target.value)} />
        </label>
        <label>
          Visit type
          <select className="input" value={form.visitType} onChange={(e) => update("visitType", e.target.value as "home" | "video")}>
            <option value="home">Home visit</option>
            <option value="video">Video</option>
          </select>
        </label>
        <label>
          Number of sessions
          <input className="input" type="number" min={1} max={60} required value={form.totalSessions} onChange={(e) => update("totalSessions", e.target.value)} />
        </label>
        <label>
          Start date
          <input className="input" type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
        </label>
        <label>
          End date
          <input className="input" type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} />
        </label>
        <label className="admin-package-form__check">
          <input type="checkbox" checked={form.includesAssessment} onChange={(e) => update("includesAssessment", e.target.checked)} />
          First session is the initial assessment
        </label>
        <label>
          Price (£)
          <input
            className="input"
            type="number"
            min={0}
            step="0.01"
            disabled={priceLocked}
            value={shownPrice}
            onChange={(e) => {
              setPriceTouched(true);
              update("price", e.target.value);
            }}
          />
          <span className="muted admin-package-form__help">
            {priceLocked ? "Paid — price locked." : `Site prices would be ${formatPounds(listPrice)}. Set 0 for no charge.`}
          </span>
        </label>
        <label className="admin-package-form__wide">
          Notes (admin only)
          <input className="input" maxLength={600} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
        </label>
      </div>
      {span > 0 && <p className="muted admin-package-form__help">{span} day{span === 1 ? "" : "s"} from start to end.</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="admin-package-card__actions">
        <button type="submit" className="button small primary" disabled={saving}>{saving ? "Saving…" : submitLabel}</button>
        <button type="button" className="text-button" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  );
}

function VisitForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (body: { date: string; time: string; note: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(todayKey());
  const [time, setTime] = useState("12:00");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ date, time, note });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record the visit.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-package-form stack" onSubmit={(e) => void submit(e)}>
      <div className="admin-package-form__grid">
        <label>Visit date<input className="input" type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label>Time<input className="input" type="time" required value={time} onChange={(e) => setTime(e.target.value)} /></label>
        <label className="admin-package-form__wide">
          Private session note (optional, admin only)
          <textarea className="input" rows={3} maxLength={4000} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="admin-package-card__actions">
        <button type="submit" className="button small primary" disabled={saving}>{saving ? "Saving…" : "Record visit"}</button>
        <button type="button" className="text-button" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  );
}
