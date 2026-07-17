export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const UK_PHONE_RE = /^(?:\+44\s?|0)(?:\d\s?){9,10}$/;

export const LIMITS = {
  name: 80,
  email: 254,
  phone: 20,
  note: 500,
  clinicalNote: 2000,
  message: 2000,
  sessionId: 200,
  service: 200,
  password: 128,
} as const;

const EMAIL_MSG = "Enter a valid email address.";

export function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v || v.length > LIMITS.email || !EMAIL_RE.test(v)) return EMAIL_MSG;
  return null;
}

export function validateName(value: string, min = 2): string | null {
  const v = value.trim();
  if (v.length < min) return "Enter your full name.";
  if (v.length > LIMITS.name) return `Name must be ${LIMITS.name} characters or fewer.`;
  return null;
}

export function validateUKPhone(value: string): string | null {
  const v = value.trim();
  if (!v) return null; // optional
  if (v.length > LIMITS.phone || !UK_PHONE_RE.test(v)) {
    return "Enter a valid UK phone number, or leave this blank.";
  }
  return null;
}

export function validateRequiredText(
  value: string,
  opts: { min?: number; max: number; message: string },
): string | null {
  const v = value.trim();
  if (v.length < (opts.min ?? 1)) return opts.message;
  if (v.length > opts.max) return `Keep this to ${opts.max} characters or fewer.`;
  return null;
}

export function validateOptionalText(value: string, max: number): string | null {
  if (value.trim().length > max) return `Keep this to ${max} characters or fewer.`;
  return null;
}

export function validateDob(iso: string): string | null {
  if (!iso) return "Enter a date of birth in the past.";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Enter a valid date of birth.";
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  if (d.getTime() > endOfToday.getTime()) return "Enter a date of birth in the past.";
  if (d.getFullYear() < 1900) return "Enter a date of birth after 1900.";
  return null;
}

export function validateIntInRange(value: string | number, min: number, max: number): string | null {
  const n = typeof value === "number" ? value : Number(value.trim());
  if (!Number.isInteger(n) || n < min || n > max) {
    return `Enter a whole number between ${min} and ${max}.`;
  }
  return null;
}
