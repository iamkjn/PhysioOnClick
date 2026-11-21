"use client";

import Link from "next/link";
import { PhoneCall } from "lucide-react";

import { MailIcon, recordContactTap } from "@/components/contact-options";
import { TrackedBookLink } from "@/components/tracked-book-link";
import { trackGrowthEvent } from "@/lib/growth-tracking";
import { conditionEmailHref } from "@/lib/practice-contact";
import { visitRequestHrefAbout } from "@/lib/visit-request";

/**
 * "Which one do I need?" at the top of /pricing. Visitors were leaving after
 * ~16 seconds of a long price list (Nov 2026); three plain choices answer the
 * question first, and the full list stays below.
 */
export function PricingChooser({
  homeInitial,
  homeFollowUp,
  videoInitial,
}: {
  /** e.g. "£80" */
  homeInitial: string;
  homeFollowUp: string;
  videoInitial: string;
}) {
  return (
    <section className="pricing-chooser" aria-labelledby="pricing-chooser-title">
      <h2 id="pricing-chooser-title">Which one do I need?</h2>
      <div className="pricing-chooser-grid">
        <div className="pricing-chooser-tile is-featured">
          <h3>Home visit</h3>
          <p className="pricing-chooser-where">Glasgow and up to about an hour away</p>
          <p className="pricing-chooser-price">
            {homeInitial} <small>first visit, about an hour, all in</small>
          </p>
          <p className="pricing-chooser-where">Then {homeFollowUp} a visit. No travel charge, no GP referral.</p>
          <TrackedBookLink
            className="button primary"
            href={visitRequestHrefAbout("Home visit (from the pricing page)")}
            source="pricing_chooser_home"
          >
            <PhoneCall className="contact-icon" size={18} aria-hidden="true" />
            Request a call back
          </TrackedBookLink>
          <p className="pricing-chooser-alt">
            or{" "}
            <Link
              href="/book?visit=home"
              onClick={() => trackGrowthEvent("book_now_click", { source: "pricing_chooser_home_online" })}
            >
              choose a time and pay online
            </Link>
          </p>
        </div>

        <div className="pricing-chooser-tile">
          <h3>Video appointment</h3>
          <p className="pricing-chooser-where">Anywhere in the UK</p>
          <p className="pricing-chooser-price">
            {videoInitial} <small>first appointment</small>
          </p>
          <p className="pricing-chooser-where">With the same HCPC-registered physiotherapist, from home.</p>
          <TrackedBookLink
            className="button secondary"
            href="/book?service=initial-assessment"
            serviceSlug="initial-assessment"
            source="pricing_chooser_video"
          >
            Book a video appointment
          </TrackedBookLink>
        </div>

        <div className="pricing-chooser-tile">
          <h3>Not sure?</h3>
          <p className="pricing-chooser-where">
            Tell us what&apos;s going on and we&apos;ll recommend the right option, with no obligation to book.
          </p>
          <a
            className="button secondary"
            href={conditionEmailHref("which option suits me")}
            onClick={() => recordContactTap("email", "pricing_chooser_ask", "condition")}
          >
            <MailIcon />
            Email us about your condition
          </a>
          <p className="pricing-chooser-alt">
            or{" "}
            <Link
              href={visitRequestHrefAbout("Which option suits me (from the pricing page)")}
              onClick={() => trackGrowthEvent("book_now_click", { source: "pricing_chooser_ask_callback" })}
            >
              ask us to call you
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
