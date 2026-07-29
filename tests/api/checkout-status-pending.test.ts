import { afterEach, describe, expect, it, vi } from "vitest";

const emptyDb = {
  collection: () => ({
    where: () => ({
      limit: () => ({
        get: async () => ({ empty: true, docs: [] })
      })
    })
  })
};
vi.mock("@/lib/firebase-admin", () => ({ getAdminDb: () => emptyDb }));
import { GET } from "@/app/api/checkout/status/route";

afterEach(() => vi.restoreAllMocks());

describe("GET /api/checkout/status (pending)", () => {
  it("returns pending when no payment doc exists yet", async () => {
    const res = await GET(new Request("http://localhost/api/checkout/status?session_id=cs_none"));
    const json = await res.json();
    expect(json.status).toBe("pending");
  });
});
