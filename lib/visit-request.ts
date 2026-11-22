/**
 * "Request a home visit": the short form for people who'd rather be phoned
 * than book and pay online. They leave a name, phone number and postcode;
 * the practice calls back, agrees a time, then adds them in admin (Add
 * patient → package → payment link → sign-in invite).
 *
 * Shared by the form (components/visit-request-form.tsx) and the route
 * (app/api/visit-request/route.ts) so both check the same rules.
 */
import { APPOINTMENT_HOURS } from "@/lib/appointment-hours";
import { isCoveredPostcode } from "@/lib/home-visit-area";
import { normalisePostcode } from "@/lib/home-visit";
import { UK_PHONE_RE, validateName } from "@/lib/validation";

export const VISIT_REQUEST_PATH = "/request-visit";

/** /request-visit with the topic carried over, so the form's note starts with it. */
export function visitRequestHrefAbout(about?: string): string {
  return about ? `${VISIT_REQUEST_PATH}?about=${encodeURIComponent(about)}` : VISIT_REQUEST_PATH;
}

/** When the visit could happen; matches the practice's appointment hours. */
export const VISIT_TIME_OPTIONS = [
  { id: "weekday-evening", label: `Weekday evening (${APPOINTMENT_HOURS.weekdays.short.replace(/^Mon–Fri:\s*/, "")})` },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" },
] as const;

export type VisitTimeId = (typeof VISIT_TIME_OPTIONS)[number]["id"];

export const VISIT_NOTE_MAX = 500;

export type VisitRequest = {
  name: string;
  phone: string;
  postcode: string;
  covered: boolean;
  times: VisitTimeId[];
  note: string;
};

// Full UK postcode, e.g. "G72 8FE", "PA1 1AA", "EH54 6XX".
const UK_POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/;

export function timeLabels(times: readonly string[]): string[] {
  return VISIT_TIME_OPTIONS.filter((o) => times.includes(o.id)).map((o) => o.label);
}

/** Checks one field at a time so the form can show the message beside it. */
export function visitRequestErrors(input: { name: string; phone: string; postcode: string; note?: string }) {
  const errors: Partial<Record<"name" | "phone" | "postcode" | "note", string>> = {};
  const nameError = validateName(input.name.trim());
  if (nameError) errors.name = nameError;
  const phone = input.phone.trim();
  if (!phone) errors.phone = "Add a phone number so we can call you back.";
  else if (phone.length > 20 || !UK_PHONE_RE.test(phone)) errors.phone = "Enter a UK phone number, e.g. 07123 456789.";
  const postcode = normalisePostcode(input.postcode.trim());
  if (!postcode) errors.postcode = "Add your postcode so we know where to visit.";
  else if (!UK_POSTCODE_RE.test(postcode)) errors.postcode = "Enter a full UK postcode, e.g. G72 8FE.";
  if ((input.note ?? "").length > VISIT_NOTE_MAX) errors.note = `Keep this under ${VISIT_NOTE_MAX} characters.`;
  return errors;
}

/**
 * Which fields stopped the form, for tracking: "name:missing,phone:invalid".
 * Field names and the kind of problem only, never what the visitor typed.
 */
export function visitRequestErrorFields(
  input: { name: string; phone: string; postcode: string; note?: string },
  errors: ReturnType<typeof visitRequestErrors>,
): string {
  return (["name", "phone", "postcode", "note"] as const)
    .filter((field) => errors[field])
    .map((field) => `${field}:${(input[field] ?? "").trim() ? "invalid" : "missing"}`)
    .join(",");
}

/** Validates and normalises a request body. Returns the first problem as `error`. */
export function parseVisitRequest(body: Record<string, unknown>): { value: VisitRequest } | { error: string } {
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const postcodeRaw = typeof body.postcode === "string" ? body.postcode : "";
  const note = typeof body.note === "string" ? body.note.trim() : "";
  const errors = visitRequestErrors({ name, phone, postcode: postcodeRaw, note });
  const first = errors.name || errors.phone || errors.postcode || errors.note;
  if (first) return { error: first };

  const allowed = new Set<string>(VISIT_TIME_OPTIONS.map((o) => o.id));
  const times = Array.isArray(body.times)
    ? [...new Set(body.times.filter((t): t is VisitTimeId => typeof t === "string" && allowed.has(t)))]
    : [];
  const postcode = normalisePostcode(postcodeRaw.trim());
  return { value: { name, phone, postcode, covered: isCoveredPostcode(postcode), times, note } };
}
