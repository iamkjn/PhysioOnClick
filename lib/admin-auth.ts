import type { User } from "firebase/auth";

// Must stay in sync with the ADMIN_EMAIL secret read by app/admin/actions.ts.
// This gate runs in the browser, so it cannot read a server-only secret — a
// mismatch between the two locks the real admin out of the UI while server
// actions still accept them.
const ADMIN_EMAIL = "hello@physioonclick.co.uk";

export async function isAdminUser(user: User): Promise<boolean> {
  const tokenResult = await user.getIdTokenResult(true);
  return tokenResult.claims.admin === true || user.email === ADMIN_EMAIL;
}
