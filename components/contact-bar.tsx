"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PhoneCall } from "lucide-react";

import { MailIcon, WhatsAppIcon, recordContactTap } from "@/components/contact-options";
import { trackGrowthEvent } from "@/lib/growth-tracking";
import { emailHref, topicForPath, whatsappHref } from "@/lib/practice-contact";
import { VISIT_REQUEST_PATH } from "@/lib/visit-request";

// Pages where a visitor might be weighing up a Glasgow appointment. Kept off
// the exercise library, blog, booking flow and patient/admin areas: most
// exercise readers are overseas, and the booking flow has its own next step.
const BAR_PATHS = new Set([
  "/",
  "/about",
  "/pricing",
  "/contact",
  "/services",
  "/glasgow-physiotherapist",
  "/physiotherapy-home-visits-glasgow",
  "/manual-therapy-glasgow",
]);

export function showContactBar(pathname: string): boolean {
  return BAR_PATHS.has(pathname) || pathname.startsWith("/services/");
}

/**
 * Bottom bar on phones (hidden on wider screens by CSS): "Call me back" opens
 * the short visit-request form, then "WhatsApp" and "Email".
 */
export function ContactBar() {
  const pathname = usePathname() ?? "";
  if (!showContactBar(pathname)) return null;
  const topic = topicForPath(pathname);

  return (
    <nav className="contact-bar" aria-label="Contact us">
      <Link
        className="contact-bar-link contact-bar-link--callback"
        href={VISIT_REQUEST_PATH}
        onClick={() => trackGrowthEvent("book_now_click", { source: "contact_bar_callback" })}
      >
        <PhoneCall className="contact-icon" size={18} aria-hidden="true" />
        Call me back
      </Link>
      <a
        className="contact-bar-link contact-bar-link--whatsapp"
        href={whatsappHref(topic)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => recordContactTap("whatsapp", "contact_bar", topic)}
      >
        <WhatsAppIcon />
        WhatsApp
      </a>
      <a
        className="contact-bar-link contact-bar-link--email"
        href={emailHref(topic)}
        onClick={() => recordContactTap("email", "contact_bar", topic)}
      >
        <MailIcon />
        Email
      </a>
    </nav>
  );
}
