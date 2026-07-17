"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Avatar } from "@/components/avatar";
import { SkeletonRow } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { getBooking, type BookingRecord } from "@/lib/patient-bookings";
import { getSessionSummary, type SessionSummary } from "@/lib/session-summaries";
import { DownloadSummaryButton } from "@/components/download-summary-button";
import { RecoveryPercentCard } from "@/components/recovery-percent-card";

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/patient");
        return;
      }
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const [b, s] = await Promise.all([getBooking(id), getSessionSummary(id)]);
        setBooking(b);
        setSummary(s);
      } catch {
        // Without this catch a rejected fetch left loading true forever —
        // the page just sat on the skeleton with no way out.
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    });
  }, [id, router]);

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
        <EmptyState
          illustration={loadError ? "wifi-off" : "search"}
          title={loadError ? "Could not load this appointment" : "Appointment not found"}
          body={
            loadError
              ? "Please check your connection and try again."
              : "This appointment may have been removed, or the link is incorrect."
          }
          cta={{ label: "Back to appointments", href: "/patient/appointments" }}
        />
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
        style={{ color: "var(--color-primary-dark)", textDecoration: "none", fontSize: 14, fontWeight: 600 }}
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
          boxShadow: "var(--shadow)",
        }}
      >
        <Avatar name={booking.patientName} imageUrl={booking.patientAvatarUrl} size={60} />
        <div>
          <h2 style={{ margin: 0, color: "var(--color-text-primary)" }}>{booking.patientName}</h2>
          <p style={{ margin: "4px 0 0", color: "var(--color-text-secondary)" }}>{booking.service}</p>
          <p style={{ margin: "2px 0 0", color: "var(--color-primary-dark)", fontWeight: 600, fontSize: 14 }}>
            {date}
          </p>
        </div>
      </div>

      {summary ? (
        <div style={{ marginTop: "1.5rem", display: "grid", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "stretch", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 260px" }}>
              <RecoveryPercentCard
                staticPercent={summary.recoveryPercent}
                subtitle="Recovery score recorded by your physio at this session."
              />
            </div>
            <span
              aria-label={`Pain score at this session: ${summary.painScore} out of 10`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                alignSelf: "flex-start",
                gap: "0.4rem",
                padding: "0.5rem 0.9rem",
                borderRadius: "var(--radius-pill)",
                fontWeight: 700,
                fontSize: "var(--text-sm)",
                ...painBadgeColors(summary.painScore),
              }}
            >
              <span aria-hidden="true">🩹</span>
              Pain {summary.painScore}/10
            </span>
          </div>
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
                borderRadius: "var(--radius-card)",
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <span aria-hidden="true">📅</span>
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
            boxShadow: "var(--shadow)",
          }}
        >
          <div aria-hidden="true" style={{ fontSize: 36 }}>⏳</div>
          <h3>Summary coming soon</h3>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Your physio will add a session summary shortly.
          </p>
        </div>
      )}
    </div>
  );
}

// Coral is reserved for advisory/warning content elsewhere in this design
// system, so a high pain score (a genuine warning signal) is the one case
// that legitimately reaches for it here — low/mid scores stay within the
// calm primary/neutral palette.
function painBadgeColors(score: number): { background: string; color: string } {
  if (score >= 7) return { background: "var(--color-coral-light)", color: "var(--color-coral)" };
  if (score >= 4) return { background: "var(--color-border)", color: "var(--color-text-primary)" };
  return { background: "var(--color-primary-light)", color: "var(--color-primary-dark)" };
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
        boxShadow: "var(--shadow)",
      }}
    >
      <h3
        style={{
          margin: "0 0 0.5rem",
          fontSize: "var(--text-sm)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <span aria-hidden="true">{icon}</span>
        {title}
      </h3>
      <p style={{ margin: 0, color: "var(--color-text-primary)", lineHeight: 1.65 }}>{body}</p>
    </div>
  );
}
