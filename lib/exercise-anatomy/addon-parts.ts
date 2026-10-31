// lib/exercise-anatomy/addon-parts.ts
// The deep structures exercise pages need but the booking model leaves out
// (EXCLUDE in lib/body-chart-3d-regions.ts): pelvic floor, diaphragm, deep neck
// flexors and the intervertebral discs. Shared by scripts/build-anatomy-addon.ts,
// the add-on loader and the tests.

export const ANATOMY_ADDON_DIR = "/models/exercise-anatomy";

export const ADDON_PART =
  /coccygeus|puborectalis|anal sphincter|perineal|\bdiaphragm\b|longus colli|longus capitis|rectus capitis (anterior|lateralis)|intervertebral disk of/i;
