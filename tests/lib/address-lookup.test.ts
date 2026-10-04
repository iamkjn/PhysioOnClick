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
    expect(formatAddressLine({ line_1: "Flat 2", line_2: "7 Example Street", line_3: "", line_4: "", town_or_city: "Glasgow" })).toBe(
      "Flat 2, 7 Example Street, Glasgow",
    );
  });
  it("caps the result at 120 characters", () => {
    expect(formatAddressLine({ line_1: "x".repeat(200), town_or_city: "Glasgow" }).length).toBe(120);
  });
});

describe("findAddresses", () => {
  it("is unconfigured without a key and never calls the provider", async () => {
    vi.stubEnv("GETADDRESS_API_KEY", "");
    const fetchMock = stubFetch(new Response("{}"));
    expect(await findAddresses("G31 4HS")).toEqual({ ok: false, reason: "unconfigured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls autocomplete with the normalised postcode and maps suggestions", async () => {
    vi.stubEnv("GETADDRESS_API_KEY", "k_test");
    const fetchMock = stubFetch(
      new Response(JSON.stringify({ suggestions: [{ address: "7 Example Street, Glasgow, G31 4HS", url: "/get/abc", id: "abc" }] }), { status: 200 }),
    );
    expect(await findAddresses("g31 4hs")).toEqual({ ok: true, value: [{ id: "abc", label: "7 Example Street, Glasgow, G31 4HS" }] });
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe("https://api.getaddress.io/autocomplete/G31%204HS");
    expect(url.searchParams.get("api-key")).toBe("k_test");
    expect(url.searchParams.get("all")).toBe("true");
  });

  it("maps 404 to not_found, 429 to rate_limited and others to provider_error", async () => {
    vi.stubEnv("GETADDRESS_API_KEY", "k_test");
    stubFetch(new Response("", { status: 404 }));
    expect(await findAddresses("G31 4HS")).toEqual({ ok: false, reason: "not_found" });
    stubFetch(new Response("", { status: 429 }));
    expect(await findAddresses("G31 4HS")).toEqual({ ok: false, reason: "rate_limited" });
    stubFetch(new Response("", { status: 500 }));
    expect(await findAddresses("G31 4HS")).toEqual({ ok: false, reason: "provider_error" });
  });

  it("treats an empty suggestion list as not_found and a network error as provider_error", async () => {
    vi.stubEnv("GETADDRESS_API_KEY", "k_test");
    stubFetch(new Response(JSON.stringify({ suggestions: [] }), { status: 200 }));
    expect(await findAddresses("G31 4HS")).toEqual({ ok: false, reason: "not_found" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));
    expect(await findAddresses("G31 4HS")).toEqual({ ok: false, reason: "provider_error" });
  });
});

describe("resolveAddress", () => {
  it("gets the address by id and returns a single address line plus postcode", async () => {
    vi.stubEnv("GETADDRESS_API_KEY", "k_test");
    const fetchMock = stubFetch(
      new Response(
        JSON.stringify({ postcode: "G31 4HS", line_1: "7 Example Street", line_2: "", line_3: "", line_4: "", town_or_city: "Glasgow", county: "Lanarkshire" }),
        { status: 200 },
      ),
    );
    expect(await resolveAddress("abc")).toEqual({ ok: true, value: { addressLine: "7 Example Street, Glasgow", postcode: "G31 4HS" } });
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe("https://api.getaddress.io/get/abc");
  });

  it("never logs the response body (which contains the address)", async () => {
    vi.stubEnv("GETADDRESS_API_KEY", "k_test");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    stubFetch(new Response("7 Example Street G31 4HS", { status: 500 }));
    await resolveAddress("abc");
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain("Example");
    errorSpy.mockRestore();
  });
});
