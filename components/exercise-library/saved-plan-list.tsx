"use client";

// The "Your saved exercises" list rendered in the #my-plan section of the
// library index. The full exercise index is passed in from the server page;
// this component reads the visitor's localStorage plan on mount (never during
// render, so SSR and first paint match) and maps the saved slugs onto it,
// preserving plan order and dropping any slug that is no longer a real exercise.

import { useEffect, useState } from "react";
import Link from "next/link";

import { getPlan, onPlanChange, removeFromPlan } from "@/lib/exercise-plan-store";
import { TrackedBookLink } from "@/components/tracked-book-link";

type SavedExerciseSummary = {
  slug: string;
  title: string;
  bodyPart?: string;
  stage?: string;
};

export function SavedPlanList({
  items,
}: {
  items: SavedExerciseSummary[];
}) {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    setSlugs(getPlan());
    return onPlanChange((next) => setSlugs(next));
  }, []);

  const itemBySlug = new Map(items.map((item) => [item.slug, item]));
  const saved = slugs
    .map((slug) => itemBySlug.get(slug))
    .filter((item): item is SavedExerciseSummary => Boolean(item));

  if (saved.length === 0) {
    return (
      <div className="exlib-saved exlib-saved--empty">
        <div className="exlib-saved__empty-icon" aria-hidden="true">+</div>
        <div>
          <h3>Build a shortlist before you book</h3>
          <p>
            Save exercises that look relevant, then bring that shortlist into
            your assessment so your physiotherapist can shape it into a safe plan.
          </p>
        </div>
        <Link className="button secondary small" href="#exercise-browser">
          Browse exercises
        </Link>
      </div>
    );
  }

  return (
    <div className="exlib-saved">
      <div className="exlib-saved__summary">
        <div>
          <span className="eyebrow">Saved exercise plan</span>
          <h3>{saved.length} saved for review</h3>
          <p>
            These are your interests, not a prescription yet. We will use them
            as a starting point for the right dose, order and progression.
          </p>
        </div>
        <TrackedBookLink
          className="button primary"
          href="/book?service=initial-assessment&source=saved-exercise-plan"
          serviceSlug="initial-assessment"
          source="exercise-plan-list"
          growthEvent="saved_plan_booking_intent"
          growthParams={{
            source: "exercise_saved_section",
            service_slug: "initial-assessment",
            saved_count: saved.length,
          }}
        >
          Review with a physio
        </TrackedBookLink>
      </div>
      <ul className="exlib-saved__list">
        {saved.map((item, index) => (
          <li key={item.slug} className="exlib-saved__item">
            <div className="exlib-saved__item-main">
              <span className="exlib-saved__number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <Link className="exlib-saved__link" href={`/exercises/${item.slug}`}>
                  {item.title}
                </Link>
                <p>
                  {[item.bodyPart, item.stage].filter(Boolean).join(" · ") ||
                    "Exercise guide"}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="exlib-saved__remove"
              onClick={() => removeFromPlan(item.slug)}
            >
              Remove
              <span className="sr-only"> {item.title} from your plan</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
