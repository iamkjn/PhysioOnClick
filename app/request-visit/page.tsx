import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ContactOptions } from "@/components/contact-options";
import { BookingRequest } from "@/components/booking-request";
import { APPOINTMENT_HOURS } from "@/lib/appointment-hours";
import { homeVisitPrices } from "@/lib/home-visit-pricing";
import { PRACTICE_PHONE, PRACTICE_PHONE_HREF } from "@/lib/practice-contact";
import { founder } from "@/lib/site-data";

const TITLE = "Request a physiotherapy appointment";
const DESCRIPTION = `Tell us when suits you; ${founder.name}, HCPC-registered physiotherapist, will call to confirm a home visit or video appointment. ${homeVisitPrices.initial} first visit, ${homeVisitPrices.followUp} after, all in. Pay after your session.`;

export const metadata: Metadata = {
  title: "Request an Appointment | PhysioOnClick",
  description: DESCRIPTION,
  alternates: { canonical: "/request-visit" },
  // A form, not content: kept out of search results. The home-visits page ranks instead.
  robots: { index: false, follow: true },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/request-visit",
    type: "website",
    siteName: "PhysioOnClick",
    locale: "en_GB",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "PhysioOnClick home physiotherapy in Glasgow" }],
  },
};

export default function RequestVisitPage() {
  return (
    <div className="site-shell">
      <section className="page-section">
        <BookingRequest source="request_visit_page" />
        <div className="request-below">
          <div className="visit-request-physio">
            <Image
              src="/images/shivaliba-zala-portrait.webp"
              alt={`${founder.name}, HCPC-registered physiotherapist`}
              width={120}
              height={160}
              className="visit-request-photo"
            />
            <div>
              <strong>{founder.name}</strong>
              <p className="muted">HCPC-registered physiotherapist, visiting homes across Glasgow and the surrounding area.</p>
            </div>
          </div>
          <div>
            <h2 className="visit-request-subhead">What happens next</h2>
            <ol className="visit-request-steps" data-contact-source="request_visit_steps">
              <li>
                We call you from <a href={PRACTICE_PHONE_HREF}>{PRACTICE_PHONE}</a>, usually within a day, to hear
                what&rsquo;s going on.
              </li>
              <li>We confirm a day and time that suits you, {APPOINTMENT_HOURS.phrase}.</li>
              <li>The visit, then your exercise plan with pictures, online and printed.</li>
              <li>
                You pay after your session by secure link. A home visit is {homeVisitPrices.initial} for the first
                visit (about an hour), {homeVisitPrices.followUp} for follow-ups, all in. No travel charge.
              </li>
            </ol>
          </div>
          <ContactOptions topic="home-visit" source="request_visit_page" lead="Rather message us?" />
          <p className="visit-request-small">
            Prefer to lock in your time and pay online now? <Link href="/book?pay=online">Book and pay online</Link>
          </p>
          <p className="visit-request-small muted">
            If someone has had a fall and is hurt, or is suddenly much worse, call 999 or NHS 24 on 111.
          </p>
        </div>
      </section>
    </div>
  );
}
