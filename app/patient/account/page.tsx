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
        <div style={{ background: "#fff", borderRadius: 18, padding: "1.5rem", marginBottom: "1.5rem", boxShadow: "0 2px 10px rgba(0,0,0,0.07)" }}>
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

  const pillStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "#D8F3F9",
    color: "#0E7490",
    padding: "0.6rem 1.25rem",
    borderRadius: 999,
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 14,
  };

  const sectionHeadingStyle: React.CSSProperties = {
    color: "#0C2A38",
    fontSize: 18,
    fontWeight: 700,
    margin: "0 0 0.75rem",
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      {/* User info card */}
      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          padding: "1.5rem",
          marginBottom: "1.5rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
        }}
      >
        <h1 style={{ margin: "0 0 0.25rem", color: "#0C2A38", fontSize: 22 }}>
          {displayName}
        </h1>
        <p style={{ margin: "0 0 1rem", color: "#5E7A84", fontSize: 14 }}>{email}</p>
        <button
          onClick={() => void handleSignOut()}
          style={{
            background: "none",
            border: "1px solid #D1E8EE",
            borderRadius: 10,
            padding: "0.5rem 1.25rem",
            cursor: "pointer",
            color: "#5E7A84",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
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
        <Link href="/patient/people" style={pillStyle}>👨‍👩‍👧 My People</Link>
        <Link href="/patient/appointments" style={pillStyle}>📋 My Appointments</Link>
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
