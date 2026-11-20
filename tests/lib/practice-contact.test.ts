import { describe, expect, it } from "vitest";
import {
  PRACTICE_EMAIL,
  PRACTICE_PHONE,
  PRACTICE_PHONE_HREF,
  contactTopic,
  emailHref,
  whatsappHref,
} from "@/lib/practice-contact";
import * as structuredData from "@/lib/structured-data";
import { invoiceIssuer } from "@/lib/site-data";

describe("practice contact details", () => {
  it("keeps one source for the phone number and email", () => {
    expect(structuredData.PRACTICE_PHONE).toBe(PRACTICE_PHONE);
    expect(structuredData.PRACTICE_PHONE_HREF).toBe(PRACTICE_PHONE_HREF);
    expect(invoiceIssuer.contactEmail).toBe(PRACTICE_EMAIL);
    expect(PRACTICE_EMAIL).toBe("hello@physioonclick.co.uk");
  });

  it("builds a WhatsApp click-to-chat link from the same number", () => {
    const digits = PRACTICE_PHONE_HREF.replace(/\D/g, "");
    const href = whatsappHref("home-visit");
    expect(href.startsWith(`https://wa.me/${digits}?text=`)).toBe(true);
    expect(digits).toBe("447557684395");
    const text = new URL(href).searchParams.get("text");
    expect(text).toBe(contactTopic("home-visit").whatsapp);
    expect(text).toMatch(/home visit/i);
  });

  it("builds a mailto link with a subject and a short template", () => {
    const href = emailHref("neuro");
    expect(href.startsWith(`mailto:${PRACTICE_EMAIL}?`)).toBe(true);
    // Mail apps show "+" literally, so spaces must be %20.
    expect(href).not.toContain("+");
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("subject")).toBe(contactTopic("neuro").subject);
    expect(params.get("body")).toMatch(/postcode/i);
  });

  it("has a sensible message for every topic", () => {
    for (const topic of ["general", "home-visit", "neuro", "manual-therapy"] as const) {
      const t = contactTopic(topic);
      expect(t.whatsapp.length).toBeGreaterThan(10);
      expect(t.subject.length).toBeGreaterThan(5);
    }
  });
});
