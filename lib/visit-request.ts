/**
 * "Request a home visit": the short form for people who'd rather be phoned
 * than book and pay online. They leave a name, phone number and postcode;
 * the practice calls back, agrees a time, then adds them in admin (Add
 * patient → package → payment link → sign-in invite).
 *
 * Shared by the form (components/visit-request-form.tsx) and the route
 * (app/api/visit-request/route.ts) so both check the same rules.
 */
import { isCoveredPostcode } from "@/lib/home-visit-area";
import { normalisePostcode } from "@/lib/home-visit";
import { UK_PHONE_RE, validateDob, validateName } from "@/lib/validation";

export const VISIT_REQUEST_PATH = "/request-visit";

/** /request-visit with the topic carried over, so the form's note starts with it. */
export function visitRequestHrefAbout(about?: string): string {
  return about ? `${VISIT_REQUEST_PATH}?about=${encodeURIComponent(about)}` : VISIT_REQUEST_PATH;
}

/** When the visit could happen; matches the practice's appointment hours. */
export const VISIT_TIME_OPTIONS = [
  // Ids are stored on enquiries, so keep existing ones; "weekday-day" was
  // added when the hours became 9am-9pm every day (2026-11-23).
  { id: "weekday-day", label: "Weekday daytime (9am–5pm)" },
  { id: "weekday-evening", label: "Weekday evening (5pm–9pm)" },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" },
] as const;

export type VisitTimeId = (typeof VISIT_TIME_OPTIONS)[number]["id"];

export const VISIT_NOTE_MAX = 500;

/** Step 1 tiles. Ids are stored on enquiries. */
export const VISIT_CONCERNS = [
  { id: "back-neck", label: "Back / neck pain" },
  { id: "post-surgery", label: "Post-surgery rehab" },
  { id: "neuro", label: "Stroke / neurological" },
  { id: "falls", label: "Falls / mobility" },
  { id: "sports", label: "Sports injury" },
  { id: "joint", label: "Joint / arthritis pain" },
  { id: "older", label: "Elderly care" },
  { id: "other", label: "Other" },
] as const;

export const URGENCY_OPTIONS = [
  { id: "asap", label: "As soon as possible", hint: "Within 1-2 days" },
  { id: "week", label: "This week", hint: "Within a few days" },
  { id: "flexible", label: "I'm flexible", hint: "Any time that suits" },
] as const;

export const DAY_PARTS = [
  { id: "morning", label: "Morning", hint: "9am–12pm" },
  { id: "afternoon", label: "Afternoon", hint: "12–5pm" },
  { id: "evening", label: "Evening", hint: "5–9pm" },
] as const;

export const GENDERS = [
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
  { id: "not-said", label: "Prefer not to say" },
] as const;

type Option = { id: string; label: string };
export function optionLabel(options: readonly Option[], id: unknown): string {
  return options.find((o) => o.id === id)?.label ?? "";
}

export type RequestVisitType = "home" | "video";

/** "2026-11-27" -> "Fri 27 Nov"; "" for anything that is not a real date. */
export function dateLabel(day: string): string {
  const date = new Date(`${day}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== day) return "";
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(date);
}

export type VisitRequest = {
  /** The short "quick query" form: name, phone and email only. */
  quick: boolean;
  visitType: RequestVisitType;
  concern: string;
  urgency: string;
  preferredDate: string;
  preferredTime: string;
  name: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  emergencyName: string;
  emergencyPhone: string;
  postcode: string;
  town: string;
  address: string;
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
type RequestInput = {
  name: string;
  phone: string;
  email: string;
  postcode?: string;
  town?: string;
  gender?: string;
  dateOfBirth?: string;
  preferredDate?: string;
  preferredTime?: string;
  emergencyPhone?: string;
  note?: string;
  visitType?: RequestVisitType;
  quick?: boolean;
};

export const REQUEST_FIELDS = [
  "postcode", "town", "preferredDate", "preferredTime",
  "name", "gender", "dateOfBirth", "phone", "email", "emergencyPhone", "note",
] as const;
export type RequestField = (typeof REQUEST_FIELDS)[number];

/** Checks one field at a time so the form can show the message beside it. */
export function visitRequestErrors(input: RequestInput) {
  const errors: Partial<Record<RequestField, string>> = {};
  const nameError = validateName(input.name.trim());
  if (nameError) errors.name = nameError;
  const phone = input.phone.trim();
  if (!phone) errors.phone = "Add a phone number so we can call you back.";
  else if (phone.length > 20 || !UK_PHONE_RE.test(phone)) errors.phone = "Enter a UK phone number, e.g. 07123 456789.";
  const email = input.email.trim();
  if (!email) errors.email = "Add your email address.";
  else if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  if ((input.note ?? "").length > VISIT_NOTE_MAX) errors.note = `Keep this under ${VISIT_NOTE_MAX} characters.`;
  if (input.quick) return errors;

  // A video appointment needs no address.
  if (input.visitType !== "video") {
    const postcode = normalisePostcode((input.postcode ?? "").trim());
    if (!postcode) errors.postcode = "Add your postcode so we know where to visit.";
    else if (!UK_POSTCODE_RE.test(postcode)) errors.postcode = "Enter a full UK postcode, e.g. G72 8FE.";
    if (!(input.town ?? "").trim()) errors.town = "Add your town or city.";
  }
  if (!dateLabel(input.preferredDate ?? "")) errors.preferredDate = "Choose a date.";
  if (!optionLabel(DAY_PARTS, input.preferredTime)) errors.preferredTime = "Choose morning, afternoon or evening.";
  if (!optionLabel(GENDERS, input.gender)) errors.gender = "Choose one option.";
  const dobError = validateDob(input.dateOfBirth ?? "");
  if (dobError) errors.dateOfBirth = dobError;
  const emergency = (input.emergencyPhone ?? "").trim();
  if (emergency && (emergency.length > 20 || !/^\+?[\d\s()-]{7,}$/.test(emergency)))
    errors.emergencyPhone = "Enter a phone number, or leave this empty.";
  return errors;
}

/**
 * Which fields stopped the form, for tracking: "name:missing,phone:invalid".
 * Field names and the kind of problem only, never what the visitor typed.
 */
export function visitRequestErrorFields(
  input: RequestInput,
  errors: Partial<Record<RequestField, string>>,
): string {
  return REQUEST_FIELDS.filter((field) => errors[field])
    .map((field) => `${field}:${String(input[field] ?? "").trim() ? "invalid" : "missing"}`)
    .join(",");
}

/** Validates and normalises a request body. Returns the first problem as `error`. */
export function parseVisitRequest(body: Record<string, unknown>): { value: VisitRequest } | { error: string } {
  const text = (key: string, max = 120) => {
    const v = body[key];
    return typeof v === "string" ? v.trim().slice(0, max) : "";
  };
  const quick = body.quick === true;
  const visitType: RequestVisitType = body.visitType === "video" ? "video" : "home";
  const input = {
    quick,
    visitType,
    name: text("name", 80),
    phone: text("phone", 40),
    email: text("email", 200),
    postcode: text("postcode", 12),
    town: text("town", 60),
    gender: text("gender"),
    dateOfBirth: text("dateOfBirth"),
    preferredDate: text("preferredDate"),
    preferredTime: text("preferredTime"),
    emergencyPhone: text("emergencyPhone", 40),
    note: typeof body.note === "string" ? body.note.trim() : "",
  };
  const errors = visitRequestErrors(input);
  const first = REQUEST_FIELDS.map((f) => errors[f]).find(Boolean);
  if (first) return { error: first };
  if (body.consent !== true) return { error: "Please tick the boxes to agree before sending." };

  const pick = (options: readonly Option[], key: string) => (optionLabel(options, body[key]) ? String(body[key]) : "");
  const allowed = new Set<string>(VISIT_TIME_OPTIONS.map((o) => o.id));
  const times = Array.isArray(body.times)
    ? [...new Set(body.times.filter((t): t is VisitTimeId => typeof t === "string" && allowed.has(t)))]
    : [];
  const home = visitType === "home" && !quick;
  const postcode = home ? normalisePostcode(input.postcode) : "";
  return {
    value: {
      ...input,
      concern: pick(VISIT_CONCERNS, "concern"),
      urgency: pick(URGENCY_OPTIONS, "urgency"),
      emergencyName: text("emergencyName", 80),
      postcode,
      town: home ? input.town : "",
      address: home ? text("address") : "",
      covered: home ? isCoveredPostcode(postcode) : true,
      times,
    },
  };
}

/** sessionStorage key: the homepage postcode check hands the postcode to the form. */
export const REQUEST_POSTCODE_KEY = "poc-request-postcode";
