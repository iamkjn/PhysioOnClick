#!/usr/bin/env bash
# Build release artefacts for one environment, with the Firebase project and
# backend URL guaranteed to match.
#
#   ./scripts/build-release.sh prod   # live site + physioonclick-prod
#   ./scripts/build-release.sh dev    # dev.physioonclick.co.uk + physioonclick-dev
#
# Produces: Android app bundle (.aab) + APK, and an unsigned iOS build check.
# Android is signed with the Play upload key when android/key.properties exists
# (debug key otherwise). iOS signing (Apple team) is not configured yet.
# Restores the committed (dev) Firebase config afterwards so prod config is
# never committed by accident. Run from mobile_app/.
set -euo pipefail

ENV="${1:-}"
if [[ "$ENV" != "dev" && "$ENV" != "prod" ]]; then
  echo "usage: $0 dev|prod" >&2
  exit 1
fi

restore() {
  git checkout -- android/app/google-services.json ios/Runner/GoogleService-Info.plist \
    lib/src/core/firebase/firebase_options.dart
  if [[ "${COPIED_KEY_PROPS:-0}" == 1 ]]; then rm -f android/key.properties; fi
}
trap restore EXIT

./scripts/switch-firebase-env.sh "$ENV"

expected="physioonclick-$ENV"
if ! grep -q "projectId: '$expected'" lib/src/core/firebase/firebase_options.dart; then
  echo "SAFETY STOP: firebase_options.dart is not $expected" >&2
  exit 1
fi

# The Play upload key lives outside the repo (never commit it). If the owner's
# key.properties exists there, use it for this build only.
KEY_PROPS="$HOME/keys/physioonclick-key.properties"
COPIED_KEY_PROPS=0
if [[ ! -f android/key.properties && -f "$KEY_PROPS" ]]; then
  cp "$KEY_PROPS" android/key.properties
  COPIED_KEY_PROPS=1
fi

if [[ "$ENV" == "prod" && ! -f android/key.properties ]]; then
  echo "WARNING: android/key.properties not found - Android builds will be signed" >&2
  echo "with the DEBUG key. Fine for testing on a phone; Google Play will reject it." >&2
fi

DEFINE="--dart-define=APP_ENV=$ENV"
flutter build appbundle --release $DEFINE
flutter build apk --release $DEFINE
if [[ "$(uname)" == "Darwin" ]]; then
  flutter build ios --release --no-codesign $DEFINE
fi

echo
echo "Built $ENV release:"
ls -lh build/app/outputs/bundle/release/*.aab build/app/outputs/flutter-apk/app-release.apk
