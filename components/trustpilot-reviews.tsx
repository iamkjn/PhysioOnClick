// components/trustpilot-reviews.tsx
import { Reveal } from "@/components/reveal";
import { getTrustpilotSummary } from "@/lib/trustpilot";
import { curatedTrustpilotReviews, TRUSTPILOT_PROFILE_URL } from "@/lib/trustpilot-curated";

interface Props {
  limit?: number;
}

function Stars({ value }: { value: number }) {
  return (
    <span className="tp-stars" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < Math.round(value) ? "tp-star is-on" : "tp-star"}>
          ★
        </span>
      ))}
    </span>
  );
}

export async function TrustpilotReviews({ limit = 4 }: Props) {
  // Live Trustpilot data when the Business API is configured; otherwise the
  // owner-confirmed excerpts in lib/trustpilot-curated.ts. The curated set has
  // no score/total because a hardcoded figure would silently go stale.
  const live = await getTrustpilotSummary({ minStars: 4, limit });
  const reviews = live?.reviews.length ? live.reviews : curatedTrustpilotReviews.slice(0, limit);
  const profileUrl = live?.profileUrl ?? TRUSTPILOT_PROFILE_URL;

  // Nothing genuine to show: render nothing rather than placeholder quotes.
  if (reviews.length === 0) {
    return null;
  }

  return (
    <div className="home-testimonial-stack">
      <Reveal direction="up">
        <a
          className="tp-summary"
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {live?.reviews.length ? (
            <>
              <span className="tp-summary-score">
                <strong>{live.trustScore.toFixed(1)}</strong>
                <Stars value={live.stars} />
              </span>
              <span className="tp-summary-meta">
                {live.total.toLocaleString("en-GB")} review{live.total === 1 ? "" : "s"} on{" "}
                <strong>Trustpilot</strong> &middot; read them all &rarr;
              </span>
            </>
          ) : (
            <span className="tp-summary-meta">
              Selected patient reviews from <strong>Trustpilot</strong> &middot; read them all &rarr;
            </span>
          )}
        </a>
      </Reveal>
      {reviews.map((r, i) => (
        <Reveal key={r.id} direction="up" delay={75 + i * 60}>
          <blockquote className="card home-testimonial-card">
            <Stars value={r.stars} />
            {r.title && <p className="tp-review-title">&ldquo;{r.title}&rdquo;</p>}
            <p>{r.text}</p>
            <footer>
              <strong>{r.author}</strong>
              <span>
                Review on Trustpilot &middot;{" "}
                {new Date(r.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
              </span>
            </footer>
          </blockquote>
        </Reveal>
      ))}
    </div>
  );
}
