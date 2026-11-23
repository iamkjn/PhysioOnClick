import { beforeEach, describe, expect, it, vi } from "vitest";

const addMock = vi.fn().mockResolvedValue({ id: "evt" });
vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: () => ({ collection: () => ({ add: addMock }) }),
  FieldValue: { serverTimestamp: vi.fn().mockReturnValue("__TS__") },
}));

const cfMock = vi.hoisted(() => ({ value: undefined as Record<string, unknown> | undefined }));
vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => {
    if (!cfMock.value) throw new Error("not in a Worker");
    return { env: {}, cf: cfMock.value };
  },
}));

import { POST } from "@/app/api/growth/track/route";
import { resetRateLimitMemory } from "@/lib/rate-limit";

function req(body: object, userAgent = "Mozilla/5.0 (Macintosh) Safari/605.1.15") {
  return new Request("http://localhost/api/growth/track", {
    method: "POST",
    headers: { "Content-Type": "application/json", "user-agent": userAgent },
    body: JSON.stringify(body),
  });
}

const base = { event: "page_view", sessionId: "session-12345", path: "/" };

describe("POST /api/growth/track visitor source", () => {
  beforeEach(() => {
    resetRateLimitMemory();
    addMock.mockClear();
  });

  it("stores the channel and referring host the browser worked out", async () => {
    await POST(req({ ...base, channel: "facebook", referrerHost: "l.facebook.com" }));
    expect(addMock.mock.calls[0][0]).toMatchObject({ channel: "facebook", referrerHost: "l.facebook.com" });
  });

  it("falls back to the in-app browser for pages that don't send a source", async () => {
    await POST(req(base, "Mozilla/5.0 (iPhone) Mobile/15E148 [FBAN/FBIOS;FBAV/530.0]"));
    expect(addMock.mock.calls[0][0]).toMatchObject({ channel: "facebook", referrerHost: "" });
  });

  it("never stores junk sent as a source", async () => {
    await POST(req({ ...base, channel: "<img src=x>", referrerHost: "https://x.example/path?q=secret" }));
    expect(addMock.mock.calls[0][0]).toMatchObject({ channel: "direct", referrerHost: "" });
  });
});

describe("POST /api/growth/track visitor area", () => {
  beforeEach(() => {
    resetRateLimitMemory();
    addMock.mockClear();
    cfMock.value = undefined;
  });

  it("stores the approximate town, region and postcode district, never the full postcode", async () => {
    cfMock.value = { city: "Rutherglen", region: "Scotland", postalCode: "G73 2AB" };
    const request = req(base);
    request.headers.set("cf-ipcountry", "GB");
    await POST(request);
    expect(addMock.mock.calls[0][0]).toMatchObject({ city: "Rutherglen", region: "Scotland", postalDistrict: "G73", countryCode: "GB" });
    expect(JSON.stringify(addMock.mock.calls[0][0])).not.toContain("2AB");
  });

  it("stores empty area fields outside Cloudflare", async () => {
    await POST(req(base));
    expect(addMock.mock.calls[0][0]).toMatchObject({ city: "", region: "", postalDistrict: "" });
  });
});
