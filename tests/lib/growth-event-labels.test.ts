import { describe, expect, it } from "vitest";

import { contactEventTitle } from "@/lib/growth-event-labels";

describe("contactEventTitle", () => {
  it("names phone, WhatsApp and email taps", () => {
    expect(contactEventTitle({ event: "call_click" })).toBe("Phone number tapped");
    expect(contactEventTitle({ event: "whatsapp_click" })).toBe("WhatsApp tapped");
    expect(contactEventTitle({ event: "email_click" })).toBe("Email tapped");
  });

  it("names each step of the call-back form", () => {
    expect(contactEventTitle({ event: "visit_request_started" })).toBe("Started the call-back form");
    expect(contactEventTitle({ event: "visit_request_sent" })).toBe("Call-back requested");
    expect(contactEventTitle({ event: "visit_request_failed", params: { status: 503 } })).toBe(
      "Call-back form didn't send (server error 503)",
    );
    expect(contactEventTitle({ event: "visit_request_failed", params: { status: 0 } })).toBe(
      "Call-back form didn't send (no connection)",
    );
  });

  it("says which fields stopped the form, in plain words", () => {
    expect(
      contactEventTitle({ event: "visit_request_error", params: { fields: "phone:invalid,postcode:missing" } }),
    ).toBe("Call-back form stopped: phone number not accepted, postcode missing");
    expect(contactEventTitle({ event: "visit_request_error", params: { fields: "name:missing" } })).toBe(
      "Call-back form stopped: name missing",
    );
    expect(contactEventTitle({ event: "visit_request_error" })).toBe("Call-back form stopped");
  });

  it("leaves other events to the caller", () => {
    expect(contactEventTitle({ event: "page_view" })).toBeNull();
  });
});
