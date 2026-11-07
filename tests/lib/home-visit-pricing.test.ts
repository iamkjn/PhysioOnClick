import { describe, expect, it } from "vitest";
import { bookServiceFor } from "@/lib/cal-services";
import * as pricingModule from "@/lib/home-visit-pricing";
import {
  HOME_VISIT_EXTRA_PENCE,
  formatPounds,
  homeVisitPricePence,
  homeVisitPrices,
  sessionPricePence,
} from "@/lib/home-visit-pricing";

const videoPence = (id: Parameters<typeof bookServiceFor>[0]) => Math.round(bookServiceFor(id).price * 100);

describe("sessionPricePence", () => {
  it("is the video price for video and for a missing visit type", () => {
    expect(sessionPricePence("initial-assessment", "video")).toBe(videoPence("initial-assessment"));
    expect(sessionPricePence("bundle-8")).toBe(videoPence("bundle-8"));
    expect(sessionPricePence("bundle-4")).toBe(Math.round(bookServiceFor("bundle-4").price * 100));
  });

  it("keeps the video prices unchanged", () => {
    expect(sessionPricePence("initial-assessment", "video")).toBe(4000);
    expect(sessionPricePence("follow-up", "video")).toBe(3000);
    expect(sessionPricePence("bundle-4", "video")).toBe(12000);
    expect(sessionPricePence("bundle-8", "video")).toBe(22500);
  });

  it("is the whole home-visit price for a home visit: video price + £40 per visit", () => {
    expect(HOME_VISIT_EXTRA_PENCE).toBe(4000);
    for (const id of ["initial-assessment", "follow-up", "bundle-4", "bundle-8"] as const) {
      expect(sessionPricePence(id, "home")).toBe(
        videoPence(id) + HOME_VISIT_EXTRA_PENCE * bookServiceFor(id).sessions
      );
    }
  });

  it("prices home visits at £80, £70, £280 and £545", () => {
    expect(sessionPricePence("initial-assessment", "home")).toBe(8000);
    expect(sessionPricePence("follow-up", "home")).toBe(7000);
    expect(sessionPricePence("bundle-4", "home")).toBe(28000);
    expect(sessionPricePence("bundle-8", "home")).toBe(54500);
  });
});

describe("homeVisitPricePence", () => {
  it("is sessionPricePence for a home visit", () => {
    for (const id of ["initial-assessment", "follow-up", "bundle-4", "bundle-8"] as const) {
      expect(homeVisitPricePence(id)).toBe(sessionPricePence(id, "home"));
    }
  });
});

describe("homeVisitPrices", () => {
  it("formats the whole home-visit initial and follow-up prices", () => {
    expect(homeVisitPrices).toEqual({
      initial: formatPounds(homeVisitPricePence("initial-assessment")),
      followUp: formatPounds(homeVisitPricePence("follow-up")),
    });
    expect(homeVisitPrices).toEqual({ initial: "£80", followUp: "£70" });
  });
});

describe("helpers", () => {
  it("formats whole pounds without pence and part pounds with pence", () => {
    expect(formatPounds(5500)).toBe("£55");
    expect(formatPounds(5150)).toBe("£51.50");
  });

  it("no longer exports any travel-fee helper", () => {
    const exported = Object.keys(pricingModule);
    for (const removed of [
      "HOME_VISIT_TRAVEL_FEE_PENCE",
      "travelFeePence",
      "totalPence",
      "travelFeeLabel",
      "TRAVEL_FEE_FALLBACK_LABEL",
      "chargedTravelFeeLabel",
    ]) {
      expect(exported).not.toContain(removed);
    }
  });
});
