// Server-only postcode -> address lookup. Provider: Ideal Postcodes (owner
// decision 2026-10-04; the previous provider no longer served UK addresses). Switching
// provider means changing only this file. Autocomplete uses no credits; resolving
// one address costs 1 credit.
// Never log postcodes, addresses or provider response bodies.
import { HOME_ADDRESS_MAX, normalisePostcode } from "@/lib/home-visit";

export type AddressSuggestion = { id: string; label: string };
export type LookupResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "unconfigured" | "not_found" | "rate_limited" | "provider_error" };

const BASE = "https://api.ideal-postcodes.co.uk/v1/autocomplete/addresses"
const TIMEOUT_MS = 5000;

function apiKey(): string {
  return process.env.IDEAL_POSTCODES_API_KEY ?? "";
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

const compact = (v: string) => v.replace(/\s+/g, "").toUpperCase();

export async function findAddresses(postcode: string): Promise<LookupResult<AddressSuggestion[]>> {
  const key = apiKey();
  if (!key) return { ok: false, reason: "unconfigured" };
  const queried = normalisePostcode(postcode);
  const params = new URLSearchParams({ query: queried, api_key: key });
  try {
    const res = await fetch(`${BASE}?${params.toString()}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) {
      console.error("Address lookup failed", res.status);
      return failure(res.status);
    }
    const json = (await res.json()) as { result?: { hits?: Array<{ id?: unknown; suggestion?: unknown }> } };
    const want = compact(queried);
    const value = (json?.result?.hits ?? [])
      .filter((h): h is { id: string; suggestion: string } => typeof h?.id === "string" && typeof h?.suggestion === "string")
      .filter((h) => compact(h.suggestion).endsWith(want))
      .map((h) => ({ id: h.id, label: h.suggestion }));
    return value.length ? { ok: true, value } : { ok: false, reason: "not_found" };
  } catch {
    console.error("Address lookup request failed");
    return { ok: false, reason: "provider_error" };
  }
}

export async function resolveAddress(id: string): Promise<LookupResult<{ addressLine: string; postcode: string }>> {
  const key = apiKey();
  if (!key) return { ok: false, reason: "unconfigured" };
  const params = new URLSearchParams({ api_key: key });
  try {
    const res = await fetch(`${BASE}/${encodeURIComponent(id)}/gbr?${params.toString()}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) {
      console.error("Address resolve failed", res.status);
      return failure(res.status);
    }
    const json = (await res.json()) as { result?: Record<string, unknown> };
    const r = json?.result ?? {};
    const str = (k: string) => (typeof r[k] === "string" ? (r[k] as string) : "");
    const addressLine = formatAddressLine({
      line_1: str("line_1"), line_2: str("line_2"), line_3: str("line_3"), town_or_city: str("post_town"),
    });
    const postcode = normalisePostcode(str("postcode"));
    if (!addressLine || !postcode) return { ok: false, reason: "provider_error" };
    return { ok: true, value: { addressLine, postcode } };
  } catch {
    console.error("Address resolve request failed");
    return { ok: false, reason: "provider_error" };
  }
}
