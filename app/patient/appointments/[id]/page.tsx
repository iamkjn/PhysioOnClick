"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Avatar } from "@/components/avatar";
import { SkeletonRow } from "@/components/skeleton";
import { getBooking, type BookingRecord } from "@/lib/patient-bookings";
import { getSessionSummary, type SessionSummary } from "@/lib/session-summaries";
import { DownloadSummaryButton } from "@/components/download-summary-button";

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, async (u) => {
      if (!u || !id) return;
      const [b, s] = await Promise.all([getBooking(id), getSessionSummary(id)]);
      setBooking(b);
      setSummary(s);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "3rem 1rem" }}>
        <SkeletonRow count={1} />
      </div>
    );
  }

  if (!booking) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "3rem 1rem" }}>
        Appointment not found.
      </div>
    );
  }

  const date = booking.sessionDate.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      <Link
        href="/patient/appointments"
        style={{ color: "var(--color-primary)", textDecoration: "none", fontSize: 14, fontWeight: 600 }}
      >
        ← Back to appointments
      </Link>

      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-panel)",
          padding: "1.5rem",
          marginTop: "1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        }}
      >
        <Avatar name={booking.patientName} imageUrl={booking.patientAvatarUrl} size={60} />
        <div>
          <h2 style={{ margin: 0, color: "var(--color-text-primary)" }}>{booking.patientName}</h2>
          <p style={{ margin: "4px 0 0", color: "var(--color-text-secondary)" }}>{booking.service}</p>
          <p style={{ margin: "2px 0 0", color: "var(--color-primary)", fontWeight: 600, fontSize: 14 }}>
            {date}
          </p>
        </div>
      </div>

      {summary ? (
        <div style={{ marginTop: "1.5rem", display: "grid", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
            <h2 style={{ color: "var(--color-text-primary)", margin: 0 }}>Session summary</h2>
            <DownloadSummaryButton summary={summary} />
          </div>
          <SummaryBlock title="What we worked on" icon="🩺" body={summary.workedOn} />
          <SummaryBlock title="Exercises assigned" icon="💪" body={summary.exercises} />
          <SummaryBlock title="Next steps & advice" icon="💡" body={summary.nextSteps} />
          {summary.followUpWeeks > 0 && (
            <div
              style={{
                background: "var(--color-primary-light)",
                borderRadius: 14,
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <span>📅</span>
              <strong style={{ color: "var(--color-primary-dark)" }}>
                Follow-up recommended in {summary.followUpWeeks} week
                {summary.followUpWeeks > 1 ? "s" : ""}
              </strong>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            marginTop: "1.5rem",
            background: "var(--color-surface)",
            borderRadius: "var(--radius-card)",
            padding: "2rem",
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ fontSize: 36 }}>⏳</div>
          <h3>Summary coming soon</h3>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Your physio will add a session summary shortly.
          </p>
        </div>
      )}
    </div>
  );
}

function SummaryBlock({
  title,
  icon,
  body,
}: {
  title: string;
  icon: string;
  body: string;
}) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        borderRadius: "var(--radius-card)",
        padding: "1.25rem",
        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
      }}
    >
      <h3
        style={{
          margin: "0 0 0.5rem",
          fontSize: 15,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <span>{icon}</span>
        {title}
      </h3>
      <p style={{ margin: 0, color: "var(--color-text-primary)", lineHeight: 1.65 }}>{body}</p>
    </div>
  );
}
