// Single source for how patients reach the practice: phone, WhatsApp and
// email. Dependency-free on purpose, so client components (the mobile contact
// bar) can import it without pulling in lib/structured-data's entity graph.
// lib/structured-data re-exports the phone constants for existing callers.

/** Dedicated business number, shown sitewide and in the entity graph. */
export const PRACTICE_PHONE = "07557 684395";

/** Same number in the digits-only form `tel:` links require. */
export const PRACTICE_PHONE_HREF = "tel:+447557684395";

/** The practice inbox (IONOS). Contact-form enquiries are also sent here. */
export const PRACTICE_EMAIL = "hello@physioonclick.co.uk";

export type ContactTopic = "general" | "home-visit" | "neuro" | "manual-therapy";

type TopicCopy = {
  /** Prefilled WhatsApp message. The patient can edit it before sending. */
  whatsapp: string;
  /** Email subject line. */
  subject: string;
};

const TOPICS: Record<ContactTopic, TopicCopy> = {
  general: {
    whatsapp: "Hi, I have a question about physiotherapy.",
    subject: "Physiotherapy question",
  },
  "home-visit": {
    whatsapp: "Hi, I'd like to ask about a physiotherapy home visit.",
    subject: "Home visit question",
  },
  neuro: {
    whatsapp: "Hi, I'd like to ask about neuro physiotherapy at home.",
    subject: "Neuro physiotherapy question",
  },
  "manual-therapy": {
    whatsapp: "Hi, I'd like to ask about hands-on physiotherapy at home.",
    subject: "Hands-on physiotherapy question",
  },
};

/** The short template that opens in the patient's mail app. */
const EMAIL_BODY = [
  "Hello,",
  "",
  "My name:",
  "My postcode:",
  "Who it's for and what's going on:",
  "Best time to reach me:",
  "",
  "Thanks",
].join("\n");

export function contactTopic(topic: ContactTopic): TopicCopy {
  return TOPICS[topic];
}

/** WhatsApp click-to-chat link for the practice number, with a prefilled message. */
export function whatsappHref(topic: ContactTopic): string {
  const digits = PRACTICE_PHONE_HREF.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(TOPICS[topic].whatsapp)}`;
}

/** mailto link with a subject and template. encodeURIComponent keeps spaces as
 *  %20; URLSearchParams would write "+", which many mail apps show literally. */
export function emailHref(topic: ContactTopic): string {
  const subject = encodeURIComponent(TOPICS[topic].subject);
  const body = encodeURIComponent(EMAIL_BODY);
  return `mailto:${PRACTICE_EMAIL}?subject=${subject}&body=${body}`;
}

/** Which topic fits a page, so the prefilled message matches what the visitor was reading. */
export function topicForPath(pathname: string): ContactTopic {
  if (pathname === "/physiotherapy-home-visits-glasgow" || pathname === "/glasgow-physiotherapist") return "home-visit";
  if (pathname === "/services/neurological-rehabilitation") return "neuro";
  if (pathname === "/manual-therapy-glasgow") return "manual-therapy";
  return "general";
}
