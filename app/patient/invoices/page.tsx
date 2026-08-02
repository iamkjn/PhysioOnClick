// app/patient/invoices/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { Skeleton, SkeletonCircle } from "@/components/skeleton";
import { useToast } from "@/components/toast-provider";
import { formatGbp } from "@/lib/invoice";
import type { PatientInvoice } from "@/lib/patient-invoices";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function InvoicesPage() {
  const router = useRouter();
  const toast = useToast();
  const [uid, setUid] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<PatientInvoice[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/patient");
        return;
      }
      setUid(user.uid);
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/patient/invoices", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        const data = (await res.json()) as { invoices: PatientInvoice[] };
        setInvoices(data.invoices ?? []);
      } catch {
        setLoadError(true);
      } finally {
        setLoaded(true);
      }
    });
  }, [router]);

  async function handleDownload(invoiceNumber: string) {
    const auth = getAuth();
    if (!auth.currentUser) return;
    setDownloading(invoiceNumber);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/patient/invoice/${invoiceNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.show("Could not download this invoice. Try again.", "error");
    } finally {
      setDownloading(null);
    }
  }

  // Group invoices by the member the session was for.
  const groups = invoices.reduce<Record<string, PatientInvoice[]>>((acc, inv) => {
    const key = inv.patientName || "You";
    (acc[key] ??= []).push(inv);
    return acc;
  }, {});
  const memberNames = Object.keys(groups);

  const cardStyle: React.CSSProperties = {
    background: "var(--color-surface)",
    borderRadius: "var(--radius-card)",
    padding: "1rem 1.25rem",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    boxShadow: "var(--shadow)",
  };

  return (
    <div className="site-shell patient-page">
      <section className="page-hero">
        <div className="stack">
          <h1 style={{ color: "var(--color-text-primary)" }}>Invoices &amp; payments</h1>
          <p className="muted">Receipts for your paid sessions and those of everyone you manage.</p>
        </div>
      </section>

      <section className="page-section">
        {/* Loading */}
        {!loaded &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ ...cardStyle, marginBottom: "var(--space-3)" }}>
              <SkeletonCircle size="52px" />
              <div style={{ flex: 1 }}>
                <Skeleton height="1em" width="160px" />
                <div style={{ marginTop: "0.4rem" }}>
                  <Skeleton height="0.8em" width="120px" />
                </div>
              </div>
              <Skeleton height="2rem" width="90px" className="skeleton-pill" />
            </div>
          ))}

        {loaded && loadError && (
          <p style={{ color: "var(--color-error)", fontFamily: "var(--font-sans)", padding: "var(--space-6) 0" }}>
            Could not load your invoices. Please try again.
          </p>
        )}

        {loaded && !loadError && invoices.length === 0 && (
          <EmptyState
            illustration="calendar"
            title="No invoices yet"
            body="Once you pay for a session, its receipt will appear here — for you and anyone you manage."
            cta={{ label: "Book a session", onClick: () => router.push("/book") }}
          />
        )}

        {loaded && !loadError && invoices.length > 0 && uid && (
          <div style={{ display: "grid", gap: "var(--space-5)" }}>
            {memberNames.map((name) => (
              <div key={name}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "var(--space-3)" }}>
                  <Avatar name={name} size={32} />
                  <strong style={{ color: "var(--color-text-primary)" }}>{name}</strong>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                    {groups[name].length} {groups[name].length === 1 ? "invoice" : "invoices"}
                  </span>
                </div>

                <div style={{ display: "grid", gap: "var(--space-2)" }}>
                  {groups[name].map((inv) => (
                    <div key={inv.invoiceNumber} style={cardStyle}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ display: "block", color: "var(--color-text-primary)" }}>
                          {inv.serviceLabel || inv.service || "Session"}
                        </strong>
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                          {formatDate(inv.sessionDate || inv.paidAt)} · {inv.invoiceNumber}
                        </span>
                      </div>
                      <span
                        style={{
                          fontWeight: 700,
                          fontFamily: "var(--font-sans)",
                          color: "var(--color-text-primary)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatGbp(inv.amountPence)}
                      </span>
                      {inv.hasPdf ? (
                        <button
                          type="button"
                          className="button secondary small"
                          disabled={downloading === inv.invoiceNumber}
                          aria-busy={downloading === inv.invoiceNumber}
                          onClick={() => void handleDownload(inv.invoiceNumber)}
                        >
                          {downloading === inv.invoiceNumber ? "…" : "Download"}
                        </button>
                      ) : (
                        <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>—</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
