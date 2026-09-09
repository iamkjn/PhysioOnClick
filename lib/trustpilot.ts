// lib/trustpilot.ts
// Server-side read of the practice's Trustpilot Business Unit — overall score
// plus the best recent reviews — for rendering on the marketing site in our
// own design. Everything here is best-effort: any missing config or API error
// returns null and callers fall back to the static testimonials in
// lib/site-data.ts.

const API_BASE = "https://api.trustpilot.com/v1";

export interface TrustpilotReview {
  id: string;
  stars: number;
  title: string;
  text: string;
  createdAt: string;
  author: string;
}

export interface TrustpilotSummary {
  trustScore: number; // e.g. 4.8
  stars: number; // rounded half-star, e.g. 4.5
  total: number; // number of reviews
  profileUrl: string;
  reviews: TrustpilotReview[];
}

interface CacheEntry {
  at: number;
  data: TrustpilotSummary | null;
}
let cache: CacheEntry | null = null;
const TTL_MS = 60 * 60 * 1000; // 1 hour

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      console.error("[trustpilot] HTTP", res.status, url.split("?")[0]);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error("[trustpilot] fetch failed", err);
    return null;
  }
}

/**
 * `minStars` filters which reviews come back (default 4 = show 4- and 5-star).
 * `limit` caps how many. The overall score/total is always the true figure for
 * the whole business unit, never a filtered subset — Trustpilot's display
 * rules require showing the honest rating alongside selected reviews.
 */
export async function getTrustpilotSummary(
  { minStars = 4, limit = 6 }: { minStars?: number; limit?: number } = {}
): Promise<TrustpilotSummary | null> {
  const key = process.env.TRUSTPILOT_API_KEY;
  const businessUnitId = process.env.TRUSTPILOT_BUSINESS_UNIT_ID;
  if (!key || !businessUnitId) return null;

  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;

  const auth = `apikey=${encodeURIComponent(key)}`;
  const starsQuery = Array.from({ length: 5 - minStars + 1 }, (_, i) => `stars=${minStars + i}`).join("&");

  const [unit, reviewsResp] = await Promise.all([
    fetchJson<{
      score?: { trustScore?: number; stars?: number };
      numberOfReviews?: { total?: number };
      profileUrl?: string;
    }>(`${API_BASE}/business-units/${businessUnitId}?${auth}`),
    fetchJson<{
      reviews?: Array<{
        id: string;
        stars: number;
        title?: string;
        text?: string;
        createdAt: string;
        consumer?: { displayName?: string };
      }>;
    }>(`${API_BASE}/business-units/${businessUnitId}/reviews?${auth}&${starsQuery}&orderBy=createdat.desc&perPage=${limit * 2}`),
  ]);

  if (!unit || !reviewsResp) {
    cache = { at: Date.now(), data: null };
    return null;
  }

  const reviews: TrustpilotReview[] = (reviewsResp.reviews ?? [])
    .filter((r) => r.stars >= minStars && (r.text ?? "").trim().length > 0)
    .slice(0, limit)
    .map((r) => ({
      id: r.id,
      stars: r.stars,
      title: (r.title ?? "").trim(),
      text: (r.text ?? "").trim(),
      createdAt: r.createdAt,
      author: (r.consumer?.displayName ?? "Verified patient").trim(),
    }));

  const data: TrustpilotSummary = {
    trustScore: unit.score?.trustScore ?? 0,
    stars: unit.score?.stars ?? 0,
    total: unit.numberOfReviews?.total ?? reviews.length,
    profileUrl: unit.profileUrl || "https://www.trustpilot.com/review/physioonclick.co.uk",
    reviews,
  };
  cache = { at: Date.now(), data };
  return data;
}
