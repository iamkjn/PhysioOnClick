/**
 * scripts/upload-exercise-images.ts
 *
 * Uploads generated exercise illustrations to Firebase Storage.
 *
 * Usage:
 *   npx tsx --env-file=.env.development scripts/upload-exercise-images.ts --only=ex-3,ex-14
 *   npx tsx --env-file=.env.development scripts/upload-exercise-images.ts --all
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
import { exerciseImagePrompts } from "../lib/exercise-image-prompts";
import { uploadObject } from "../lib/firebase-admin";

interface UploadArgs {
  only?: string[];
  all?: boolean;
}

function parseArgs(args: string[]): UploadArgs {
  const result: UploadArgs = {};

  for (const arg of args) {
    if (arg.startsWith("--only=")) {
      result.only = arg.slice(7).split(",");
    } else if (arg === "--all") {
      result.all = true;
    }
  }

  return result;
}

function getIdsToUpload(args: UploadArgs): string[] {
  if (args.only) {
    return args.only;
  }
  if (args.all) {
    return Object.keys(exerciseImagePrompts);
  }

  console.error("Usage:");
  console.error("  npx tsx --env-file=.env.development scripts/upload-exercise-images.ts --only=ex-3,ex-14");
  console.error("  npx tsx --env-file=.env.development scripts/upload-exercise-images.ts --all");
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

  console.log(
    `\nDone. Now add these ids to \`uploadedImageIds\` in lib/exercise-image-prompts.ts\n` +
      `and commit — that is the gate the web card and PDF use to switch from the\n` +
      `stick figure to the real illustration:\n  ${ids.join(", ")}`,
  );
}

main().catch((error) => {
  console.error("Image upload failed:", error);
  process.exit(1);
});
