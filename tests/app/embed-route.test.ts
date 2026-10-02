import { describe, expect, it } from "vitest";

import { GET, generateStaticParams } from "@/app/embed/exercises/[slug]/route";

const req = () => new Request("http://localhost/embed/exercises/clam-shell");
const ctx = (slug: string) => ({ params: Promise.resolve({ slug }) });

describe("GET /embed/exercises/[slug]", () => {
  it("serves the embed document for a known exercise", async () => {
    const res = await GET(req(), ctx("clam-shell"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(res.headers.get("cache-control")).toContain("max-age=86400");
    const body = await res.text();
    expect(body).toContain("<!doctype html>");
    expect(body).toContain("Clam");
  });

  it("404s an unknown slug", async () => {
    const res = await GET(req(), ctx("no-such-exercise"));
    expect(res.status).toBe(404);
  });

  it("prerenders every exercise", () => {
    expect(generateStaticParams().length).toBeGreaterThan(100);
  });
});
