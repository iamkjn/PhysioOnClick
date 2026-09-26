// components/trustpilot-reviews.tsx
import { Reveal } from "@/components/reveal";
import { getTrustpilotSummary } from "@/lib/trustpilot";

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
  const summary = await getTrustpilotSummary({ minStars: 4, limit });

  // No genuine reviews to show (Trustpilot not configured, unreachable, or no
  // 4-5 star reviews yet): render nothing rather than placeholder quotes.
  if (!summary || summary.reviews.length === 0) {
    return null;
  }

  return (
    <div className="home-testimonial-stack">
      <Reveal direction="up">
        <a
          className="tp-summary"
          href={summary.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="tp-summary-score">
            <strong>{summary.trustScore.toFixed(1)}</strong>
            <Stars value={summary.stars} />
          </span>
          <span className="tp-summary-meta">
            {summary.total.toLocaleString("en-GB")} review{summary.total === 1 ? "" : "s"} on{" "}
            <strong>Trustpilot</strong> &middot; read them all &rarr;
          </span>
        </a>
      </Reveal>
      {summary.reviews.map((r, i) => (
        <Reveal key={r.id} direction="up" delay={75 + i * 60}>
          <blockquote className="card home-testimonial-card">
            <Stars value={r.stars} />
            {r.title && <p className="tp-review-title">&ldquo;{r.title}&rdquo;</p>}
            <p>{r.text}</p>
            <footer>
              <strong>{r.author}</strong>
              <span>
                Verified Trustpilot review &middot;{" "}
                {new Date(r.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
              </span>
            </footer>
          </blockquote>
        </Reveal>
      ))}
    </div>
  );
}
