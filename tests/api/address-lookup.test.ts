import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findAddresses: vi.fn(),
  resolveAddress: vi.fn(),
  isRateLimited: vi.fn().mockResolvedValue(false),
}));
vi.mock("@/lib/address-lookup", () => ({ findAddresses: mocks.findAddresses, resolveAddress: mocks.resolveAddress }));
vi.mock("@/lib/rate-limit", () => ({ isRateLimited: mocks.isRateLimited, clientIp: () => "1.2.3.4" }));

import { POST as lookup } from "@/app/api/address/lookup/route";
import { POST as resolve } from "@/app/api/address/resolve/route";

const post = (body: unknown) =>
  new Request("http://localhost/api/address/x", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isRateLimited.mockResolvedValue(false);
});

describe("POST /api/address/lookup", () => {
  it("returns suggestions for a covered postcode", async () => {
    mocks.findAddresses.mockResolvedValue({ ok: true, value: [{ id: "abc", label: "7 Example Street, Glasgow, G31 4HS" }] });
    const res = await lookup(post({ postcode: "g31 4hs" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ addresses: [{ id: "abc", label: "7 Example Street, Glasgow, G31 4HS" }] });
    expect(mocks.findAddresses).toHaveBeenCalledWith("G31 4HS");
  });
  it("rejects a malformed postcode with 400 and an uncovered one with 422, without calling the provider", async () => {
    expect((await lookup(post({ postcode: "12345" }))).status).toBe(400);
    const uncovered = await lookup(post({ postcode: "EH1 1AA" }));
    expect(uncovered.status).toBe(422);
    expect(await uncovered.json()).toEqual({ error: "not_covered" });
    expect(mocks.findAddresses).not.toHaveBeenCalled();
  });
  it("rejects a null JSON body with 400", async () => {
    expect((await lookup(post(null))).status).toBe(400);
  });
  it("maps provider failures to 404 / 429 / 503", async () => {
    mocks.findAddresses.mockResolvedValueOnce({ ok: false, reason: "not_found" });
    expect((await lookup(post({ postcode: "G31 4HS" }))).status).toBe(404);
    mocks.findAddresses.mockResolvedValueOnce({ ok: false, reason: "rate_limited" });
    expect((await lookup(post({ postcode: "G31 4HS" }))).status).toBe(429);
    mocks.findAddresses.mockResolvedValueOnce({ ok: false, reason: "unconfigured" });
    expect((await lookup(post({ postcode: "G31 4HS" }))).status).toBe(503);
    mocks.findAddresses.mockResolvedValueOnce({ ok: false, reason: "provider_error" });
    expect((await lookup(post({ postcode: "G31 4HS" }))).status).toBe(503);
  });
  it("is rate limited per IP with ADDRESS_RATE_LIMITER", async () => {
    mocks.isRateLimited.mockResolvedValue(true);
    expect((await lookup(post({ postcode: "G31 4HS" }))).status).toBe(429);
    expect(mocks.isRateLimited).toHaveBeenCalledWith("ADDRESS_RATE_LIMITER", "1.2.3.4");
    expect(mocks.findAddresses).not.toHaveBeenCalled();
  });
});

describe("POST /api/address/resolve", () => {
  it("returns the address line and postcode", async () => {
    mocks.resolveAddress.mockResolvedValue({ ok: true, value: { addressLine: "7 Example Street, Glasgow", postcode: "G31 4HS" } });
    const res = await resolve(post({ id: "abc" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ addressLine: "7 Example Street, Glasgow", postcode: "G31 4HS" });
  });
  it("rejects a bad id with 400", async () => {
    expect((await resolve(post({ id: "../etc" }))).status).toBe(400);
    expect((await resolve(post({}))).status).toBe(400);
    expect((await resolve(post(null))).status).toBe(400);
  });
  it("accepts Ideal Postcodes style ids", async () => {
    mocks.resolveAddress.mockResolvedValue({ ok: true, value: { addressLine: "7 Example Street, Glasgow", postcode: "G31 4HS" } });
    expect((await resolve(post({ id: "paf_12345678" }))).status).toBe(200);
    expect((await resolve(post({ id: "a:b-c_1" }))).status).toBe(200);
  });
  it("refuses an address whose postcode is outside the covered area", async () => {
    mocks.resolveAddress.mockResolvedValue({ ok: true, value: { addressLine: "1 Princes Street, Edinburgh", postcode: "EH2 2AN" } });
    expect((await resolve(post({ id: "abc" }))).status).toBe(422);
  });
  it("maps provider failures to 404 / 429 / 503", async () => {
    mocks.resolveAddress.mockResolvedValueOnce({ ok: false, reason: "not_found" });
    expect((await resolve(post({ id: "paf_1" }))).status).toBe(404);
    mocks.resolveAddress.mockResolvedValueOnce({ ok: false, reason: "rate_limited" });
    expect((await resolve(post({ id: "paf_1" }))).status).toBe(429);
    mocks.resolveAddress.mockResolvedValueOnce({ ok: false, reason: "unconfigured" });
    expect((await resolve(post({ id: "paf_1" }))).status).toBe(503);
    mocks.resolveAddress.mockResolvedValueOnce({ ok: false, reason: "provider_error" });
    expect((await resolve(post({ id: "paf_1" }))).status).toBe(503);
  });
  it("is rate limited per IP with ADDRESS_RATE_LIMITER", async () => {
    mocks.isRateLimited.mockResolvedValue(true);
    expect((await resolve(post({ id: "paf_1" }))).status).toBe(429);
    expect(mocks.isRateLimited).toHaveBeenCalledWith("ADDRESS_RATE_LIMITER", "1.2.3.4");
    expect(mocks.resolveAddress).not.toHaveBeenCalled();
  });
});
