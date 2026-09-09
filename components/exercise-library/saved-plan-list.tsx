"use client";

// The "Your saved exercises" list rendered in the #my-plan section of the
// library index. The full exercise index is passed in from the server page;
// this component reads the visitor's localStorage plan on mount (never during
// render, so SSR and first paint match) and maps the saved slugs onto it,
// preserving plan order and dropping any slug that is no longer a real exercise.

import { useEffect, useState } from "react";

import { getPlan, onPlanChange, removeFromPlan } from "@/lib/exercise-plan-store";
import { TrackedBookLink } from "@/components/tracked-book-link";

export function SavedPlanList({
  items,
}: {
  items: { slug: string; title: string }[];
}) {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    setSlugs(getPlan());
    return onPlanChange((next) => setSlugs(next));
  }, []);

  const titleBySlug = new Map(items.map((item) => [item.slug, item.title]));
  const saved = slugs
    .filter((slug) => titleBySlug.has(slug))
    .map((slug) => ({ slug, title: titleBySlug.get(slug) as string }));

  if (saved.length === 0) {
    return (
      <p className="exlib-saved__empty">
        {`You haven't saved any exercises yet. Tap "Add to my plan" on any exercise page to build a list here.`}
      </p>
    );
  }

  return (
    <div className="exlib-saved">
      <ul className="exlib-saved__list">
        {saved.map((item) => (
          <li key={item.slug} className="exlib-saved__item">
            <a className="exlib-saved__link" href={`/exercises/${item.slug}`}>
              {item.title}
            </a>
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
      <p className="exlib-saved__cta">
        <TrackedBookLink
          href="/book"
          serviceSlug="musculoskeletal-physiotherapy"
          source="exercise-plan-list"
        >
          Book an assessment to get a tailored plan
        </TrackedBookLink>
      </p>
    </div>
  );
}
