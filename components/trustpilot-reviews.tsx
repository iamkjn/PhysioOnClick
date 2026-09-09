// components/trustpilot-reviews.tsx
import { Reveal } from "@/components/reveal";
import { getTrustpilotSummary } from "@/lib/trustpilot";
import type { Testimonial } from "@/lib/site-data";

interface Props {
  // Shown when Trustpilot isn't configured or the API is unreachable.
  fallback: Testimonial[];
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

export async function TrustpilotReviews({ fallback, limit = 4 }: Props) {
  const summary = await getTrustpilotSummary({ minStars: 4, limit });

  if (!summary || summary.reviews.length === 0) {
    return (
      <div className="home-testimonial-stack">
        {fallback.slice(0, 2).map((t, i) => (
          <Reveal key={t.name} direction="up" delay={75 + i * 75}>
            <blockquote className="card home-testimonial-card">
              <p>&ldquo;{t.quote}&rdquo;</p>
              <footer>
                <strong>{t.name}</strong>
                <span>
                  {t.location} &middot; {t.focus}
                </span>
              </footer>
            </blockquote>
          </Reveal>
        ))}
      </div>
    );
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
