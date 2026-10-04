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

  it("on a 400 retries a home visit without metadata (address dropped) and never logs the error body", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const echoingError = JSON.stringify({ error: "bad metadata", echo: { homeVisitAddress: "7 Example Street, G31 4HS" } });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(echoingError, { status: 400 }))
      .mockResolvedValueOnce(new Response(echoingError, { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NEXT_PUBLIC_CAL_USERNAME", "physio");

    const result = await createCalBooking({
      ...OK_INPUT,
      visitType: "home",
      homeVisitAddress: "7 Example Street, G31 4HS",
    });

    expect(result.ok).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const first = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(first.metadata.homeVisitAddress).toBe("7 Example Street, G31 4HS");
    const retry = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
    expect(retry).not.toHaveProperty("metadata");
    expect(JSON.stringify(retry)).not.toContain("Example Street");

    const logged = JSON.stringify(errorSpy.mock.calls);
    expect(errorSpy).toHaveBeenCalled();
    expect(logged).not.toContain("Example Street");
    expect(logged).not.toContain("G31 4HS");
    expect(logged).not.toContain("bad metadata");
  });

  it("still logs the Cal.com error body for a video booking", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("slot gone", { status: 500 })));
    vi.stubEnv("NEXT_PUBLIC_CAL_USERNAME", "physio");
    await createCalBooking(OK_INPUT);
    expect(JSON.stringify(errorSpy.mock.calls)).toContain("slot gone");
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

describe("createCalBooking — Cal.com event type for home visits", () => {
  function okFetch() {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { uid: "cal_abc" } }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NEXT_PUBLIC_CAL_USERNAME", "physio");
    return fetchMock;
  }
  const slugOf = (fetchMock: ReturnType<typeof vi.fn>) =>
    JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string).eventTypeSlug;

  it("books a home-visit initial assessment into the Glasgow home-visit event", async () => {
    const fetchMock = okFetch();
    await createCalBooking({ ...OK_INPUT, visitType: "home", homeVisitAddress: "7 Example Street, G31 4HS" });
    expect(slugOf(fetchMock)).toBe("initial-assessment-home-visit-in-glasgow");
  });

  it("keeps a home-visit follow-up on the follow-up event", async () => {
    const fetchMock = okFetch();
    await createCalBooking({
      ...OK_INPUT,
      service: "follow-up",
      visitType: "home",
      homeVisitAddress: "7 Example Street, G31 4HS",
    });
    expect(slugOf(fetchMock)).toBe("online-follow-up");
  });

  it("treats a home visit with no address as video, matching the metadata rule", async () => {
    const fetchMock = okFetch();
    await createCalBooking({ ...OK_INPUT, visitType: "home" });
    expect(slugOf(fetchMock)).toBe("initial-online-assessment");
  });

  it("retries a rejected home visit without metadata but still on the home-visit event", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("bad metadata", { status: 400 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { uid: "cal_abc" } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NEXT_PUBLIC_CAL_USERNAME", "physio");
    await createCalBooking({ ...OK_INPUT, visitType: "home", homeVisitAddress: "7 Example Street, G31 4HS" });
    const retry = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
    expect(retry.eventTypeSlug).toBe("initial-assessment-home-visit-in-glasgow");
    expect(retry.metadata).toBeUndefined();
  });
});
