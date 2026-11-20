"use client";

import { usePathname } from "next/navigation";

import { MailIcon, WhatsAppIcon, recordContactTap } from "@/components/contact-options";
import { emailHref, topicForPath, whatsappHref } from "@/lib/practice-contact";

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

/** Bottom bar on phones with "WhatsApp us" and "Email us" (hidden on wider screens by CSS). */
export function ContactBar() {
  const pathname = usePathname() ?? "";
  if (!showContactBar(pathname)) return null;
  const topic = topicForPath(pathname);

  return (
    <nav className="contact-bar" aria-label="Message us">
      <a
        className="contact-bar-link contact-bar-link--whatsapp"
        href={whatsappHref(topic)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => recordContactTap("whatsapp", "contact_bar", topic)}
      >
        <WhatsAppIcon />
        WhatsApp us
      </a>
      <a
        className="contact-bar-link contact-bar-link--email"
        href={emailHref(topic)}
        onClick={() => recordContactTap("email", "contact_bar", topic)}
      >
        <MailIcon />
        Email us
      </a>
    </nav>
  );
}
