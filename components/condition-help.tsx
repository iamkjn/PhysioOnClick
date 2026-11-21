"use client";

import Link from "next/link";
import { PhoneCall } from "lucide-react";

import { MailIcon, WhatsAppIcon, recordContactTap } from "@/components/contact-options";
import { trackGrowthEvent } from "@/lib/growth-tracking";
import { PRACTICE_PHONE, PRACTICE_PHONE_HREF, conditionEmailHref, conditionWhatsappHref } from "@/lib/practice-contact";
import { visitRequestHrefAbout } from "@/lib/visit-request";

export { visitRequestHrefAbout };

/**
 * "Ask about your condition": for visitors who read a service, price list or
 * exercise and leave with a question about their own problem. Email (with a
 * short template naming what they were reading), a call back via the short
 * request form, or WhatsApp. Every tap is logged to the Growth tab.
 */
export function ConditionHelp({
  about,
  source,
  heading = "Not sure if this is right for you?",
  lead = "Tell us what's going on. Shivaliba will get back to you personally with what she'd suggest, with no obligation to book.",
  headingLevel = "h2",
  inline = false,
  hideCallBack = false,
}: {
  /** What the visitor was reading, e.g. "Neurological rehabilitation" or "Clamshell (exercise)". */
  about?: string;
  /** Where the block sits, recorded with each tap (e.g. "service_detail_condition"). */
  source: string;
  heading?: string;
  lead?: string;
  headingLevel?: "h2" | "h3";
  /** No card or heading: sits inside another prompt. */
  inline?: boolean;
  /** Leave out "Request a call back" where the surrounding prompt already offers it. */
  hideCallBack?: boolean;
}) {
  const Heading = headingLevel;
  return (
    <div className={inline ? "condition-help condition-help--inline" : "condition-help"}>
      {inline ? null : <Heading className="condition-help-title">{heading}</Heading>}
      <p className="condition-help-lead">{lead}</p>
      <div className="condition-help-actions">
        <a
          className="button primary condition-help-email"
          href={conditionEmailHref(about)}
          onClick={() => recordContactTap("email", source, "condition")}
        >
          <MailIcon />
          Email us about your condition
        </a>
        {hideCallBack ? null : (
          <Link
            className="button secondary"
            href={visitRequestHrefAbout(about)}
            onClick={() => trackGrowthEvent("book_now_click", { source: `${source}_callback` })}
          >
            <PhoneCall className="contact-icon" size={18} aria-hidden="true" />
            Request a call back
          </Link>
        )}
        <a
          className="button secondary condition-help-whatsapp"
          href={conditionWhatsappHref(about)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => recordContactTap("whatsapp", source, "condition")}
        >
          <WhatsAppIcon />
          WhatsApp
        </a>
      </div>
      <p className="condition-help-small">
        Or call or text <a href={PRACTICE_PHONE_HREF}>{PRACTICE_PHONE}</a>. Home visits across Glasgow and nearby,
        video appointments anywhere in the UK.
      </p>
    </div>
  );
}
