// Who the practice-owner tools belong to (add patient, new appointment, price
// checker). Deliberately NOT the `admin` claim: other physios added later may
// be admins without being the owner. Client-safe; the server check is in
// lib/owner-request.ts.
export const OWNER_EMAIL = "hello@physioonclick.co.uk";

export function isOwnerEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase() === OWNER_EMAIL;
}
