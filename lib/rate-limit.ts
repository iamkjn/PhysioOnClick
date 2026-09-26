// lib/rate-limit.ts
// Per-client rate limiting for public, unauthenticated endpoints (chat, enquiry).
//
// In production this uses Cloudflare's Workers Rate Limiting bindings declared
// in wrangler.jsonc (CHAT_RATE_LIMITER / FORM_RATE_LIMITER), which are shared
// across isolates in a Cloudflare location. Outside a Worker (next dev, tests)
// or if the binding is missing, it falls back to a best-effort in-memory
// sliding window. The in-memory map is per-isolate, so on its own it is only
// a speed bump; the binding is the real protection.
import { getCloudflareContext } from "@opennextjs/cloudflare";

export type RateLimiterBinding = "CHAT_RATE_LIMITER" | "FORM_RATE_LIMITER";

interface CloudflareRateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

// Fallback limits mirror the wrangler.jsonc `simple` configs.
const FALLBACK: Record<RateLimiterBinding, { limit: number; windowMs: number }> = {
  CHAT_RATE_LIMITER: { limit: 15, windowMs: 60_000 },
  FORM_RATE_LIMITER: { limit: 3, windowMs: 60_000 },
};

const memory = new Map<string, number[]>();

export function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function memoryLimited(binding: RateLimiterBinding, key: string): boolean {
  const { limit, windowMs } = FALLBACK[binding];
  const now = Date.now();
  const bucket = `${binding}:${key}`;
  const hits = (memory.get(bucket) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    memory.set(bucket, hits);
    return true;
  }
  hits.push(now);
  memory.set(bucket, hits);
  return false;
}

/** True when this client has exceeded the limit and the request should be rejected. */
export async function isRateLimited(binding: RateLimiterBinding, key: string): Promise<boolean> {
  let limiter: CloudflareRateLimiter | undefined;
  try {
    const { env } = getCloudflareContext();
    limiter = (env as unknown as Record<string, CloudflareRateLimiter | undefined>)[binding];
  } catch {
    // Not running inside a Worker (next dev / tests).
  }

  if (limiter) {
    try {
      const { success } = await limiter.limit({ key });
      return !success;
    } catch (error) {
      console.error(`[rate-limit] ${binding} failed, using in-memory fallback`, error);
    }
  }
  return memoryLimited(binding, key);
}

/** Test helper: clear the in-memory fallback state. */
export function resetRateLimitMemory() {
  memory.clear();
}
