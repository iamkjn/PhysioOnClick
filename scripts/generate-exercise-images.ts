/**
 * scripts/generate-exercise-images.ts
 *
 * Generates exercise illustrations using the Gemini Imagen 3.0 API.
 *
 * Usage:
 *   npx tsx --env-file=.env.development scripts/generate-exercise-images.ts --only=ex-3,ex-14
 *   npx tsx --env-file=.env.development scripts/generate-exercise-images.ts --all   (every authored prompt)
 *
 * The first run must be verified:
 *   If the Imagen endpoint (imagen-3.0-generate-002) returns 403/404 for this key,
 *   it may indicate that Imagen requires a paid tier. The fallback is to:
 *   1. Switch the endpoint to OpenAI (requires OPENAI_API_KEY in .env)
 *   2. Manually generate the images and place them in exercise-images-src/
 *
 * Writes PNG files to exercise-images-src/{id}.png.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { exerciseImagePrompts, fullImagePrompt } from "../lib/exercise-image-prompts";

interface GenerateArgs {
  only?: string[];
  all?: boolean;
}

function parseArgs(args: string[]): GenerateArgs {
  const result: GenerateArgs = {};

  for (const arg of args) {
    if (arg.startsWith("--only=")) {
      result.only = arg.slice(7).split(",");
    } else if (arg === "--all") {
      result.all = true;
    }
  }

  return result;
}

function getIdsToGenerate(args: GenerateArgs): string[] {
  if (args.only) {
    return args.only;
  }
  if (args.all) {
    return Object.keys(exerciseImagePrompts);
  }

  console.error("Usage:");
  console.error("  npx tsx --env-file=.env.development scripts/generate-exercise-images.ts --only=ex-3,ex-14");
  console.error("  npx tsx --env-file=.env.development scripts/generate-exercise-images.ts --all");
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

  // The Imagen `:predict` models are not exposed on the Generative Language
  // API for a standard Gemini key (404). The available image model is
  // `gemini-2.5-flash-image` ("Nano Banana") via `generateContent` with an
  // IMAGE response modality. NOTE: image generation needs **billing enabled**
  // on the key's Google AI project — a free-tier key returns HTTP 429
  // "You exceeded your current quota". Set `EXERCISE_IMAGE_MODEL` to override.
  const model = process.env.EXERCISE_IMAGE_MODEL || "gemini-2.5-flash-image";
  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  );
  url.searchParams.set("key", apiKey);

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["IMAGE"] }
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[${id}] image API (${model}) returned ${response.status}: ${text}`);
      return;
    }

    const json = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }>;
    };
    const base64 = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData?.data;

    if (!base64) {
      console.error(`[${id}] image API response contained no inline image data`);
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
