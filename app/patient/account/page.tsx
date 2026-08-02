"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import Link from "next/link";

import { PatientProfileEditor } from "@/components/patient-profile-editor";
import { RehabProgramsSection } from "@/components/rehab-programs-section";
import { UploadPanel } from "@/components/upload-panel";
import { Skeleton, SkeletonForm, SkeletonRow } from "@/components/skeleton";
import { PeopleIcon, ClipboardIcon } from "@/components/icons";

export default function AccountPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/patient");
        return;
      }
      setUid(user.uid);
      setDisplayName(user.displayName || "Patient");
      setEmail(user.email || "");
    });
  }, [router]);

  async function handleSignOut() {
    const auth = getAuth();
    await signOut(auth);
    router.push("/patient");
  }

  if (!uid) {
    return (
      <div className="site-shell patient-page">
        <section className="page-hero">
          <div className="stack">
            <Skeleton height="1.5rem" width="160px" className="skeleton-heading" />
            <Skeleton height="0.9rem" width="220px" />
            <Skeleton height="2.2rem" width="100px" className="skeleton-pill" />
          </div>
        </section>

        <section className="page-section">
          <div className="button-row">
            <Skeleton height="2.4rem" width="140px" className="skeleton-pill" />
            <Skeleton height="2.4rem" width="160px" className="skeleton-pill" />
          </div>
        </section>

        <section className="page-section">
          <SkeletonForm fields={3} />
        </section>

        <section className="page-section stack">
          <Skeleton height="1.1rem" width="180px" />
          <SkeletonRow count={2} />
        </section>

        <section className="page-section stack">
          <Skeleton height="1.1rem" width="180px" />
          <SkeletonRow count={2} />
        </section>
      </div>
    );
  }

  return (
    <div className="site-shell patient-page">
      {/* User info */}
      <section className="page-hero">
        <div className="stack">
          <h1 style={{ color: "var(--color-text-primary)" }}>{displayName}</h1>
          <p className="muted">{email}</p>
          <button onClick={() => void handleSignOut()} className="button secondary small">
            Sign out
          </button>
        </div>
      </section>

      {/* Quick links */}
      <section className="page-section">
        <div className="button-row">
          <Link href="/patient/people" className="pill-link">
            <PeopleIcon className="pill-link-icon" />
            My People
          </Link>
          <Link href="/patient/appointments" className="pill-link">
            <ClipboardIcon className="pill-link-icon" />
            My Appointments
          </Link>
          <Link href="/patient/invoices" className="pill-link">
            <ClipboardIcon className="pill-link-icon" />
            Invoices &amp; Payments
          </Link>
        </div>
      </section>

      {/* Profile details */}
      <section className="page-section">
        <PatientProfileEditor />
      </section>

      {/* Rehab programmes */}
      <section className="page-section stack">
        <div className="section-heading">
          <h2>Rehab programmes</h2>
        </div>
        <RehabProgramsSection email={email} />
      </section>

      {/* Uploads */}
      <section className="page-section stack">
        <div className="section-heading">
          <h2>Secure document uploads</h2>
        </div>
        <UploadPanel />
      </section>
    </div>
  );
}
