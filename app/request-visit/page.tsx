import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ContactOptions } from "@/components/contact-options";
import { VisitRequestForm } from "@/components/visit-request-form";
import { APPOINTMENT_HOURS } from "@/lib/appointment-hours";
import { homeVisitPrices } from "@/lib/home-visit-pricing";
import { PRACTICE_PHONE, PRACTICE_PHONE_HREF } from "@/lib/practice-contact";
import { founder } from "@/lib/site-data";

const TITLE = "Request a physiotherapy home visit in Glasgow";
const DESCRIPTION = `Leave your name, number and postcode and ${founder.name}, HCPC-registered physiotherapist, will call you back to arrange a home visit. ${homeVisitPrices.initial} first visit, ${homeVisitPrices.followUp} after, all in. Nothing to pay now.`;

export const metadata: Metadata = {
  title: "Request a Home Visit | PhysioOnClick",
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
      <section className="page-section visit-request">
        <div className="visit-request-main">
          <span className="eyebrow">Home visits in Glasgow and nearby</span>
          <h1>Request a home visit</h1>
          <p className="lead">
            Leave your name, number and postcode. {founder.name.split(" ")[0]} will call you back to find a time that
            suits. There&rsquo;s nothing to pay until you&rsquo;ve spoken.
          </p>
          <div className="visit-request-card">
            <VisitRequestForm />
          </div>
          <p className="visit-request-small muted">
            If someone has had a fall and is hurt, or is suddenly much worse, call 999 or NHS 24 on 111.
          </p>
        </div>

        <aside className="visit-request-aside">
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
            <ol className="visit-request-steps">
              <li>
                We call you from <a href={PRACTICE_PHONE_HREF}>{PRACTICE_PHONE}</a>, usually within a day, to hear
                what&rsquo;s going on.
              </li>
              <li>
                We agree a day and time: {APPOINTMENT_HOURS.weekdays.short}, {APPOINTMENT_HOURS.weekends.short}.
              </li>
              <li>
                You get a secure payment link: {homeVisitPrices.initial} for the first visit (about an hour),{" "}
                {homeVisitPrices.followUp} for follow-ups, all in. No travel charge.
              </li>
              <li>The visit, then your exercise plan with pictures, online and printed.</li>
            </ol>
          </div>

          <ContactOptions topic="home-visit" source="request_visit_page" lead="Rather message us?" />

          <p className="visit-request-small">
            Prefer to choose a time and pay online now?{" "}
            <Link href="/book?visit=home">Book online</Link>
          </p>
        </aside>
      </section>
    </div>
  );
}
