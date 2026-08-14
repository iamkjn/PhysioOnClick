import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const generateLinkMock = vi.fn().mockResolvedValue("https://example.com/reset");

vi.mock("@/lib/firebase-admin", () => ({
  getAdminAuth: () => ({
    generatePasswordResetLink: generateLinkMock,
  }),
}));

function makeRequest(body: object): Request {
  return new Request("http://localhost/api/admin/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// The route rate-limits per email via a module-level map, so each test that
// needs a fresh (non-rate-limited) attempt for the admin address resets the
// module registry and re-imports POST.
async function freshPost() {
  vi.resetModules();
  const mod = await import("@/app/api/admin/forgot-password/route");
  return mod.POST;
}

describe("POST /api/admin/forgot-password", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    generateLinkMock.mockClear();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("returns ok and generates a reset link for the admin email (dev path, no Resend key)", async () => {
    const POST = await freshPost();
    const res = await POST(makeRequest({ email: "hello@physioonclick.co.uk" }));

    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean };
    expect(data.ok).toBe(true);
    expect(generateLinkMock).toHaveBeenCalledWith("hello@physioonclick.co.uk");
  });

  it("returns the same generic ok for a non-admin email, without generating a link", async () => {
    const POST = await freshPost();
    const res = await POST(makeRequest({ email: "not-admin@example.com" }));

    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean };
    expect(data.ok).toBe(true);
    expect(generateLinkMock).not.toHaveBeenCalled();
  });

  it.each([
    ["empty email", ""],
    ["no @ sign", "nope"],
    ["missing TLD", "a@b"],
    ["missing local part", "@example.com"],
    ["contains whitespace", "a b@example.com"],
  ])("returns 400 for %s", async (_label, email) => {
    const POST = await freshPost();
    const res = await POST(makeRequest({ email }));

    expect(res.status).toBe(400);
    expect(generateLinkMock).not.toHaveBeenCalled();
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe("A valid email address is required.");
  });

  it("rate-limits a second request for the same email within 60 seconds", async () => {
    const POST = await freshPost();
    const email = "hello@physioonclick.co.uk";
    await POST(makeRequest({ email }));
    generateLinkMock.mockClear();

    const res = await POST(makeRequest({ email }));

    expect(res.status).toBe(429);
    expect(generateLinkMock).not.toHaveBeenCalled();
  });

  it("still returns generic ok when link generation fails, to avoid leaking whether the account exists or is misconfigured", async () => {
    generateLinkMock.mockRejectedValueOnce(new Error("sendOobCode failed"));
    const POST = await freshPost();
    const res = await POST(makeRequest({ email: "hello@physioonclick.co.uk" }));

    expect(res.status).toBe(200);
    const data = (await res.json()) as { ok: boolean };
    expect(data.ok).toBe(true);
  });
});
