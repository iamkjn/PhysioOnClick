export type GateBooking = {
  id: string;
  sessionDate: Date;
  assessmentCompletedAt: Date | null;
  paid: boolean;
  status: string;
};

export function selectTargetBooking(
  bookings: GateBooking[],
  preferredId?: string,
): GateBooking | null {
  const now = Date.now();
  const eligible = bookings
    .filter((b) => b.paid && b.status === "upcoming" && b.sessionDate.getTime() >= now)
    .sort((a, b) => a.sessionDate.getTime() - b.sessionDate.getTime());
  if (eligible.length === 0) return null;
  if (preferredId) {
    const pref = eligible.find((b) => b.id === preferredId);
    if (pref) return pref;
  }
  return eligible.find((b) => b.assessmentCompletedAt === null) ?? null;
}
