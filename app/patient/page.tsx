import type { Metadata } from "next";
import Link from "next/link";

import { AuthPanel } from "@/components/auth-panel";
import { ExerciseLibrary } from "@/components/exercise-library";
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
          <div className="dashboard-chip">Upcoming appointment</div>
          <strong>Follow-up review</strong>
          <p className="muted">Thursday, 19 March at 10:30</p>
          <div className="progress-pill-row">
            <span>Pain tracking</span>
            <span>Exercise library</span>
            <span>Secure uploads</span>
          </div>
        </div>
      </section>

      <section className="page-section" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <Link
          href="/patient/appointments"
          style={{
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
          }}
        >
          📋 My Appointments
        </Link>
        <Link
          href="/patient/people"
          style={{
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
          }}
        >
          👨‍👩‍👧 My People
        </Link>
        <Link
          href="/patient/account"
          style={{
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
          }}
        >
          👤 My Account
        </Link>
        <Link
          href="/patient/recovery"
          style={{
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
          }}
        >
          📈 My Recovery
        </Link>
      </section>

      <section className="page-section dashboard-grid">
        <AuthPanel role="patient" />
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
            Profile details, bookings, enquiries, saved blogs and document uploads now connect to the same Firebase patient
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
