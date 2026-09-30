// components/service-reviews.tsx
// "What patients say" block for the services pages: renders the given
// owner-confirmed Trustpilot excerpts (see lib/trustpilot-curated.ts). Server
// component; renders nothing when there are none.

import { Reveal } from "@/components/reveal";
import { Stars } from "@/components/trustpilot-reviews";
import type { TrustpilotReview } from "@/lib/trustpilot";
import { TRUSTPILOT_PROFILE_URL } from "@/lib/trustpilot-curated";

export function ServiceReviews({ reviews }: { reviews: TrustpilotReview[] }) {
  if (reviews.length === 0) return null;

  return (
    <section className="page-section stack simple-services-list">
      <Reveal direction="up">
        <div className="section-heading">
          <h2>What patients say</h2>
          <p>
            In their own words, from our{" "}
            <a
              className="service-reviews-link"
              href={TRUSTPILOT_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Trustpilot reviews
            </a>
            .
          </p>
        </div>
      </Reveal>
      {reviews.map((r) => (
        <Reveal key={r.id} direction="up">
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
    </section>
  );
}
