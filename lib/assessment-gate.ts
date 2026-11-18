export type GateBooking = {
  id: string;
  sessionDate: Date;
  assessmentCompletedAt: Date | null;
  paid: boolean;
  status: string;
  /** Drives the assessment's consent wording and consultationMode. */
  visitType?: "video" | "home";
  /** Physio-added (date-only) sessions never need a pre-appointment assessment. */
  dateOnly?: boolean;
};

export function selectTargetBooking(
  bookings: GateBooking[],
  preferredId?: string,
): GateBooking | null {
  const now = Date.now();
  const eligible = bookings
    .filter((b) => b.paid && !b.dateOnly && b.status === "upcoming" && b.sessionDate.getTime() >= now)
    .sort((a, b) => a.sessionDate.getTime() - b.sessionDate.getTime());
  if (eligible.length === 0) return null;
  if (preferredId) {
    const pref = eligible.find((b) => b.id === preferredId);
    if (pref) return pref;
  }
  return eligible.find((b) => b.assessmentCompletedAt === null) ?? null;
}
