import type { Metadata } from "next";
import Link from "next/link";
import { TrackedBookLink } from "@/components/tracked-book-link";
import { APPOINTMENT_HOURS_SENTENCE } from "@/lib/appointment-hours";
import { homeVisitPrices } from "@/lib/home-visit-pricing";
import { PRACTICE_PHONE, PRACTICE_PHONE_HREF } from "@/lib/structured-data";

// Where the QR code on the leave-behind fridge magnet points
// (physioonclick.co.uk/plan). Two readers: the patient, who wants their
// exercises or their next visit, and whoever spots the magnet on their fridge
// and asks about it. Kept out of search and the sitemap: it only makes sense
// to someone holding the magnet. Scans show up in analytics as visits to
// /plan with utm_source=fridge_magnet.
export const metadata: Metadata = {
  alternates: { canonical: "/plan" },
  title: "Your physio plan | PhysioOnClick",
  description: "Open your exercises, book your next home visit, or find out about evening and weekend home physiotherapy in Glasgow.",
  robots: { index: false, follow: true },
};

export default function PlanPage() {
  return (
    <div className="site-shell">
      <section className="page-hero page-hero-split">
        <div className="stack">
          <span className="eyebrow">Your physio plan</span>
          <h1>Your exercises and your next visit</h1>
          <p className="lead">
            Sign in to see the exercises your physiotherapist set for you, with pictures and how many to do.
          </p>
          <div className="button-row">
            <Link className="button primary" href="/patient/exercises" prefetch>
              Open my exercises
            </Link>
            <TrackedBookLink
              className="button secondary"
              href="/book?visit=home"
              source="fridge_magnet_plan"
              event="book_now_click"
            >
              Book my next visit
            </TrackedBookLink>
          </div>
          {PRACTICE_PHONE && PRACTICE_PHONE_HREF ? (
            <p>
              Something changed, or a question about an exercise? Call or text{" "}
              <a href={PRACTICE_PHONE_HREF}>{PRACTICE_PHONE}</a>.
            </p>
          ) : null}
        </div>
        <div className="page-hero-aside checklist-panel">
          <h2>Saw this on a friend&rsquo;s fridge?</h2>
          <ul className="clean-list">
            <li>Physiotherapy at home in Glasgow, Paisley and Hamilton, from an HCPC registered physiotherapist</li>
            <li>{APPOINTMENT_HOURS_SENTENCE}</li>
            <li>Family members or carers are welcome to join and learn how to help</li>
            <li>
              Home assessment {homeVisitPrices.initial}, all in. No GP referral needed.
            </li>
          </ul>
          <div className="button-row">
            <TrackedBookLink
              className="button primary"
              href="/book?visit=home"
              source="fridge_magnet_new"
              event="book_now_click"
            >
              Book a home visit
            </TrackedBookLink>
            <Link className="button secondary" href="/physiotherapy-home-visits-glasgow" prefetch>
              About home visits
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
