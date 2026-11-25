import { describe, expect, it } from "vitest";

import { cleanVisitorArea, visitorPlace } from "@/lib/visitor-area";

const london = { city: "London", region: "England", postalCode: "W2", countryCode: "GB" };

describe("unreliable locations", () => {
  it("drops the town for mobile networks and relays", () => {
    for (const [network, connection] of [["EE Limited", "mobile"], ["Telefonica UK", "mobile"], ["Akamai", "relay"]]) {
      expect(cleanVisitorArea({ ...london, network })).toEqual({ city: "", region: "", postalDistrict: "", connection });
    }
    expect(visitorPlace({ connection: "mobile", countryCode: "GB" })).toBe("Area unknown (mobile network)");
  });

  it("keeps it for home broadband", () => {
    expect(cleanVisitorArea({ ...london, network: "Virgin Media" })).toMatchObject({ city: "London" });
  });
});
