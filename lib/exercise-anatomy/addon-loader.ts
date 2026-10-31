// lib/exercise-anatomy/addon-loader.ts
// Downloads the exercise add-on model (public/models/exercise-anatomy) once
// per page load. Only exercises whose muscles live in the add-on ask for it.

import { readChunk, type BodyModelManifest } from "@/lib/body-model-format";
import { readModelFile, type BodyModel } from "@/lib/body-model-loader";
import { ANATOMY_ADDON_DIR } from "@/lib/exercise-anatomy/addon-parts";

let pending: Promise<BodyModel> | null = null;

export function loadAnatomyAddon(): Promise<BodyModel> {
  pending ??= (async () => {
    const res = await fetch(`${ANATOMY_ADDON_DIR}/manifest.json`);
    if (!res.ok) throw new Error(`Anatomy add-on manifest failed (${res.status})`);
    const manifest = (await res.json()) as BodyModelManifest;
    const chunks = await Promise.all(
      manifest.chunks.map(async (chunk) =>
        readChunk(chunk, await readModelFile(await fetch(`${ANATOMY_ADDON_DIR}/${chunk.file}`), chunk.bytes))
      )
    );
    return { manifest, chunks };
  })().catch((error: unknown) => {
    pending = null;
    throw error;
  });
  return pending;
}

/** Test-only: forget the cached add-on. */
export function resetAnatomyAddonForTests(): void {
  pending = null;
}
