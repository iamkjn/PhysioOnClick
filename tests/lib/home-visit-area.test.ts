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
  it("covers Kilmarnock KA3 (the patient who was wrongly turned away) and the rest of the hour's-drive area", () => {
    expect(isCoveredPostcode("KA3 7BJ")).toBe(true);
    expect(isCoveredPostcode("ka3 7bj")).toBe(true);
    for (const pc of ["G60 1AA", "G74 1AA", "G84 7AA", "PA15 1AA", "ML1 1AA", "KA7 1AA", "KA30 8AA", "FK1 1AA", "EH54 6AA", "KY11 1AA"]) {
      expect(isCoveredPostcode(pc)).toBe(true);
    }
  });
  it("rejects districts outside an hour's drive or only reachable by ferry", () => {
    for (const pc of ["G54 1AA", "G70 1AA", "G79 1AA", "KA26 9AA", "KA27 8AA", "KA28 0AA", "PA20 0AA", "PA23 7AA", "EH1 1AA", "KY13 8AA", "FK18 8AA", "KY1 1AA", "PH1 1AA", "DG1 1AA"]) {
      expect(isCoveredPostcode(pc)).toBe(false);
    }
  });
  it("does not confuse G1 with G10-G19 or PA1 with PA10+", () => {
    expect(HOME_VISIT_DISTRICTS.has("G1")).toBe(true);
    expect(isCoveredPostcode("PA20 1AA")).toBe(false);
    expect(isCoveredPostcode("ML30 1AA")).toBe(false);
  });
  it("rejects empty or garbage input", () => {
    expect(isCoveredPostcode("")).toBe(false);
    expect(isCoveredPostcode("12345")).toBe(false);
  });
});

describe("copy", () => {
  it("names the covered area and the district in the out-of-area message", () => {
    expect(HOME_VISIT_AREA_LABEL).toBe(
      "Glasgow and the surrounding area within about an hour's drive (Lanarkshire, Renfrewshire, Inverclyde, Dunbartonshire, Ayrshire, Falkirk, Stirling, West Lothian and west Fife)",
    );
    expect(outOfAreaMessage("eh1 1aa")).toBe(
      "We don't offer home visits in EH1 yet. Video consultations work anywhere in the UK, or contact us and we'll see if we can help.",
    );
  });
});
