import { QuickQueryForm } from "@/components/quick-query-form";
import { VisitRequestForm } from "@/components/visit-request-form";

/** The step-by-step request with the short "call me back" form beside it. */
export function BookingRequest({ source }: { source: string }) {
  return (
    <div className="request-layout">
      <div className="request-col">
        <span className="eyebrow">Pay after your session, cash accepted for home visits</span>
        <h1>Request an appointment</h1>
        <p>Tell us what you need and when suits you. We call you to confirm the time.</p>
        <div className="request-card">
          <VisitRequestForm source={source} />
        </div>
      </div>
      <aside className="request-col">
        <span className="eyebrow">Short on time?</span>
        <h2>Quick query</h2>
        <p>Leave your details and we&rsquo;ll call you back.</p>
        <div className="request-card request-card--quick">
          <QuickQueryForm />
        </div>
      </aside>
    </div>
  );
}
