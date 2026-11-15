// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const verifyIdToken = vi.fn();
const generateSignInWithEmailLink = vi.fn(async (email: string) => `https://link.test/${email}`);
const patientGet = vi.fn();
const patientUpdate = vi.fn();
const db = { collection: () => ({ doc: () => ({ get: patientGet, update: patientUpdate }) }) };
vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: () => db,
  getAdminAuth: () => ({ verifyIdToken, generateSignInWithEmailLink }),
}));
vi.stubEnv("ADMIN_EMAIL", "admin@physioonclick.co.uk");
vi.stubEnv("RESEND_API_KEY", "re_test");
vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://physioonclick.co.uk");

import { POST } from "@/app/api/admin/send-invite/route";

const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
function req(body: unknown, token = "good") {
  return new Request("http://localhost/api/admin/send-invite", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : {},
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  verifyIdToken.mockResolvedValue({ email: "admin@physioonclick.co.uk" });
  patientGet.mockResolvedValue({
    exists: true,
    data: () => ({
      email: "Pat@Example.com",
      displayName: "Edwin Argo",
      carerEmails: ["carer@example.com"],
      carerContact: { name: "Thomas Cisecki", email: "carer@example.com", relationship: "Partner" },
    }),
  });
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("POST /api/admin/send-invite", () => {
  it("401 without a token and 403 for a non-admin; sends nothing", async () => {
    expect((await POST(req({ uid: "patientUid1" }, ""))).status).toBe(401);
    verifyIdToken.mockResolvedValue({ email: "someone@example.com" });
    expect((await POST(req({ uid: "patientUid1" }))).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("emails the patient and each carer their own sign-in link", async () => {
    const res = await POST(req({ uid: "patientUid1" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sent: ["pat@example.com", "carer@example.com"], failed: [] });

    expect(generateSignInWithEmailLink).toHaveBeenCalledTimes(2);
    const continueUrl = new URL(generateSignInWithEmailLink.mock.calls[0][1].url);
    expect(continueUrl.pathname).toBe("/auth/verify");
    expect(continueUrl.searchParams.get("email")).toBe("pat@example.com");

    const bodies = fetchMock.mock.calls.map((c) => JSON.parse(String((c as unknown as [string, RequestInit])[1].body)));
    expect(bodies[0].to).toEqual(["pat@example.com"]);
    expect(bodies[0].subject).toBe("Your PhysioOnClick account is ready");
    expect(bodies[0].html).toContain("Hello Edwin,");
    expect(bodies[0].html).toContain("https://link.test/pat@example.com");
    expect(bodies[1].to).toEqual(["carer@example.com"]);
    expect(bodies[1].subject).toContain("Edwin Argo");
    expect(bodies[1].html).toContain("Hello Thomas,");
    expect(bodies[1].html).not.toContain("https://link.test/pat@example.com");
    expect(patientUpdate).toHaveBeenCalledWith(expect.objectContaining({ portalInviteSentTo: ["pat@example.com", "carer@example.com"] }));
  });

  it("reports a failed recipient without blocking the others", async () => {
    fetchMock.mockImplementationOnce(async () => new Response("bad", { status: 500 }));
    const res = await POST(req({ uid: "patientUid1" }));
    expect(await res.json()).toEqual({ sent: ["carer@example.com"], failed: ["pat@example.com"] });
  });

  it("404 for an unknown patient, 400 for a bad uid", async () => {
    patientGet.mockResolvedValue({ exists: false, data: () => undefined });
    expect((await POST(req({ uid: "patientUid1" }))).status).toBe(404);
    expect((await POST(req({ uid: "../x" }))).status).toBe(400);
  });
});
