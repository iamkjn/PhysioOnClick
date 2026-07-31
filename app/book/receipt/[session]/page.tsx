import Link from "next/link";
import { invoiceIssuer } from "@/lib/site-data";
import { formatGbp, issuerField } from "@/lib/invoice";
import { getReceiptBySession } from "@/lib/patient-receipt";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default async function ReceiptPage({ params }: { params: Promise<{ session: string }> }) {
  const { session } = await params;
  const r = await getReceiptBySession(session);

  if (!r) {
    return (
      <main className="receipt-page">
        <p>We couldn&apos;t find a paid receipt for this booking yet. If you&apos;ve just paid,
        wait a moment and refresh, or <Link href="/contact">contact us</Link>.</p>
      </main>
    );
  }

  return (
    <main className="receipt-page" style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>{invoiceIssuer.tradingName}</h1>
          <p style={{ margin: "0.25rem 0" }}>{invoiceIssuer.legalName}</p>
          {invoiceIssuer.addressLines.filter(Boolean).map((line) => (
            <p key={line} style={{ margin: 0 }}>{line}</p>
          ))}
          <p style={{ margin: "0.25rem 0" }}>{invoiceIssuer.contactEmail}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <h2 style={{ margin: 0 }}>Receipt</h2>
          <p style={{ margin: "0.25rem 0" }}>Invoice: <strong>{r.invoiceNumber}</strong></p>
          <p style={{ margin: 0 }}>Date paid: {fmtDate(r.paidAt)}</p>
        </div>
      </header>

      <section style={{ marginTop: "1.5rem" }}>
        <p><strong>Registration:</strong> HCPC {issuerField(invoiceIssuer.hcpcNumber)} · CSP {issuerField(invoiceIssuer.cspNumber)}</p>
        <p><strong>Patient:</strong> {r.patientName || r.patientEmail}</p>
      </section>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "0.5rem 0" }}>Service</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "0.5rem 0" }}>Session date</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #ccc", padding: "0.5rem 0" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: "0.5rem 0" }}>{r.serviceLabel}</td>
            <td style={{ padding: "0.5rem 0" }}>{fmtDate(r.sessionDate)}</td>
            <td style={{ padding: "0.5rem 0", textAlign: "right" }}>{formatGbp(r.amountPence)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} style={{ padding: "0.5rem 0", textAlign: "right", fontWeight: 700 }}>Total paid</td>
            <td style={{ padding: "0.5rem 0", textAlign: "right", fontWeight: 700 }}>{formatGbp(r.amountPence)}</td>
          </tr>
        </tfoot>
      </table>

      <p style={{ marginTop: "1rem" }}>Paid by card via Stripe.</p>
      <p style={{ color: "#555" }}>{invoiceIssuer.vatStatus}</p>
      <p className="no-print" style={{ marginTop: "1rem" }}>
        Tip: use your browser&apos;s Print → Save as PDF to submit this to your insurer.
      </p>
    </main>
  );
}
