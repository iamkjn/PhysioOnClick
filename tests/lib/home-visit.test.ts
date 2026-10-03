import { describe, expect, it } from "vitest";

import {
  HOME_ADDRESS_MAX,
  HOME_POSTCODE_MAX,
  HOME_VISIT_HINT,
  VISIT_TYPE_LABELS,
  isVisitType,
  normalisePostcode,
  validateHomeVisit,
} from "@/lib/home-visit";

describe("home-visit helpers", () => {
  it("exposes the agreed labels, hint and caps", () => {
    expect(VISIT_TYPE_LABELS.video).toBe("Video call (anywhere in the UK)");
    expect(VISIT_TYPE_LABELS.home).toBe("Home visit (Glasgow area)");
    expect(HOME_VISIT_HINT).toBe(
      "Home visits cover the Glasgow area. We'll confirm by email if your address is outside it.",
    );
    expect(HOME_ADDRESS_MAX).toBe(120);
    expect(HOME_POSTCODE_MAX).toBe(10);
  });

  it("recognises only video and home as visit types", () => {
    expect(isVisitType("video")).toBe(true);
    expect(isVisitType("home")).toBe(true);
    expect(isVisitType("clinic")).toBe(false);
    expect(isVisitType(undefined)).toBe(false);
  });

  it("normalises a postcode to upper case with one space before the inward code", () => {
    expect(normalisePostcode(" g31  4hs ")).toBe("G31 4HS");
    expect(normalisePostcode("g24hs")).toBe("G2 4HS");
  });

  it("accepts a trimmed address and a UK-shaped postcode", () => {
    const result = validateHomeVisit("  7 Example Street,   Flat 2 ", "g31 4hs");
    expect(result).toEqual({
      ok: true,
      addressLine: "7 Example Street, Flat 2",
      postcode: "G31 4HS",
      homeVisitAddress: "7 Example Street, Flat 2, G31 4HS",
    });
  });

  it("rejects a missing or over-long address", () => {
    expect(validateHomeVisit("", "G31 4HS")).toMatchObject({ ok: false });
    expect(validateHomeVisit("   ", "G31 4HS")).toMatchObject({ ok: false });
    expect(validateHomeVisit(undefined, "G31 4HS")).toMatchObject({ ok: false });
    expect(validateHomeVisit("x".repeat(121), "G31 4HS")).toMatchObject({ ok: false });
    expect(validateHomeVisit("x".repeat(120), "G31 4HS")).toMatchObject({ ok: true });
  });

  it("rejects a missing, over-long or non-UK-shaped postcode", () => {
    expect(validateHomeVisit("7 Example Street", "")).toMatchObject({ ok: false });
    expect(validateHomeVisit("7 Example Street", "12345")).toMatchObject({ ok: false });
    expect(validateHomeVisit("7 Example Street", "G31 4HS 12345")).toMatchObject({ ok: false });
    expect(validateHomeVisit("7 Example Street", 1234)).toMatchObject({ ok: false });
  });
});
