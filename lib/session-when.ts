// Display helper shared by admin screens; kept out of lib/patient-bookings so
// tests that mock that module don't need to stub it.

/**
 * A session's date (and time, unless it is date-only) for display, in UK time.
 * Pass the date-only parts in `options`; hour/minute are added when allowed.
 */
export function formatSessionWhen(
  booking: { sessionDate: Date; dateOnly?: boolean },
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
): string {
  return booking.sessionDate.toLocaleString("en-GB", {
    ...options,
    ...(booking.dateOnly ? {} : { hour: "2-digit", minute: "2-digit" }),
    timeZone: "Europe/London",
  });
}

/** Physio-added sessions (source "admin-manual") record a date only. */
export function isDateOnlyBooking(data: Record<string, unknown>): boolean {
  return data.dateOnly === true || data.source === "admin-manual";
}

/**
 * Start Session (the live clinical wizard) is for sessions booked online only.
 * Physio-added sessions are recorded by hand on the patient's package, so the
 * admin screens never offer it for them.
 */
export function canStartSession(booking: { dateOnly?: boolean }): boolean {
  return booking.dateOnly !== true;
}
