import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

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

import { GET } from "@/app/api/cal/slots/route";

function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL("http://localhost/api/cal/slots");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

describe("GET /api/cal/slots", () => {
  beforeEach(() => {
    calUsernameMock = "test-physio";
    global.fetch = vi.fn();
  });

  it("returns normalised slots on a valid request", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            "2026-07-20": [
              { start: "2026-07-20T08:00:00.000Z" },
              { start: "2026-07-20T09:00:00.000Z" },
            ],
            "2026-07-21": [{ start: "2026-07-21T08:00:00.000Z" }],
          },
        }),
        { status: 200 },
      ),
    );

    const res = await GET(
      makeRequest({ service: "initial-assessment", start: "2026-07-20", end: "2026-07-21" }),
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as { slots: Record<string, string[]> };
    expect(data.slots).toEqual({
      "2026-07-20": ["2026-07-20T08:00:00.000Z", "2026-07-20T09:00:00.000Z"],
      "2026-07-21": ["2026-07-21T08:00:00.000Z"],
    });

    // Fetches Cal.com's public v2 slots endpoint by eventTypeSlug + username, no API key.
    const [calledUrl, calledInit] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const urlObj = new URL(calledUrl.toString());
    expect(urlObj.origin + urlObj.pathname).toBe("https://api.cal.com/v2/slots");
    expect(urlObj.searchParams.get("eventTypeSlug")).toBe("initial-online-assessment");
    expect(urlObj.searchParams.get("username")).toBe("test-physio");
    expect(calledInit).toMatchObject({
      headers: { "cal-api-version": "2024-09-04" },
      next: { revalidate: 60 },
    });
  });

  it("normalises Cal's [{start}] objects into a flat ISO string array, even with no availability", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: {} }), { status: 200 }),
    );

    const res = await GET(
      makeRequest({ service: "follow-up", start: "2026-07-20", end: "2026-07-20" }),
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as { slots: Record<string, string[]> };
    expect(data.slots).toEqual({});
  });

  it("returns 400 for an invalid service", async () => {
    const res = await GET(
      makeRequest({ service: "not-a-real-service", start: "2026-07-20", end: "2026-07-21" }),
    );

    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns 400 for a malformed date", async () => {
    const res = await GET(
      makeRequest({ service: "initial-assessment", start: "2026-02-30", end: "2026-07-21" }),
    );

    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns 400 when end is before start", async () => {
    const res = await GET(
      makeRequest({ service: "initial-assessment", start: "2026-07-21", end: "2026-07-20" }),
    );

    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns 400 when the range exceeds 62 days", async () => {
    const res = await GET(
      makeRequest({ service: "initial-assessment", start: "2026-01-01", end: "2026-12-31" }),
    );

    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns 503 when CAL_USERNAME is not configured", async () => {
    calUsernameMock = "";

    const res = await GET(
      makeRequest({ service: "initial-assessment", start: "2026-07-20", end: "2026-07-21" }),
    );

    expect(res.status).toBe(503);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns 502 and does not leak the raw Cal payload when Cal returns a server error", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response("Internal Server Error", { status: 500 }),
    );

    const res = await GET(
      makeRequest({ service: "initial-assessment", start: "2026-07-20", end: "2026-07-21" }),
    );

    expect(res.status).toBe(502);
    const data = (await res.json()) as { error: string };
    expect(data.error).not.toContain("Internal Server Error");
  });

  it("returns 502 when Cal returns malformed JSON", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response("not json", { status: 200 }));

    const res = await GET(
      makeRequest({ service: "initial-assessment", start: "2026-07-20", end: "2026-07-21" }),
    );

    expect(res.status).toBe(502);
  });
});
