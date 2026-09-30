// components/service-reviews.tsx
// "What patients say" block on a service page: the owner-confirmed Trustpilot
// excerpts mapped to that service in lib/trustpilot-curated.ts. Server
// component; renders nothing for services with no mapped review.

import { Reveal } from "@/components/reveal";
import { Stars } from "@/components/trustpilot-reviews";
import { curatedReviewsForService, TRUSTPILOT_PROFILE_URL } from "@/lib/trustpilot-curated";

export function ServiceReviews({ serviceSlug }: { serviceSlug: string }) {
  const reviews = curatedReviewsForService(serviceSlug);
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
