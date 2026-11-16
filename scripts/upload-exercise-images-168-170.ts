// Upload the three approved illustrations supplied on 2026-11-16 for
// ex-168 Static Quadriceps, ex-169 Last Degree Knee Extension and
// ex-170 High Sitting Hip Flexion.
//
//   npx tsx --env-file=.env.development scripts/upload-exercise-images-168-170.ts --src=<dir>
//   npx tsx --env-file=.env.production  scripts/upload-exercise-images-168-170.ts --src=<dir>
//   add --dry-run --out=<dir> to write the variants locally instead of uploading.
//
// The supplied PNGs are 1182x1330: a 1182x1182 square illustration with the
// PhysioOnClick brand footer band composited underneath (the band's top rule
// sits at row 1183). Every other library image is served as the clean square
// artwork, with branding applied as a CSS watermark overlay, so this script
// keeps only the square above the band - no duplicate footer, and the full
// pose is retained because nothing above the band is trimmed.
//
// Writes the same objects as upload-exercise-images.ts +
// upload-exercise-pdf-images.ts: {id}.png (960), {id}-320.webp,
// {id}-960.webp and {id}-pdf.png (216).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

const FILES: Record<string, string> = {
  "ex-168": "ex-168-static-quadriceps.png",
  "ex-169": "ex-169-last-degree-knee-extension.png",
  "ex-170": "ex-170-high-sitting-hip-flexion.png",
};

const CACHE_CONTROL = "public,max-age=86400,stale-while-revalidate=604800";

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.slice(name.length + 3);
}

async function variants(file: string) {
  const input = readFileSync(file);
  const { width, height } = await sharp(input).metadata();
  if (!width || !height) throw new Error(`${file}: unreadable image`);
  // Square artwork above the footer band.
  const side = Math.min(width, height);
  const square = await sharp(input).extract({ left: 0, top: 0, width: side, height: side }).toBuffer();
  const src = sharp(square);
  const fit = { fit: "inside" as const, withoutEnlargement: true };
  return {
    png: await src.clone().resize(960, 960, fit).png({ compressionLevel: 9 }).toBuffer(),
    webp320: await src.clone().resize(320, 320, fit).webp({ quality: 82 }).toBuffer(),
    webp960: await src.clone().resize(960, 960, fit).webp({ quality: 85 }).toBuffer(),
    pdf: await src.clone().resize(216, 216, fit).png({ compressionLevel: 9 }).toBuffer(),
  };
}

async function main() {
  const srcDir = arg("src");
  if (!srcDir) throw new Error("pass --src=<directory holding the supplied PNGs>");
  const dryRun = process.argv.includes("--dry-run");
  const outDir = arg("out");

  let bucket: { file(name: string): { save(data: Buffer, opts: object): Promise<void> } } | null = null;
  if (!dryRun) {
    const { cert, getApps, initializeApp } = await import("firebase-admin/app");
    const { getStorage } = await import("firebase-admin/storage");
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const storageBucket = process.env.FIREBASE_ADMIN_STORAGE_BUCKET;
    if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not set");
    if (!storageBucket) throw new Error("FIREBASE_ADMIN_STORAGE_BUCKET is not set");
    if (!getApps().length) initializeApp({ credential: cert(JSON.parse(raw)), storageBucket });
    bucket = getStorage().bucket();
    console.log(`Uploading to ${storageBucket}`);
  }

  for (const [id, name] of Object.entries(FILES)) {
    const v = await variants(path.join(srcDir, name));
    const objects: [string, Buffer, string][] = [
      [`${id}.png`, v.png, "image/png"],
      [`${id}-320.webp`, v.webp320, "image/webp"],
      [`${id}-960.webp`, v.webp960, "image/webp"],
      [`${id}-pdf.png`, v.pdf, "image/png"],
    ];
    for (const [object, data, contentType] of objects) {
      if (bucket) {
        await bucket.file(`exercise-images/${object}`).save(data, {
          contentType,
          resumable: false,
          metadata: { cacheControl: CACHE_CONTROL },
        });
      } else if (outDir) {
        mkdirSync(outDir, { recursive: true });
        writeFileSync(path.join(outDir, object), data);
      }
    }
    console.log(`${id}: ${objects.map(([o, d]) => `${o} ${d.length}B`).join(", ")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
