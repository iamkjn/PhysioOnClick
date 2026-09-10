"use client";

// Symptom-aware type-ahead over the exercise library. The server index page
// passes the whole catalogue as a serialisable `SearchItem[]` prop (title/name
// plus a pre-joined `terms` string per item) and this ranks it client-side with
// the shared pure matcher - no fetch. Up to 12 ranked results, exercises and
// conditions interleaved by score.

import { useState } from "react";
import Link from "next/link";

import { searchItems, type SearchItem } from "@/lib/exercise-library";

export function LibrarySearch({ items }: { items: SearchItem[] }) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const results = trimmed ? searchItems(items, query) : [];

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

      {trimmed !== "" && results.length > 0 && (
        <ul className="exlib-search__results">
          {results.map((item) => (
            <li key={`${item.kind}-${item.slug}`}>
              <Link
                href={
                  item.kind === "exercise"
                    ? `/exercises/${item.slug}`
                    : `/exercises/for/${item.slug}`
                }
                className="exlib-search__result"
              >
                <span className="exlib-search__kind" aria-hidden="true">
                  {item.kind === "exercise" ? "Exercise" : "Condition"}
                </span>
                <span className="exlib-search__label">
                  {item.kind === "exercise" ? item.title : item.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {trimmed !== "" && results.length === 0 && (
        <p className="exlib-search__empty">
          No matches - try a body part, a condition name, or how it feels.
        </p>
      )}
    </div>
  );
}
