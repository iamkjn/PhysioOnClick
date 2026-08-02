import { afterEach, describe, expect, it, vi } from "vitest";

const { sendAssessmentLinkEmail, generateSignInWithEmailLink, bookingGet } = vi.hoisted(() => ({
  sendAssessmentLinkEmail: vi.fn().mockResolvedValue({ sent: true }),
  generateSignInWithEmailLink: vi.fn().mockResolvedValue("https://physioonclick.co.uk/auth/verify?email=x"),
  bookingGet: vi.fn(),
}));
vi.mock("@/lib/emails/assessment-link-email", () => ({ sendAssessmentLinkEmail }));

const db = { collection: () => ({ doc: () => ({ get: bookingGet }) }) };
vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: () => db,
  getAdminAuth: () => ({ generateSignInWithEmailLink }),
}));

vi.stubEnv("CRON_SECRET", "test-secret");

import { POST } from "@/app/api/assessment/reminder-email/route";

function req(headers: Record<string, string>, body: unknown) {
  return new Request("http://localhost/api/assessment/reminder-email", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

afterEach(() => vi.restoreAllMocks());

describe("POST /api/assessment/reminder-email", () => {
  it("401 when x-cron-secret header is missing", async () => {
    const res = await POST(req({}, { bookingId: "b1" }));
    expect(res.status).toBe(401);
  });

  it("401 when x-cron-secret is wrong", async () => {
    const res = await POST(req({ "x-cron-secret": "wrong" }, { bookingId: "b1" }));
    expect(res.status).toBe(401);
  });

  it("404 when booking is missing", async () => {
    bookingGet.mockResolvedValue({ exists: false });
    const res = await POST(req({ "x-cron-secret": "test-secret" }, { bookingId: "missing" }));
    expect(res.status).toBe(404);
  });

  it("200 and emails the booking's own email on success", async () => {
    bookingGet.mockResolvedValue({
      exists: true,
      data: () => ({
        email: "patient@example.com",
        patientName: "Jane Doe",
        service: "Initial Assessment",
        meetingUrl: "https://meet.example.com/x",
        appointmentLabel: "3 Aug, 10:00",
      }),
    });
    const res = await POST(req({ "x-cron-secret": "test-secret" }, { bookingId: "b1" }));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { sent: boolean };
    expect(json.sent).toBe(true);
    expect(sendAssessmentLinkEmail).toHaveBeenCalledTimes(1);
    const call = sendAssessmentLinkEmail.mock.calls[0][0];
    expect(call.to).toBe("patient@example.com");
    expect(call.patientName).toBe("Jane Doe");
    expect(call.serviceLabel).toBe("Initial Assessment");
    expect(call.meetingUrl).toBe("https://meet.example.com/x");
    expect(call.appointmentLabel).toBe("3 Aug, 10:00");
  });
});
