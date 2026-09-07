/**
 * scripts/generate-exercise-images.ts
 *
 * Generates exercise illustrations from the prompts in
 * lib/exercise-image-prompts.ts and writes PNGs to exercise-images-src/{id}.png.
 *
 * Provider (auto-detected, override with EXERCISE_IMAGE_PROVIDER=openai|gemini):
 *   - openai  — gpt-image-1 via https://api.openai.com/v1/images/generations.
 *               Needs OPENAI_API_KEY (a platform.openai.com key with billing —
 *               NOT a ChatGPT Plus subscription). ~$0.04 / 1024px image at
 *               medium quality. Set EXERCISE_IMAGE_QUALITY=low|medium|high
 *               (default medium).
 *   - gemini  — gemini-2.5-flash-image via generateContent. Needs GEMINI_API_KEY
 *               with **billing enabled** on its Google AI project (a free-tier
 *               key returns HTTP 429). Set EXERCISE_IMAGE_MODEL to override.
 *
 * Usage:
 *   npx tsx --env-file=.env.development scripts/generate-exercise-images.ts --only=ex-3,ex-14
 *   npx tsx --env-file=.env.development scripts/generate-exercise-images.ts --all
 *
 * Then: scripts/brand-exercise-images.ts, physio review, scripts/upload-exercise-images.ts.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { exerciseImagePrompts, fullImagePrompt } from "../lib/exercise-image-prompts";

interface GenerateArgs {
  only?: string[];
  all?: boolean;
}

function parseArgs(args: string[]): GenerateArgs {
  const result: GenerateArgs = {};
  for (const arg of args) {
    if (arg.startsWith("--only=")) result.only = arg.slice(7).split(",");
    else if (arg === "--all") result.all = true;
  }
  return result;
}

function getIdsToGenerate(args: GenerateArgs): string[] {
  if (args.only) return args.only;
  if (args.all) return Object.keys(exerciseImagePrompts);
  console.error("Usage:");
  console.error("  npx tsx --env-file=.env.development scripts/generate-exercise-images.ts --only=ex-3,ex-14");
  console.error("  npx tsx --env-file=.env.development scripts/generate-exercise-images.ts --all");
  process.exit(1);
}

type Provider = "openai" | "gemini";

function chooseProvider(): Provider {
  const forced = process.env.EXERCISE_IMAGE_PROVIDER?.toLowerCase();
  if (forced === "openai" || forced === "gemini") return forced;
  if (process.env.OPENAI_API_KEY) return "openai";
  return "gemini";
}

/** Returns base64 PNG data, or null on a (logged) failure. */
async function openaiImage(id: string, prompt: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY env var");
  const quality = (process.env.EXERCISE_IMAGE_QUALITY || "medium").toLowerCase();

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1024",
      quality,
      background: "opaque",
    }),
  });
  if (!res.ok) {
    console.error(`[${id}] OpenAI images API returned ${res.status}: ${await res.text()}`);
    return null;
  }
  const json = (await res.json()) as { data?: Array<{ b64_json?: string }> };
  return json.data?.[0]?.b64_json ?? null;
}

async function geminiImage(id: string, prompt: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY env var");
  const model = process.env.EXERCISE_IMAGE_MODEL || "gemini-2.5-flash-image";
  const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`);
  url.searchParams.set("key", key);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });
  if (!res.ok) {
    console.error(`[${id}] Gemini image API (${model}) returned ${res.status}: ${await res.text()}`);
    return null;
  }
  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string } }> } }>;
  };
  return json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData?.data ?? null;
}

async function generateImage(id: string, provider: Provider): Promise<void> {
  const prompt = fullImagePrompt(id);
  if (!prompt) {
    console.warn(`Skipping ${id}: no image prompt defined`);
    return;
  }
  try {
    const base64 = provider === "openai" ? await openaiImage(id, prompt) : await geminiImage(id, prompt);
    if (!base64) {
      console.error(`[${id}] no image data in the response`);
      return;
    }
    mkdirSync("exercise-images-src", { recursive: true });
    const buf = Buffer.from(base64, "base64");
    const filePath = `exercise-images-src/${id}.png`;
    writeFileSync(filePath, buf);
    console.log(`wrote ${filePath} (${Math.round(buf.length / 1024)} KB)`);
  } catch (error) {
    console.error(`[${id}] Error generating image:`, error);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const ids = getIdsToGenerate(args);
  const provider = chooseProvider();
  console.log(`Generating ${ids.length} exercise image(s) via ${provider}...`);
  for (const id of ids) await generateImage(id, provider);
}

main().catch((error) => {
  console.error("Image generation failed:", error);
  process.exit(1);
});
