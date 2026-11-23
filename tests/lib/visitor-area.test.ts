import { describe, expect, it } from "vitest";

import { cleanVisitorArea, ukAreaOf, visitorPlace } from "@/lib/visitor-area";

describe("cleanVisitorArea", () => {
  it("keeps the town, region and UK postcode district", () => {
    expect(cleanVisitorArea({ city: "Glasgow", region: "Scotland", postalCode: "G72", countryCode: "GB" })).toEqual({
      city: "Glasgow",
      region: "Scotland",
      postalDistrict: "G72",
    });
  });

  it("never keeps more than the first half of a UK postcode", () => {
    expect(cleanVisitorArea({ postalCode: "G72 8FE", countryCode: "GB" }).postalDistrict).toBe("G72");
    expect(cleanVisitorArea({ postalCode: "g728fe", countryCode: "GB" }).postalDistrict).toBe("G72");
    expect(cleanVisitorArea({ postalCode: "EC1A", countryCode: "GB" }).postalDistrict).toBe("EC1A");
    expect(cleanVisitorArea({ postalCode: "nonsense", countryCode: "GB" }).postalDistrict).toBe("");
  });

  it("drops postcodes outside the UK and anything that isn't a place name", () => {
    expect(cleanVisitorArea({ city: "İstanbul", region: "Istanbul", postalCode: "34000", countryCode: "TR" })).toEqual({
      city: "İstanbul",
      region: "Istanbul",
      postalDistrict: "",
    });
    expect(cleanVisitorArea({ city: "<script>", region: 42, countryCode: "GB" })).toEqual({
      city: "",
      region: "",
      postalDistrict: "",
    });
  });
});

describe("visitorPlace", () => {
  it("shows a UK town with its postcode district and region", () => {
    expect(visitorPlace({ city: "Glasgow", region: "Scotland", postalDistrict: "G31", countryCode: "GB" })).toBe("Glasgow (G31), Scotland");
    expect(visitorPlace({ city: "Hamilton", region: "Scotland", countryName: "United Kingdom" })).toBe("Hamilton, Scotland");
    expect(visitorPlace({ region: "Scotland", countryCode: "GB" })).toBe("Scotland");
  });

  it("shows a town abroad with its country", () => {
    expect(visitorPlace({ city: "Istanbul", region: "Istanbul", countryCode: "TR", countryName: "Türkiye" })).toBe("Istanbul, Türkiye");
  });

  it("is empty for visits recorded before areas were", () => {
    expect(visitorPlace({ countryCode: "GB", countryName: "United Kingdom" })).toBe("");
    expect(visitorPlace({})).toBe("");
  });
});

describe("ukAreaOf", () => {
  it("groups UK visits by town and region, keeping the district", () => {
    const a = ukAreaOf({ city: "Glasgow", region: "Scotland", postalDistrict: "G31", countryCode: "GB" });
    const b = ukAreaOf({ city: "Glasgow", region: "Scotland", postalDistrict: "G72", countryCode: "GB" });
    expect(a).toEqual({ key: "glasgow|scotland", label: "Glasgow, Scotland", district: "G31" });
    expect(b?.key).toBe(a?.key);
  });

  it("ignores visits from abroad and visits with no town", () => {
    expect(ukAreaOf({ city: "Istanbul", countryCode: "TR" })).toBeNull();
    expect(ukAreaOf({ region: "Scotland", countryCode: "GB" })).toBeNull();
  });
});
