/**
 * Standing appointment hours, for home visits and video alike.
 *
 * They mirror the default weekly schedule in Cal.com (prod "Working hours",
 * schedule 2127952), which is what the booking page actually offers. Owner
 * change 2026-11-23: 9am to 9pm every day, weekdays and weekends (was weekday
 * evenings 6-9pm and weekends 9am-7pm). One-off changes are Cal.com date
 * overrides and don't belong here. If the standing Cal.com hours change,
 * change these too: /contact, the homepage, the home-visit pages, the call-back
 * form, the chat assistant and Google's opening-hours data all read them.
 */
export const APPOINTMENT_HOURS = {
  days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  opens: "09:00",
  closes: "21:00",
  /** For lists and the contact card. */
  short: "Every day: 9am–9pm",
  /** Fits after "Visits run …" / "available …". */
  phrase: "7 days a week, from 9am to 9pm",
  /** Trust-bar / pill length. */
  label: "7 days, 9am–9pm",
} as const;

/** One sentence for copy and FAQs. */
export const APPOINTMENT_HOURS_SENTENCE = `Appointments run ${APPOINTMENT_HOURS.phrase}, weekdays and weekends.`;

/** Cal.com minimum notice on the home-visit event types (24 hours). */
export const HOME_VISIT_NOTICE_SENTENCE = "Home visits need booking at least 24 hours ahead.";

/** schema.org OpeningHoursSpecification for the practice node. */
export function openingHoursSpecification() {
  return [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [...APPOINTMENT_HOURS.days],
      opens: APPOINTMENT_HOURS.opens,
      closes: APPOINTMENT_HOURS.closes,
    },
  ];
}
