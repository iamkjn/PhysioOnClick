import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

async function load() {
  vi.resetModules();
  return (await import("@/lib/trustpilot")).getTrustpilotSummary;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("getTrustpilotSummary", () => {
  it("returns null when the API key or business unit id is missing", async () => {
    vi.stubEnv("TRUSTPILOT_API_KEY", "");
    vi.stubEnv("TRUSTPILOT_BUSINESS_UNIT_ID", "");
    const getTrustpilotSummary = await load();
    expect(await getTrustpilotSummary()).toBeNull();
  });

  it("maps the business unit + reviews and keeps only 4★+ with text", async () => {
    vi.stubEnv("TRUSTPILOT_API_KEY", "k");
    vi.stubEnv("TRUSTPILOT_BUSINESS_UNIT_ID", "bu1");
    const fetchMock = vi.fn((url: string) => {
      if (url.includes("/reviews")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              reviews: [
                { id: "r1", stars: 5, title: "Great", text: "Really helped my knee.", createdAt: "2026-08-01T00:00:00Z", consumer: { displayName: "Jay C" } },
                { id: "r2", stars: 3, title: "Ok", text: "Fine.", createdAt: "2026-08-02T00:00:00Z" },
                { id: "r3", stars: 5, title: "", text: "   ", createdAt: "2026-08-03T00:00:00Z" },
              ],
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            score: { trustScore: 4.8, stars: 4.5 },
            numberOfReviews: { total: 12 },
            profileUrl: "https://www.trustpilot.com/review/physioonclick.co.uk",
          }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const getTrustpilotSummary = await load();
    const summary = await getTrustpilotSummary({ minStars: 4, limit: 6 });

    expect(summary).not.toBeNull();
    expect(summary!.trustScore).toBe(4.8);
    expect(summary!.total).toBe(12);
    expect(summary!.reviews).toHaveLength(1);
    expect(summary!.reviews[0]).toMatchObject({ id: "r1", author: "Jay C", stars: 5 });
  });

  it("returns null (and caches it) when the API errors", async () => {
    vi.stubEnv("TRUSTPILOT_API_KEY", "k");
    vi.stubEnv("TRUSTPILOT_BUSINESS_UNIT_ID", "bu1");
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: false, status: 500 })));
    const getTrustpilotSummary = await load();
    expect(await getTrustpilotSummary()).toBeNull();
  });
});
