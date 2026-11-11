/**
 * Standing appointment hours, for home visits and video alike.
 *
 * They mirror the default weekly schedule in Cal.com (prod "Working hours",
 * set 2026-11-11), which is what the booking page actually offers. The
 * physiotherapist works a day job, so appointments are weekday evenings and
 * weekends only, and the site sells that as the point: no time off work, and
 * the family can be there. One-off weekly changes are Cal.com date overrides
 * and don't belong here. If the standing Cal.com hours change, change these
 * too: /contact, the homepage, the home-visit pages, the chat assistant and
 * Google's opening-hours data all read them.
 */
export const APPOINTMENT_HOURS = {
  weekdays: {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "18:00",
    closes: "21:00",
    short: "Mon–Fri: 6pm–9pm",
    phrase: "on weekday evenings from 6pm to 9pm",
  },
  weekends: {
    days: ["Saturday", "Sunday"],
    opens: "09:00",
    closes: "19:00",
    short: "Sat–Sun: 9am–7pm",
    phrase: "on Saturdays and Sundays from 9am to 7pm",
  },
} as const;

/** One sentence for copy and FAQs. */
export const APPOINTMENT_HOURS_SENTENCE = `Appointments run ${APPOINTMENT_HOURS.weekdays.phrase}, and ${APPOINTMENT_HOURS.weekends.phrase}.`;

/** Cal.com minimum notice on the home-visit event types (24 hours). */
export const HOME_VISIT_NOTICE_SENTENCE = "Home visits need booking at least 24 hours ahead.";

/** schema.org OpeningHoursSpecification for the practice node. */
export function openingHoursSpecification() {
  return [APPOINTMENT_HOURS.weekdays, APPOINTMENT_HOURS.weekends].map((block) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [...block.days],
    opens: block.opens,
    closes: block.closes,
  }));
}
