import { describe, expect, it } from "vitest";

import { regionFromTimeZone } from "@/lib/visitor-region";

describe("regionFromTimeZone", () => {
  it.each(["Europe/London", "Europe/Belfast", "Europe/Jersey", "Europe/Guernsey", "Europe/Isle_of_Man"])(
    "treats %s as the UK",
    (tz) => expect(regionFromTimeZone(tz)).toBe("uk"),
  );

  it.each(["America/New_York", "Europe/Dublin", "Asia/Kolkata", "Europe/Rome", "UTC"])("treats %s as overseas", (tz) =>
    expect(regionFromTimeZone(tz)).toBe("overseas"),
  );

  it("is unknown without a time zone", () => {
    expect(regionFromTimeZone(undefined)).toBe("unknown");
    expect(regionFromTimeZone("")).toBe("unknown");
  });
});
