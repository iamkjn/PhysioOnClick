import { normalisePostcode } from "@/lib/home-visit";

// The label lives in lib/home-visit (to avoid an import cycle); re-exported here.
export { HOME_VISIT_AREA_LABEL } from "@/lib/home-visit";

/**
 * Where home visits are offered, by postcode district (outward code), and which
 * price band each district is in. This is the ONLY copy: the booking UI,
 * /api/checkout/create and the mobile app's coverage endpoint all read it.
 *
 * Owner decision 2026-11-27: the band follows the estimated rush-hour drive
 * from the G31 base (it replaced one price for the whole area). Band 0 is up to
 * about 30 minutes, 1 up to 45, 2 up to 60, 3 further. Prices for each band
 * are in lib/home-visit-pricing. Island and ferry-only districts, Kinross
 * (KY13) and central Edinburgh are out.
 */
const BAND_DISTRICTS: readonly (readonly string[])[] = [
  [
  "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10",
  "G11", "G12", "G13", "G14", "G15", "G16", "G17", "G18", "G19", "G20",
  "G21", "G22", "G23", "G24", "G25", "G26", "G27", "G28", "G29", "G30",
  "G31", "G32", "G33", "G34", "G35", "G36", "G37", "G38", "G39", "G40",
  "G41", "G42", "G43", "G44", "G45", "G46", "G47", "G48", "G49", "G50",
  "G51", "G52", "G53", "G60", "G61", "G62", "G64", "G65", "G66", "G67",
  "G68", "G69", "G71", "G72", "G73", "G74", "G75", "G76", "G77", "G81",
  "PA1", "PA2", "PA3", "PA4", "PA5", "ML1", "ML3", "ML4", "ML5", "ML6",
  "ML9",
  ],
  [
  "G63", "G78", "G82", "PA6", "PA7", "PA8", "PA9", "PA10", "PA11", "PA12",
  "ML2", "ML7", "ML8", "ML10", "ML11", "FK1", "FK2", "FK3", "FK4", "FK5",
  "FK6", "FK7", "EH47", "EH48",
  ],
  [
  "G83", "PA13", "PA14", "PA15", "PA16", "KA1", "KA2", "KA3", "KA4", "KA11",
  "KA12", "KA13", "KA14", "KA15", "KA16", "KA17", "KA24", "KA25", "FK8", "FK9",
  "FK10", "FK11", "FK12", "FK13", "FK15", "FK16", "EH28", "EH49", "EH51", "EH52",
  "EH53", "EH54", "EH55",
  ],
  [
  "G84", "PA17", "PA18", "PA19", "KA5", "KA6", "KA7", "KA8", "KA9", "KA10",
  "KA18", "KA19", "KA20", "KA21", "KA22", "KA23", "KA29", "KA30", "ML12", "FK14",
  "FK17", "EH12", "EH27", "EH29", "EH30", "KY11", "KY12",
  ],
];

const BAND_BY_DISTRICT: ReadonlyMap<string, number> = new Map(
  BAND_DISTRICTS.flatMap((districts, band) => districts.map((d) => [d, band] as const)),
);

export const HOME_VISIT_DISTRICTS: ReadonlySet<string> = new Set(BAND_BY_DISTRICT.keys());

/** Price band (0 = nearest) for a postcode, or null when we don't visit it. */
export function homeVisitBand(postcode: string): number | null {
  return BAND_BY_DISTRICT.get(outwardCode(postcode)) ?? null;
}

/** As homeVisitBand, for a bare district such as "KA1". */
export function homeVisitBandOfDistrict(district: string): number | null {
  return BAND_BY_DISTRICT.get(district) ?? null;
}

/** "g31 4hs" -> "G31". Empty string when there is no recognisable district. */
export function outwardCode(postcode: string): string {
  const normalised = normalisePostcode(postcode.trim());
  const space = normalised.indexOf(" ");
  return space > 0 ? normalised.slice(0, space) : "";
}

export function isCoveredPostcode(postcode: string): boolean {
  const district = outwardCode(postcode);
  return district !== "" && HOME_VISIT_DISTRICTS.has(district);
}

export function outOfAreaMessage(postcode: string): string {
  const district = outwardCode(postcode) || "your area";
  return `Let's talk about ${district}: contact us and we'll go through the options. Video consultations work anywhere in the UK.`;
}
