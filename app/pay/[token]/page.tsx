import type { Metadata } from "next";
import Link from "next/link";
import { getPaymentRequest } from "@/lib/package-payment";
import { formatPounds } from "@/lib/home-visit-pricing";
import { PayButton } from "./pay-button";

// Public payment page for a physio-arranged treatment package. Reached only
// from the link the admin shares; the 32-hex token is the access check.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pay for your treatment plan",
  robots: { index: false, follow: false },
};

export default async function PayPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { token } = await params;
  const { paid } = await searchParams;
  const view = await getPaymentRequest(token);

  if (!view) {
    return (
      <div className="site-shell">
        <section className="page-section pay-page">
          <div className="panel stack">
            <h1 className="pay-page__title">This payment link isn&apos;t valid</h1>
            <p className="muted">It may have been replaced. Please contact us and we&apos;ll send you a new one.</p>
            <p><Link href="/contact" className="button secondary">Contact us</Link></p>
          </div>
        </section>
      </div>
    );
  }

  const sessionsLine = `${view.totalSessions} ${view.visitType === "home" ? "home visit" : "video session"}${view.totalSessions === 1 ? "" : "s"}`;
  const isPaid = view.status === "paid";
  const justPaid = paid === "1" && !isPaid;

  return (
    <div className="site-shell">
      <section className="page-section pay-page">
        <div className="panel stack">
          <p className="pay-page__eyebrow">PhysioOnClick</p>
          <h1 className="pay-page__title">
            {isPaid ? "Paid, thank you" : justPaid ? "Thank you, we're confirming your payment" : "Your treatment plan"}
          </h1>
          {view.firstName && !isPaid && !justPaid && (
            <p className="muted">Payment for {view.firstName}&apos;s physiotherapy treatment plan.</p>
          )}
          <dl className="pay-page__summary">
            <div><dt>Plan</dt><dd>{view.title}</dd></div>
            <div><dt>Sessions</dt><dd>{sessionsLine}</dd></div>
            {view.datesLine && <div><dt>Dates</dt><dd>{view.datesLine}</dd></div>}
            <div className="pay-page__total"><dt>{isPaid ? "Paid" : "Amount"}</dt><dd>{formatPounds(view.amountPence)}</dd></div>
          </dl>
          {isPaid ? (
            <p className="muted">Your receipt and invoice have been emailed to you. Nothing more to do.</p>
          ) : justPaid ? (
            <p className="muted">Your receipt will arrive by email in a minute or two. You can close this page.</p>
          ) : view.status === "open" ? (
            <>
              <PayButton token={view.token} label={`Pay ${formatPounds(view.amountPence)} securely`} />
              <p className="muted pay-page__fine">Card, Apple Pay or Google Pay through Stripe. You&apos;ll get a receipt and invoice by email.</p>
            </>
          ) : (
            <p className="muted">This payment isn&apos;t available right now. Please contact us.</p>
          )}
        </div>
      </section>
    </div>
  );
}
