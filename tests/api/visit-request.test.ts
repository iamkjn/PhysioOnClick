import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const addMock = vi.fn();
let dbAvailable = true;
vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: () => (dbAvailable ? { collection: () => ({ add: addMock }) } : null),
  FieldValue: { serverTimestamp: vi.fn().mockReturnValue("__TS__") },
}));

import { POST } from "@/app/api/visit-request/route";
import { resetRateLimitMemory } from "@/lib/rate-limit";

const fetchMock = vi.fn();

function req(body: object) {
  return new Request("http://localhost/api/visit-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const valid = {
  name: "John Smith",
  phone: "07518 953611",
  email: "john@example.com",
  postcode: "g72 8fe",
  town: "Cambuslang",
  gender: "male",
  dateOfBirth: "1950-04-02",
  preferredDate: "2026-11-27",
  preferredTime: "morning",
  times: ["weekday-evening", "sunday"],
  note: "Struggling to walk far",
  channel: "fb-cambuslang",
  consent: true,
};

describe("POST /api/visit-request", () => {
  beforeEach(() => {
    resetRateLimitMemory();
    dbAvailable = true;
    addMock.mockReset().mockResolvedValue({ id: "enq1" });
    fetchMock.mockReset().mockResolvedValue({ ok: true, text: async () => "" });
    vi.stubGlobal("fetch", fetchMock);
    process.env.RESEND_API_KEY = "re_test";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.RESEND_API_KEY;
  });

  it("saves the request to Enquiries and emails hello@ with a tap-to-call number", async () => {
    const res = await POST(req(valid));
    expect(await res.json()).toMatchObject({ ok: true, saved: true, emailSent: true, covered: true });

    expect(addMock.mock.calls[0][0]).toMatchObject({
      name: "John Smith",
      phone: "07518 953611",
      postcode: "G72 8FE",
      covered: true,
      visitTimes: ["weekday-evening", "sunday"],
      message: "Struggling to walk far",
      kind: "visit-request",
      channel: "fb-cambuslang",
      status: "new",
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    const email = JSON.parse(init.body);
    expect(email.subject).toBe("Home visit request: John Smith, G72 8FE, Fri 27 Nov morning");
    expect(email.html).toContain('href="tel:+447518953611"');
    expect(email.html).toContain("Inside the home-visit area");
    expect(email.html).toContain("Facebook · Cambuslang");
  });

  it("flags a postcode outside the area in the email", async () => {
    await POST(req({ ...valid, postcode: "EH1 1AA" }));
    expect(addMock.mock.calls[0][0].covered).toBe(false);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).html).toContain("OUTSIDE the home-visit area");
  });

  it("takes a video request with no postcode or address", async () => {
    const res = await POST(req({ ...valid, visitType: "video", postcode: "", town: "", concern: "neuro" }));
    expect(res.status).toBe(200);
    expect(addMock.mock.calls[0][0]).toMatchObject({ visitType: "video", postcode: "", concern: "neuro", preferredTime: "morning" });
  });

  it("takes a quick query with just name, phone and email", async () => {
    const res = await POST(req({ quick: true, name: "Ann Lee", phone: "07700900123", email: "a@example.com", consent: true }));
    expect(res.status).toBe(200);
    expect(addMock.mock.calls[0][0]).toMatchObject({ service: "Quick query", email: "a@example.com" });
  });

  it("requires an email, gender and date of birth", async () => {
    for (const gap of [{ email: "" }, { gender: "" }, { dateOfBirth: "" }]) {
      expect((await POST(req({ ...valid, ...gap }))).status).toBe(400);
      resetRateLimitMemory();
    }
    expect(addMock).not.toHaveBeenCalled();
  });

  it("refuses a request without consent", async () => {
    expect((await POST(req({ ...valid, consent: false }))).status).toBe(400);
    expect(addMock).not.toHaveBeenCalled();
  });

  it("refuses a request without a phone number", async () => {
    const res = await POST(req({ ...valid, phone: "" }));
    expect(res.status).toBe(400);
    expect(addMock).not.toHaveBeenCalled();
  });

  it("quietly drops bot submissions that fill the hidden field", async () => {
    const res = await POST(req({ ...valid, website: "http://spam.example" }));
    expect(res.status).toBe(200);
    expect(addMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("still succeeds if only the email goes out", async () => {
    dbAvailable = false;
    const json = await (await POST(req(valid))).json();
    expect(json).toMatchObject({ ok: true, saved: false, emailSent: true });
  });

  it("tells the visitor to phone if neither saving nor emailing worked", async () => {
    dbAvailable = false;
    fetchMock.mockResolvedValue({ ok: false, text: async () => "down" });
    const res = await POST(req(valid));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/07557 684395/);
  });
});
