"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import Link from "next/link";

import { PatientProfileEditor } from "@/components/patient-profile-editor";
import { RehabProgramsSection } from "@/components/rehab-programs-section";
import { UploadPanel } from "@/components/upload-panel";
import { Skeleton, SkeletonForm, SkeletonRow } from "@/components/skeleton";

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
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
        <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-panel)", padding: "1.5rem", marginBottom: "1.5rem", boxShadow: "var(--shadow)" }}>
          <Skeleton height="1.5rem" width="160px" className="skeleton-heading" />
          <div style={{ marginTop: "0.5rem" }}>
            <Skeleton height="0.9rem" width="220px" />
          </div>
          <div style={{ marginTop: "1rem" }}>
            <Skeleton height="2.2rem" width="100px" className="skeleton-pill" />
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          <Skeleton height="2.4rem" width="140px" className="skeleton-pill" />
          <Skeleton height="2.4rem" width="160px" className="skeleton-pill" />
        </div>
        <div style={{ marginBottom: "2rem" }}>
          <SkeletonForm fields={3} />
        </div>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ marginBottom: "0.75rem" }}>
            <Skeleton height="1.1rem" width="180px" />
          </div>
          <SkeletonRow count={2} />
        </div>
        <div>
          <div style={{ marginBottom: "0.75rem" }}>
            <Skeleton height="1.1rem" width="180px" />
          </div>
          <SkeletonRow count={2} />
        </div>
      </div>
    );
  }

  const sectionHeadingStyle: React.CSSProperties = {
    color: "var(--color-text-primary)",
    margin: "0 0 0.75rem",
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      {/* User info card */}
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-panel)",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          boxShadow: "var(--shadow)",
        }}
      >
        <h1 style={{ margin: "0 0 0.25rem", color: "var(--color-text-primary)", fontSize: "var(--text-lg)" }}>
          {displayName}
        </h1>
        <p style={{ margin: "0 0 1rem", color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>{email}</p>
        <button onClick={() => void handleSignOut()} className="button secondary small">
          Sign out
        </button>
      </div>

      {/* Quick links */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          marginBottom: "2rem",
        }}
      >
        <Link href="/patient/people" className="pill-link">👨‍👩‍👧 My People</Link>
        <Link href="/patient/appointments" className="pill-link">📋 My Appointments</Link>
      </div>

      {/* Profile details */}
      <div style={{ marginBottom: "2rem" }}>
        <PatientProfileEditor />
      </div>

      {/* Rehab programmes */}
      <h2 style={sectionHeadingStyle}>Rehab programmes</h2>
      <div style={{ marginBottom: "2rem" }}>
        <RehabProgramsSection email={email} />
      </div>

      {/* Uploads */}
      <h2 style={sectionHeadingStyle}>Secure document uploads</h2>
      <UploadPanel />
    </div>
  );
}
