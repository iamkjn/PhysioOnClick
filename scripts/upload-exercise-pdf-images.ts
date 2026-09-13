// Uploads a small PNG variant of each exercise illustration for embedding in
// the exercise-plan PDF (condition-hub + patient-booking). The PDF draws
// each illustration at 108pt square; the full 960px PNG used on the web is
// vastly more pixels than that needs, and decoding/embedding several of them
// with pdf-lib is CPU-heavy enough to blow the Workers Free plan's per-request
// CPU budget (Cloudflare error 1102). This variant is sized for the print box
// instead, at 2x for crispness: 216x216.
//
// Run with: npx tsx --env-file=.env.production scripts/upload-exercise-pdf-images.ts
// (repeat with .env.development to also serve dev's PDF route.)
import { readFileSync } from "node:fs";
import path from "node:path";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import sharp from "sharp";

const BATCH_DIR = path.resolve(
  __dirname,
  "../generated-assets/physioonclick-updated-prompt-image-library-2026-09-10",
);
const ARTWORK_DIR = path.join(BATCH_DIR, "artwork");

const PDF_IMAGE_SIZE = 216;
const CACHE_CONTROL = "public,max-age=86400,stale-while-revalidate=604800";

function parseMapping(): Record<string, string> {
  const html = readFileSync(path.join(BATCH_DIR, "index.html"), "utf8");
  const re =
    /exc(\d+)\.png"[^>]*alt="([^"]*)">\s*<h2>exc\d+\.png <span>([a-zA-Z0-9_-]+)<\/span>/g;
  const mapping: Record<string, string> = {};
  for (const match of html.matchAll(re)) {
    mapping[`exc${match[1]}`] = match[3];
  }
  return mapping;
}

function initAdmin() {
  if (getApps().length) return;
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const storageBucket = process.env.FIREBASE_ADMIN_STORAGE_BUCKET;
  if (!rawServiceAccount) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not set");
  if (!storageBucket) throw new Error("FIREBASE_ADMIN_STORAGE_BUCKET is not set");
  initializeApp({ credential: cert(JSON.parse(rawServiceAccount)), storageBucket });
}

async function main() {
  initAdmin();
  const mapping = parseMapping();
  const bucket = getStorage().bucket();
  const entries = Object.entries(mapping);
  console.log(`Uploading ${entries.length} PDF-sized exercise illustrations...`);

  let done = 0;
  for (const [stem, id] of entries) {
    const pngSmall = await sharp(readFileSync(path.join(ARTWORK_DIR, `${stem}.png`)))
      .resize(PDF_IMAGE_SIZE, PDF_IMAGE_SIZE, { fit: "inside", withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toBuffer();

    await bucket.file(`exercise-images/${id}-pdf.png`).save(pngSmall, {
      contentType: "image/png",
      resumable: false,
      metadata: { cacheControl: CACHE_CONTROL },
    });

    done += 1;
    if (done % 20 === 0) console.log(`  ${done}/${entries.length}`);
  }
  console.log(`Uploaded ${done} PDF-sized exercise illustrations.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
