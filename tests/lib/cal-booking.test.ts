import { afterEach, describe, expect, it, vi } from "vitest";
import { createCalBooking } from "@/lib/cal-booking";

const OK_INPUT = {
  service: "initial-assessment" as const,
  startISO: "2999-01-01T10:00:00.000Z",
  name: "Ada Lovelace",
  email: "ada@example.com",
  timeZone: "Europe/London",
};

afterEach(() => vi.restoreAllMocks());

describe("createCalBooking", () => {
  it("posts to Cal.com and returns the uid", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { uid: "cal_abc" } }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NEXT_PUBLIC_CAL_USERNAME", "physio");

    const result = await createCalBooking(OK_INPUT);

    expect(result).toEqual({ ok: true, uid: "cal_abc" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.cal.com/v2/bookings");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.eventTypeSlug).toBe("initial-online-assessment");
    expect(body.username).toBe("physio");
    expect(body.attendee.email).toBe("ada@example.com");
  });

  it("returns an error result when Cal.com rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 500 })));
    vi.stubEnv("NEXT_PUBLIC_CAL_USERNAME", "physio");
    const result = await createCalBooking(OK_INPUT);
    expect(result.ok).toBe(false);
  });

  it("sends visitType and the home address in Cal.com metadata for a home visit", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { uid: "cal_abc" } }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NEXT_PUBLIC_CAL_USERNAME", "physio");

    await createCalBooking({
      ...OK_INPUT,
      focusAreas: ["Back & neck"],
      visitType: "home",
      homeVisitAddress: "7 Example Street, G31 4HS",
    });

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.metadata).toEqual({
      focusAreas: "Back & neck",
      visitType: "home",
      homeVisitAddress: "7 Example Street, G31 4HS",
    });
  });

  it("keeps a video booking's Cal.com payload unchanged", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { uid: "cal_abc" } }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NEXT_PUBLIC_CAL_USERNAME", "physio");

    await createCalBooking({ ...OK_INPUT, focusAreas: ["Shoulder"] });
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.metadata).toEqual({ focusAreas: "Shoulder" });

    await createCalBooking(OK_INPUT);
    const plain = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
    expect(plain).not.toHaveProperty("metadata");
  });
});
