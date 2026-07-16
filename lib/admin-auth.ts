import type { User } from "firebase/auth";

const ADMIN_EMAIL = "hello@physioonclick.co.uk";

export async function isAdminUser(user: User): Promise<boolean> {
  const tokenResult = await user.getIdTokenResult(true);
  return tokenResult.claims.admin === true || user.email === ADMIN_EMAIL;
}
