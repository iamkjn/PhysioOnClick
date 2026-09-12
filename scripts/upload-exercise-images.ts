// One-off upload of the generated exercise stick-diagram library to Firebase
// Storage. Run with: tsx --env-file=.env.development scripts/upload-exercise-images.ts
//
// Source assets + the exc/selftest -> exercise/self-test id mapping live in
// generated-assets/physioonclick-updated-prompt-image-library-2026-09-10/
// (untracked, produced by the image-gen batch). This script reads the
// mapping straight out of that batch's index.html rather than hand-copying
// it, so it stays correct if the batch is regenerated.
import { readFileSync } from "node:fs";
import path from "node:path";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import sharp from "sharp";

const BATCH_DIR = path.resolve(
  __dirname,
  "../generated-assets/physioonclick-updated-prompt-image-library-2026-09-10",
);

// `images/` (source of `responsive/`) holds the branded marketing-card
// template - logo header, title band, footer strap line - meant for social /
// PDF export, not an in-app tile. `artwork/` holds the same 174+49 poses as
// clean, untemplated illustrations, which is what the site should show. So
// this script resizes straight from artwork/ rather than reusing the
// prebuilt responsive/ set.
const ARTWORK_DIR = path.join(BATCH_DIR, "artwork");

function parseMapping(prefix: "exc" | "selftest"): Record<string, string> {
  const html = readFileSync(path.join(BATCH_DIR, "index.html"), "utf8");
  const re = new RegExp(
    `${prefix}(\\d+)\\.png"[^>]*alt="([^"]*)">\\s*<h2>${prefix}\\d+\\.png <span>([a-zA-Z0-9_-]+)</span>`,
    "g",
  );
  const mapping: Record<string, string> = {};
  for (const match of html.matchAll(re)) {
    mapping[`${prefix}${match[1]}`] = match[3];
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

const CACHE_CONTROL = "public,max-age=86400,stale-while-revalidate=604800";

async function uploadOne(
  storagePrefix: "exercise-images" | "self-test-images",
  stem: string,
  id: string,
) {
  const bucket = getStorage().bucket();
  const source = sharp(readFileSync(path.join(ARTWORK_DIR, `${stem}.png`)));

  const png960 = await source
    .clone()
    .resize(960, 960, { fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const webp320 = await source
    .clone()
    .resize(320, 320, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  const webp960 = await source
    .clone()
    .resize(960, 960, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  await bucket.file(`${storagePrefix}/${id}.png`).save(png960, {
    contentType: "image/png",
    resumable: false,
    metadata: { cacheControl: CACHE_CONTROL },
  });
  await bucket.file(`${storagePrefix}/${id}-320.webp`).save(webp320, {
    contentType: "image/webp",
    resumable: false,
    metadata: { cacheControl: CACHE_CONTROL },
  });
  await bucket.file(`${storagePrefix}/${id}-960.webp`).save(webp960, {
    contentType: "image/webp",
    resumable: false,
    metadata: { cacheControl: CACHE_CONTROL },
  });
}

async function main() {
  initAdmin();

  const exerciseMapping = parseMapping("exc");
  const selfTestMapping = parseMapping("selftest");
  console.log(`Uploading ${Object.keys(exerciseMapping).length} exercise images...`);

  let done = 0;
  for (const [stem, id] of Object.entries(exerciseMapping)) {
    await uploadOne("exercise-images", stem, id);
    done += 1;
    if (done % 20 === 0) console.log(`  ${done}/${Object.keys(exerciseMapping).length}`);
  }
  console.log(`Uploaded ${done} exercise images.`);

  console.log(`Uploading ${Object.keys(selfTestMapping).length} self-test images...`);
  done = 0;
  for (const [stem, id] of Object.entries(selfTestMapping)) {
    await uploadOne("self-test-images", stem, id);
    done += 1;
  }
  console.log(`Uploaded ${done} self-test images.`);

  console.log("\nExercise id -> image mapping (for uploadedImageIds):");
  console.log(JSON.stringify(Object.values(exerciseMapping).sort(), null, 0));
  console.log("\nSelf-test id -> image mapping (for uploadedSelfTestImageIds):");
  console.log(JSON.stringify(Object.values(selfTestMapping).sort(), null, 0));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
