import type { Metadata } from "next";
import Link from "next/link";

import { ExerciseLibrary } from "@/components/exercise-library";
import { PatientAuthGate } from "@/components/patient-auth-gate";
import { PatientLiveOverview } from "@/components/patient-live-overview";
import { PatientProfileEditor } from "@/components/patient-profile-editor";
import { UploadPanel } from "@/components/upload-panel";

export const metadata: Metadata = {
  title: "Patient Portal | PhysioOnClick",
  description: "Secure patient portal for appointments, invoices, document uploads and rehab tracking."
};

export default function PatientPage() {
  return (
    <div className="site-shell">
      <section className="page-hero page-hero-split">
        <div className="stack">
          <span className="eyebrow">Patient portal</span>
          <h1>Appointments, uploads and rehab progress in one secure space.</h1>
          <p className="lead">
            Patients can sign in, view upcoming appointments, review payment history, upload reports, access assigned
            exercise videos and track recovery across the rehabilitation journey.
          </p>
        </div>
        <div className="page-hero-aside dashboard-preview">
          <div
            className="dashboard-chip"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.35rem 0.85rem",
              borderRadius: "var(--radius-chip)",
              background: "var(--color-primary-light)",
              color: "var(--primary)",
              fontSize: "var(--text-xs)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "0.75rem"
            }}
          >
            Upcoming appointment
          </div>
          <strong>Follow-up review</strong>
          <p className="muted">Thursday, 19 March at 10:30</p>
          <div
            className="progress-pill-row"
            style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem" }}
          >
            {["Pain tracking", "Exercise library", "Secure uploads"].map((label) => (
              <span
                key={label}
                style={{
                  padding: "0.3rem 0.7rem",
                  borderRadius: "var(--radius-pill)",
                  border: "1px solid var(--line)",
                  background: "var(--color-surface)",
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  color: "var(--muted)"
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <Link href="/patient/appointments" className="pill-link">
          📋 My Appointments
        </Link>
        <Link href="/patient/people" className="pill-link">
          👨‍👩‍👧 My People
        </Link>
        <Link href="/patient/account" className="pill-link">
          👤 My Account
        </Link>
        <Link href="/patient/recovery" className="pill-link">
          📈 My Recovery
        </Link>
      </section>

      <section className="page-section dashboard-grid">
        <PatientAuthGate />
        <PatientLiveOverview />
      </section>

      <section className="page-section dashboard-grid">
        <PatientProfileEditor />
      </section>

      <section className="page-section dashboard-grid">
        <UploadPanel />
        <div className="panel stack">
          <span className="eyebrow">Patient account</span>
          <h3>Everything linked to one secure record</h3>
          <p className="muted">
            Profile details, bookings, enquiries and document uploads now connect to the same secure patient
            account for a more consistent portal experience.
          </p>
        </div>
      </section>

      <section className="page-section stack">
        <div>
          <span className="eyebrow">Exercise library</span>
          <h2>Example rehab videos ready for patient assignment.</h2>
        </div>
        <ExerciseLibrary />
      </section>
    </div>
  );
}
