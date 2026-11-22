"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PhoneCall } from "lucide-react";

import { MailIcon, WhatsAppIcon, recordContactTap } from "@/components/contact-options";
import { useVisitorRegion } from "@/components/region-switch";
import { trackGrowthEvent } from "@/lib/growth-tracking";
import { emailHref, topicForPath, whatsappHref } from "@/lib/practice-contact";
import { VISIT_REQUEST_PATH } from "@/lib/visit-request";

// Pages where a visitor might be weighing up an appointment. Kept off the
// blog, the printable receipt, the call-back form itself and the patient/admin
// areas. The exercise library is listed but only shown to UK readers (see
// ContactBar): most of its readers are overseas and can't use a UK appointment.
const BAR_PATHS = new Set([
  "/",
  "/about",
  "/pricing",
  "/contact",
  "/services",
  "/glasgow-physiotherapist",
  "/physiotherapy-home-visits-glasgow",
  "/manual-therapy-glasgow",
  "/book",
  "/book/success",
  "/exercises",
]);

function isExercisePath(pathname: string): boolean {
  return pathname === "/exercises" || pathname.startsWith("/exercises/");
}

export function showContactBar(pathname: string): boolean {
  return BAR_PATHS.has(pathname) || pathname.startsWith("/services/") || isExercisePath(pathname);
}

/**
 * Bar fixed to the bottom of the screen on every screen size: "Call me back"
 * opens the short visit-request form, then "WhatsApp" and "Email". Phones show
 * the three buttons only; wider screens add a short lead line on the left.
 */
export function ContactBar() {
  const pathname = usePathname() ?? "";
  const region = useVisitorRegion();
  if (!showContactBar(pathname)) return null;
  // The region is "unknown" in the static HTML and until the browser answers,
  // so overseas readers never see the bar flash up and disappear.
  if (isExercisePath(pathname) && region !== "uk") return null;
  const topic = topicForPath(pathname);

  return (
    <nav className="contact-bar" aria-label="Contact us">
      <div className="contact-bar-inner">
        <p className="contact-bar-lead">
          <strong>Questions?</strong> Ask the physio on WhatsApp or by email, or ask for a call back.
        </p>
        <div className="contact-bar-actions">
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
        </div>
      </div>
    </nav>
  );
}
