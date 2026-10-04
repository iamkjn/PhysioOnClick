// Server-only postcode -> address lookup. Provider: getAddress.io (free plan,
// owner decision 2026-10-04). Switching provider means changing only this file.
// Autocomplete is free (rate-limited by the provider); /get counts as a lookup.
// Never log postcodes, addresses or provider response bodies.
import { HOME_ADDRESS_MAX, normalisePostcode } from "@/lib/home-visit";

export type AddressSuggestion = { id: string; label: string };
export type LookupResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "unconfigured" | "not_found" | "rate_limited" | "provider_error" };

const BASE = "https://api.getaddress.io";

function apiKey(): string {
  return process.env.GETADDRESS_API_KEY ?? "";
}

function failure(status: number): LookupResult<never> {
  if (status === 404) return { ok: false, reason: "not_found" };
  if (status === 429) return { ok: false, reason: "rate_limited" };
  return { ok: false, reason: "provider_error" };
}

export function formatAddressLine(parts: {
  line_1?: string; line_2?: string; line_3?: string; line_4?: string; town_or_city?: string;
}): string {
  return [parts.line_1, parts.line_2, parts.line_3, parts.line_4, parts.town_or_city]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(", ")
    .slice(0, HOME_ADDRESS_MAX);
}

export async function findAddresses(postcode: string): Promise<LookupResult<AddressSuggestion[]>> {
  const key = apiKey();
  if (!key) return { ok: false, reason: "unconfigured" };
  const url = new URL(`${BASE}/autocomplete/${encodeURIComponent(normalisePostcode(postcode))}`);
  url.searchParams.set("api-key", key);
  url.searchParams.set("all", "true");
  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error("Address lookup failed", res.status);
      return failure(res.status);
    }
    const json = (await res.json()) as { suggestions?: Array<{ id?: unknown; address?: unknown }> };
    const value = (json.suggestions ?? [])
      .filter((s): s is { id: string; address: string } => typeof s.id === "string" && typeof s.address === "string")
      .map((s) => ({ id: s.id, label: s.address }));
    return value.length ? { ok: true, value } : { ok: false, reason: "not_found" };
  } catch {
    console.error("Address lookup request failed");
    return { ok: false, reason: "provider_error" };
  }
}

export async function resolveAddress(id: string): Promise<LookupResult<{ addressLine: string; postcode: string }>> {
  const key = apiKey();
  if (!key) return { ok: false, reason: "unconfigured" };
  const url = new URL(`${BASE}/get/${encodeURIComponent(id)}`);
  url.searchParams.set("api-key", key);
  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error("Address resolve failed", res.status);
      return failure(res.status);
    }
    const json = (await res.json()) as Record<string, unknown>;
    const str = (k: string) => (typeof json[k] === "string" ? (json[k] as string) : "");
    const addressLine = formatAddressLine({
      line_1: str("line_1"), line_2: str("line_2"), line_3: str("line_3"), line_4: str("line_4"), town_or_city: str("town_or_city"),
    });
    const postcode = normalisePostcode(str("postcode"));
    if (!addressLine || !postcode) return { ok: false, reason: "provider_error" };
    return { ok: true, value: { addressLine, postcode } };
  } catch {
    console.error("Address resolve request failed");
    return { ok: false, reason: "provider_error" };
  }
}
