"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useId, useMemo, useRef, useState } from "react";

import type { SearchItem } from "@/lib/firestore-content";

export function SearchExperience({
  initialQuery = "",
  scope = "general",
  items
}: {
  initialQuery?: string;
  scope?: string;
  items: SearchItem[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const resultsHeadingId = useId();

  const keywordOptions = useMemo(() => {
    if (scope === "blog") return ["Knee injuries", "Back pain", "Sciatica", "Shoulder rehab", "Workplace ergonomics"];
    if (scope === "service") return ["Musculoskeletal Physiotherapy", "Post-Surgical Rehabilitation", "Online Rehab"];
    if (scope === "pricing") return ["Initial", "Follow-Up", "Bundle"];
    return ["Knee pain", "Back pain", "Online physio", "Shoulder rehab", "ACL recovery", "Sciatica"];
  }, [scope]);

  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    const scopedItems = items.filter((item) => {
      if (scope === "blog") return item.type === "Blog";
      if (scope === "service") return item.type === "Service";
      if (scope === "pricing") return item.type === "Pricing";
      return true;
    });

    if (!value) {
      return scopedItems.slice(0, 9);
    }

    return scopedItems.filter((item) => {
      const haystack = `${item.title} ${item.description} ${item.type}`.toLowerCase();
      return haystack.includes(value);
    });
  }, [items, query, scope]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();

    if (!value) {
      setError("Enter a keyword like knee pain, pricing or online physio.");
      return;
    }

    setError("");
    router.push(`${pathname}?q=${encodeURIComponent(value)}&scope=${scope}`);
  }

  function clearSearch() {
    setQuery("");
    setError("");
    router.push(`${pathname}?scope=${scope}`);
    inputRef.current?.focus();
  }

  function handleKeywordClick(value: string) {
    setQuery(value);
    setError("");
    router.push(`${pathname}?q=${encodeURIComponent(value)}&scope=${scope}`);
  }

  const trimmedQuery = query.trim();
  const resultsAnnouncement = trimmedQuery
    ? `${results.length} result${results.length === 1 ? "" : "s"} for "${trimmedQuery}"`
    : `Showing ${results.length} suggested result${results.length === 1 ? "" : "s"}`;

  return (
    <div className="search-experience">
      <form className="search-bar" role="search" aria-label="Site search" onSubmit={submitSearch}>
        <label htmlFor={inputId} className="sr-only">
          Search the website
        </label>
        <input
          id={inputId}
          ref={inputRef}
          placeholder="Search services, pricing or blog articles"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (error) {
              setError("");
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && query) {
              event.preventDefault();
              clearSearch();
            }
          }}
        />
        {query ? (
          <button className="button secondary" onClick={clearSearch} type="button">
            Clear
          </button>
        ) : null}
        <button className="button primary" type="submit">
          Search
        </button>
      </form>
      {error ? <p className="search-form-error" role="alert">{error}</p> : null}
      <div className="search-suggestion-strip" role="group" aria-label="Popular searches">
        {keywordOptions.map((option) => (
          <button className="search-keyword-chip" key={option} type="button" onClick={() => handleKeywordClick(option)}>
            {option}
          </button>
        ))}
      </div>

      <div className="search-results" role="region" aria-live="polite" aria-labelledby={resultsHeadingId}>
        <h2 id={resultsHeadingId} className="sr-only">
          Search results
        </h2>
        <p className="sr-only">{resultsAnnouncement}</p>
        {results.length ? (
          results.map((item, index) => (
            <Link className="search-result-card" href={item.href} key={`${item.type}-${item.href}-${index}`}>
              <span className="search-type">{item.type}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </Link>
          ))
        ) : (
          <div className="search-empty">
            <h3>No results found</h3>
            <p>Try a broader term like back pain, knee rehab, online physio or assessment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
