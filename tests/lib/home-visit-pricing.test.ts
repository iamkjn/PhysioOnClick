import { describe, expect, it } from "vitest";
import { bookServiceFor } from "@/lib/cal-services";
import {
  HOME_VISIT_TRAVEL_FEE_PENCE,
  formatPounds,
  sessionPricePence,
  totalPence,
  travelFeeLabel,
  travelFeePence,
} from "@/lib/home-visit-pricing";

describe("travelFeePence", () => {
  it("is zero for video and for a missing visit type", () => {
    expect(travelFeePence("initial-assessment", "video")).toBe(0);
    expect(travelFeePence("bundle-8")).toBe(0);
  });
  it("is £15 per home visit, multiplied by the sessions in a bundle", () => {
    expect(HOME_VISIT_TRAVEL_FEE_PENCE).toBe(1500);
    expect(travelFeePence("initial-assessment", "home")).toBe(1500);
    expect(travelFeePence("follow-up", "home")).toBe(1500);
    expect(travelFeePence("bundle-4", "home")).toBe(6000);
    expect(travelFeePence("bundle-8", "home")).toBe(12000);
  });
});

describe("totalPence", () => {
  it("discounts the session price only, then adds travel", () => {
    expect(totalPence({ sessionPence: 4000, discountPence: 400, travelFeePence: 1500 })).toBe(5100);
  });
  it("never lets a discount push the session below zero or touch travel", () => {
    expect(totalPence({ sessionPence: 1000, discountPence: 5000, travelFeePence: 1500 })).toBe(1500);
  });
  it("is just the session price for video", () => {
    expect(totalPence({ sessionPence: 4000, discountPence: 0, travelFeePence: 0 })).toBe(4000);
  });
});

describe("helpers", () => {
  it("reads the session price from the pricing table", () => {
    expect(sessionPricePence("bundle-4")).toBe(Math.round(bookServiceFor("bundle-4").price * 100));
  });
  it("labels the travel line with the number of visits", () => {
    expect(travelFeeLabel("initial-assessment")).toBe("Travel fee (1 home visit × £15)");
    expect(travelFeeLabel("bundle-4")).toBe("Travel fee (4 home visits × £15)");
  });
  it("formats whole pounds without pence and part pounds with pence", () => {
    expect(formatPounds(5500)).toBe("£55");
    expect(formatPounds(5150)).toBe("£51.50");
  });
});

describe("chargedTravelFeeLabel", () => {
  it("uses the per-visit breakdown when the charge matches the service's travel fee", async () => {
    const { chargedTravelFeeLabel } = await import("@/lib/home-visit-pricing");
    expect(chargedTravelFeeLabel("initial-assessment", 1500)).toBe("Travel fee (1 home visit × £15)");
    expect(chargedTravelFeeLabel("bundle-4", 6000)).toBe("Travel fee (4 home visits × £15)");
  });
  it("falls back to a plain label for an unknown service or a charge that no longer matches the constant", async () => {
    const { chargedTravelFeeLabel } = await import("@/lib/home-visit-pricing");
    expect(chargedTravelFeeLabel("legacy-service", 1500)).toBe("Travel fee (home visit)");
    expect(chargedTravelFeeLabel(undefined, 1500)).toBe("Travel fee (home visit)");
    expect(chargedTravelFeeLabel("bundle-4", 4000)).toBe("Travel fee (home visit)");
  });
});
