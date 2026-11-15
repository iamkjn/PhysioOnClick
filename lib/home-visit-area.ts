import { normalisePostcode } from "@/lib/home-visit";

// The label lives in lib/home-visit (to avoid an import cycle); re-exported here.
export { HOME_VISIT_AREA_LABEL } from "@/lib/home-visit";

/**
 * Where home visits are offered, by postcode district (outward code).
 * This is the ONLY copy of the list: the booking UI, /api/checkout/create and
 * the mobile app's coverage endpoint (/api/home-visit/coverage) all read it from here.
 *
 * Owner decision 2026-11-15: everywhere within roughly an hour's drive of the
 * G31 base (it replaced the 2026-10-04 list of G1-G53, PA1-PA3 and ML3 only,
 * which wrongly turned away a Kilmarnock KA3 patient). Island and ferry-only
 * districts (KA27 Arran, KA28 Cumbrae, PA20+ Bute/Argyll) are deliberately out.
 */
const range = (prefix: string, from: number, to: number): string[] =>
  Array.from({ length: to - from + 1 }, (_, i) => `${prefix}${from + i}`);

export const HOME_VISIT_DISTRICTS: ReadonlySet<string> = new Set([
  // Glasgow city, plus Dunbartonshire, East Dunbartonshire, North/South Lanarkshire edges and East Renfrewshire
  ...range("G", 1, 53),
  ...range("G", 60, 69),
  ...range("G", 71, 78),
  ...range("G", 81, 84),
  // Renfrewshire and Inverclyde (Paisley, Renfrew, Johnstone, Erskine, Greenock, Gourock, Wemyss Bay)
  ...range("PA", 1, 19),
  // Lanarkshire (Motherwell, Wishaw, Hamilton, Bellshill, Coatbridge, Airdrie, Shotts, Carluke, Larkhall, Strathaven, Lanark, Biggar)
  ...range("ML", 1, 12),
  // Ayrshire (Kilmarnock, Stewarton, Ayr, Prestwick, Troon, Irvine, Kilwinning, Beith, Cumnock, Maybole, the Three Towns, Dalry, Kilbirnie, Largs)
  ...range("KA", 1, 25),
  "KA29",
  "KA30",
  // Falkirk, Stirling and Clackmannanshire (Grangemouth, Larbert, Denny, Alloa, Dollar, Dunblane, Doune)
  ...range("FK", 1, 16),
  // West Lothian and the west edge of Edinburgh (Kirknewton, Ratho, Kirkliston, South Queensferry, Bathgate, Linlithgow, Bo'ness, Broxburn, Livingston)
  "EH27",
  "EH28",
  "EH29",
  "EH30",
  "EH47",
  "EH48",
  "EH49",
  "EH51",
  "EH52",
  "EH53",
  "EH54",
  "EH55",
  // West Fife and Kinross (Dunfermline, Rosyth, Inverkeithing, Kinross)
  "KY11",
  "KY12",
  "KY13",
]);

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
  return `We don't offer home visits in ${district} yet. Video consultations work anywhere in the UK, or contact us and we'll see if we can help.`;
}
