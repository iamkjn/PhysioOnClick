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
