// One-off upload of the 2026-09-20 self-test photo pack to Firebase Storage.
// Run with: npx tsx --env-file=.env.development scripts/upload-self-test-images-2026-09-20.ts
// (swap .env.development for .env.production to push the same pack to prod).
//
// Source assets:
// generated-assets/self-check-test-photos-2026-09-20/{png,webp/1200,manifest.json}
// (untracked). The pack's manifest only gives a sequence number per file
// (selftest01.png .. selftest49.png) — it does not carry the target
// `step.imageId`. Rather than hand-copy a sequence->id table (which would
// silently go stale if `lib/self-test-image-prompts.ts` is ever reordered),
// this script derives the mapping by matching each pack prompt's "Primary
// request: ..." sentence against the `core` phrase authored per imageId in
// `selfTestImagePrompts` — the pack was generated from those exact phrases,
// so every one must match exactly, or the script refuses to upload.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import sharp from "sharp";

import {
  selfTestImagePrompts,
  SELF_TEST_IMAGE_STYLE_PREFIX,
  SELF_TEST_IMAGE_STYLE_SUFFIX,
} from "../lib/self-test-image-prompts";

const PACK_DIR = path.resolve(
  __dirname,
  "../generated-assets/self-check-test-photos-2026-09-20",
);
const PNG_DIR = path.join(PACK_DIR, "png");
const PROMPTS_DIR = path.join(PACK_DIR, "prompts");

function buildMapping(): Record<string, string> {
  // Exact expected sentence (as the pack would have generated it from the
  // style contract) -> imageId. Exact-string matching (not startsWith)
  // avoids one core phrase ever being mistaken for a prefix of another.
  const sentenceToId = new Map<string, string>();
  for (const [id, core] of Object.entries(selfTestImagePrompts)) {
    sentenceToId.set(`${SELF_TEST_IMAGE_STYLE_PREFIX}${core}${SELF_TEST_IMAGE_STYLE_SUFFIX}`, id);
  }

  const files = readdirSync(PROMPTS_DIR).filter((f) => /^selftest\d+\.txt$/.test(f)).sort();
  const mapping: Record<string, string> = {};
  const unmatched: string[] = [];

  for (const file of files) {
    const stem = file.replace(/\.txt$/, ""); // "selftest01"
    const text = readFileSync(path.join(PROMPTS_DIR, file), "utf8").trim();
    const match = text.match(/^Primary request:\s*(.*)$/m);
    const sentence = match?.[1];
    const id = sentence ? sentenceToId.get(sentence) : undefined;
    if (!id) { unmatched.push(stem); continue; }
    mapping[stem] = id;
  }

  if (unmatched.length > 0) {
    throw new Error(
      `Could not match ${unmatched.length} pack prompt(s) to a known self-test imageId: ${unmatched.join(", ")}. ` +
      `Refusing to upload — check the pack against lib/self-test-image-prompts.ts by hand.`,
    );
  }
  const ids = Object.values(mapping);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Duplicate imageId matched by more than one pack file — mapping is ambiguous, aborting.");
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

async function uploadOne(stem: string, id: string) {
  const bucket = getStorage().bucket();
  const source = sharp(readFileSync(path.join(PNG_DIR, `${stem}.png`)));

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

  await bucket.file(`self-test-images/${id}.png`).save(png960, {
    contentType: "image/png",
    resumable: false,
    metadata: { cacheControl: CACHE_CONTROL },
  });
  await bucket.file(`self-test-images/${id}-320.webp`).save(webp320, {
    contentType: "image/webp",
    resumable: false,
    metadata: { cacheControl: CACHE_CONTROL },
  });
  await bucket.file(`self-test-images/${id}-960.webp`).save(webp960, {
    contentType: "image/webp",
    resumable: false,
    metadata: { cacheControl: CACHE_CONTROL },
  });
}

async function main() {
  const mapping = buildMapping();
  console.log(`Matched ${Object.keys(mapping).length} pack files to self-test imageIds.`);

  initAdmin();

  let done = 0;
  for (const [stem, id] of Object.entries(mapping)) {
    await uploadOne(stem, id);
    done += 1;
    if (done % 10 === 0) console.log(`  ${done}/${Object.keys(mapping).length}`);
  }
  console.log(`Uploaded ${done} self-test images to bucket ${process.env.FIREBASE_ADMIN_STORAGE_BUCKET}.`);

  console.log("\nSelf-test imageIds now uploaded (paste into uploadedSelfTestImageIds):");
  console.log(JSON.stringify(Object.values(mapping).sort(), null, 0));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
