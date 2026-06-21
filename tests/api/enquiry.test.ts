import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: vi.fn().mockReturnValue("__SERVER_TIMESTAMP__"),
  },
}));

const addMock = vi.fn().mockResolvedValue({ id: "mock-enquiry-id" });
let adminDbMock: unknown = {
  collection: () => ({
    add: addMock,
  }),
};

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: () => adminDbMock,
}));

import { POST } from "@/app/api/enquiry/route";

const validBody = {
  name: "Jane Smith",
  email: "jane@example.com",
  phone: "07700900000",
  service: "Initial Assessment",
  message: "I would like help with recurring shoulder pain after exercise.",
};

function makeRequest(body: object): Request {
  return new Request("http://localhost/api/enquiry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/enquiry", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    adminDbMock = {
      collection: () => ({
        add: addMock,
      }),
    };
    addMock.mockClear();
    global.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
  });

  it("saves enquiry and reports email as unsent when Resend is not configured", async () => {
    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(200);
    expect(addMock).toHaveBeenCalledOnce();
    expect(global.fetch).not.toHaveBeenCalled();

    const data = (await res.json()) as { ok: boolean; emailSent: boolean; emailReason: string };
    expect(data).toMatchObject({
      ok: true,
      saved: true,
      emailSent: false,
      emailReason: "missing-api-key",
    });
  });

  it("sends notification email when Resend is configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "resend_test_key");
    vi.stubEnv("ENQUIRY_EMAIL_TO", "hello@physioonclick.co.uk");

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer resend_test_key",
        }),
      }),
    );

    const data = (await res.json()) as { ok: boolean; emailSent: boolean; emailReason: string };
    expect(data).toMatchObject({
      ok: true,
      saved: true,
      emailSent: true,
      emailReason: "",
    });
  });

  it("still sends notification email when server Firestore is not configured", async () => {
    adminDbMock = null;
    vi.stubEnv("RESEND_API_KEY", "resend_test_key");

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(200);
    expect(addMock).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledOnce();

    const data = (await res.json()) as {
      ok: boolean;
      saved: boolean;
      saveReason: string;
      emailSent: boolean;
    };
    expect(data).toMatchObject({
      ok: true,
      saved: false,
      saveReason: "missing-admin-db",
      emailSent: true,
    });
  });

  it("returns 400 when required fields are missing", async () => {
    const { email: _removed, ...withoutEmail } = validBody;

    const res = await POST(makeRequest(withoutEmail));

    expect(res.status).toBe(400);
    expect(addMock).not.toHaveBeenCalled();
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe("Missing required enquiry fields.");
  });
});
