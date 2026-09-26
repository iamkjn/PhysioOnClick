import { beforeEach, describe, expect, it } from "vitest";

import { clientIp, isRateLimited, resetRateLimitMemory } from "@/lib/rate-limit";

describe("isRateLimited (in-memory fallback outside a Worker)", () => {
  beforeEach(() => resetRateLimitMemory());

  it("allows up to the chat limit then blocks", async () => {
    const results: boolean[] = [];
    for (let i = 0; i < 16; i++) results.push(await isRateLimited("CHAT_RATE_LIMITER", "1.2.3.4"));
    expect(results.slice(0, 15).every((limited) => !limited)).toBe(true);
    expect(results[15]).toBe(true);
  });

  it("tracks clients and limiters independently", async () => {
    for (let i = 0; i < 3; i++) await isRateLimited("FORM_RATE_LIMITER", "a");
    expect(await isRateLimited("FORM_RATE_LIMITER", "a")).toBe(true);
    expect(await isRateLimited("FORM_RATE_LIMITER", "b")).toBe(false);
    expect(await isRateLimited("CHAT_RATE_LIMITER", "a")).toBe(false);
  });
});

describe("clientIp", () => {
  it("prefers Cloudflare's connecting IP header", () => {
    const req = new Request("http://x", { headers: { "cf-connecting-ip": "9.9.9.9", "x-forwarded-for": "1.1.1.1" } });
    expect(clientIp(req)).toBe("9.9.9.9");
  });

  it("falls back to the first x-forwarded-for entry", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "1.1.1.1, 2.2.2.2" } });
    expect(clientIp(req)).toBe("1.1.1.1");
  });
});
