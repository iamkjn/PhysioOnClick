/**
 * A website visitor's approximate town or area, for the admin Growth tab, so
 * the practice can see which nearby areas the site is reaching.
 *
 * It comes from Cloudflare's IP geolocation (request.cf), the same source as
 * the visitor's country. Only the town, region and, for the UK, the postcode
 * district (the first half, e.g. "G72") are kept: never the IP address or a
 * full postcode. It is approximate: people on mobile data often show the city
 * their network routes through rather than where they are.
 */

export type VisitorArea = { city: string; region: string; postalDistrict: string };

export type AreaFields = {
  city?: string;
  region?: string;
  postalDistrict?: string;
  countryCode?: string;
  countryName?: string;
};

// Letters (any language), spaces and the punctuation place names use.
const PLACE_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}\s'’.,()-]{0,59}$/u;
// UK outward code: G1, G72, ML3, KA10, EH4, EC1A, W1D.
const UK_DISTRICT_PATTERN = /^[A-Z]{1,2}\d[A-Z\d]?$/;

function cleanPlace(value: unknown): string {
  if (typeof value !== "string") return "";
  const place = value.trim().replace(/\s+/g, " ");
  return PLACE_PATTERN.test(place) ? place : "";
}

function cleanUkDistrict(value: unknown): string {
  if (typeof value !== "string") return "";
  // Keep only the outward code, even if a full postcode is ever supplied.
  const outward = value.trim().toUpperCase().split(/\s+/)[0] ?? "";
  if (UK_DISTRICT_PATTERN.test(outward)) return outward;
  // "G728FE" with no space: the inward code is always digit + two letters.
  const joined = outward.match(/^([A-Z]{1,2}\d[A-Z\d]?)\d[A-Z]{2}$/);
  return joined ? joined[1]! : "";
}

/** Cleans Cloudflare's location fields for storage; anything unexpected becomes "". */
export function cleanVisitorArea(input: {
  city?: unknown;
  region?: unknown;
  postalCode?: unknown;
  countryCode?: string;
}): VisitorArea {
  return {
    city: cleanPlace(input.city),
    region: cleanPlace(input.region),
    postalDistrict: input.countryCode === "GB" ? cleanUkDistrict(input.postalCode) : "",
  };
}

function isUk(event: AreaFields) {
  return event.countryCode === "GB" || event.countryName === "United Kingdom";
}

/**
 * "Glasgow (G72), Scotland" for the UK; "Istanbul, Türkiye" abroad; "" when no
 * town or region was captured (events before 23 Nov 2026 have none).
 */
export function visitorPlace(event: AreaFields): string {
  const city = event.city ?? "";
  const region = event.region ?? "";
  const district = event.postalDistrict ?? "";
  const town = city && district ? `${city} (${district})` : city || (district ? `Postcode ${district}` : "");
  const wider = isUk(event) ? region : event.countryName || event.countryCode || "";
  if (!town) return isUk(event) ? region : "";
  return wider && wider !== city ? `${town}, ${wider}` : town;
}

/** A UK town or area to rank on the Growth tab, grouped by town and region (not postcode). */
export function ukAreaOf(event: AreaFields): { key: string; label: string; district: string } | null {
  if (!isUk(event)) return null;
  const city = event.city ?? "";
  const region = event.region ?? "";
  const district = event.postalDistrict ?? "";
  const name = city || (district ? `Postcode ${district}` : "");
  if (!name) return null;
  return {
    key: `${name}|${region}`.toLowerCase(),
    label: region && region !== name ? `${name}, ${region}` : name,
    district,
  };
}
