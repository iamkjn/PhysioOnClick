// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { memoryFirestore } from "../helpers/memory-firestore";

let mem = memoryFirestore();
const { verifyIdToken } = vi.hoisted(() => ({ verifyIdToken: vi.fn() }));
vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: () => mem.db,
  getAdminAuth: () => ({ verifyIdToken }),
  FieldValue: { serverTimestamp: () => "TS" },
}));

import { GET } from "@/app/api/patient/treatment-plans/route";
import { POST } from "@/app/api/patient/treatment-plans/pay/route";

const OWNER = "patientUid123";
const fetchMock = vi.fn(async () =>
  new Response(JSON.stringify({ id: "cs_1", url: "https://checkout.stripe.com/c/cs_1" }), { status: 200 }),
);

function get() {
  return new Request(`http://x/api/patient/treatment-plans?owner=${OWNER}`, { headers: { Authorization: "Bearer t" } });
}
function pay(body: Record<string, unknown> = {}) {
  return new Request("http://x/api/patient/treatment-plans/pay", {
    method: "POST",
    headers: { Authorization: "Bearer t", "Content-Type": "application/json" },
    body: JSON.stringify({ owner: OWNER, packageId: "pkg0000001", returnPath: "/patient", ...body }),
  });
}

beforeEach(() => {
  mem = memoryFirestore({
    [`patients/${OWNER}`]: { displayName: "Edwin Argo", email: "pat@example.com", carerEmails: ["carer@example.com"], createdByAdmin: "hello@physioonclick.co.uk" },
    "sessionPackages/pkg0000001": {
      ownerUid: OWNER, patientId: OWNER, patientName: "Edwin Argo", email: "pat@example.com", manual: true,
      title: "Home visit treatment plan (7 visits)", visitType: "home", totalSessions: 7, usedSessions: 3,
      startDate: "2026-11-15", endDate: "2026-11-21", pricePence: 49000, paymentStatus: "unpaid", notes: "secret admin note",
    },
    "sessionPackages/free000001": { ownerUid: OWNER, manual: true, totalSessions: 2, pricePence: 0, paymentStatus: "paid", paidMethod: "no-charge" },
    "sessionPackages/bundle0001": { ownerUid: OWNER, totalSessions: 4, pricePence: 28000 },
  });
  verifyIdToken.mockResolvedValue({ uid: OWNER, email: "pat@example.com", email_verified: true });
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://physioonclick.co.uk");
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("patient treatment plans", () => {
  it("shows the patient their priced plan only, with no admin notes or token", async () => {
    const json = (await (await GET(get())).json()) as { plans: Array<Record<string, unknown>> };
    expect(json.plans).toEqual([
      expect.objectContaining({ id: "pkg0000001", amountPence: 49000, paid: false, usedSessions: 3, datesLine: "Sun 15 Nov – Sat 21 Nov 2026" }),
    ]);
    expect(JSON.stringify(json)).not.toContain("secret");
  });

  it("lets a verified carer see and pay, but not an unverified or unlisted user", async () => {
    verifyIdToken.mockResolvedValue({ uid: "carerUid1", email: "Carer@Example.com", email_verified: true });
    expect((await GET(get())).status).toBe(200);
    expect((await POST(pay())).status).toBe(200);

    verifyIdToken.mockResolvedValue({ uid: "carerUid1", email: "carer@example.com", email_verified: false });
    expect((await GET(get())).status).toBe(403);
    verifyIdToken.mockResolvedValue({ uid: "strangerUid", email: "x@example.com", email_verified: true });
    expect((await POST(pay())).status).toBe(403);
  });

  it("Pay now creates the payment request once and opens Stripe at the plan price, emailing nobody", async () => {
    const res = await POST(pay());
    expect(await res.json()).toEqual({ url: "https://checkout.stripe.com/c/cs_1" });
    const pkg = mem.get("sessionPackages/pkg0000001")!;
    expect(pkg.paymentStatus).toBe("link-ready");
    const token = pkg.paymentRequestId as string;
    expect(mem.get(`paymentRequests/${token}`)).toMatchObject({ packageId: "pkg0000001", status: "open" });

    const form = new URLSearchParams((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(form.get("line_items[0][price_data][unit_amount]")).toBe("49000");
    expect(form.get("metadata[paymentRequestId]")).toBe(token);
    expect(form.get("success_url")).toBe("https://physioonclick.co.uk/patient?paid=1");
    expect(fetchMock.mock.calls.every(([u]) => String(u).includes("stripe.com"))).toBe(true);

    await POST(pay());
    expect(mem.get("sessionPackages/pkg0000001")!.paymentRequestId).toBe(token);
  });

  it("shows nothing and refuses payment for a customer's own (self sign-up) account", async () => {
    mem.store.set(`patients/${OWNER}`, { displayName: "Edwin Argo", email: "pat@example.com" });
    expect(((await (await GET(get())).json()) as { plans: unknown[] }).plans).toEqual([]);
    expect((await POST(pay())).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses paid, foreign and non-manual packages", async () => {
    expect((await POST(pay({ packageId: "bundle0001" }))).status).toBe(404);
    mem.store.set("sessionPackages/pkg0000001", { ...mem.get("sessionPackages/pkg0000001")!, paymentStatus: "paid" });
    expect((await POST(pay())).status).toBe(409);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
