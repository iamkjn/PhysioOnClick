"use client";

import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { FormEvent, useEffect, useState } from "react";

import { auth, db } from "@/lib/firebase";
import { ensurePatientRecord, mergePatientProfileDetails } from "@/lib/patient-account";
import { SkeletonForm } from "@/components/skeleton";

const phonePattern = /^(?:\+44|0)[0-9\s]{9,14}$/;

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

  return (
    <div className="panel patient-profile-panel">
      <div className="stack">
        <span className="eyebrow">Profile details</span>
        <h3>Keep your patient account up to date</h3>
        <p className="muted">Your saved profile helps link bookings, enquiries, uploads and favourite blogs together.</p>
      </div>

      <form className="patient-profile-form" onSubmit={handleSubmit}>
        <label>
          Email address
          <input disabled value={email} />
        </label>

        <label>
          Full name
          <input onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" value={fullName} />
        </label>

        <label>
          Mobile number
          <input onChange={(event) => setPhone(event.target.value)} placeholder="07xxx xxxxxx" value={phone} />
        </label>

        <button className="button primary" disabled={!userId || isSaving} type="submit">
          {isSaving ? "Saving..." : "Save profile"}
        </button>
      </form>

      <p className="muted">{status}</p>
    </div>
  );
}
