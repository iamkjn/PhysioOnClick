/**
 * scripts/generate-exercise-images.ts
 *
 * Generates exercise illustrations using the Gemini Imagen 3.0 API.
 *
 * Usage:
 *   npx tsx --env-file=.env.development scripts/generate-exercise-images.ts --only=ex-3,ex-14
 *   npx tsx --env-file=.env.development scripts/generate-exercise-images.ts --batch=1
 *
 * The first run must be verified:
 *   If the Imagen endpoint (imagen-3.0-generate-002) returns 403/404 for this key,
 *   it may indicate that Imagen requires a paid tier. The fallback is to:
 *   1. Switch the endpoint to OpenAI (requires OPENAI_API_KEY in .env)
 *   2. Manually generate the images and place them in exercise-images-src/
 *
 * Writes PNG files to exercise-images-src/{id}.png.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fullImagePrompt } from "../lib/exercise-image-prompts";

// List of all exercise ids for batch generation (from task brief)
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

interface GenerateArgs {
  only?: string[];
  batch?: number;
}

function parseArgs(args: string[]): GenerateArgs {
  const result: GenerateArgs = {};

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

function getIdsToGenerate(args: GenerateArgs): string[] {
  if (args.only) {
    return args.only;
  }
  if (args.batch === 1) {
    return BATCH_1_IDS;
  }

  console.error("Usage:");
  console.error("  npx tsx --env-file=.env.development scripts/generate-exercise-images.ts --only=ex-3,ex-14");
  console.error("  npx tsx --env-file=.env.development scripts/generate-exercise-images.ts --batch=1");
  process.exit(1);
}

async function generateImage(id: string): Promise<void> {
  const prompt = fullImagePrompt(id);

  if (!prompt) {
    console.warn(`Skipping ${id}: no image prompt defined`);
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY env var");
  }

  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict`
  );
  url.searchParams.set("key", apiKey);

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1, aspectRatio: "1:1" }
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[${id}] Imagen API returned ${response.status}: ${text}`);
      return;
    }

    const json = (await response.json()) as { predictions?: Array<{ bytesBase64Encoded?: string }> };
    const base64 = json.predictions?.[0]?.bytesBase64Encoded;

    if (!base64) {
      console.error(`[${id}] Imagen API response missing bytesBase64Encoded`);
      return;
    }

    // Create output directory if needed
    mkdirSync("exercise-images-src", { recursive: true });

    // Decode and write
    const buf = Buffer.from(base64, "base64");
    const filePath = `exercise-images-src/${id}.png`;
    writeFileSync(filePath, buf);
    console.log(`wrote ${filePath} (${buf.length} bytes)`);
  } catch (error) {
    console.error(`[${id}] Error generating image:`, error);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const ids = getIdsToGenerate(args);

  console.log(`Generating ${ids.length} exercise image(s)...`);

  for (const id of ids) {
    await generateImage(id);
  }
}

main().catch((error) => {
  console.error("Image generation failed:", error);
  process.exit(1);
});
