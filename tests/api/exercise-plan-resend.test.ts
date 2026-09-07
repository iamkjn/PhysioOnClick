import { afterEach, describe, expect, it, vi } from "vitest";

const verifyIdToken = vi.fn();
vi.mock("@/lib/firebase-admin", () => ({
  getAdminAuth: () => ({ verifyIdToken }),
}));

vi.stubEnv("ADMIN_EMAIL", "admin@physioonclick.co.uk");
vi.stubEnv("CRON_SECRET", "sekret");
vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dev.example");

import { POST } from "@/app/api/admin/exercise-plan/resend/route";

function req(token: string | undefined, body: unknown = { summaryId: "s1" }) {
  return new Request("http://localhost/api/admin/exercise-plan/resend", {
    method: "POST",
    headers: token
      ? { Authorization: `Bearer ${token}`, "content-type": "application/json" }
      : { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("POST /api/admin/exercise-plan/resend", () => {
  it("401 without a token", async () => {
    const res = await POST(req(undefined));
    expect(res.status).toBe(401);
  });

  it("401 for an invalid token", async () => {
    verifyIdToken.mockRejectedValue(new Error("bad token"));
    const res = await POST(req("nope"));
    expect(res.status).toBe(401);
  });

  it("403 for a valid but non-admin token", async () => {
    verifyIdToken.mockResolvedValue({ email: "someone.else@example.com" });
    const res = await POST(req("valid-but-not-admin"));
    expect(res.status).toBe(403);
  });

  it("accepts an admin custom claim even without the admin email", async () => {
    verifyIdToken.mockResolvedValue({ admin: true, email: "claim.only@example.com" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })));
    const res = await POST(req("claim-admin"));
    expect(res.status).toBe(200);
  });

  it("200 and forwards force:true to the generate route for an admin", async () => {
    verifyIdToken.mockResolvedValue({ email: "admin@physioonclick.co.uk" });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, emailed: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(req("admin"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, emailed: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://dev.example/api/exercise-plan/generate");
    expect((init.headers as Record<string, string>)["x-cron-secret"]).toBe("sekret");
    expect(JSON.parse(init.body as string)).toEqual({ summaryId: "s1", force: true });
  });

  it("400 when summaryId is missing", async () => {
    verifyIdToken.mockResolvedValue({ email: "admin@physioonclick.co.uk" });
    const res = await POST(req("admin", {}));
    expect(res.status).toBe(400);
  });
});
