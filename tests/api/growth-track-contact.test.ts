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
});
