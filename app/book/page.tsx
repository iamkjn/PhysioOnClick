import type { Metadata } from "next";

import Link from "next/link";

import { BookingFlow } from "@/components/booking-flow";
import { VISIT_REQUEST_PATH } from "@/lib/visit-request";

export const metadata: Metadata = {
  alternates: { canonical: "/book" },
  title: "Book an Appointment | PhysioOnClick",
  description:
    "Book your physiotherapy appointment online. Choose from initial assessments, follow-ups, and online consultations with a Glasgow HCPC-registered physiotherapist."
};

export default function BookPage() {
  return (
    <div className="site-shell">
      {/* No page hero: the flow's left rail carries the title, and the site
          header already sits above it. */}
      <section className="page-section">
        <p className="book-callback-note">
          Prefer a phone call?{" "}
          <Link href={VISIT_REQUEST_PATH}>Leave your number and we&rsquo;ll call you</Link> to arrange a home visit.
          Nothing to pay until you&rsquo;ve spoken.
        </p>
        <BookingFlow />
      </section>
    </div>
  );
}
