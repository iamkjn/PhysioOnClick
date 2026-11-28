import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { bookingGet, accountGet, update } = vi.hoisted(() => ({
  bookingGet: vi.fn(),
  accountGet: vi.fn(),
  update: vi.fn(),
}));
const db = {
  collection: (name: string) => ({
    doc: () => ({ get: name === "patients" ? accountGet : bookingGet, update }),
  }),
};
vi.mock("@/lib/firebase-admin", () => ({ getAdminDb: () => db }));

import { POST } from "@/app/api/appointments/reminder-email/route";
import { buildReminderEmail, reminderDue } from "@/lib/appointment-reminder";

const NOW = new Date("2026-11-28T15:00:00Z");
const base = {
  status: "upcoming",
  email: "daughter@example.com",
  service: "Initial Assessment (home visit)",
  patientName: "saera abedin",
  patientType: "dependent",
  visitType: "home",
  homeVisitAddress: "1 Test Crescent, Glasgow, G1 1AA",
  dateOnly: true,
  notes: "Planned visit",
  appointmentTime: "15:00",
  sessionDate: new Date("2026-11-29T15:00:00Z"),
  createdAt: new Date("2026-11-23T19:00:00Z"),
  reminders: { reviewRequestSent: true },
  bookedBy: "u1",
};

describe("reminderDue", () => {
  it("is due 24 hours before", () => {
    expect(reminderDue(base, NOW).due).toBe(true);
  });

  it.each([
    ["too early", { sessionDate: new Date("2026-11-29T15:15:00Z") }],
    ["already started", { sessionDate: new Date("2026-11-28T14:00:00Z") }],
    ["added within 24 hours", { createdAt: new Date("2026-11-28T16:00:00Z") }],
    ["not upcoming", { status: "cancelled" }],
    ["no email", { email: "" }],
    ["already sent", { reminders: { appointmentReminderFor: "2026-11-29T15:00:00.000Z" } }],
  ])("is not due: %s", (reason, change) => {
    expect(reminderDue({ ...base, ...change }, NOW)).toEqual({ due: false, reason });
  });

  it("reminds again after the appointment moves", () => {
    const moved = { ...base, reminders: { appointmentReminderFor: "2026-11-28T18:00:00.000Z" } };
    expect(reminderDue(moved, NOW).due).toBe(true);
  });
});

describe("buildReminderEmail", () => {
  it("greets the account holder about the dependent, with no price", () => {
    const email = buildReminderEmail({ booking: base, start: base.sessionDate, accountName: "Atiya Abedin", now: NOW });
    expect(email.subject).toBe("Reminder: Saera's home visit tomorrow at 3pm");
    expect(email.text).toContain("Hi Atiya,");
    expect(email.text).toContain(
      "Saera's initial assessment home visit is tomorrow, Sunday 29 November at 3pm. It takes about 60 minutes.",
    );
    expect(email.text).toContain("Address: 1 Test Crescent, Glasgow, G1 1AA");
    expect(email.text).not.toContain("£");
  });

  it("quotes no time for a visit planned by date only", () => {
    const booking = { ...base, patientType: "self", appointmentTime: "18:00", service: "Follow-Up (home visit)" };
    const email = buildReminderEmail({ booking, start: base.sessionDate, now: NOW });
    expect(email.subject).toBe("Reminder: your home visit tomorrow");
    expect(email.text).not.toMatch(/3pm|minutes/);
  });

  it("includes the video link", () => {
    const booking = { ...base, visitType: "video", homeVisitAddress: undefined, meetingUrl: "https://meet.example/x" };
    expect(buildReminderEmail({ booking, start: base.sessionDate, now: NOW }).text).toContain(
      "Video link: https://meet.example/x",
    );
  });
});

describe("POST /api/appointments/reminder-email", () => {
  const send = vi.fn();
  const call = (secret = "s") =>
    POST(
      new Request("http://localhost/api/appointments/reminder-email", {
        method: "POST",
        headers: { "x-cron-secret": secret },
        body: JSON.stringify({ bookingId: "b1" }),
      }),
    );

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.stubEnv("CRON_SECRET", "s");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubGlobal("fetch", send);
    send.mockResolvedValue({ ok: true, status: 200 });
    bookingGet.mockResolvedValue({ exists: true, data: () => base });
    accountGet.mockResolvedValue({ data: () => ({ displayName: "Atiya Abedin" }) });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("rejects a wrong secret", async () => {
    expect((await call("nope")).status).toBe(401);
    expect(send).not.toHaveBeenCalled();
  });

  it("sends once and stamps without losing other flags", async () => {
    expect(await (await call()).json()).toEqual({ sent: true });
    expect(JSON.parse(send.mock.calls[0][1].body).to).toEqual(["daughter@example.com"]);
    expect(update).toHaveBeenCalledWith({
      reminders: { reviewRequestSent: true, appointmentReminderFor: "2026-11-29T15:00:00.000Z" },
    });
  });

  it("does not stamp when the send fails", async () => {
    send.mockResolvedValue({ ok: false, status: 500 });
    expect((await call()).status).toBe(502);
    expect(update).not.toHaveBeenCalled();
  });
});
