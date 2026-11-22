"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PhoneCall } from "lucide-react";

import { MailIcon, WhatsAppIcon, recordContactTap } from "@/components/contact-options";
import { useVisitorRegion } from "@/components/region-switch";
import { trackGrowthEvent } from "@/lib/growth-tracking";
import { emailHref, topicForPath, whatsappHref } from "@/lib/practice-contact";
import { VISIT_REQUEST_PATH } from "@/lib/visit-request";

// Every public tab gets the bar. Kept off the printable receipt, the call-back
// form itself, legal pages and the patient/admin areas. The exercise library
// (and its self-checks) is listed but only shown to UK readers (see
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
  "/how-online-physiotherapy-works",
  "/online-physiotherapy-scotland",
  "/cancellation-policy",
  "/book",
  "/book/success",
  "/exercises",
  "/blog",
  "/guides",
]);

const BAR_PREFIXES = ["/services/", "/exercises/", "/blog/", "/guides/", "/online-physiotherapy-for/", "/pay/"];

function isExercisePath(pathname: string): boolean {
  return pathname === "/exercises" || pathname.startsWith("/exercises/");
}

export function showContactBar(pathname: string): boolean {
  return BAR_PATHS.has(pathname) || BAR_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export type ContactBarMessage = {
  /** Bold opening on wider screens. */
  title: string;
  /** The rest of the line on wider screens. */
  text: string;
  /** The one line phones show above the buttons (keep to ~42 characters). */
  short: string;
};

// What a visitor on each tab might be stuck on, answered with "we'll help".
const MESSAGES = {
  home: {
    title: "Not sure where to start?",
    text: "Tell us what's going on and we'll guide you to the right help.",
    short: "Not sure where to start? We'll guide you.",
  },
  about: {
    title: "Want to talk before you decide?",
    text: "Ask us anything. There's no pressure to book.",
    short: "Want to talk first? Ask us anything.",
  },
  services: {
    title: "Not sure which treatment you need?",
    text: "Tell us what's going on and we'll point you to the right one.",
    short: "Not sure what you need? We'll help.",
  },
  neuro: {
    title: "Caring for someone with a neuro condition?",
    text: "Talk it through with us and we'll explain the options.",
    short: "Caring for someone? Talk it through.",
  },
  homeVisit: {
    title: "Need a physio to come to you?",
    text: "Message us your postcode and we'll arrange the visit for you.",
    short: "Need a home visit? We'll arrange it.",
  },
  exercises: {
    title: "Not sure an exercise is right for you?",
    text: "Ask the physio before you try it, or if it isn't helping.",
    short: "Unsure about an exercise? Ask the physio.",
  },
  selfChecks: {
    title: "Worried about what a self-check showed?",
    text: "Ask the physio what it means for you.",
    short: "Worried about a result? Ask the physio.",
  },
  blog: {
    title: "Reading about your own pain?",
    text: "Ask us about your situation and we'll help you with the next step.",
    short: "Question about your pain? Just ask us.",
  },
  pricing: {
    title: "Not sure which option is right for you?",
    text: "We'll help you choose. No pressure.",
    short: "Not sure which option? We'll help you.",
  },
  booking: {
    title: "Finding it hard to book?",
    text: "Leave it to us. Message us and we'll book it for you.",
    short: "Finding it hard to book? Leave it to us.",
  },
  appointment: {
    title: "Questions about your appointment?",
    text: "Just message us. We're happy to help.",
    short: "Questions about your appointment? Ask us.",
  },
  change: {
    title: "Need to change or cancel?",
    text: "Message us and we'll sort it out for you.",
    short: "Need to change a booking? Message us.",
  },
  payment: {
    title: "Having trouble paying?",
    text: "Message us and we'll sort it out with you.",
    short: "Trouble paying? We'll sort it out.",
  },
  contact: {
    title: "Prefer a quick message?",
    text: "WhatsApp or email us, or ask us to call you back.",
    short: "Prefer a quick message? We're here.",
  },
} satisfies Record<string, ContactBarMessage>;

/** The bar's message for a page: what someone on that tab might be stuck on. */
export function contactBarMessage(pathname: string): ContactBarMessage {
  if (pathname === "/book") return MESSAGES.booking;
  if (pathname.startsWith("/book/")) return MESSAGES.appointment;
  if (pathname === "/cancellation-policy") return MESSAGES.change;
  if (pathname.startsWith("/pay/")) return MESSAGES.payment;
  if (pathname === "/exercises/tests" || pathname.startsWith("/exercises/tests/")) return MESSAGES.selfChecks;
  if (isExercisePath(pathname)) return MESSAGES.exercises;
  if (pathname === "/blog" || pathname.startsWith("/blog/")) return MESSAGES.blog;
  if (pathname === "/pricing") return MESSAGES.pricing;
  if (pathname === "/about") return MESSAGES.about;
  if (pathname === "/contact") return MESSAGES.contact;
  if (pathname === "/physiotherapy-home-visits-glasgow" || pathname === "/glasgow-physiotherapist") {
    return MESSAGES.homeVisit;
  }
  if (pathname === "/services/neurological-rehabilitation") return MESSAGES.neuro;
  if (pathname === "/") return MESSAGES.home;
  return MESSAGES.services;
}

/**
 * Bar fixed to the bottom of the screen on every screen size, with a message
 * that fits the page ("Finding it hard to book? Leave it to us.") and three
 * buttons: "Call me back" opens the short visit-request form, then "WhatsApp"
 * and "Email" with a prefilled message for the page.
 */
export function ContactBar() {
  const pathname = usePathname() ?? "";
  const region = useVisitorRegion();
  if (!showContactBar(pathname)) return null;
  // The region is "unknown" in the static HTML and until the browser answers,
  // so overseas readers never see the bar flash up and disappear.
  if (isExercisePath(pathname) && region !== "uk") return null;
  const topic = topicForPath(pathname);
  const message = contactBarMessage(pathname);

  return (
    <nav className="contact-bar" aria-label="Contact us">
      <div className="contact-bar-inner">
        <p className="contact-bar-lead">
          <strong>{message.title}</strong> <span>{message.text}</span>
        </p>
        <p className="contact-bar-note">{message.short}</p>
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
