// app/admin/invoices/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isAdminUser } from "@/lib/admin-auth";
import { listInvoices, type InvoiceRow } from "@/app/admin/actions";
import { formatGbp } from "@/lib/invoice";
import { AdminShell } from "@/components/admin-shell";
import { SkeletonRow, SkeletonTable } from "@/components/skeleton";
import { useToast } from "@/components/toast-provider";

// Same client-side auth-check pattern as app/admin/patients/page.tsx (this
// route isn't wrapped by the shared components/admin-auth-gate.tsx, which is
// hardwired to always render AdminDashboard).
export default function AdminInvoicesPage() {
  const toast = useToast();
  const [checkedAdmin, setCheckedAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) { setCheckedAdmin(true); return; }
    return onAuthStateChanged(auth, async (user) => {
      const ok = user ? await isAdminUser(user) : false;
      setIsAdmin(ok);
      setCheckedAdmin(true);
      if (!ok || !user) { setLoading(false); return; }
      try {
        const token = await user.getIdToken();
        const res = await listInvoices(token);
        if (res.ok) setRows(res.invoices);
        else setLoadError("Could not load invoices. Try again.");
      } catch {
        setLoadError("Could not load invoices. Check that this account has admin access.");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  async function handleDownload(invoiceNumber: string) {
    if (!auth?.currentUser) return;
    setDownloading(invoiceNumber);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/admin/invoice/${invoiceNumber}`, {
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

  // Opens the tab synchronously (before the fetch) so it carries the click's
  // user-activation and isn't blocked as a popup — the tab is then pointed at
  // the PDF blob once it's fetched, instead of downloading it.
  async function handleView(invoiceNumber: string) {
    if (!auth?.currentUser) return;
    const win = window.open("", "_blank");
    setViewing(invoiceNumber);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/admin/invoice/${invoiceNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`View failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (win) win.location.href = url;
      else toast.show("Please allow pop-ups to view this invoice.", "error");
    } catch {
      win?.close();
      toast.show("Could not open this invoice. Try again.", "error");
    } finally {
      setViewing(null);
    }
  }

  if (!checkedAdmin) {
    return (
      <AdminShell backHref="/admin" backLabel="← Back to dashboard">
        <div className="site-shell">
          <section className="page-section">
            <SkeletonRow count={6} />
          </section>
        </div>
      </AdminShell>
    );
  }

  if (!isAdmin) {
    return (
      <AdminShell backHref="/admin" backLabel="← Back to dashboard">
        <div className="site-shell">
          <section className="page-section stack">
            <p className="muted" style={{ fontSize: "var(--text-sm)" }}>
              Admin access required.{" "}
              <Link href="/admin" style={{ color: "var(--primary)", fontWeight: 600 }}>
                Go to sign in
              </Link>
            </p>
          </section>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell backHref="/admin" backLabel="← Back to dashboard">
      <div className="site-shell">
        <section className="page-section admin-nav-page">
          <div className="admin-page-hero admin-page-hero--compact">
            <div>
              <span className="dashboard-eyebrow">Billing</span>
              <h1>Invoices</h1>
              <p>Review paid bookings and open or download insurance-ready PDF invoices.</p>
            </div>
            <div className="admin-page-metrics" aria-label="Invoice totals">
              <span><strong>{rows.length}</strong> paid</span>
            </div>
          </div>

          <div className="panel admin-patient-card">
          <div className="dashboard-table-head">
            <div>
              <span className="dashboard-eyebrow">Invoices</span>
              <h2>Paid bookings</h2>
            </div>
            <span className="dashboard-table-count">
              {rows.length} {rows.length === 1 ? "invoice" : "invoices"}
            </span>
          </div>

          {loading && <SkeletonTable rows={5} columns={6} />}

          {!loading && loadError && (
            <p style={{ color: "var(--color-error)", fontFamily: "var(--font-sans)", padding: "var(--space-6) 0" }}>
              {loadError}
            </p>
          )}

          {!loading && !loadError && rows.length === 0 && (
            <p style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)", padding: "var(--space-6) 0" }}>
              No paid invoices yet.
            </p>
          )}

          {!loading && !loadError && rows.length > 0 && (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <caption className="sr-only">Paid bookings with invoice number, patient, service, amount and PDF download</caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Invoice</th>
                    <th scope="col">Patient</th>
                    <th scope="col">Service</th>
                    <th scope="col">Amount</th>
                    <th scope="col">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.invoiceNumber} className="admin-table-row" style={{ verticalAlign: "middle" }}>
                      <td style={{ fontFamily: "var(--font-sans)", verticalAlign: "middle" }}>
                        {r.paidAt ? new Date(r.paidAt).toLocaleDateString("en-GB") : "—"}
                      </td>
                      <td style={{ color: "var(--color-navy)", fontFamily: "var(--font-sans)", verticalAlign: "middle" }}>{r.invoiceNumber}</td>
                      <td style={{ fontFamily: "var(--font-sans)", verticalAlign: "middle" }}>{r.email}</td>
                      <td style={{ fontFamily: "var(--font-sans)", verticalAlign: "middle" }}>{r.service}</td>
                      <td style={{ fontFamily: "var(--font-sans)", verticalAlign: "middle" }}>{formatGbp(r.amountPence)}</td>
                      <td style={{ verticalAlign: "middle" }}>
                        {r.hasPdf ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <button
                              type="button"
                              disabled={viewing === r.invoiceNumber}
                              onClick={() => void handleView(r.invoiceNumber)}
                              className="admin-outline-action"
                            >
                              {viewing === r.invoiceNumber ? "Opening…" : "View"}
                            </button>
                            <button
                              type="button"
                              disabled={downloading === r.invoiceNumber}
                              onClick={() => void handleDownload(r.invoiceNumber)}
                              className="admin-outline-action"
                            >
                              {downloading === r.invoiceNumber ? "Downloading…" : "Download"}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
