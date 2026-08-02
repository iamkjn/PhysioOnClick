// tests/api/cal-webhook-meeting-url.test.ts
// Focused test: cal-webhook writes meetingUrl to the booking doc when the Cal
// payload carries a video call URL, and omits the field entirely when absent.
// Modeled on tests/api/cal-webhook-paid.test.ts's mock/signature setup.
import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let addedDocData: Record<string, unknown> | undefined;
const bookingRef = { update: vi.fn().mockResolvedValue(undefined) };
const db = {
  collection: vi.fn((name: string) => {
    if (name === "bookings") {
      return {
        where: () => ({ limit: () => ({ get: async () => ({ empty: true, docs: [] }) }) }),
        add: vi.fn(async (data: Record<string, unknown>) => {
          addedDocData = data;
          return bookingRef;
        }),
      };
    }
    // payments / users / patients lookups -> empty
    return { where: () => ({ limit: () => ({ get: async () => ({ empty: true, docs: [] }) }) }) };
  }),
  doc: () => ({ get: async () => ({ exists: false }), delete: vi.fn(), update: vi.fn() }),
};

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: () => db,
  FieldValue: { serverTimestamp: () => "TS" },
}));
import { POST } from "@/app/api/cal-webhook/route";

const SECRET = "cal_secret";
function signed(body: string) {
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("hex");
  return new Request("http://localhost/api/cal-webhook", {
    method: "POST",
    headers: { "X-Cal-Signature-256": sig },
    body,
  });
}

function bodyWith(payloadExtra: Record<string, unknown>) {
  return JSON.stringify({
    triggerEvent: "BOOKING_CREATED",
    payload: {
      uid: "cal_meeting_1",
      startTime: "2999-01-01T10:00:00.000Z",
      attendees: [{ name: "Ada", email: "ada@example.com" }],
      eventType: { title: "Initial Assessment" },
      ...payloadExtra,
    },
  });
}

beforeEach(() => {
  vi.stubEnv("CAL_WEBHOOK_SECRET", SECRET);
  addedDocData = undefined;
});
afterEach(() => vi.restoreAllMocks());

describe("cal-webhook meeting link persistence", () => {
  it("writes meetingUrl from payload.videoCallData.url when present", async () => {
    const res = await POST(
      signed(bodyWith({ videoCallData: { url: "https://cal.com/video/abc123" } }))
    );
    expect(res.status).toBe(200);
    expect(addedDocData?.meetingUrl).toBe("https://cal.com/video/abc123");
  });

  it("falls back to payload.location when it looks like an http(s) URL", async () => {
    const res = await POST(signed(bodyWith({ location: "https://meet.example.com/room" })));
    expect(res.status).toBe(200);
    expect(addedDocData?.meetingUrl).toBe("https://meet.example.com/room");
  });

  it("omits meetingUrl when no URL is present", async () => {
    const res = await POST(signed(bodyWith({ location: "In-person clinic visit" })));
    expect(res.status).toBe(200);
    expect(addedDocData).toBeDefined();
    expect(addedDocData && "meetingUrl" in addedDocData).toBe(false);
  });
});
