"use client";

// In-memory type-ahead over the exercise library. The server page (Task 9)
// passes the whole searchable index as a serialisable `items` prop — a slim
// {slug,title,aka} / {slug,name,aka} shape — and this filters it client-side
// with no fetch. Up to 8 exercise + 8 condition results.

import { useState } from "react";

type ExerciseItem = { slug: string; title: string; aka?: string[] };
type ConditionItem = { slug: string; name: string; aka?: string[] };

const LIMIT = 8;

export function LibrarySearch({
  items,
}: {
  items: { exercises: ExerciseItem[]; conditions: ConditionItem[] };
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();

  const matches = (haystack: string[]) =>
    haystack.some((value) => value.toLowerCase().includes(needle));

  const exerciseHits = needle
    ? items.exercises
        .filter((item) => matches([item.title, ...(item.aka ?? [])]))
        .slice(0, LIMIT)
    : [];
  const conditionHits = needle
    ? items.conditions
        .filter((item) => matches([item.name, ...(item.aka ?? [])]))
        .slice(0, LIMIT)
    : [];

  const total = exerciseHits.length + conditionHits.length;

  return (
    <div className="exlib-search">
      <input
        type="search"
        className="exlib-search__input"
        placeholder="Search exercises and conditions"
        aria-label="Search exercises and conditions"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {needle !== "" && total > 0 && (
        <ul className="exlib-search__results">
          {exerciseHits.map((item) => (
            <li key={`exercise-${item.slug}`}>
              <a
                href={`/exercises/${item.slug}`}
                className="exlib-search__result"
              >
                <span className="exlib-search__kind" aria-hidden="true">
                  Exercise
                </span>
                <span className="exlib-search__label">{item.title}</span>
              </a>
            </li>
          ))}
          {conditionHits.map((item) => (
            <li key={`condition-${item.slug}`}>
              <a
                href={`/exercises/for/${item.slug}`}
                className="exlib-search__result"
              >
                <span className="exlib-search__kind" aria-hidden="true">
                  Condition
                </span>
                <span className="exlib-search__label">{item.name}</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {needle !== "" && total === 0 && (
        <p className="exlib-search__empty">No matches. Try a different word.</p>
      )}
    </div>
  );
}
