import { describe, expect, it } from "vitest";
import { bookServiceFor } from "@/lib/cal-services";
import * as pricingModule from "@/lib/home-visit-pricing";
import {
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

  it("charges £50, £40, £160 and £305 by video (owner, 2026-11-15)", () => {
    expect(sessionPricePence("initial-assessment", "video")).toBe(5000);
    expect(sessionPricePence("follow-up", "video")).toBe(4000);
    expect(sessionPricePence("bundle-4", "video")).toBe(16000);
    expect(sessionPricePence("bundle-8", "video")).toBe(30500);
  });

  it("starts home visits at £80 and £70 when no postcode is known", () => {
    expect(sessionPricePence("initial-assessment", "home")).toBe(8000);
    expect(sessionPricePence("follow-up", "home")).toBe(7000);
  });
});

describe("homeVisitPricePence", () => {
  it("is sessionPricePence for a home visit", () => {
    for (const id of ["initial-assessment", "follow-up"] as const) {
      expect(homeVisitPricePence(id)).toBe(sessionPricePence(id, "home"));
    }
  });
});

describe("homeVisitPrices", () => {
  it("advertises the starting prices", () => {
    expect(homeVisitPrices).toEqual({
      initial: `from ${formatPounds(homeVisitPricePence("initial-assessment"))}`,
      followUp: `from ${formatPounds(homeVisitPricePence("follow-up"))}`,
    });
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
