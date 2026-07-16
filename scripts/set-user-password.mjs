// Set (or reset) a Firebase user's password via the Admin REST API, so an
// account with no inbox can still log in with email + password.
//
// Usage:
//   node scripts/set-user-password.mjs <email> [password] [service-account.json]
//
// If <password> is omitted, a strong random one is generated and printed.
// The password is printed to YOUR terminal only — it never leaves this machine.
import { readFileSync } from "node:fs";
import { createSign, randomBytes } from "node:crypto";

const email = process.argv[2];
const providedPw = process.argv[3] && !process.argv[3].endsWith(".json") ? process.argv[3] : null;
const saPath =
  process.argv.find((a) => a.endsWith(".json")) ||
  "/Users/manthanjansari/Downloads/physioonclick-firebase-adminsdk-fbsvc-7f0343d32e.json";

if (!email) {
  console.error("Usage: node scripts/set-user-password.mjs <email> [password] [service-account.json]");
  process.exit(1);
}

// Strong random password: 18 chars, url-safe, no ambiguous parsing.
const password = providedPw || randomBytes(18).toString("base64url").slice(0, 18);
if (password.length < 6) {
  console.error("Password must be at least 6 characters (Firebase minimum).");
  process.exit(1);
}

const sa = JSON.parse(readFileSync(saPath, "utf8"));
const now = Math.floor(Date.now() / 1000);
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const scope = "https://www.googleapis.com/auth/identitytoolkit";
const unsigned = [
  b64({ alg: "RS256", typ: "JWT" }),
  b64({ iss: sa.client_email, scope, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }),
].join(".");
const sig = createSign("RSA-SHA256").update(unsigned).sign(sa.private_key.replace(/\\n/g, "\n")).toString("base64url");
const jwt = `${unsigned}.${sig}`;

const tok = (
  await (
    await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
    })
  ).json()
).access_token;

const P = sa.project_id;
const look = await (
  await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${P}/accounts:lookup`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email: [email] }),
  })
).json();
const u = (look.users || [])[0];
if (!u) {
  console.error(`No Firebase user found for ${email}. Sign in once (magic link) first to create it.`);
  process.exit(1);
}

const upd = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${P}/accounts:update`, {
  method: "POST",
  headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
  body: JSON.stringify({ localId: u.localId, password, emailVerified: true }),
});

if (!upd.ok) {
  console.error(`❌ ${upd.status}: ${await upd.text()}`);
  process.exit(1);
}

console.log("\n✅ Password set. Log in at /patient (or /admin) with:");
console.log(`   Email:    ${email}`);
console.log(`   Password: ${password}`);
console.log("\nStore it in a password manager, then delete it from your shell history.\n");
