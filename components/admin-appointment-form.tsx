"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/components/toast-provider";
import { PostcodePrice } from "@/components/admin-price-checker";
import { homeVisitBand, outwardCode } from "@/lib/home-visit-area";
import { sessionPricePence } from "@/lib/home-visit-pricing";
import { formatPersonName } from "@/lib/name-format";

type Person = { key: string; uid: string; personId: string; label: string };
type Appointment = {
  id: string;
  patientName: string;
  patientUid: string;
  personId: string;
  service: string;
  date: string;
  time: string;
  address: string;
};
type ApiJson = {
  error?: string;
  clash?: boolean;
  uid?: string;
  calendarSent?: boolean;
  paidKept?: boolean;
  appointments?: Appointment[];
  possibleDuplicates?: { uid: string; email: string }[];
};

async function api(url: string, init?: { method: string; body?: unknown }) {
  const token = await auth?.currentUser?.getIdToken().catch(() => null);
  if (!token) throw new Error("You're signed out. Sign in again.");
  const res = await fetch(url, {
    method: init?.method ?? "GET",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(init?.body ? { body: JSON.stringify(init.body) } : {}),
  });
  return { res, json: (await res.json().catch(() => ({}))) as ApiJson };
}

async function loadPeople(): Promise<Person[]> {
  if (!db) return [];
  const [patients, dependents] = await Promise.all([
    getDocs(collection(db, "patients")),
    getDocs(collection(db, "dependents")),
  ]);
  const owners = new Map<string, string>();
  const people: Person[] = patients.docs.map((d) => {
    const data = d.data();
    const name = formatPersonName(data.displayName as string | undefined, "Unnamed");
    owners.set(d.id, name);
    return { key: d.id, uid: d.id, personId: d.id, label: `${name} (${String(data.email ?? "no email")})` };
  });
  for (const d of dependents.docs) {
    const data = d.data();
    const ownerId = String(data.ownerId ?? "");
    if (!owners.has(ownerId)) continue;
    const name = formatPersonName(data.name as string | undefined, "Unnamed");
    people.push({ key: `${ownerId}:${d.id}`, uid: ownerId, personId: d.id, label: `${name} (via ${owners.get(ownerId)})` });
  }
  return people.sort((a, b) => a.label.localeCompare(b.label));
}

const EMPTY = {
  name: "",
  email: "",
  dob: "",
  phoneNumber: "",
  service: "initial-assessment",
  visitType: "home",
  date: "",
  time: "",
  addressLine: "",
  postcode: "",
  notes: "",
};

const todayKey = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/London" });

export function AdminAppointmentForm() {
  const toast = useToast();
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [people, setPeople] = useState<Person[]>([]);
  const [personKey, setPersonKey] = useState("");
  const [form, setForm] = useState(EMPTY);
  // Pounds as typed; null = follow the postcode / service price.
  const [priceTyped, setPriceTyped] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clash, setClash] = useState(false);
  const [sameName, setSameName] = useState<{ uid: string; email: string }[]>([]);
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { res, json } = await api("/api/admin/appointments");
      if (!res.ok) throw new Error(json.error);
      setAppointments(json.appointments ?? []);
    } catch {
      setAppointments([]);
    }
  }, []);

  useEffect(() => {
    void refresh();
    loadPeople().then(setPeople).catch(() => setError("Could not load your patient list."));
  }, [refresh]);

  const set =
    (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setForm((f) => ({ ...f, [k]: value }));
      setClash(false);
      setDone(null);
      if (k === "name" || k === "email") setSameName([]);
      if (k === "service" || k === "visitType" || k === "postcode") setPriceTyped(null);
    };

  const isHome = form.visitType === "home";
  const service = form.service === "follow-up" ? "follow-up" : "initial-assessment";
  const covered = !isHome || (!!outwardCode(form.postcode) && homeVisitBand(form.postcode) !== null);
  const listPrice = covered
    ? String(sessionPricePence(service, isHome ? "home" : "video", form.postcode) / 100)
    : "";
  const price = priceTyped ?? listPrice;

  async function submit(options: { allowSameName?: boolean; allowOverlap?: boolean } = {}) {
    setError(null);
    setDone(null);
    const pricePence = Math.round(Number(price) * 100);
    if (price.trim() === "" || !Number.isFinite(pricePence) || pricePence < 0) {
      setError("Enter the price (0 if there is no charge).");
      return;
    }
    if (!form.date || !form.time) {
      setError("Choose the date and time.");
      return;
    }
    if (isHome && (!form.addressLine.trim() || !form.postcode.trim())) {
      setError("Enter the address and postcode for the home visit.");
      return;
    }
    setSaving(true);
    try {
      let person = people.find((p) => p.key === personKey);
      if (mode === "new") {
        const { res, json } = await api("/api/admin/patients", {
          method: "POST",
          body: {
            name: form.name,
            email: form.email,
            dob: form.dob,
            phoneNumber: form.phoneNumber,
            allowSameName: options.allowSameName,
          },
        });
        if (res.status === 409 && json.possibleDuplicates?.length) {
          setSameName(json.possibleDuplicates);
          return;
        }
        if (res.status === 409 && json.uid) {
          setMode("existing");
          setPersonKey(json.uid);
          setPeople(await loadPeople());
          setError("This email already has an account, so it's now selected below. Check it's the right person and save again.");
          return;
        }
        if (!res.ok || !json.uid) throw new Error(json.error || "Could not create the patient.");
        // Created: from here a retry must reuse this account.
        person = { key: json.uid, uid: json.uid, personId: json.uid, label: `${form.name.trim()} (${form.email.trim()})` };
        setPeople((list) => [...list, person!]);
        setPersonKey(json.uid);
        setMode("existing");
      }
      if (!person) throw new Error("Choose a patient.");

      const { res, json } = await api("/api/admin/appointments", {
        method: "POST",
        body: {
          uid: person.uid,
          personId: person.personId,
          service,
          visitType: form.visitType,
          date: form.date,
          time: form.time,
          addressLine: form.addressLine,
          postcode: form.postcode,
          pricePence,
          notes: form.notes,
          allowOverlap: options.allowOverlap,
        },
      });
      if (res.status === 409 && json.clash) {
        setClash(true);
        setError(json.error ?? "That time is already booked.");
        return;
      }
      if (!res.ok) throw new Error(json.error || "Could not save the appointment.");
      setClash(false);
      setForm(EMPTY);
      setPriceTyped(null);
      setPersonKey("");
      setMode("new");
      setDone(
        json.calendarSent
          ? "Appointment saved and sent to your calendar."
          : "Appointment saved. The calendar email was not sent, so add it to your calendar yourself.",
      );
      toast.show("Appointment saved.", "success");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the appointment.");
    } finally {
      setSaving(false);
    }
  }

  async function cancel(a: Appointment) {
    if (!window.confirm(`Cancel ${a.patientName} on ${a.date} at ${a.time}?`)) return;
    try {
      const { res, json } = await api(`/api/admin/appointments?id=${encodeURIComponent(a.id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error(json.error);
      toast.show(
        json.paidKept ? "Cancelled. It was already paid: refund or rearrange it with the patient." : "Appointment cancelled.",
        "success",
      );
      await refresh();
    } catch (err) {
      toast.show(err instanceof Error && err.message ? err.message : "Could not cancel.", "error");
    }
  }

  return (
    <div className="stack">
      <div>
        <h1>Add appointment</h1>
        <p className="muted">
          Book a visit yourself. Nothing is sent to the patient. Payment link, mark as paid and record visit are on the
          patient&apos;s page.
        </p>
      </div>

      <form
        className="panel stack owner-form"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div role="group" aria-label="Patient" className="admin-segmented-filter">
          {(["new", "existing"] as const).map((m) => (
            <button key={m} type="button" aria-pressed={mode === m} className={mode === m ? "is-active" : ""} onClick={() => setMode(m)}>
              {m === "new" ? "New patient" : "Existing patient"}
            </button>
          ))}
        </div>

        {mode === "existing" ? (
          <label>
            Patient
            <select className="input" required value={personKey} onChange={(e) => setPersonKey(e.target.value)}>
              <option value="">Choose a patient</option>
              {people.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          </label>
        ) : (
          <div className="owner-form__grid">
            <label>Full name<input className="input" required value={form.name} onChange={set("name")} autoComplete="off" /></label>
            <label>Email<input className="input" type="email" required value={form.email} onChange={set("email")} autoComplete="off" /></label>
            <label>Phone (optional)<input className="input" type="tel" value={form.phoneNumber} onChange={set("phoneNumber")} autoComplete="off" /></label>
            <label>Date of birth (optional)<input className="input" type="date" value={form.dob} onChange={set("dob")} /></label>
          </div>
        )}

        <div className="owner-form__grid">
          <label>
            Appointment
            <select className="input" value={form.service} onChange={set("service")}>
              <option value="initial-assessment">Initial assessment</option>
              <option value="follow-up">Follow-up</option>
            </select>
          </label>
          <label>
            Where
            <select className="input" value={form.visitType} onChange={set("visitType")}>
              <option value="home">Home visit</option>
              <option value="video">Video call</option>
            </select>
          </label>
          <label>Preferred date<input className="input" type="date" required min={todayKey()} value={form.date} onChange={set("date")} /></label>
          <label>Preferred time<input className="input" type="time" required value={form.time} onChange={set("time")} /></label>
        </div>

        {isHome && (
          <>
            <div className="owner-form__grid">
              <label>Address<input className="input" required maxLength={120} value={form.addressLine} onChange={set("addressLine")} autoComplete="off" /></label>
              <label>Postcode<input className="input" required maxLength={10} value={form.postcode} onChange={set("postcode")} autoComplete="off" /></label>
            </div>
            <PostcodePrice postcode={form.postcode} />
          </>
        )}

        <div className="owner-form__grid">
          <label>
            Price (£)
            <input
              className="input"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              required
              value={price}
              onChange={(e) => setPriceTyped(e.target.value)}
            />
          </label>
        </div>
        <label>Note (optional)<textarea className="input" rows={2} maxLength={600} value={form.notes} onChange={set("notes")} /></label>

        {sameName.length > 0 && (
          <div role="alert">
            <p><strong>{form.name.trim()} may already have an account.</strong> Check it isn&apos;t the same person:</p>
            <ul>
              {sameName.map((d) => (
                <li key={d.uid}><Link href={`/admin/patients/${d.uid}`}>{d.email || "No email on file"}</Link></li>
              ))}
            </ul>
            <button type="button" className="button small" disabled={saving} onClick={() => void submit({ allowSameName: true })}>
              It&apos;s a different person, save anyway
            </button>
          </div>
        )}
        {error && <p className="field-error" role="alert">{error}</p>}
        {done && <p role="status">{done}</p>}
        <div className="owner-form__actions">
          <button type="submit" className="button primary" disabled={saving}>{saving ? "Saving…" : "Save appointment"}</button>
          {clash && (
            <button type="button" className="button" disabled={saving} onClick={() => void submit({ allowOverlap: true })}>
              Book it anyway
            </button>
          )}
        </div>
      </form>

      <div className="panel stack">
        <h2>Upcoming appointments you added</h2>
        {appointments === null ? (
          <p className="muted">Loading…</p>
        ) : appointments.length === 0 ? (
          <p className="muted">None yet.</p>
        ) : (
          <ul className="owner-appointments">
            {appointments.map((a) => (
              <li key={a.id}>
                <div>
                  <strong>
                    {new Date(`${a.date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}
                    , {a.time}: {a.patientName}
                  </strong>
                  <span className="muted">{a.service}{a.address ? ` · ${a.address}` : ""}</span>
                </div>
                <div className="owner-form__actions">
                  <Link href={a.personId && a.personId !== a.patientUid ? `/admin/patients/${a.patientUid}?person=${a.personId}` : `/admin/patients/${a.patientUid}`}>
                    Open patient
                  </Link>
                  <button type="button" className="text-button" onClick={() => void cancel(a)}>Cancel appointment</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
