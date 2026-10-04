import { describe, expect, it } from "vitest";
import {
  HOME_VISIT_AREA_LABEL,
  HOME_VISIT_DISTRICTS,
  isCoveredPostcode,
  outOfAreaMessage,
  outwardCode,
} from "@/lib/home-visit-area";

describe("outwardCode", () => {
  it("returns the district before the space, normalised", () => {
    expect(outwardCode("g31 4hs")).toBe("G31");
    expect(outwardCode("G314HS")).toBe("G31");
    expect(outwardCode(" pa1 1aa ")).toBe("PA1");
    expect(outwardCode("G1 1AA")).toBe("G1");
  });
});

describe("isCoveredPostcode", () => {
  it("covers every Glasgow district G1 to G53", () => {
    for (let n = 1; n <= 53; n++) expect(isCoveredPostcode(`G${n} 1AA`)).toBe(true);
  });
  it("covers Paisley PA1-PA3 and Hamilton ML3", () => {
    expect(isCoveredPostcode("PA1 1AA")).toBe(true);
    expect(isCoveredPostcode("PA2 6AA")).toBe(true);
    expect(isCoveredPostcode("PA3 2AA")).toBe(true);
    expect(isCoveredPostcode("ML3 6AA")).toBe(true);
  });
  it("rejects districts just outside the area", () => {
    for (const pc of ["G54 1AA", "G60 1AA", "G84 1AA", "PA4 8AA", "PA5 1AA", "ML1 1AA", "ML4 1AA", "EH1 1AA"]) {
      expect(isCoveredPostcode(pc)).toBe(false);
    }
  });
  it("does not confuse G1 with G10-G19 or PA1 with PA10+", () => {
    expect(HOME_VISIT_DISTRICTS.has("G1")).toBe(true);
    expect(isCoveredPostcode("PA10 1AA")).toBe(false);
    expect(isCoveredPostcode("ML30 1AA")).toBe(false);
  });
  it("rejects empty or garbage input", () => {
    expect(isCoveredPostcode("")).toBe(false);
    expect(isCoveredPostcode("12345")).toBe(false);
  });
});

describe("copy", () => {
  it("names the covered area and the district in the out-of-area message", () => {
    expect(HOME_VISIT_AREA_LABEL).toBe("Glasgow (G1–G53), Paisley (PA1–PA3) and Hamilton (ML3)");
    expect(outOfAreaMessage("eh1 1aa")).toBe(
      "We don't offer home visits in EH1 yet. Video consultations work anywhere in the UK, or contact us and we'll see if we can help.",
    );
  });
});
