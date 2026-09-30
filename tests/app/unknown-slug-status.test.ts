import { existsSync } from "node:fs";
import path from "node:path";

// A root app/loading.tsx makes every unknown public slug answer 200 instead of
// 404 (the Suspense fallback streams the status before notFound() runs).
describe("route loading boundaries", () => {
  it("has no loading.tsx at the app root", () => {
    expect(existsSync(path.join(process.cwd(), "app/loading.tsx"))).toBe(false);
  });

  it.each(["blog", "services", "exercises"])("has no loading.tsx over /%s", (segment) => {
    expect(existsSync(path.join(process.cwd(), "app", segment, "loading.tsx"))).toBe(false);
  });
});
