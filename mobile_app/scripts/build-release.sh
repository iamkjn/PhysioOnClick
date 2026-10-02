#!/usr/bin/env bash
# Build release artefacts for one environment, with the Firebase project and
# backend URL guaranteed to match.
#
#   ./scripts/build-release.sh prod   # live site + physioonclick-prod
#   ./scripts/build-release.sh dev    # dev.physioonclick.co.uk + physioonclick-dev
#
# Produces: Android app bundle (.aab) + APK, and an unsigned iOS build check.
# Store signing (Play upload key, Apple team) is NOT configured here yet.
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
}
trap restore EXIT

./scripts/switch-firebase-env.sh "$ENV"

expected="physioonclick-$ENV"
if ! grep -q "projectId: '$expected'" lib/src/core/firebase/firebase_options.dart; then
  echo "SAFETY STOP: firebase_options.dart is not $expected" >&2
  exit 1
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
