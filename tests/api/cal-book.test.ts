import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/cal/book/route";

// The direct (unpaid) booking route was removed in favour of the pay-first
// Stripe flow. It must now create nothing and return 410 Gone.
describe("POST /api/cal/book (removed — pay-first only)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns 410 and never calls Cal.com", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const res = await POST();

    expect(res.status).toBe(410);
    const data = (await res.json()) as { ok: boolean; error: string };
    expect(data.ok).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
