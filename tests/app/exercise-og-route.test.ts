import { describe, it, expect } from "vitest";

import { GET as conditionOgGET } from "@/app/condition-og/[slug]/route";
import { GET as exerciseOgGET } from "@/app/exercise-og/[slug]/route";
import { GET as selfTestOgGET } from "@/app/self-test-og/[slug]/route";

const req = () => new Request("http://localhost/exercise-og/clam-shell");
const ctx = (slug: string) => ({ params: Promise.resolve({ slug }) });

describe("GET /exercise-og/[slug]", () => {
  it("renders an SVG OG card for a known exercise", async () => {
    const res = await exerciseOgGET(req(), ctx("clam-shell"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/svg+xml");

    const body = await res.text();
    expect(body.startsWith("<svg")).toBe(true);
    expect(body).toContain("Clam");

    const cache = res.headers.get("cache-control") ?? "";
    expect(cache).toContain("max-age=86400");
    expect(cache).not.toContain("immutable");
  });

  it("404s an unknown exercise slug", async () => {
    const res = await exerciseOgGET(req(), ctx("no-such-exercise"));
    expect(res.status).toBe(404);
  });
});

describe("GET /condition-og/[slug]", () => {
  it("renders an SVG OG card for a known condition", async () => {
    const res = await conditionOgGET(req(), ctx("rotator-cuff-tendinopathy"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/svg+xml");

    const body = await res.text();
    expect(body.startsWith("<svg")).toBe(true);
    expect(body).toContain("Rotator cuff");

    const cache = res.headers.get("cache-control") ?? "";
    expect(cache).toContain("max-age=86400");
    expect(cache).not.toContain("immutable");
  });

  it("404s an unknown condition slug", async () => {
    const res = await conditionOgGET(req(), ctx("no-such-condition"));
    expect(res.status).toBe(404);
  });
});

describe("GET /self-test-og/[slug]", () => {
  it("renders an SVG OG card for a known self-check test", async () => {
    const res = await selfTestOgGET(req(), ctx("full-can-test"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/svg+xml");

    const body = await res.text();
    expect(body.startsWith("<svg")).toBe(true);
    expect(body).toContain("Full Can Test");

    const cache = res.headers.get("cache-control") ?? "";
    expect(cache).toContain("max-age=86400");
    expect(cache).not.toContain("immutable");
  });

  it("404s an unknown self-check test slug", async () => {
    const res = await selfTestOgGET(req(), ctx("no-such-test"));
    expect(res.status).toBe(404);
  });
});
