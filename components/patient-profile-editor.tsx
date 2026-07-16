"use client";

import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { FormEvent, useEffect, useState } from "react";

import { auth, db } from "@/lib/firebase";
import { ensurePatientRecord, mergePatientProfileDetails } from "@/lib/patient-account";
import { SkeletonForm } from "@/components/skeleton";

const phonePattern = /^(?:\+44|0)[0-9\s]{9,14}$/;

function getStatusTone(message: string): "neutral" | "success" | "error" {
  if (message.includes("successfully")) return "success";
  if (message.startsWith("Please") || message.startsWith("Enter") || message.includes("could not")) {
    return "error";
  }
  return "neutral";
}

export function PatientProfileEditor() {
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("Sign in to manage your profile details.");
  const [isSaving, setIsSaving] = useState(false);
  const [resolvedAuth, setResolvedAuth] = useState(false);

  useEffect(() => {
    if (!auth) {
      setResolvedAuth(true);
      return;
    }

    return onAuthStateChanged(auth, async (user) => {
      setResolvedAuth(true);
      setUserId(user?.uid || "");
      setEmail(user?.email || "");

      if (!user) {
        setFullName("");
        setPhone("");
        setStatus("Sign in to manage your profile details.");
        return;
      }

      await ensurePatientRecord(user);
      setFullName(user.displayName || "");
      setPhone(user.phoneNumber || "");
      setStatus("Update your name and phone number so bookings and enquiries stay linked to your account.");
    });
  }, []);

  useEffect(() => {
    if (!db || !userId) {
      return;
    }

    return onSnapshot(doc(db, "patients", userId), (snapshot) => {
      const data = snapshot.data();
      setFullName(String(data?.displayName || auth?.currentUser?.displayName || ""));
      setPhone(String(data?.phoneNumber || auth?.currentUser?.phoneNumber || ""));
      setEmail(String(data?.email || auth?.currentUser?.email || ""));
    });
  }, [userId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const user = auth?.currentUser;
    if (!user) {
      setStatus("Please sign in first to update your profile.");
      return;
    }

    if (fullName.trim().length < 2) {
      setStatus("Enter your full name before saving.");
      return;
    }

    if (phone.trim() && !phonePattern.test(phone.trim())) {
      setStatus("Enter a valid UK phone number or leave the phone field blank.");
      return;
    }

    try {
      setIsSaving(true);
      await updateProfile(user, { displayName: fullName.trim() });
      await mergePatientProfileDetails(user, {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email
      });
      setStatus("Profile updated successfully.");
    } catch {
      setStatus("We could not update your profile right now. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!resolvedAuth) {
    return (
      <div className="panel patient-profile-panel">
        <SkeletonForm fields={3} />
      </div>
    );
  }

  const statusTone = getStatusTone(status);
  const isNameError = statusTone === "error" && status.includes("full name");
  const isPhoneError = statusTone === "error" && status.includes("phone number");

  return (
    <div className="panel patient-profile-panel">
      <div className="stack">
        <span className="eyebrow">Profile details</span>
        <h2 style={{ fontSize: "var(--text-lg)" }}>Keep your patient account up to date</h2>
        <p className="muted">Your saved profile helps link bookings, enquiries and uploads together.</p>
      </div>

      <form className="patient-profile-form" onSubmit={handleSubmit}>
        <label>
          Email address
          <input disabled value={email} autoComplete="email" />
          <span className="muted" style={{ fontSize: "var(--text-xs)", fontWeight: 400 }}>
            This is the email you sign in with and cannot be changed here.
          </span>
        </label>

        <label>
          Full name *
          <input
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Your full name"
            value={fullName}
            autoComplete="name"
            aria-required="true"
            aria-invalid={isNameError || undefined}
            style={isNameError ? { borderColor: "var(--color-error)" } : undefined}
          />
        </label>

        <label>
          Mobile number <span className="muted" style={{ fontWeight: 400 }}>(optional)</span>
          <input
            onChange={(event) => setPhone(event.target.value)}
            placeholder="07xxx xxxxxx"
            value={phone}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={isPhoneError || undefined}
            style={isPhoneError ? { borderColor: "var(--color-error)" } : undefined}
          />
        </label>

        <button className="button primary" disabled={!userId || isSaving} aria-busy={isSaving} type="submit">
          {isSaving ? "Saving…" : "Save profile"}
        </button>
      </form>

      <div
        className={`form-note${statusTone === "error" ? " error" : statusTone === "success" ? " success" : ""}`}
        role={statusTone === "error" ? "alert" : "status"}
        aria-live="polite"
      >
        <p className="muted">{status}</p>
      </div>
    </div>
  );
}
