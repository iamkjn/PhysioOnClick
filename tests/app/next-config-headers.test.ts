import { createRequire } from "node:module";
import { afterEach, describe, expect, it, vi } from "vitest";

type HeaderRule = { source: string; headers: { key: string; value: string }[] };

async function loadHeaders(): Promise<HeaderRule[]> {
  vi.resetModules();
  const config = (await import("@/next.config.mjs")).default as { headers: () => Promise<HeaderRule[]> };
  return config.headers();
}

function robotsTagFor(rules: HeaderRule[], source: string) {
  return rules
    .filter((r) => r.source === source)
    .flatMap((r) => r.headers)
    .find((h) => h.key === "X-Robots-Tag")?.value;
}

describe("next.config.mjs headers", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("noindexes the generated image routes on production", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://physioonclick.co.uk");
    const rules = await loadHeaders();
    for (const source of [
      "/exercise-og/:path*",
      "/condition-og/:path*",
      "/self-test-og/:path*",
      "/blog-images/:path*",
      "/service-images/:path*",
      "/specialism-images/:path*",
    ]) {
      expect(robotsTagFor(rules, source)).toBe("noindex");
    }
  });

  it("does not noindex real pages or the exercise illustrations on production", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://physioonclick.co.uk");
    const rules = await loadHeaders();
    expect(robotsTagFor(rules, "/:path*")).toBeUndefined();
    expect(rules.some((r) => r.source.startsWith("/exercise-images"))).toBe(false);
  });

  it("noindexes everything on the dev worker", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dev.physioonclick.co.uk");
    const rules = await loadHeaders();
    expect(robotsTagFor(rules, "/:path*")).toBe("noindex, nofollow");
  });
});

const nodeRequire = createRequire(import.meta.url);
const { pathToRegexp } = nodeRequire("next/dist/compiled/path-to-regexp") as {
  pathToRegexp: (source: string, keys?: unknown[]) => RegExp;
};

function headersFor(rules: HeaderRule[], path: string) {
  const out: Record<string, string> = {};
  for (const rule of rules) {
    if (pathToRegexp(rule.source, []).test(path)) {
      for (const h of rule.headers) out[h.key] = h.value;
    }
  }
  return out;
}

describe("framing headers", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("lets anyone frame /embed/* but nothing else", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://physioonclick.co.uk");
    const rules = await loadHeaders();

    const embed = headersFor(rules, "/embed/exercises/clam-shell");
    expect(embed["X-Frame-Options"]).toBeUndefined();
    expect(embed["Content-Security-Policy"]).toContain("frame-ancestors *");
    expect(embed["X-Robots-Tag"]).toBe("noindex");
    expect(embed["Strict-Transport-Security"]).toBeDefined();

    for (const path of ["/", "/exercises/clam-shell", "/book", "/embedded-thing"]) {
      const h = headersFor(rules, path);
      expect(h["X-Frame-Options"], path).toBe("SAMEORIGIN");
      expect(h["Content-Security-Policy"], path).toContain("frame-ancestors 'self'");
    }
  });
});
