import { describe, it, expect } from "vitest";

import { APPOINTMENT_HOURS, APPOINTMENT_HOURS_SENTENCE, openingHoursSpecification } from "@/lib/appointment-hours";
import { practiceNode } from "@/lib/structured-data";

// These mirror the standing Cal.com schedule set on 2026-11-11 (weekday
// evenings and weekends, around the physio's day job). If this test fails
// because the hours changed, change Cal.com's default schedule to match.
describe("appointment hours", () => {
  it("are weekday evenings and weekend days", () => {
    expect(APPOINTMENT_HOURS.weekdays).toMatchObject({ opens: "18:00", closes: "21:00" });
    expect(APPOINTMENT_HOURS.weekdays.days).toEqual(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
    expect(APPOINTMENT_HOURS.weekends).toMatchObject({ opens: "09:00", closes: "19:00" });
    expect(APPOINTMENT_HOURS.weekends.days).toEqual(["Saturday", "Sunday"]);
  });

  it("reads the same in the copy sentence", () => {
    expect(APPOINTMENT_HOURS_SENTENCE).toBe(
      "Appointments run on weekday evenings from 6pm to 9pm, and on Saturdays and Sundays from 9am to 7pm.",
    );
  });

  it("gives Google the same hours as the booking calendar", () => {
    const node = practiceNode() as { openingHoursSpecification?: unknown };
    expect(node.openingHoursSpecification).toEqual(openingHoursSpecification());
    expect(openingHoursSpecification()).toEqual([
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "18:00", closes: "21:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Saturday", "Sunday"], opens: "09:00", closes: "19:00" },
    ]);
    // The old 8am-6pm / Saturday-morning hours contradicted the calendar.
    expect(JSON.stringify(node)).not.toContain('"08:00"');
  });
});
