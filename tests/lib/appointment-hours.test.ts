import { describe, it, expect } from "vitest";

import { APPOINTMENT_HOURS, APPOINTMENT_HOURS_SENTENCE, openingHoursSpecification } from "@/lib/appointment-hours";
import { practiceNode } from "@/lib/structured-data";

// These mirror the standing Cal.com schedule (prod 2127952), set on
// 2026-11-23 to 9am-9pm every day. If this test fails because the hours
// changed, change Cal.com's default schedule to match.
describe("appointment hours", () => {
  it("are 9am to 9pm, 7 days a week", () => {
    expect(APPOINTMENT_HOURS).toMatchObject({ opens: "09:00", closes: "21:00" });
    expect(APPOINTMENT_HOURS.days).toEqual([
      "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
    ]);
  });

  it("reads the same in the copy sentence", () => {
    expect(APPOINTMENT_HOURS_SENTENCE).toBe("Appointments run 7 days a week, from 9am to 9pm, weekdays and weekends.");
  });

  it("gives Google the same hours as the booking calendar", () => {
    const node = practiceNode() as { openingHoursSpecification?: unknown };
    expect(node.openingHoursSpecification).toEqual(openingHoursSpecification());
    expect(openingHoursSpecification()).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "09:00",
        closes: "21:00",
      },
    ]);
    // None of the old hours may linger in Google's data.
    for (const old of ['"08:00"', '"18:00"', '"19:00"']) expect(JSON.stringify(node)).not.toContain(old);
  });
});
