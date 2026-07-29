import { afterEach, describe, expect, it, vi } from "vitest";

const db = {
  collection: () => ({
    where: () => ({
      limit: () => ({
        get: async () => ({
          empty: false,
          docs: [{ data: () => ({ status: "paid", service: "initial-assessment", calBookingUid: "cal_xyz" }) }]
        })
      })
    })
  })
};
vi.mock("@/lib/firebase-admin", () => ({ getAdminDb: () => db }));
import { GET } from "@/app/api/checkout/status/route";

afterEach(() => vi.restoreAllMocks());

describe("GET /api/checkout/status", () => {
  it("returns paid status for a known session", async () => {
    const res = await GET(new Request("http://localhost/api/checkout/status?session_id=cs_1"));
    const json = await res.json();
    expect(json.status).toBe("paid");
    expect(json.calBookingUid).toBe("cal_xyz");
  });
});
