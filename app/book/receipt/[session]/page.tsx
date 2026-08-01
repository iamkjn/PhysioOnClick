import Link from "next/link";
import { invoiceIssuer } from "@/lib/site-data";
import { formatGbp, issuerField } from "@/lib/invoice";
import { getReceiptBySession } from "@/lib/patient-receipt";
import { PrintButton } from "./print-button";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

const RECEIPT_CSS = `
.rcpt-root {
  --ink: #12324e;
  --ink-soft: #5a6b7b;
  --line: #e2e6ea;
  --paid: #0f7b52;
  --paid-bg: #e7f6ee;
  min-height: 100vh;
  background: #eef1f4;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  padding: 2.5rem 1rem 3.5rem;
  color: var(--ink);
}
.rcpt-paper {
  width: 100%;
  max-width: 820px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 6px;
  box-shadow: 0 10px 40px rgba(18, 50, 78, 0.12);
  padding: 48px 52px;
}
.rcpt-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  padding-bottom: 22px;
  border-bottom: 3px solid var(--ink);
}
.rcpt-brand { display: flex; align-items: center; gap: 14px; }
.rcpt-logo {
  width: 46px; height: 46px; border-radius: 12px;
  background: var(--ink); color: #fff;
  font-weight: 800; font-size: 22px;
  display: flex; align-items: center; justify-content: center;
}
.rcpt-trading { font-family: var(--font-serif, Georgia, serif); font-size: 1.5rem; font-weight: 700; line-height: 1.1; }
.rcpt-legal { color: var(--ink-soft); font-size: 0.85rem; margin-top: 2px; }
.rcpt-doc { text-align: right; }
.rcpt-doctitle { font-size: 1.5rem; font-weight: 800; letter-spacing: 0.14em; color: var(--ink); }
.rcpt-paid {
  display: inline-flex; align-items: center; gap: 6px;
  margin-top: 8px; padding: 5px 14px; border-radius: 999px;
  background: var(--paid-bg); color: var(--paid);
  font-size: 0.8rem; font-weight: 800; letter-spacing: 0.08em;
  border: 1.5px solid var(--paid);
}
.rcpt-meta {
  display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 1.5rem;
  padding: 26px 0; font-size: 0.9rem; line-height: 1.5;
}
.rcpt-label {
  font-size: 0.7rem; font-weight: 800; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--ink-soft); margin-bottom: 6px;
}
.rcpt-reg { margin-top: 6px; font-weight: 700; font-size: 0.82rem; }
.rcpt-info div { display: flex; justify-content: space-between; gap: 10px; padding: 2px 0; }
.rcpt-info span { color: var(--ink-soft); }
.rcpt-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
.rcpt-table thead th {
  text-align: left; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em;
  text-transform: uppercase; color: #fff; background: var(--ink);
  padding: 11px 14px;
}
.rcpt-table thead th.r, .rcpt-table td.r { text-align: right; }
.rcpt-table tbody td { padding: 16px 14px; border-bottom: 1px solid var(--line); vertical-align: top; }
.rcpt-item-title { font-weight: 700; }
.rcpt-item-sub { color: var(--ink-soft); font-size: 0.82rem; margin-top: 2px; }
.rcpt-totals { margin-left: auto; width: 320px; margin-top: 18px; font-size: 0.92rem; }
.rcpt-total-row { display: flex; justify-content: space-between; padding: 7px 14px; }
.rcpt-total-row span:first-child { color: var(--ink-soft); }
.rcpt-grand {
  margin-top: 6px; padding: 13px 14px; border-radius: 6px;
  background: var(--ink); color: #fff; font-weight: 800; font-size: 1.05rem;
}
.rcpt-grand span:first-child { color: rgba(255,255,255,0.8); }
.rcpt-notes {
  margin-top: 30px; padding: 18px 20px; border-radius: 8px;
  background: #f6f8fa; border: 1px solid var(--line);
  font-size: 0.86rem; line-height: 1.55; color: #3a4a58;
}
.rcpt-notes p { margin: 0 0 8px; }
.rcpt-notes p:last-child { margin-bottom: 0; }
.rcpt-ref { color: var(--ink-soft); font-size: 0.78rem; word-break: break-all; }
.rcpt-footer {
  display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;
  margin-top: 26px; padding-top: 16px; border-top: 1px solid var(--line);
  font-size: 0.78rem; color: var(--ink-soft);
}
.rcpt-actions { display: flex; align-items: center; gap: 1.25rem; }
.rcpt-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 26px; border: none; border-radius: 12px;
  background: var(--ink); color: #fff; font: 600 0.95rem inherit; cursor: pointer;
  box-shadow: 0 6px 18px rgba(18,50,78,0.28); transition: transform .12s ease;
}
.rcpt-btn:hover { transform: translateY(-2px); }
.rcpt-back { color: var(--ink); font-weight: 600; text-decoration: underline; text-underline-offset: 2px; }

@media (max-width: 640px) {
  .rcpt-paper { padding: 30px 22px; }
  .rcpt-meta { grid-template-columns: 1fr; gap: 1rem; }
  .rcpt-totals { width: 100%; }
}

@media print {
  body { margin: 0; background: #fff; }
  body * { visibility: hidden; }
  .rcpt-root, .rcpt-root * { visibility: visible; }
  .rcpt-root { position: absolute; inset: 0; min-height: 0; padding: 0; background: #fff; display: block; }
  .rcpt-paper { max-width: none; border: none; box-shadow: none; border-radius: 0; padding: 0; }
  .rcpt-no-print { display: none !important; }
  .rcpt-logo, .rcpt-table thead th, .rcpt-grand, .rcpt-paid { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page { size: A4; margin: 16mm; }
}
`;

export default async function ReceiptPage({ params }: { params: Promise<{ session: string }> }) {
  const { session } = await params;
  const r = await getReceiptBySession(session);

  if (!r) {
    return (
      <main className="rcpt-root">
        <style dangerouslySetInnerHTML={{ __html: RECEIPT_CSS }} />
        <div className="rcpt-paper" style={{ maxWidth: 520, textAlign: "center" }}>
          <div className="rcpt-logo" style={{ margin: "0 auto 16px" }}>P</div>
          <h1 style={{ marginTop: 0 }}>Receipt not ready yet</h1>
          <p style={{ color: "#5a6b7b", lineHeight: 1.55 }}>
            We couldn&apos;t find a paid receipt for this booking yet. If you&apos;ve just paid, wait a
            moment and refresh, or <Link href="/contact">contact us</Link>.
          </p>
        </div>
      </main>
    );
  }

  const patient = r.patientName || r.patientEmail;

  return (
    <main className="rcpt-root">
      <style dangerouslySetInnerHTML={{ __html: RECEIPT_CSS }} />

      <div className="rcpt-paper">
        <div className="rcpt-head">
          <div className="rcpt-brand">
            <div className="rcpt-logo" aria-hidden="true">P</div>
            <div>
              <div className="rcpt-trading">{invoiceIssuer.tradingName}</div>
              <div className="rcpt-legal">{invoiceIssuer.legalName}</div>
            </div>
          </div>
          <div className="rcpt-doc">
            <div className="rcpt-doctitle">RECEIPT</div>
            <span className="rcpt-paid">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12l5 5L20 6" /></svg>
              PAID
            </span>
          </div>
        </div>

        <div className="rcpt-meta">
          <div className="rcpt-from">
            <div className="rcpt-label">From</div>
            <div>{invoiceIssuer.tradingName} ({invoiceIssuer.legalName})</div>
            {invoiceIssuer.addressLines.filter(Boolean).map((line) => (
              <div key={line}>{line}</div>
            ))}
            <div>{invoiceIssuer.contactEmail}</div>
            <div className="rcpt-reg">
              HCPC {issuerField(invoiceIssuer.hcpcNumber)} · CSP {issuerField(invoiceIssuer.cspNumber)}
            </div>
          </div>
          <div className="rcpt-billto">
            <div className="rcpt-label">Billed to</div>
            <div style={{ fontWeight: 700 }}>{patient}</div>
            {r.patientName && r.patientEmail ? <div>{r.patientEmail}</div> : null}
          </div>
          <div className="rcpt-info">
            <div className="rcpt-label">Details</div>
            <div><span>Invoice no.</span><strong>{r.invoiceNumber}</strong></div>
            <div><span>Date paid</span><strong>{fmtDate(r.paidAt)}</strong></div>
            <div><span>Method</span><strong>Card · Stripe</strong></div>
          </div>
        </div>

        <table className="rcpt-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Session date</th>
              <th className="r">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div className="rcpt-item-title">{r.serviceLabel}</div>
                <div className="rcpt-item-sub">Physiotherapy service</div>
              </td>
              <td>{fmtDate(r.sessionDate)}</td>
              <td className="r">{formatGbp(r.amountPence)}</td>
            </tr>
          </tbody>
        </table>

        <div className="rcpt-totals">
          <div className="rcpt-total-row"><span>Subtotal</span><span>{formatGbp(r.amountPence)}</span></div>
          <div className="rcpt-total-row"><span>VAT</span><span>£0.00 (exempt)</span></div>
          <div className="rcpt-total-row rcpt-grand"><span>Total paid</span><span>{formatGbp(r.amountPence)}</span></div>
        </div>

        <div className="rcpt-notes">
          <p><strong>This is an official receipt for a physiotherapy service.</strong> Please retain it for your private health insurance claim.</p>
          <p>{invoiceIssuer.vatStatus}</p>
          <p className="rcpt-ref">Payment reference: {session}</p>
        </div>

        <div className="rcpt-footer">
          <span>{invoiceIssuer.tradingName} · HCPC {issuerField(invoiceIssuer.hcpcNumber)} · CSP {issuerField(invoiceIssuer.cspNumber)}</span>
          <span>{invoiceIssuer.contactEmail}</span>
        </div>
      </div>

      <div className="rcpt-actions rcpt-no-print">
        <PrintButton />
        <Link href="/" className="rcpt-back">Back to home</Link>
      </div>
    </main>
  );
}
