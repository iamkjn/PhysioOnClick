/**
 * Is this visitor in the UK? Worked out in the browser from its time zone, so
 * statically generated pages (the exercise library) can show UK readers a UK
 * offer without a server round trip. About four in five exercise readers are
 * overseas and can't use a UK appointment.
 *
 * "unknown" is the server render and first paint: pages show their default
 * content until the browser has answered.
 */
export type VisitorRegion = "uk" | "overseas" | "unknown";

const UK_TIME_ZONES = new Set([
  "Europe/London",
  "Europe/Belfast",
  "Europe/Jersey",
  "Europe/Guernsey",
  "Europe/Isle_of_Man",
  "GB",
  "GB-Eire",
]);

export function regionFromTimeZone(timeZone?: string | null): VisitorRegion {
  if (!timeZone) return "unknown";
  return UK_TIME_ZONES.has(timeZone) ? "uk" : "overseas";
}

export function browserRegion(): VisitorRegion {
  try {
    return regionFromTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {
    return "unknown";
  }
}
