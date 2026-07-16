// Grant the Firebase `admin: true` custom claim to a user by email.
// Usage: node scripts/set-admin-claim.mjs <email> [path-to-service-account.json]
//
// The admin dashboard gate (lib/admin-auth.ts) and server actions
// (app/admin/actions.ts) both grant access when the signed-in user's token
// carries `admin: true`. This is the mechanism that works on both sides.
import { readFileSync } from "node:fs";
import { createSign } from "node:crypto";

const email = process.argv[2];
const saPath = process.argv[3] || "/Users/manthanjansari/Downloads/physioonclick-firebase-adminsdk-fbsvc-7f0343d32e.json";
if (!email) {
  console.error("Usage: node scripts/set-admin-claim.mjs <email> [service-account.json]");
  process.exit(1);
}

const sa = JSON.parse(readFileSync(saPath, "utf8"));
const now = Math.floor(Date.now() / 1000);
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const scope = ["https://www.googleapis.com/auth/identitytoolkit"].join(" ");
const unsigned = [b64({ alg: "RS256", typ: "JWT" }), b64({ iss: sa.client_email, scope, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })].join(".");
const sig = createSign("RSA-SHA256").update(unsigned).sign(sa.private_key.replace(/\\n/g, "\n")).toString("base64url");
const jwt = `${unsigned}.${sig}`;

const tok = (await (await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
})).json()).access_token;

const P = sa.project_id;
const look = await (await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${P}/accounts:lookup`, {
  method: "POST", headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
  body: JSON.stringify({ email: [email] }),
})).json();
const u = (look.users || [])[0];
if (!u) { console.error(`No Firebase user found for ${email}. Sign in once first to create the account.`); process.exit(1); }

const upd = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${P}/accounts:update`, {
  method: "POST", headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
  body: JSON.stringify({ localId: u.localId, customAttributes: JSON.stringify({ admin: true }) }),
});
console.log(upd.ok ? `✅ admin:true set on ${email} (uid ${u.localId})` : `❌ ${upd.status}: ${await upd.text()}`);
console.log("Now sign out and back in (or reload /admin) to refresh the token with the new claim.");
