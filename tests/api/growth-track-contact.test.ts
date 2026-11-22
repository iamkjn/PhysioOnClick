import { beforeEach, describe, expect, it, vi } from "vitest";

const addMock = vi.fn().mockResolvedValue({ id: "evt" });
vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: () => ({ collection: () => ({ add: addMock }) }),
  FieldValue: { serverTimestamp: vi.fn().mockReturnValue("__TS__") },
}));

import { POST } from "@/app/api/growth/track/route";
import { resetRateLimitMemory } from "@/lib/rate-limit";

function req(body: object) {
  return new Request("http://localhost/api/growth/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/growth/track contact taps", () => {
  beforeEach(() => {
    resetRateLimitMemory();
    addMock.mockClear();
  });

  it.each(["whatsapp_click", "email_click"])("stores %s with its source and topic", async (event) => {
    const res = await POST(req({
      event,
      sessionId: "session-12345",
      path: "/physiotherapy-home-visits-glasgow",
      params: { source: "contact_bar", topic: "home-visit" },
    }));
    const json = await res.json();
    expect(json.saved).toBe(true);
    expect(addMock).toHaveBeenCalledTimes(1);
    const doc = addMock.mock.calls[0][0];
    expect(doc.event).toBe(event);
    expect(doc.params).toEqual({ source: "contact_bar", topic: "home-visit" });
  });

  it("stores a phone number tap", async () => {
    const res = await POST(req({ event: "call_click", sessionId: "session-12345", path: "/request-visit", params: { source: "footer" } }));
    expect((await res.json()).saved).toBe(true);
    expect(addMock.mock.calls[0][0]).toMatchObject({ event: "call_click", params: { source: "footer" } });
  });

  it("stores call-back form progress with the blocked fields and the failure status", async () => {
    for (const [event, params] of [
      ["visit_request_started", { source: "request_visit_page", step: "phone" }],
      ["visit_request_error", { source: "request_visit_page", fields: "phone:invalid,postcode:missing" }],
      ["visit_request_failed", { source: "request_visit_page", status: 503 }],
    ] as const) {
      const res = await POST(req({ event, sessionId: "session-12345", path: "/request-visit", params }));
      expect((await res.json()).saved).toBe(true);
    }
    expect(addMock.mock.calls.map(([doc]) => [doc.event, doc.params])).toEqual([
      ["visit_request_started", { source: "request_visit_page", step: "phone" }],
      ["visit_request_error", { source: "request_visit_page", fields: "phone:invalid,postcode:missing" }],
      ["visit_request_failed", { source: "request_visit_page", status: 503 }],
    ]);
  });
});
