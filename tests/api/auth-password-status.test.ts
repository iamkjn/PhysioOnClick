import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyIdToken = vi.fn();
const hasPassword = vi.fn();
vi.mock("@/lib/firebase-admin", () => ({
  getAdminAuth: () => ({ verifyIdToken, hasPassword }),
}));

import { GET } from "@/app/api/auth/password-status/route";

function req(token?: string) {
  return new Request("http://localhost/api/auth/password-status", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

describe("GET /api/auth/password-status", () => {
  beforeEach(() => {
    verifyIdToken.mockReset();
    hasPassword.mockReset();
  });

  it("rejects a request with no token", async () => {
    const res = await GET(req());
    expect(res.status).toBe(401);
    expect(hasPassword).not.toHaveBeenCalled();
  });

  it("rejects an invalid token", async () => {
    verifyIdToken.mockRejectedValue(new Error("bad"));
    const res = await GET(req("nope"));
    expect(res.status).toBe(401);
  });

  it("looks up only the caller's own account", async () => {
    verifyIdToken.mockResolvedValue({ uid: "uid-1" });
    hasPassword.mockResolvedValue(false);
    const res = await GET(req("tok"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ hasPassword: false });
    expect(hasPassword).toHaveBeenCalledWith("uid-1");
  });

  it("returns 502 when the lookup fails", async () => {
    verifyIdToken.mockResolvedValue({ uid: "uid-1" });
    hasPassword.mockRejectedValue(new Error("down"));
    const res = await GET(req("tok"));
    expect(res.status).toBe(502);
  });
});
