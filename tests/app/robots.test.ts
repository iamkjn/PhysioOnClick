import { afterEach, describe, expect, it, vi } from "vitest";

async function loadRobots() {
  vi.resetModules();
  const mod = await import("@/app/robots");
  return mod.default;
}

describe("app/robots.ts", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("allows crawling on the production host, with a sitemap", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://physioonclick.co.uk");
    const robots = await loadRobots();

    const result = robots();
    expect(result.rules).toMatchObject({ userAgent: "*", allow: "/" });
    expect(result.sitemap).toBe("https://physioonclick.co.uk/sitemap.xml");
  });

  it("disallows everything on the dev worker host, with no sitemap", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dev.physioonclick.co.uk");
    const robots = await loadRobots();

    const result = robots();
    expect(result.rules).toEqual({ userAgent: "*", disallow: "/" });
    expect(result.sitemap).toBeUndefined();
  });
});
