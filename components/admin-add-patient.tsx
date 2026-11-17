// components/admin-add-patient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useToast } from "@/components/toast-provider";

// "Add patient": creates an account for a patient the physio manages directly
// (POST /api/admin/patients). Nothing is emailed; the sign-in invite is a
// separate button on the patient's page.
export function AdminAddPatient() {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    dob: "",
    phoneNumber: "",
    carerName: "",
    carerEmail: "",
    carerRelationship: "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = await auth?.currentUser?.getIdToken().catch(() => null);
      if (!token) throw new Error("You're signed out. Sign in again.");
      const res = await fetch("/api/admin/patients", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json().catch(() => ({}))) as { uid?: string; error?: string; existing?: boolean };
      if (res.status === 409 && json.uid) {
        toast.show("This patient already has an account. Opening it.", "success");
        router.push(`/admin/patients/${json.uid}`);
        return;
      }
      if (!res.ok || !json.uid) throw new Error(json.error || "Could not create the patient.");
      toast.show(`${form.name.trim()} added.`, "success");
      router.push(`/admin/patients/${json.uid}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the patient.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="button small primary admin-add-patient__open" onClick={() => setOpen(true)}>
        <UserPlus aria-hidden="true" /> Add patient
      </button>
    );
  }

  return (
    <form className="panel stack admin-add-patient" onSubmit={(e) => void submit(e)}>
      <div>
        <h2 className="admin-add-patient__title">Add a patient you manage</h2>
        <p className="muted admin-add-patient__hint">
          For patients who won&apos;t sign up themselves. This creates their account only. Nothing is emailed until you
          press &quot;Send sign-in invite&quot; on their page.
        </p>
      </div>
      <div className="admin-add-patient__grid">
        <label>Full name<input className="input" required value={form.name} onChange={set("name")} autoComplete="off" /></label>
        <label>Email<input className="input" type="email" required value={form.email} onChange={set("email")} autoComplete="off" /></label>
        <label>Date of birth (optional)<input className="input" type="date" value={form.dob} onChange={set("dob")} /></label>
        <label>Phone (optional)<input className="input" type="tel" value={form.phoneNumber} onChange={set("phoneNumber")} autoComplete="off" /></label>
      </div>
      <fieldset className="admin-add-patient__carer">
        <legend>Carer / family member (optional)</legend>
        <div className="admin-add-patient__grid">
          <label>Name<input className="input" value={form.carerName} onChange={set("carerName")} autoComplete="off" /></label>
          <label>Email<input className="input" type="email" value={form.carerEmail} onChange={set("carerEmail")} autoComplete="off" /></label>
          <label>Relationship<input className="input" placeholder="e.g. Partner, Daughter" value={form.carerRelationship} onChange={set("carerRelationship")} /></label>
        </div>
      </fieldset>
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="admin-add-patient__actions">
        <button type="submit" className="button primary" disabled={saving}>{saving ? "Creating…" : "Create patient"}</button>
        <button type="button" className="text-button" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
      </div>
    </form>
  );
}
