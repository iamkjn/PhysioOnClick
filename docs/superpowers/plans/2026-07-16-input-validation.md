# Input Validation & Feedback (Web + Mobile) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every data-entry input on web and mobile validates before submit and always shows the user a clear message (inline per-field + submit-level toast/snackbar) when input isn't fulfilled.

**Architecture:** Two shared validator modules (`lib/validation.ts`, `mobile_app/lib/src/core/validators.dart`) are the single source of rules and copy. Web forms keep their inline `.field-error` pattern and add `useToast()` on submit. Mobile forms use `TextFormField` validators inline plus a new `showAppSnackBar` helper for submit outcomes. Client-side only in this slice; server-side enforcement is a flagged follow-up.

**Tech Stack:** Next.js 15 / React 19 / TypeScript, Vitest (jsdom, `@/` alias). Flutter (Dart ^3.8.1), `flutter_test`.

**Spec:** `docs/superpowers/specs/2026-07-16-input-validation-design.md`

## Global Constraints

- **Email regex (both platforms):** `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **UK phone regex (web):** `/^(?:\+44\s?|0)(?:\d\s?){9,10}$/`
- **Length caps:** name 80, email 254, phone 20, patient note 500, clinical note 2000, enquiry message 2000, sessionId 200, password 128.
- **Passwords are NEVER trimmed** — validate and submit the raw value. Sign-in = presence + Firebase floor; sign-up min stays web **8** / mobile **6**.
- **DOB:** must parse, not in the future, year ≥ 1900.
- **File upload:** allowed ext = pdf/png/jpg/jpeg/doc/docx; MIME must match; size ≤ 10 MB; `file.name` sanitised before the Storage path.
- **Copy tone:** calm, plain UK English, sentence case, ends with a full stop (e.g. "Enter a valid email address.").
- **Feedback:** inline per-field error under the field + one submit-level toast (web) / snackbar (mobile). Reuse existing inline regions (`.field-error`, `.form-note`, `.auth-status`, `.book-error`) where present — do not add parallel channels.
- Filter/selector inputs are out of scope. Do not touch: admin-chat-logs, admin-patient-selector, blog-directory, booking-flow, person-switcher, search-experience, assigned-exercises, mobile admin_patient_list_screen, mobile patient_dashboard.

---

## Phase A — Shared validators (the spine)

### Task 1: Web validator module `lib/validation.ts`

**Files:**
- Create: `lib/validation.ts`
- Test: `tests/lib/validation.test.ts`

**Interfaces:**
- Produces: `EMAIL_RE`, `UK_PHONE_RE`, `LIMITS`, and `validateEmail(value: string): string | null`, `validateName(value: string, min?: number): string | null`, `validateUKPhone(value: string): string | null`, `validateRequiredText(value: string, opts: { min?: number; max: number; message: string }): string | null`, `validateOptionalText(value: string, max: number): string | null`, `validateDob(iso: string): string | null`, `validateIntInRange(value: string | number, min: number, max: number): string | null`. Every function returns `null` when valid, else the exact user-facing error string.

- [ ] **Step 1: Write the failing test**

Create `tests/lib/validation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  validateEmail, validateName, validateUKPhone, validateRequiredText,
  validateOptionalText, validateDob, validateIntInRange, LIMITS,
} from "@/lib/validation";

describe("validateEmail", () => {
  it("accepts a normal address", () => expect(validateEmail("a@b.co")).toBeNull());
  it("trims first", () => expect(validateEmail("  a@b.co  ")).toBeNull());
  it("rejects empty", () => expect(validateEmail("")).toBe("Enter a valid email address."));
  it.each(["a@.", "@b.c", "a@b.", "a b@c.d", "nodot@com"])("rejects %s", (v) =>
    expect(validateEmail(v)).toBe("Enter a valid email address."));
  it("rejects over 254 chars", () =>
    expect(validateEmail("a".repeat(250) + "@b.co")).toBe("Enter a valid email address."));
});

describe("validateName", () => {
  it("accepts 2+ chars", () => expect(validateName("Jo")).toBeNull());
  it("rejects whitespace-only", () => expect(validateName("   ")).toBe("Enter your full name."));
  it("rejects 1 char", () => expect(validateName("J")).toBe("Enter your full name."));
  it("rejects over cap", () =>
    expect(validateName("x".repeat(LIMITS.name + 1))).toBe(`Name must be ${LIMITS.name} characters or fewer.`));
});

describe("validateUKPhone", () => {
  it("blank is allowed (optional)", () => expect(validateUKPhone("")).toBeNull());
  it("accepts 07…", () => expect(validateUKPhone("07123456789")).toBeNull());
  it("accepts +44…", () => expect(validateUKPhone("+44 7123 456789")).toBeNull());
  it("rejects letters", () => expect(validateUKPhone("phone")).toBe("Enter a valid UK phone number, or leave this blank."));
  it("rejects spaces-only body", () => expect(validateUKPhone("0          ")).toBe("Enter a valid UK phone number, or leave this blank."));
});

describe("validateRequiredText", () => {
  const opts = { min: 20, max: 2000, message: "Add more detail." };
  it("accepts within range", () => expect(validateRequiredText("x".repeat(25), opts)).toBeNull());
  it("rejects under min", () => expect(validateRequiredText("short", opts)).toBe("Add more detail."));
  it("rejects whitespace padding to fake length", () => expect(validateRequiredText("  a  ", opts)).toBe("Add more detail."));
  it("rejects over max", () => expect(validateRequiredText("x".repeat(2001), opts)).toBe("Keep this to 2000 characters or fewer."));
});

describe("validateOptionalText", () => {
  it("blank ok", () => expect(validateOptionalText("", 500)).toBeNull());
  it("rejects over cap", () => expect(validateOptionalText("x".repeat(501), 500)).toBe("Keep this to 500 characters or fewer."));
});

describe("validateDob", () => {
  it("accepts a past date", () => expect(validateDob("1990-01-01")).toBeNull());
  it("rejects empty", () => expect(validateDob("")).toBe("Enter a date of birth in the past."));
  it("rejects the future", () => expect(validateDob("3000-01-01")).toBe("Enter a date of birth in the past."));
  it("rejects pre-1900", () => expect(validateDob("1800-01-01")).toBe("Enter a date of birth after 1900."));
});

describe("validateIntInRange", () => {
  it("accepts in range", () => expect(validateIntInRange(50, 0, 100)).toBeNull());
  it("rejects junk string", () => expect(validateIntInRange("abc", 0, 100)).toBe("Enter a whole number between 0 and 100."));
  it("rejects decimals", () => expect(validateIntInRange("50.5", 0, 100)).toBe("Enter a whole number between 0 and 100."));
  it("rejects out of range", () => expect(validateIntInRange(101, 0, 100)).toBe("Enter a whole number between 0 and 100."));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/validation.test.ts`
Expected: FAIL — cannot resolve `@/lib/validation`.

- [ ] **Step 3: Write the implementation**

Create `lib/validation.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/validation.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add lib/validation.ts tests/lib/validation.test.ts
git commit -m "feat(validation): add shared web validators with tests"
```

---

### Task 2: Mobile validator module `validators.dart`

**Files:**
- Create: `mobile_app/lib/src/core/validators.dart`
- Test: `mobile_app/test/validators_test.dart`

**Interfaces:**
- Produces: `Validators.email(String?)`, `Validators.password(String?, {int min})`, `Validators.name(String?, {int min, int max})`, `Validators.notes(String?, {int max})`, `Validators.dob(DateTime?)` — each `String?` (error) or `null`. Constants: `Validators.emailMax`, `nameMax`, `notesMax`, `passwordMax`. Signatures are `TextFormField.validator`-compatible.

- [ ] **Step 1: Write the failing test**

Create `mobile_app/test/validators_test.dart`:

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/src/core/validators.dart';

void main() {
  group('email', () {
    test('accepts normal', () => expect(Validators.email('a@b.co'), isNull));
    test('trims', () => expect(Validators.email('  a@b.co '), isNull));
    test('rejects empty', () => expect(Validators.email(''), 'Enter a valid email address.'));
    for (final v in ['a@.', '@b.c', 'a@b.', 'nodot@com']) {
      test('rejects $v', () => expect(Validators.email(v), 'Enter a valid email address.'));
    }
  });

  group('password', () {
    test('accepts 6+', () => expect(Validators.password('secret1'), isNull));
    test('does NOT trim (spaces preserved)', () => expect(Validators.password('  abc  '), isNull));
    test('rejects empty', () => expect(Validators.password(''), 'Enter your password.'));
    test('rejects short', () => expect(Validators.password('abc'), 'Use at least 6 characters.'));
  });

  group('name', () {
    test('accepts 2+', () => expect(Validators.name('Jo'), isNull));
    test('rejects whitespace-only', () => expect(Validators.name('  '), 'Enter your full name.'));
    test('rejects over cap', () => expect(Validators.name('x' * 81), 'Name must be 80 characters or fewer.'));
  });

  group('notes', () {
    test('blank ok', () => expect(Validators.notes(''), isNull));
    test('rejects over cap', () => expect(Validators.notes('x' * 501), 'Keep notes under 500 characters.'));
  });

  group('dob', () {
    test('accepts past', () => expect(Validators.dob(DateTime(1990)), isNull));
    test('rejects null', () => expect(Validators.dob(null), 'Select a date of birth.'));
    test('rejects future', () => expect(Validators.dob(DateTime(3000)), 'Enter a date of birth in the past.'));
    test('rejects pre-1900', () => expect(Validators.dob(DateTime(1800)), 'Enter a date of birth after 1900.'));
  });
}
```

Note: the import path uses the package name from `mobile_app/pubspec.yaml`. Confirm it is `mobile_app`; if the `name:` field differs, use that.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd mobile_app && flutter test test/validators_test.dart`
Expected: FAIL — `validators.dart` not found.

- [ ] **Step 3: Write the implementation**

Create `mobile_app/lib/src/core/validators.dart`:

```dart
/// Shared input validators for all data-entry forms.
/// Every method returns an error string, or null when valid.
class Validators {
  Validators._();

  static final RegExp _emailRe = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

  static const int emailMax = 254;
  static const int nameMax = 80;
  static const int notesMax = 500;
  static const int passwordMax = 128;

  static String? email(String? value) {
    final v = (value ?? '').trim();
    if (v.isEmpty || v.length > emailMax || !_emailRe.hasMatch(v)) {
      return 'Enter a valid email address.';
    }
    return null;
  }

  /// Passwords are never trimmed — validate the raw value.
  static String? password(String? value, {int min = 6}) {
    final v = value ?? '';
    if (v.isEmpty) return 'Enter your password.';
    if (v.length < min) return 'Use at least $min characters.';
    if (v.length > passwordMax) return 'Password must be $passwordMax characters or fewer.';
    return null;
  }

  static String? name(String? value, {int min = 2, int max = nameMax}) {
    final v = (value ?? '').trim();
    if (v.length < min) return 'Enter your full name.';
    if (v.length > max) return 'Name must be $max characters or fewer.';
    return null;
  }

  static String? notes(String? value, {int max = notesMax}) {
    if ((value ?? '').trim().length > max) return 'Keep notes under $max characters.';
    return null;
  }

  static String? dob(DateTime? d) {
    if (d == null) return 'Select a date of birth.';
    if (d.isAfter(DateTime.now())) return 'Enter a date of birth in the past.';
    if (d.year < 1900) return 'Enter a date of birth after 1900.';
    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd mobile_app && flutter test test/validators_test.dart`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add mobile_app/lib/src/core/validators.dart mobile_app/test/validators_test.dart
git commit -m "feat(validation): add shared mobile validators with tests"
```

---

### Task 3: Mobile snackbar helper `app_snack_bar.dart`

**Files:**
- Create: `mobile_app/lib/src/core/app_snack_bar.dart`

**Interfaces:**
- Produces: `void showAppSnackBar(BuildContext context, String message, {bool isError = false})`.

- [ ] **Step 1: Write the implementation**

Create `mobile_app/lib/src/core/app_snack_bar.dart`:

```dart
import 'package:flutter/material.dart';

/// Submit-level feedback for forms. Field errors stay inline via validators.
void showAppSnackBar(BuildContext context, String message, {bool isError = false}) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
        backgroundColor: isError ? const Color(0xFFDC2626) : const Color(0xFF0F2D3A),
      ),
    );
}
```

- [ ] **Step 2: Verify it analyzes clean**

Run: `cd mobile_app && flutter analyze lib/src/core/app_snack_bar.dart`
Expected: `No issues found!`

- [ ] **Step 3: Commit**

```bash
git add mobile_app/lib/src/core/app_snack_bar.dart
git commit -m "feat(mobile): add showAppSnackBar submit-feedback helper"
```

---

## Phase B — Web forms

**Web-form wiring pattern (applies to every task in this phase):**
1. `import { ... } from "@/lib/validation";`
2. Hold a `const [errors, setErrors] = useState<Record<string,string>>({})` (or reuse an existing errors object).
3. In the submit handler, build `nextErrors` from the validators, `setErrors(nextErrors)`, and if `Object.keys(nextErrors).length` bail before the network call.
4. Render each error under its field: `{errors.foo && <span className="field-error" id="err-foo">{errors.foo}</span>}` and set `aria-invalid` / `aria-describedby` on the input (copy the exact pattern in `components/contact-form.tsx`).
5. Fire the submit toast: on invalid → `toast.show(<errorMsg>, "error")`; on success → `toast.show(<successMsg>, "success")`. Reuse an existing inline status region where the file already has one instead of adding a toast if that is the established pattern for that file (noted per task).

**Per-task check:** `npm run lint` must pass. Browser verification is batched at the end of the phase (Task 16).

---

### Task 4: `contact-form.tsx` — migrate to shared validators + add caps

**Files:**
- Modify: `components/contact-form.tsx`

**Interfaces:**
- Consumes: `validateEmail`, `validateName`, `validateUKPhone`, `validateRequiredText`, `LIMITS` (Task 1).

- [ ] **Step 1: Replace the local regexes and checks**

Delete the local `emailPattern` / `phonePattern` consts. Import: `import { validateEmail, validateName, validateUKPhone, validateRequiredText, LIMITS } from "@/lib/validation";`

Replace the `nextErrors` block with:

```ts
const nextErrors: Record<string, string> = {};
const nameErr = validateName(payload.name);
if (nameErr) nextErrors.name = nameErr;
const emailErr = validateEmail(payload.email);
if (emailErr) nextErrors.email = emailErr;
const phoneErr = validateUKPhone(payload.phone);
if (phoneErr) nextErrors.phone = phoneErr;
if (!payload.service) nextErrors.service = "Choose the service you want to enquire about.";
const messageErr = validateRequiredText(payload.message, {
  min: 20, max: LIMITS.message,
  message: "Add a little more detail so the enquiry can be triaged properly.",
});
if (messageErr) nextErrors.message = messageErr;
if (!consent) nextErrors.consent = "Please confirm you have read the Privacy Policy before sending.";
```

- [ ] **Step 2: Add `maxLength` to inputs**

Add `maxLength={LIMITS.name}` to the name input, `maxLength={LIMITS.email}` to the email input, `maxLength={LIMITS.phone}` to the phone input, `maxLength={LIMITS.message}` to the message textarea. (This form already renders `.field-error` and the `.form-note` status — keep them; no toast needed here, the inline `form-note` is its established pattern.)

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add components/contact-form.tsx
git commit -m "refactor(contact-form): use shared validators and add length caps"
```

---

### Task 5: `patient-profile-editor.tsx` — per-field errors + phone fix

**Files:**
- Modify: `components/patient-profile-editor.tsx`

**Interfaces:**
- Consumes: `validateName`, `validateUKPhone`, `LIMITS`.

- [ ] **Step 1: Replace string-matched status with per-field error state**

Import validators. Add `const [errors, setErrors] = useState<Record<string,string>>({})`. In the save handler, before saving:

```ts
const nextErrors: Record<string, string> = {};
const nameErr = validateName(fullName);
if (nameErr) nextErrors.name = nameErr;
const phoneErr = validateUKPhone(phone);
if (phoneErr) nextErrors.phone = phoneErr;
setErrors(nextErrors);
if (Object.keys(nextErrors).length) {
  toast.show("Check the highlighted fields and try again.", "error");
  return;
}
```

Replace the brittle `isNameError` / `isPhoneError` (`status.includes(...)`) logic: render `{errors.name && <span className="field-error">{errors.name}</span>}` under name and the same for phone. On successful save, `toast.show("Profile updated successfully.", "success")`. If the file does not already consume `useToast`, add `const toast = useToast();` and `import { useToast } from "@/components/toast-provider";`.

- [ ] **Step 2: Add caps**

Add `maxLength={LIMITS.name}` to the name input and `maxLength={LIMITS.phone}` to the phone input.

- [ ] **Step 3: Lint + commit**

Run: `npm run lint` (expect clean), then:

```bash
git add components/patient-profile-editor.tsx
git commit -m "fix(profile-editor): per-field validation, UK phone fix, length caps, toast"
```

---

### Task 6: `auth-panel.tsx` — trim consistency + shared validators

**Files:**
- Modify: `components/auth-panel.tsx`

**Interfaces:**
- Consumes: `validateEmail`, `validateName`, `LIMITS`.

- [ ] **Step 1: Trim + validate email in the password path**

In `handleAuth`, read email with `.trim()` (it currently does not — the magic-link path does). Add before the Firebase call:

```ts
const emailErr = validateEmail(email);
if (emailErr) { setStatus(emailErr, "error"); return; }
if (isSignup) {
  const nameErr = validateName(fullName);
  if (nameErr) { setStatus(nameErr, "error"); return; }
}
```

(Reuse the existing `setStatus(message, tone)` / `.auth-status` region — this file's established pattern — instead of a toast.)

- [ ] **Step 2: Add caps**

Add `maxLength={LIMITS.name}` to the full-name input, `maxLength={LIMITS.email}` to both email inputs, `maxLength={LIMITS.password}` to the password input. Keep `minLength={8}` on the signup password.

- [ ] **Step 3: Fix the magic-link silent return**

Where `handleMagicLink` does `if (!email) return;`, replace with:

```ts
const emailErr = validateEmail(email);
if (emailErr) { setStatus(emailErr, "error"); return; }
```

- [ ] **Step 4: Lint + commit**

Run: `npm run lint` (expect clean), then:

```bash
git add components/auth-panel.tsx
git commit -m "fix(auth-panel): trim+validate email everywhere, caps, no silent returns"
```

---

### Task 7: `admin-sign-in.tsx` — email trim/format + password presence

**Files:**
- Modify: `components/admin-sign-in.tsx`

**Interfaces:**
- Consumes: `validateEmail`, `LIMITS`.

- [ ] **Step 1: Gate before the Firebase call**

Import `validateEmail`, `LIMITS`. In the submit handler, before `signInWithEmailAndPassword`:

```ts
const emailErr = validateEmail(email);
if (emailErr) { setError(emailErr); return; }
if (!password) { setError("Enter your password."); return; }
```

Pass `email.trim()` to Firebase. (Reuse the existing inline `<p role="alert">` `error` state — do NOT add a toast; keep the generic "Invalid email or password." for auth failures to avoid account enumeration.)

- [ ] **Step 2: Add caps**

Add `maxLength={LIMITS.email}` to the email input and `maxLength={LIMITS.password}` to the password input. Do not add min-length/complexity to this sign-in password.

- [ ] **Step 3: Lint + commit**

Run: `npm run lint` (expect clean), then:

```bash
git add components/admin-sign-in.tsx
git commit -m "fix(admin-sign-in): validate+trim email, password presence, caps"
```

---

### Task 8: `app/auth/verify/page.tsx` — validate both email inputs

**Files:**
- Modify: `app/auth/verify/page.tsx`

**Interfaces:**
- Consumes: `validateEmail`, `LIMITS`.

- [ ] **Step 1: Validate in both handlers**

Import `validateEmail`, `LIMITS`. In `handleEmailSubmit`, replace `if (!emailInput.trim()) return;` with:

```ts
const emailErr = validateEmail(emailInput);
if (emailErr) { setErrorMessage(emailErr); return; }
```

In `requestNewLink`, replace `if (!email) return;` with the same guard (using its local `email` variable and its error setter). Add `maxLength={LIMITS.email}` to both email inputs and `required` to the recovery-email input.

- [ ] **Step 2: Lint + commit**

Run: `npm run lint` (expect clean), then:

```bash
git add app/auth/verify/page.tsx
git commit -m "fix(verify): validate email on both paths, cap length, no silent returns"
```

---

### Task 9: `booking-step-time.tsx` — name/email validation + caps

**Files:**
- Modify: `components/booking-step-time.tsx`

**Interfaces:**
- Consumes: `validateEmail`, `validateName`, `LIMITS`.

- [ ] **Step 1: Validate guests before the booking call**

Import validators. In the submit handler, for the guest paths (where name/email are collected), before the Firebase/`/api/cal/book` call:

```ts
if (authMode !== "signin") {
  const nameErr = validateName(name);
  if (nameErr) { setError(nameErr); return; }
}
const emailErr = validateEmail(email);
if (emailErr) { setError(emailErr); return; }
```

(Reuse the existing `.book-error` `role="alert"` region via `setError`. Keep the consent + slot + password checks as-is.)

- [ ] **Step 2: Add caps**

Add `maxLength={LIMITS.name}` to the name input and `maxLength={LIMITS.email}` to the email input.

- [ ] **Step 3: Lint + commit**

Run: `npm run lint` (expect clean), then:

```bash
git add components/booking-step-time.tsx
git commit -m "fix(booking): validate guest name/email before booking, add caps"
```

---

### Task 10: `app/patient/people/page.tsx` — name/dob/notes on both forms

**Files:**
- Modify: `app/patient/people/page.tsx`

**Interfaces:**
- Consumes: `validateName`, `validateDob`, `validateOptionalText`, `LIMITS`. Uses existing `useToast()`.

- [ ] **Step 1: Add a shared validate for both Add and Edit**

Import validators. Add a helper inside the component:

```ts
function validatePerson(fields: { name: string; dob: string; notes: string }) {
  const e: Record<string, string> = {};
  const nameErr = validateName(fields.name);
  if (nameErr) e.name = "Enter the person's full name.";
  const dobErr = validateDob(fields.dob);
  if (dobErr) e.dob = dobErr;
  const notesErr = validateOptionalText(fields.notes, LIMITS.note);
  if (notesErr) e.notes = notesErr;
  return e;
}
```

- [ ] **Step 2: Wire into Add and Edit submit**

In both the Add handler (FormData path) and Edit handler (`editForm` state), before saving:

```ts
const e = validatePerson({ name, dob, notes });
setErrors(e); // add a per-form errors state object
if (Object.keys(e).length) { toast.show("Please fix the highlighted fields.", "error"); return; }
```

Render `{errors.name && <span className="field-error">{errors.name}</span>}` under name/dob/notes on both forms. Add `maxLength={LIMITS.note}` to both notes inputs. Keep the existing success toasts ("Person added." / "Changes saved.").

- [ ] **Step 3: Lint + commit**

Run: `npm run lint` (expect clean), then:

```bash
git add app/patient/people/page.tsx
git commit -m "fix(people): validate name/dob/notes on add+edit, inline errors, error toast"
```

---

### Task 11: `pain-check-in.tsx` — note cap

**Files:**
- Modify: `components/pain-check-in.tsx`

**Interfaces:**
- Consumes: `validateOptionalText`, `LIMITS`. Uses existing `useToast()`.

- [ ] **Step 1: Validate the note before save**

Import validators. Before `logPainScore(...)`:

```ts
const noteErr = validateOptionalText(note, LIMITS.note);
if (noteErr) { setError(noteErr); toast.show("Please shorten your note before saving.", "error"); return; }
```

Add `maxLength={LIMITS.note}` to the note input. Keep the existing success toast ("Pain score logged.").

- [ ] **Step 2: Lint + commit**

Run: `npm run lint` (expect clean), then:

```bash
git add components/pain-check-in.tsx
git commit -m "fix(pain-check-in): cap note length with inline + toast feedback"
```

---

### Task 12: `admin-clinical-entry.tsx` — date guard, notes/sessionId caps + toast

**Files:**
- Modify: `components/admin-clinical-entry.tsx`

**Interfaces:**
- Consumes: `validateDob`-style date check via a local guard, `validateOptionalText`, `LIMITS`, `useToast`.

- [ ] **Step 1: Validate before save (date becomes the Firestore doc ID)**

Import `validateOptionalText`, `LIMITS`, `useToast`. Add a date guard (today-or-earlier, non-empty) and cap checks:

```ts
const errs: Record<string, string> = {};
if (!date) errs.date = "Enter a session date of today or earlier.";
else if (new Date(date).getTime() > new Date().setHours(23,59,59,999)) errs.date = "Enter a session date of today or earlier.";
const notesErr = validateOptionalText(physioNotes, LIMITS.clinicalNote);
if (notesErr) errs.physioNotes = notesErr;
const sidErr = validateOptionalText(sessionId, LIMITS.sessionId);
if (sidErr) errs.sessionId = "Enter a valid booking ID, or leave this blank.";
setErrors(errs);
if (Object.keys(errs).length) { toast.show("Please fix the highlighted fields before saving.", "error"); return; }
```

Add `max={today}` to the date input, `maxLength={LIMITS.clinicalNote}` to notes, `maxLength={LIMITS.sessionId}` to sessionId. Render inline errors. On success `toast.show("Assessment saved.", "success")`.

- [ ] **Step 2: Lint + commit**

Run: `npm run lint` (expect clean), then:

```bash
git add components/admin-clinical-entry.tsx
git commit -m "fix(admin-clinical-entry): date guard, note/id caps, save toast"
```

---

### Task 13: `summary-form.tsx` — required notes + int range + try/catch + toast

**Files:**
- Modify: `components/summary-form.tsx`

**Interfaces:**
- Consumes: `validateRequiredText`, `validateIntInRange`, `LIMITS`, `useToast`.

- [ ] **Step 1: Validate before publish**

Import validators + `useToast`. In `handlePublish`, before the network call:

```ts
const errs: Record<string, string> = {};
const w = validateRequiredText(form.workedOn, { max: LIMITS.clinicalNote, message: "Enter what you worked on today." });
if (w) errs.workedOn = w;
const ex = validateRequiredText(form.exercises, { max: LIMITS.clinicalNote, message: "Enter the exercises you assigned." });
if (ex) errs.exercises = ex;
const ns = validateRequiredText(form.nextSteps, { max: LIMITS.clinicalNote, message: "Enter the next steps and advice." });
if (ns) errs.nextSteps = ns;
if (form.sessionOutcome == null) errs.sessionOutcome = "Select a session outcome.";
const rp = validateIntInRange(form.recoveryPercent, 0, 100);
if (rp) errs.recoveryPercent = rp;
setErrors(errs);
if (Object.keys(errs).length) { toast.show("Please complete the highlighted fields before publishing.", "error"); return; }
```

Add `maxLength={LIMITS.clinicalNote}` to the three textareas; `step={1}` on recoveryPercent. Render inline errors per field.

- [ ] **Step 2: Add the missing try/catch + success toast**

Wrap the publish body in `try { ... toast.show("Summary published.", "success"); } catch { toast.show("Could not publish. Please try again.", "error"); } finally { setSaving(false); }`. If `useToast` is not imported, add it.

- [ ] **Step 3: Lint + commit**

Run: `npm run lint` (expect clean), then:

```bash
git add components/summary-form.tsx
git commit -m "fix(summary-form): validate fields, add try/catch and publish toasts"
```

---

### Task 14: `upload-panel.tsx` — file type/size/name validation (security)

**Files:**
- Modify: `components/upload-panel.tsx`

**Interfaces:**
- Self-contained (constants defined locally in the file).

- [ ] **Step 1: Validate the file before upload**

Add near the top of the file:

```ts
const ALLOWED_EXT = ["pdf", "png", "jpg", "jpeg", "doc", "docx"];
const ALLOWED_MIME = [
  "application/pdf", "image/png", "image/jpeg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_BYTES = 10 * 1024 * 1024;

function safeName(name: string) {
  const base = name.replace(/[/\\]/g, "").replace(/\.{2,}/g, ".").trim().slice(0, 200);
  return base || "upload";
}
```

In `handleUpload`, after obtaining `file`:

```ts
const ext = (file.name.split(".").pop() || "").toLowerCase();
if (!ALLOWED_EXT.includes(ext) || !ALLOWED_MIME.includes(file.type)) {
  setMessage("Choose a PDF, PNG, JPG or Word document."); setTone("error"); return;
}
if (file.size > MAX_BYTES) {
  setMessage("Choose a file smaller than 10 MB."); setTone("error"); return;
}
```

Use `safeName(file.name)` when building the Storage path (`patient-uploads/${userId}/${Date.now()}-${safeName(file.name)}`).

- [ ] **Step 2: Lint + commit**

Run: `npm run lint` (expect clean), then:

```bash
git add components/upload-panel.tsx
git commit -m "fix(upload-panel): validate file type/size and sanitise filename (path-injection)"
```

---

### Task 15: `admin-enquiries-table.tsx` — surface silent status-write failure

**Files:**
- Modify: `components/admin-enquiries-table.tsx`

**Interfaces:**
- Consumes: `useToast`.

- [ ] **Step 1: Toast on the write-failure catch**

In `updateStatus`, the catch block currently only reverts local state. Add `toast.show("Couldn't update the status. Please try again.", "error");`. Add `const toast = useToast();` + import if absent. (No field validation — this file is otherwise a selector; only the write-failure feedback is in scope.)

- [ ] **Step 2: Lint + commit**

Run: `npm run lint` (expect clean), then:

```bash
git add components/admin-enquiries-table.tsx
git commit -m "fix(admin-enquiries): toast when a status update fails to save"
```

---

### Task 16: Web phase verification (browser drive)

**Files:** none (verification only).

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: build succeeds, no type errors.

- [ ] **Step 2: Drive representative forms**

Start the dev server (preview_start `{name}` from `.claude/launch.json`, or add one for `npm run dev` port 3000). For each of `/contact`, `/book`, `/patient/account`:
- Submit empty → expect inline field errors + an error toast/status.
- Submit invalid email (`a@.`) → expect "Enter a valid email address." inline.
- Submit valid → expect the success toast/status.
Capture a screenshot of the contact form showing inline errors + toast as proof.

- [ ] **Step 3: Commit (if any fixes were needed)**

```bash
git add -A && git commit -m "test(validation): verify web forms in browser"
```

---

## Phase C — Mobile screens

**Mobile-form wiring pattern:**
1. `import '../../core/validators.dart';` and `import '../../core/app_snack_bar.dart';` (adjust relative depth per file).
2. Ensure the fields are inside a `Form` with a `GlobalKey<FormState>`; set each `TextFormField.validator` to the matching `Validators.*`.
3. In the save/submit handler: `if (!_formKey.currentState!.validate()) return;` then wrap the async work in `try { ... showAppSnackBar(context, "<success>"); } catch (_) { showAppSnackBar(context, "<error>", isError: true); } finally { if (mounted) setState(() => _saving = false); }`.
4. Guard `context` use across async gaps with `if (!mounted) return;` before each `showAppSnackBar`.

**Per-task check:** `cd mobile_app && flutter analyze <file>` clean.

---

### Task 17: `auth_sheet.dart` — shared validators, stop trimming password

**Files:**
- Modify: `mobile_app/lib/src/features/auth/auth_sheet.dart`

**Interfaces:**
- Consumes: `Validators`, `showAppSnackBar`.

- [ ] **Step 1: Swap validators**

Import `Validators`. Set the name field validator to `(v) => _isRegister ? Validators.name(v) : null`, email to `Validators.email`, password to `Validators.password`. Reuse the same email check in `_sendPasswordReset` (`final err = Validators.email(_emailController.text); if (err != null) { setState(() => message = err); return; }`).

- [ ] **Step 2: Stop trimming the password (bug)**

Where the password is read for `createUserWithEmailAndPassword` / `signInWithEmailAndPassword`, use `_passwordController.text` (NOT `.trim()`). Email keeps `.trim()`.

- [ ] **Step 3: Analyze + commit**

Run: `cd mobile_app && flutter analyze lib/src/features/auth/auth_sheet.dart` (expect clean), then:

```bash
git add mobile_app/lib/src/features/auth/auth_sheet.dart
git commit -m "fix(mobile-auth): shared validators, stop trimming password, fix reset email check"
```

---

### Task 18: `sign_in_screen.dart` — shared validators + password copy

**Files:**
- Modify: `mobile_app/lib/src/features/auth/sign_in_screen.dart`

**Interfaces:**
- Consumes: `Validators`.

- [ ] **Step 1: Swap validators**

Import `Validators`. Email field validator → `Validators.email`; password field validator → `Validators.password` (gives distinct "Enter your password." on empty vs "Use at least 6 characters." on short). Password stays untrimmed at submit (already correct).

- [ ] **Step 2: Add email cap**

Add `maxLength: 254` to the email `TextFormField` (`buildCounter: (_, {required currentLength, required isFocused, maxLength}) => null` to hide the counter if desired).

- [ ] **Step 3: Analyze + commit**

Run: `cd mobile_app && flutter analyze lib/src/features/auth/sign_in_screen.dart` (expect clean), then:

```bash
git add mobile_app/lib/src/features/auth/sign_in_screen.dart
git commit -m "fix(mobile-sign-in): shared email/password validators, email cap"
```

---

### Task 19: `sign_up_screen.dart` — shared validators + input caps

**Files:**
- Modify: `mobile_app/lib/src/features/auth/sign_up_screen.dart`

**Interfaces:**
- Consumes: `Validators`.

- [ ] **Step 1: Swap validators + confirm-required**

Import `Validators`. Name validator → `Validators.name`; email → `Validators.email`; password → `Validators.password` (min 6); confirm validator → `(v) => (v == null || v.isEmpty) ? 'Confirm your password.' : (v != _passwordCtrl.text ? 'Passwords do not match.' : null)`.

- [ ] **Step 2: Add input-formatter caps**

`import 'package:flutter/services.dart';` and add `inputFormatters: [LengthLimitingTextInputFormatter(80)]` to name, `254` to email, `128` to password and confirm. Password stays untrimmed.

- [ ] **Step 3: Analyze + commit**

Run: `cd mobile_app && flutter analyze lib/src/features/auth/sign_up_screen.dart` (expect clean), then:

```bash
git add mobile_app/lib/src/features/auth/sign_up_screen.dart
git commit -m "fix(mobile-sign-up): shared validators, confirm-required, length caps"
```

---

### Task 20: `forgot_password_screen.dart` — shared email validator + cap

**Files:**
- Modify: `mobile_app/lib/src/features/auth/forgot_password_screen.dart`

**Interfaces:**
- Consumes: `Validators`.

- [ ] **Step 1: Swap the weak email check**

Import `Validators`. Email `TextFormField.validator` → `Validators.email`. Add `maxLength: 254`. The existing inline-error + success-view feedback stays.

- [ ] **Step 2: Analyze + commit**

Run: `cd mobile_app && flutter analyze lib/src/features/auth/forgot_password_screen.dart` (expect clean), then:

```bash
git add mobile_app/lib/src/features/auth/forgot_password_screen.dart
git commit -m "fix(mobile-forgot-password): real email validation, length cap"
```

---

### Task 21: `add_person_sheet.dart` — Form + validators + try/catch snackbar

**Files:**
- Modify: `mobile_app/lib/src/features/people/add_person_sheet.dart`

**Interfaces:**
- Consumes: `Validators`, `showAppSnackBar`.

- [ ] **Step 1: Wrap fields in a Form and validate**

Import `Validators` + `showAppSnackBar`. Add `final _formKey = GlobalKey<FormState>();`. Convert the name `TextField` and notes `TextField` to `TextFormField`; wrap them (and add a hidden validator for DOB) in a `Form(key: _formKey, ...)`. Name validator → `Validators.name`; notes validator → `Validators.notes`. Add `maxLength: 80` to name and `maxLength: 500` to notes.

- [ ] **Step 2: Validate in `_save` and add DOB check**

Replace the silent `if (name.isEmpty || _dob == null) return;` with:

```dart
final dobErr = Validators.dob(_dob);
if (!(_formKey.currentState?.validate() ?? false) || dobErr != null) {
  showAppSnackBar(context, dobErr ?? "Please add a name and date of birth.", isError: true);
  return;
}
```

- [ ] **Step 3: Add the missing try/catch (silent-failure fix)**

Wrap the save body (currently `try { ... } finally { ... }`, no catch) so the catch surfaces feedback:

```dart
try {
  // ...existing add/update + avatar upload...
  if (mounted) { showAppSnackBar(context, "Person saved."); Navigator.pop(context); }
} catch (_) {
  if (mounted) showAppSnackBar(context, "Could not save. Check your connection and try again.", isError: true);
} finally {
  if (mounted) setState(() => _saving = false);
}
```

- [ ] **Step 4: Analyze + commit**

Run: `cd mobile_app && flutter analyze lib/src/features/people/add_person_sheet.dart` (expect clean), then:

```bash
git add mobile_app/lib/src/features/people/add_person_sheet.dart
git commit -m "fix(mobile-people): Form validation, DOB check, error snackbar on save failure"
```

---

### Task 22: `admin_recovery_panel_screen.dart` — notes cap + try/catch snackbar

**Files:**
- Modify: `mobile_app/lib/src/features/admin/recovery/admin_recovery_panel_screen.dart`

**Interfaces:**
- Consumes: `Validators`, `showAppSnackBar`.

- [ ] **Step 1: Cap notes + validate**

Import `Validators` + `showAppSnackBar`. Add `maxLength: 2000` to the notes `TextField` and, in `_saveClinical`, before the write:

```dart
final notesErr = Validators.notes(_notesCtrl.text, max: 2000);
if (notesErr != null) { showAppSnackBar(context, notesErr, isError: true); return; }
```

- [ ] **Step 2: Add try/catch (fix the stuck-spinner bug)**

Wrap the `_saveClinical` async body:

```dart
try {
  await RecoveryService.addClinicalAssessment(/* ...existing args... */);
  if (mounted) { setState(() => _saving = false); showAppSnackBar(context, "Assessment saved."); }
} catch (_) {
  if (mounted) { setState(() => _saving = false); showAppSnackBar(context, "Could not save the assessment. Please try again.", isError: true); }
}
```

Also surface the silent no-op in `_assign` when `currentUser == null` with `showAppSnackBar(context, "Please sign in again.", isError: true);`.

- [ ] **Step 3: Analyze + commit**

Run: `cd mobile_app && flutter analyze lib/src/features/admin/recovery/admin_recovery_panel_screen.dart` (expect clean), then:

```bash
git add mobile_app/lib/src/features/admin/recovery/admin_recovery_panel_screen.dart
git commit -m "fix(mobile-recovery-admin): notes cap, save try/catch, snackbar feedback"
```

---

### Task 23: Mobile phase verification

**Files:** none (verification only).

- [ ] **Step 1: Analyze the whole app**

Run: `cd mobile_app && flutter analyze`
Expected: `No issues found!` (or only pre-existing, unrelated warnings).

- [ ] **Step 2: Run the mobile tests**

Run: `cd mobile_app && flutter test`
Expected: PASS (includes `validators_test.dart`).

- [ ] **Step 3: Commit (if fixes were needed)**

```bash
git add -A && git commit -m "test(mobile): flutter analyze + validator tests pass"
```

---

## Follow-ups (out of scope — do NOT implement here)

- ~~**Server-side enforcement** (the real trust boundary): mirror caps/format/enum in `app/api/enquiry`, `app/api/auth/magic-link`, `app/admin/actions.ts` `publishSummary`, and add length/type/enum rules to `firestore.rules` / `storage.rules`.~~ **Done 2026-07-17** — rules changes need `firebase deploy --only firestore:rules,storage:rules` to go live.
- Confirm-password field on **web** signup (`auth-panel`).
- Same-day clinical-assessment overwrite (doc-ID collision) — add a confirm dialog or merge-aware write.
