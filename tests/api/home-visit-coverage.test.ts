import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isRateLimited: vi.fn().mockResolvedValue(false),
}));
vi.mock("@/lib/rate-limit", () => ({ isRateLimited: mocks.isRateLimited, clientIp: () => "1.2.3.4" }));

import { POST as coverage } from "@/app/api/home-visit/coverage/route";

const post = (body: unknown) =>
  new Request("http://localhost/api/home-visit/coverage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isRateLimited.mockResolvedValue(false);
});

describe("POST /api/home-visit/coverage", () => {
  it("returns covered=true with outwardCode and normalised postcode for a covered postcode", async () => {
    const res = await coverage(post({ postcode: "g31 4hs" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ covered: true, outwardCode: "G31", postcode: "G31 4HS" });
  });

  it("returns covered=false with outwardCode and postcode for an uncovered postcode", async () => {
    const res = await coverage(post({ postcode: "EH1 1AA" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ covered: false, outwardCode: "EH1", postcode: "EH1 1AA" });
  });

  it("rejects an invalid postcode with 400 and does not call anything", async () => {
    const res = await coverage(post({ postcode: "12345" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Enter a valid postcode." });
  });

  it("rejects a null JSON body with 400", async () => {
    const res = await coverage(post(null));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid request body." });
  });

  it("returns 429 rate_limited when rate limited, without calling validators", async () => {
    mocks.isRateLimited.mockResolvedValue(true);
    const res = await coverage(post({ postcode: "G31 4HS" }));
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: "rate_limited" });
    expect(mocks.isRateLimited).toHaveBeenCalledWith("ADDRESS_RATE_LIMITER", "1.2.3.4");
  });
});
