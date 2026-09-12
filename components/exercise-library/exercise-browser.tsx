"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { ExerciseImage } from "@/components/exercise-image";
import type { Exercise } from "@/lib/exercise-library";

type BrowserExercise = Pick<
  Exercise,
  | "id"
  | "slug"
  | "title"
  | "bodyPart"
  | "condition"
  | "stage"
  | "description"
  | "equipment"
  | "setup"
  | "steps"
  | "cues"
  | "helpsWith"
  | "aka"
  | "tags"
  | "pose"
>;

type ExerciseBrowserProps = {
  exercises: BrowserExercise[];
  relatedBySlug: Record<string, BrowserExercise[]>;
};

function normalise(value: string): string {
  return value.toLowerCase().replace(/['\u2018\u2019]/g, "");
}

function searchableText(exercise: BrowserExercise): string {
  return normalise(
    [
      exercise.title,
      exercise.bodyPart,
      exercise.condition,
      exercise.stage,
      exercise.description,
      ...(exercise.aka ?? []),
      ...(exercise.tags ?? []),
      ...(exercise.helpsWith ?? []),
    ].join(" "),
  );
}

function firstUsefulSteps(exercise: BrowserExercise): string[] {
  return (exercise.steps ?? []).slice(0, 3);
}

export function ExerciseBrowser({ exercises, relatedBySlug }: ExerciseBrowserProps) {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("All");
  const [selectedSlug, setSelectedSlug] = useState(exercises[0]?.slug ?? "");

  const areas = useMemo(
    () => ["All", ...Array.from(new Set(exercises.map((exercise) => exercise.bodyPart)))],
    [exercises],
  );

  const filtered = useMemo(() => {
    const trimmed = normalise(query.trim());
    const tokens = trimmed.split(/\s+/).filter(Boolean);
    return exercises.filter((exercise) => {
      const areaMatch = area === "All" || exercise.bodyPart === area;
      const haystack = searchableText(exercise);
      const queryMatch =
        tokens.length === 0 || tokens.every((token) => haystack.includes(token));
      return areaMatch && queryMatch;
    });
  }, [area, exercises, query]);

  useEffect(() => {
    if (!filtered.length) return;
    if (!filtered.some((exercise) => exercise.slug === selectedSlug)) {
      setSelectedSlug(filtered[0].slug);
    }
  }, [filtered, selectedSlug]);

  const selected =
    exercises.find((exercise) => exercise.slug === selectedSlug) ?? filtered[0] ?? exercises[0];
  const suggestions = selected ? relatedBySlug[selected.slug] ?? [] : [];
  const previewSteps = selected ? firstUsefulSteps(selected) : [];

  if (!selected) return null;

  return (
    <section className="exlib-browser" aria-labelledby="exercise-browser-title">
      <div className="exlib-browser__head">
        <div>
          <span className="eyebrow">Exercise catalogue</span>
          <h2 id="exercise-browser-title">Browse exercises</h2>
          <p>
            Pick an exercise to preview the image, setup, key steps and related
            suggestions.
          </p>
        </div>
        <label className="exlib-browser__search">
          <span>Search</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Shoulder, balance, knee..."
          />
        </label>
      </div>

      <div className="exlib-browser__tabs" role="tablist" aria-label="Filter exercises by area">
        {areas.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={item === area}
            className="exlib-browser__tab"
            onClick={() => setArea(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="exlib-browser__layout">
        <aside className="exlib-browser__list-panel" aria-label="Exercise list">
          <div className="exlib-browser__count">
            {filtered.length} {filtered.length === 1 ? "exercise" : "exercises"}
          </div>
          <ul className="exlib-browser__list">
            {filtered.map((exercise) => (
              <li key={exercise.slug}>
                <button
                  type="button"
                  className="exlib-browser__row"
                  data-active={exercise.slug === selected.slug}
                  onClick={() => setSelectedSlug(exercise.slug)}
                >
                  <ExerciseImage
                    exerciseId={exercise.id}
                    name={exercise.title}
                    pose={exercise.pose}
                    size={72}
                    className="exlib-browser__row-image"
                    variant="thumb"
                  />
                  <span className="exlib-browser__row-copy">
                    <span className="exlib-browser__row-title">{exercise.title}</span>
                    <span className="exlib-browser__row-meta">
                      {exercise.bodyPart} | {exercise.stage}
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {!filtered.length ? (
              <li>
                <p className="exlib-browser__empty">No matching exercises found.</p>
              </li>
            ) : null}
          </ul>
        </aside>

        <article className="exlib-browser__detail">
          <div className="exlib-browser__media">
            <ExerciseImage
              exerciseId={selected.id}
              name={selected.title}
              pose={selected.pose}
              size={560}
              className="exlib-browser__main-image"
              variant="full"
              decorative={false}
            />
          </div>
          <div className="exlib-browser__copy">
            <div className="exlib-browser__chips" aria-label="Exercise details">
              <span>{selected.bodyPart}</span>
              <span>{selected.condition}</span>
              <span>{selected.stage}</span>
            </div>
            <h3>{selected.title}</h3>
            {selected.aka?.length ? (
              <p className="muted">Also known as {selected.aka.join(", ")}.</p>
            ) : null}
            <p>{selected.description}</p>

            <dl className="exlib-browser__facts">
              <div>
                <dt>Equipment</dt>
                <dd>{selected.equipment?.length ? selected.equipment.join(", ") : "None"}</dd>
              </div>
              <div>
                <dt>Best for</dt>
                <dd>{selected.condition}</dd>
              </div>
            </dl>

            {selected.setup ? (
              <div className="exlib-browser__brief">
                <h4>Setup</h4>
                <p>{selected.setup}</p>
              </div>
            ) : null}

            {previewSteps.length ? (
              <div className="exlib-browser__brief">
                <h4>Key steps</h4>
                <ol>
                  {previewSteps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            ) : null}

            <div className="exlib-browser__actions">
              <Link className="button primary" href={`/exercises/${selected.slug}`}>
                Open full guide
              </Link>
              <Link className="button secondary" href="/book">
                Ask a physio
              </Link>
            </div>
          </div>

          {suggestions.length ? (
            <div className="exlib-browser__suggested" aria-labelledby="exercise-browser-suggested">
              <h4 id="exercise-browser-suggested">Suggested next</h4>
              <div className="exlib-browser__suggested-grid">
                {suggestions.map((exercise) => (
                  <Link
                    key={exercise.slug}
                    className="exlib-browser__suggested-card"
                    href={`/exercises/${exercise.slug}`}
                  >
                    <ExerciseImage
                      exerciseId={exercise.id}
                      name={exercise.title}
                      pose={exercise.pose}
                      size={112}
                      className="exlib-browser__suggested-image"
                      variant="thumb"
                    />
                    <span>
                      <strong>{exercise.title}</strong>
                      <small>
                        {exercise.bodyPart} | {exercise.stage}
                      </small>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </article>
      </div>
    </section>
  );
}
