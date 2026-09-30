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

  it("leaves the SVG image routes crawlable so Google can see their noindex header", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://physioonclick.co.uk");
    const robots = await loadRobots();

    const result = robots();
    const disallow = (result.rules as { disallow?: string[] }).disallow ?? [];
    for (const route of ["/service-images", "/blog-images", "/specialism-images", "/exercise-og"]) {
      expect(disallow).not.toContain(route);
    }
    expect(disallow).toEqual(expect.arrayContaining(["/admin", "/patient", "/api", "/auth"]));
  });

  it("allows crawling on the dev worker host (so its noindex is seen), with no sitemap", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dev.physioonclick.co.uk");
    const robots = await loadRobots();

    const result = robots();
    expect(result.rules).toEqual({ userAgent: "*", allow: "/" });
    expect(result.sitemap).toBeUndefined();
  });
});
