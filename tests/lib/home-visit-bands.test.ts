import { describe, expect, it } from "vitest";

import { homeVisitBand, isCoveredPostcode } from "@/lib/home-visit-area";
import { homeVisitPrices, homeVisitPriceRange, sessionPricePence } from "@/lib/home-visit-pricing";

const price = (postcode: string) => [
  sessionPricePence("initial-assessment", "home", postcode),
  sessionPricePence("follow-up", "home", postcode),
];

describe("home-visit price by postcode (owner decision 2026-11-27)", () => {
  it.each(["G31 4HS", "G72 8FE", "ML3 0AA", "ML1 1AA", "PA1 1AA", "G61 1AA", "G81 1AA", "G77 6FH"])(
    "%s is £80 / £70",
    (pc) => expect(price(pc)).toEqual([8000, 7000]),
  );
  it.each(["ML2 7AA", "EH48 1AA", "FK1 1AA", "G82 1AA", "ML11 7AA"])("%s is £95 / £85", (pc) =>
    expect(price(pc)).toEqual([9500, 8500]),
  );
  it.each(["FK8 1AA", "KA1 1AA", "KA3 7BJ", "FK15 0AA", "EH54 1AA", "PA16 1AA", "EH49 7AA", "FK10 1AA", "KA12 0AA", "FK13 6AA"])(
    "%s is £110 / £100",
    (pc) => expect(price(pc)).toEqual([11000, 10000]),
  );
  it.each(["G84 8AA", "KA10 6AA", "KA30 8AA", "EH12 7AA", "KY12 7AA", "ML12 6AA", "KA7 1AA", "FK17 8AA", "KA18 1AA"])(
    "%s is £120 / £110",
    (pc) => expect(price(pc)).toEqual([12000, 11000]),
  );

  it("does not cover Kinross, central Edinburgh or Girvan", () => {
    for (const pc of ["KY13 8AA", "EH1 1AA", "KA26 9AA"]) {
      expect(isCoveredPostcode(pc)).toBe(false);
      expect(homeVisitBand(pc)).toBeNull();
    }
  });

  it("quotes the starting price when the postcode is unknown", () => {
    expect(price("")).toEqual([8000, 7000]);
    expect(homeVisitPrices).toEqual({ initial: "from £80", followUp: "from £70" });
  });

  it("describes a town that spans two bands from its lowest price", () => {
    expect(homeVisitPriceRange(["ML1", "ML2"])).toEqual({ initial: "from £80", followUp: "from £70" });
    expect(homeVisitPriceRange(["KA1", "KA3"])).toEqual({ initial: "£110", followUp: "£100" });
  });

  it("leaves video prices alone whatever the postcode", () => {
    expect(sessionPricePence("initial-assessment", "video", "KA7 1AA")).toBe(5000);
    expect(sessionPricePence("follow-up", undefined, "KA7 1AA")).toBe(4000);
  });
});
