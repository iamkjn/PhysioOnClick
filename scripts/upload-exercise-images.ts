/**
 * scripts/upload-exercise-images.ts
 *
 * Uploads generated exercise illustrations to Firebase Storage.
 *
 * Usage:
 *   npx tsx --env-file=.env.development scripts/upload-exercise-images.ts --only=ex-3,ex-14
 *   npx tsx --env-file=.env.development scripts/upload-exercise-images.ts --batch=1
 *
 * Reads PNG files from exercise-images-src/{id}.png and uploads them to
 * exercise-images/{id}.png in Firebase Storage.
 *
 * Requires:
 *   - FIREBASE_SERVICE_ACCOUNT_JSON (service account credentials)
 *   - FIREBASE_ADMIN_STORAGE_BUCKET (GCS bucket name)
 *
 * Must run via firebase-admin's authentication layer; uses lib/firebase-admin.ts uploadObject().
 */

import { readFileSync } from "node:fs";
import { uploadObject } from "../lib/firebase-admin";

// List of all exercise ids for batch upload (from task brief)
const BATCH_1_IDS = [
  "ex-3",
  "ex-14",
  "ex-15",
  "ex-17",
  "ex-18",
  "ex-24",
  "ex-25",
  "ex-26",
  "ex-27",
  "ex-28",
  "ex-31",
  "ex-32",
  "ex-34"
];

interface UploadArgs {
  only?: string[];
  batch?: number;
}

function parseArgs(args: string[]): UploadArgs {
  const result: UploadArgs = {};

  for (const arg of args) {
    if (arg.startsWith("--only=")) {
      result.only = arg.slice(7).split(",");
    } else if (arg.startsWith("--batch=")) {
      const batch = parseInt(arg.slice(8), 10);
      if (!isNaN(batch)) result.batch = batch;
    }
  }

  return result;
}

function getIdsToUpload(args: UploadArgs): string[] {
  if (args.only) {
    return args.only;
  }
  if (args.batch === 1) {
    return BATCH_1_IDS;
  }

  console.error("Usage:");
  console.error("  npx tsx --env-file=.env.development scripts/upload-exercise-images.ts --only=ex-3,ex-14");
  console.error("  npx tsx --env-file=.env.development scripts/upload-exercise-images.ts --batch=1");
  process.exit(1);
}

async function uploadImage(id: string): Promise<void> {
  const localPath = `exercise-images-src/${id}.png`;

  let buf: Buffer;
  try {
    buf = readFileSync(localPath);
  } catch (error) {
    console.warn(`Skipping ${id}: file not found at ${localPath}`);
    return;
  }

  const storagePath = `exercise-images/${id}.png`;
  const result = await uploadObject(storagePath, new Uint8Array(buf), "image/png");

  if (result.ok) {
    console.log(`uploaded ${storagePath} (${buf.length} bytes)`);
  } else {
    console.error(`failed to upload ${storagePath}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const ids = getIdsToUpload(args);

  console.log(`Uploading ${ids.length} exercise image(s)...`);

  for (const id of ids) {
    await uploadImage(id);
  }
}

main().catch((error) => {
  console.error("Image upload failed:", error);
  process.exit(1);
});
