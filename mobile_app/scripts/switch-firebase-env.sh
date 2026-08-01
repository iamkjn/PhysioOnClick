#!/usr/bin/env bash
# Switch the Flutter app's active Firebase config between environments.
#
#   ./scripts/switch-firebase-env.sh dev    # -> physioonclick-dev
#   ./scripts/switch-firebase-env.sh prod   # -> physioonclick-prod
#
# Both environments use the SAME package/bundle id (com.iamkjn.physioonclick),
# so only the Firebase project config differs. Config sets live in
# mobile_app/firebase/<env>/ and are copied into the live locations Flutter reads.
# Run from the mobile_app/ directory.
set -euo pipefail

ENV="${1:-}"
if [[ "$ENV" != "dev" && "$ENV" != "prod" ]]; then
  echo "usage: $0 dev|prod" >&2
  exit 1
fi

SRC="firebase/$ENV"
if [[ ! -d "$SRC" ]]; then
  echo "error: $SRC not found. Run from the mobile_app/ directory." >&2
  exit 1
fi

cp "$SRC/google-services.json"      android/app/google-services.json
cp "$SRC/GoogleService-Info.plist"  ios/Runner/GoogleService-Info.plist
cp "$SRC/firebase_options.dart"     lib/src/core/firebase/firebase_options.dart

echo "Firebase config switched to: $ENV"
grep -m1 project_id android/app/google-services.json
