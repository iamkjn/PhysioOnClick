import { describe, expect, it } from "vitest";

import { intentToMetadata, metadataToIntent, type BookingIntent } from "@/lib/payments";

const BASE: BookingIntent = {
  service: "initial-assessment",
  startISO: "2999-01-01T10:00:00.000Z",
  name: "Ada Lovelace",
  email: "ada@example.com",
  timeZone: "Europe/London",
  focusAreas: ["Back & neck"],
};

describe("booking intent <-> Stripe metadata", () => {
  it("round-trips a home visit with its address", () => {
    const intent: BookingIntent = {
      ...BASE,
      visitType: "home",
      homeVisitAddress: "7 Example Street, Flat 2, G31 4HS",
    };
    const meta = intentToMetadata(intent);
    expect(meta.visitType).toBe("home");
    expect(meta.homeVisitAddress).toBe("7 Example Street, Flat 2, G31 4HS");
    // Stripe caps every metadata value at 500 characters.
    for (const value of Object.values(meta)) expect(value.length).toBeLessThanOrEqual(500);

    const back = metadataToIntent(meta);
    expect(back?.visitType).toBe("home");
    expect(back?.homeVisitAddress).toBe("7 Example Street, Flat 2, G31 4HS");
  });

  it("round-trips a video booking without any address", () => {
    const meta = intentToMetadata({ ...BASE, visitType: "video" });
    expect(meta.visitType).toBe("video");
    expect(meta).not.toHaveProperty("homeVisitAddress");
    const back = metadataToIntent(meta);
    expect(back?.visitType).toBe("video");
    expect(back).not.toHaveProperty("homeVisitAddress");
  });

  it("drops an address that arrives with a non-home visit type", () => {
    const back = metadataToIntent({
      ...intentToMetadata(BASE),
      visitType: "video",
      homeVisitAddress: "should not survive",
    });
    expect(back).not.toHaveProperty("homeVisitAddress");
  });

  it("treats legacy metadata with no visit type as before (no visit fields)", () => {
    const back = metadataToIntent(intentToMetadata(BASE));
    expect(back).not.toHaveProperty("visitType");
    expect(back).not.toHaveProperty("homeVisitAddress");
  });
});
