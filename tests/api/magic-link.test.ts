import { beforeEach, describe, expect, it, vi } from "vitest";

const generateLinkMock = vi.fn().mockResolvedValue("https://example.com/magic");

vi.mock("@/lib/firebase-admin", () => ({
  getAdminAuth: () => ({
    generateSignInWithEmailLink: generateLinkMock,
  }),
}));

import { POST } from "@/app/api/auth/magic-link/route";

function makeRequest(body: object): Request {
  return new Request("http://localhost/api/auth/magic-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Each valid-path test uses a unique email: the route rate-limits per address
// with a module-level map that survives between tests.
describe("POST /api/auth/magic-link", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    generateLinkMock.mockClear();
  });

  it("returns ok for a valid email (dev path, no Resend key)", async () => {
    const res = await POST(makeRequest({ email: "valid-path@example.com" }));

    expect(res.status).toBe(200);
    expect(generateLinkMock).toHaveBeenCalledOnce();
  });

  it.each([
    ["empty email", ""],
    ["no @ sign", "nope"],
    ["missing TLD", "a@b"],
    ["missing local part", "@example.com"],
    ["contains whitespace", "a b@example.com"],
    ["over 254 chars", `${"a".repeat(250)}@example.com`],
  ])("returns 400 for %s", async (_label, email) => {
    const res = await POST(makeRequest({ email }));

    expect(res.status).toBe(400);
    expect(generateLinkMock).not.toHaveBeenCalled();
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe("A valid email address is required.");
  });
});
