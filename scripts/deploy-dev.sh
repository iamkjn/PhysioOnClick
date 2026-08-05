#!/usr/bin/env bash
# Build + deploy the DEV worker (physioonclick-dev on dev.physioonclick.co.uk).
#
# Why this script exists: `next build` only ever loads .env.production (it keys
# off NODE_ENV=production), so a dev-targeted build would silently inline PROD
# NEXT_PUBLIC_* values. Shell variables take precedence over .env files in Next,
# so we export the dev NEXT_PUBLIC_* here before building.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env.development ] || { echo "ERROR: .env.development not found at repo root."; exit 1; }

# Safety: refuse to run if the dev env file is not actually pointing at dev.
grep -q '^NEXT_PUBLIC_FIREBASE_PROJECT_ID=physioonclick-dev$' .env.development \
  || { echo "SAFETY STOP: .env.development does not target physioonclick-dev."; exit 1; }
if grep -qE '^(STRIPE_SECRET_KEY=sk_live|NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live)' .env.development; then
  echo "SAFETY STOP: .env.development contains LIVE Stripe keys. Dev must use test keys."; exit 1
fi

# Export dev NEXT_PUBLIC_* so they win over .env.production at build time.
while IFS= read -r line; do
  export "${line?}"
done < <(grep -E '^NEXT_PUBLIC_[A-Z0-9_]+=' .env.development)

echo "Building DEV bundle:"
echo "  firebase project : ${NEXT_PUBLIC_FIREBASE_PROJECT_ID}"
echo "  site url         : ${NEXT_PUBLIC_SITE_URL}"
echo "  cal username     : ${NEXT_PUBLIC_CAL_USERNAME}"

npx opennextjs-cloudflare build
npx opennextjs-cloudflare deploy -e dev

cat <<'WARN'

──────────────────────────────────────────────────────────────
NOTE: .open-next now contains a DEV build (dev NEXT_PUBLIC_* are
baked in). Always run `npm run deploy` for production — it does a
fresh build. Never run a bare `opennextjs-cloudflare deploy` after
this, or dev values would ship to the live site.
──────────────────────────────────────────────────────────────
WARN
