import { afterEach, describe, expect, it, vi } from "vitest";
import { findAddresses, formatAddressLine, resolveAddress } from "@/lib/address-lookup";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function stubFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("formatAddressLine", () => {
  it("joins the non-empty lines and the town", () => {
    expect(formatAddressLine({ line_1: "Flat 2", line_2: "7 Example Street", line_3: "", post_town: "Glasgow" })).toBe(
      "Flat 2, 7 Example Street, Glasgow",
    );
  });
  it("caps the result at 120 characters", () => {
    expect(formatAddressLine({ line_1: "x".repeat(200), post_town: "Glasgow" }).length).toBe(120);
  });
});

describe("findAddresses", () => {
  it("is unconfigured without a key and never calls the provider", async () => {
    vi.stubEnv("IDEAL_POSTCODES_API_KEY", "");
    const fetchMock = stubFetch(new Response("{}"));
    expect(await findAddresses("G31 4HS")).toEqual({ ok: false, reason: "unconfigured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls autocomplete with the normalised postcode and keeps only that postcode's hits", async () => {
    vi.stubEnv("IDEAL_POSTCODES_API_KEY", "k_test");
    const fetchMock = stubFetch(
      new Response(
        JSON.stringify({
          result: {
            hits: [
              { id: "paf_1", suggestion: "7 Example Street, Glasgow, G31 4HS", udprn: 1, urls: {} },
              { id: "paf_2", suggestion: "9 Other Road, Glasgow, G31 4HT", udprn: 2, urls: {} },
              { id: "paf_3", suggestion: "Flat 2, 7 Example Street, Glasgow, G31 4HS", udprn: 3, urls: {} },
            ],
          },
        }),
        { status: 200 },
      ),
    );
    expect(await findAddresses("g314hs")).toEqual({
      ok: true,
      value: [
        { id: "paf_1", label: "7 Example Street, Glasgow, G31 4HS" },
        { id: "paf_3", label: "Flat 2, 7 Example Street, Glasgow, G31 4HS" },
      ],
    });
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe("https://api.ideal-postcodes.co.uk/v1/autocomplete/addresses");
    expect(url.searchParams.get("query")).toBe("G31 4HS");
    expect(url.searchParams.get("api_key")).toBeNull();
    expect(fetchMock.mock.calls[0][1].headers).toEqual({ Authorization: 'api_key="k_test"' });
    expect(url.searchParams.get("limit")).toBe("100");
    expect(fetchMock.mock.calls[0][1]).toHaveProperty("signal");
  });

  it("matches the postcode after the last comma exactly, not as a suffix (defensive: G1 1AA must not match a longer code ending in it)", async () => {
    vi.stubEnv("IDEAL_POSTCODES_API_KEY", "k_test");
    stubFetch(
      new Response(
        JSON.stringify({ result: { hits: [
          { id: "a", suggestion: "1 Long Road, Glasgow, PG1 1AA" },
          { id: "b", suggestion: "2 Short St, Glasgow, G1 1AA" },
        ] } }),
        { status: 200 },
      ),
    );
    expect(await findAddresses("G1 1AA")).toEqual({ ok: true, value: [{ id: "b", label: "2 Short St, Glasgow, G1 1AA" }] });
  });

  it("maps 404 to not_found, 429 to rate_limited and 401/402/403/500 to provider_error", async () => {
    vi.stubEnv("IDEAL_POSTCODES_API_KEY", "k_test");
    stubFetch(new Response("", { status: 404 }));
    expect(await findAddresses("G31 4HS")).toEqual({ ok: false, reason: "not_found" });
    stubFetch(new Response("", { status: 429 }));
    expect(await findAddresses("G31 4HS")).toEqual({ ok: false, reason: "rate_limited" });
    for (const status of [401, 402, 403, 500]) {
      stubFetch(new Response("", { status }));
      expect(await findAddresses("G31 4HS")).toEqual({ ok: false, reason: "provider_error" });
    }
  });

  it("treats no matching hits as not_found and network errors/timeouts as provider_error", async () => {
    vi.stubEnv("IDEAL_POSTCODES_API_KEY", "k_test");
    stubFetch(new Response(JSON.stringify({ result: { hits: [] } }), { status: 200 }));
    expect(await findAddresses("G31 4HS")).toEqual({ ok: false, reason: "not_found" });
    stubFetch(new Response(JSON.stringify({ result: { hits: [{ id: "x", suggestion: "1 A St, Glasgow, G1 1AA" }] } }), { status: 200 }));
    expect(await findAddresses("G31 4HS")).toEqual({ ok: false, reason: "not_found" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));
    expect(await findAddresses("G31 4HS")).toEqual({ ok: false, reason: "provider_error" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("t", "TimeoutError")));
    expect(await findAddresses("G31 4HS")).toEqual({ ok: false, reason: "provider_error" });
  });
});

describe("resolveAddress", () => {
  it("gets the address by id and returns a single address line plus postcode", async () => {
    vi.stubEnv("IDEAL_POSTCODES_API_KEY", "k_test");
    const fetchMock = stubFetch(
      new Response(
        JSON.stringify({ result: { postcode: "G31 4HS", line_1: "7 Example Street", line_2: "", line_3: "", post_town: "Glasgow", county: "Lanarkshire" } }),
        { status: 200 },
      ),
    );
    expect(await resolveAddress("paf_123")).toEqual({ ok: true, value: { addressLine: "7 Example Street, Glasgow", postcode: "G31 4HS" } });
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe("https://api.ideal-postcodes.co.uk/v1/autocomplete/addresses/paf_123/gbr");
    expect(url.searchParams.get("api_key")).toBeNull();
    expect(fetchMock.mock.calls[0][1].headers).toEqual({ Authorization: 'api_key="k_test"' });
    expect(fetchMock.mock.calls[0][1]).toHaveProperty("signal");
  });

  it("maps statuses and failures", async () => {
    vi.stubEnv("IDEAL_POSTCODES_API_KEY", "k_test");
    stubFetch(new Response("", { status: 404 }));
    expect(await resolveAddress("paf_1")).toEqual({ ok: false, reason: "not_found" });
    stubFetch(new Response("", { status: 429 }));
    expect(await resolveAddress("paf_1")).toEqual({ ok: false, reason: "rate_limited" });
    stubFetch(new Response("", { status: 402 }));
    expect(await resolveAddress("paf_1")).toEqual({ ok: false, reason: "provider_error" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("t", "TimeoutError")));
    expect(await resolveAddress("paf_1")).toEqual({ ok: false, reason: "provider_error" });
  });

  it("never logs the response body (which contains the address)", async () => {
    vi.stubEnv("IDEAL_POSTCODES_API_KEY", "k_test");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    stubFetch(new Response("7 Example Street G31 4HS", { status: 500 }));
    await resolveAddress("paf_1");
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain("Example");
    errorSpy.mockRestore();
  });
});
