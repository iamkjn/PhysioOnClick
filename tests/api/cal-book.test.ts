import { beforeEach, describe, expect, it, vi } from "vitest";

let calUsernameMock: string = "test-physio";

vi.mock("@/lib/cal-services", () => ({
  get CAL_USERNAME() {
    return calUsernameMock;
  },
  isBookServiceId: (value: unknown) =>
    value === "initial-assessment" ||
    value === "follow-up" ||
    value === "bundle-4" ||
    value === "bundle-8",
  calServiceFor: (id: string) => ({
    id,
    calSlug: "initial-online-assessment",
    sessions: 1,
    included: [],
  }),
}));

import { POST } from "@/app/api/cal/book/route";

const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const pastStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

const validBody = {
  service: "initial-assessment",
  start: futureStart,
  name: "Jane Smith",
  email: "jane@example.com",
  timeZone: "Europe/London",
};

function makeRequest(body: object): Request {
  return new Request("http://localhost/api/cal/book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/cal/book", () => {
  beforeEach(() => {
    calUsernameMock = "test-physio";
    global.fetch = vi.fn();
  });

  it("creates a booking on a valid request and never writes to Firestore", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { uid: "cal-booking-uid-123" } }), { status: 200 }),
    );

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      ok: boolean;
      uid: string;
      start: string;
      service: string;
    };
    expect(data).toMatchObject({
      ok: true,
      uid: "cal-booking-uid-123",
      service: "initial-assessment",
    });

    expect(global.fetch).toHaveBeenCalledOnce();
    const [calledUrl, calledInit] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(calledUrl).toBe("https://api.cal.com/v2/bookings");
    expect(calledInit.method).toBe("POST");
    expect(calledInit.headers).toMatchObject({ "cal-api-version": "2024-08-13" });

    const sentBody = JSON.parse(calledInit.body as string);
    expect(sentBody).toMatchObject({
      eventTypeSlug: "initial-online-assessment",
      username: "test-physio",
      attendee: {
        name: "Jane Smith",
        email: "jane@example.com",
        timeZone: "Europe/London",
      },
    });
  });

  it("passes focusAreas through as a joined string in metadata", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { uid: "cal-booking-uid-456" } }), { status: 200 }),
    );

    const res = await POST(
      makeRequest({ ...validBody, focusAreas: ["Back & neck", "Shoulder"] }),
    );

    expect(res.status).toBe(200);
    const [, calledInit] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const sentBody = JSON.parse(calledInit.body as string);
    expect(sentBody.metadata).toEqual({ focusAreas: "Back & neck, Shoulder" });
  });

  it("retries without metadata if Cal rejects the request with a 400 when metadata was sent", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "metadata not allowed" }), { status: 400 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { uid: "cal-booking-uid-789" } }), { status: 200 }),
      );

    const res = await POST(makeRequest({ ...validBody, focusAreas: ["Shoulder"] }));

    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean; uid: string };
    expect(data).toMatchObject({ ok: true, uid: "cal-booking-uid-789" });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    const secondCallBody = JSON.parse(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1][1].body as string,
    );
    expect(secondCallBody.metadata).toBeUndefined();
  });

  it("returns 400 for an invalid service", async () => {
    const res = await POST(makeRequest({ ...validBody, service: "not-a-real-service" }));

    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
    const data = (await res.json()) as { ok: boolean };
    expect(data.ok).toBe(false);
  });

  it("returns 400 for a start time that is not valid ISO 8601", async () => {
    const res = await POST(makeRequest({ ...validBody, start: "not-a-date" }));

    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns 400 for a start time in the past", async () => {
    const res = await POST(makeRequest({ ...validBody, start: pastStart }));

    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid email", async () => {
    const res = await POST(makeRequest({ ...validBody, email: "not-an-email" }));

    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns 400 for a missing/empty name", async () => {
    const res = await POST(makeRequest({ ...validBody, name: "   " }));

    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns 502 and does not leak Cal's raw error when Cal returns a server error", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response("Internal Server Error", { status: 500 }),
    );

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(502);
    const data = (await res.json()) as { ok: boolean; error: string };
    expect(data.ok).toBe(false);
    expect(data.error).not.toContain("Internal Server Error");
  });

  it("returns 503 when CAL_USERNAME is not configured", async () => {
    calUsernameMock = "";

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(503);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
