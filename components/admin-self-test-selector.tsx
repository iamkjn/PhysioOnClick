"use client";

import { useMemo, useState } from "react";
import { SelfTestImage } from "@/components/exercise-library/self-test-image";
import type { SelfTestResult } from "@/lib/differential-diagnosis";
import { selfTests, type SelfTest } from "@/lib/self-tests";

interface Props {
  recommendedSlugs: string[];
  selectedSlugs: string[];
  results: SelfTestResult[];
  onSelectedChange: (slugs: string[]) => void;
  onResultsChange: (results: SelfTestResult[]) => void;
  onPresent: (slug: string) => void;
}

function matchesSearch(test: SelfTest, query: string) {
  if (!query) return true;
  return [
    test.name,
    test.bodyArea,
    test.assesses,
    test.whatItChecks,
    ...(test.aka ?? []),
    ...test.conditionSlugs,
  ].some((value) => value.toLowerCase().includes(query));
}

export function AdminSelfTestSelector({
  recommendedSlugs,
  selectedSlugs,
  results,
  onSelectedChange,
  onResultsChange,
  onPresent,
}: Props) {
  const [search, setSearch] = useState("");
  const [area, setArea] = useState("All");
  const [dismissed, setDismissed] = useState<string[]>([]);

  const selectedSet = useMemo(() => new Set(selectedSlugs), [selectedSlugs]);
  const recommendedSet = useMemo(() => new Set(recommendedSlugs), [recommendedSlugs]);
  const dismissedSet = useMemo(() => new Set(dismissed), [dismissed]);
  const testBySlug = useMemo(() => new Map(selfTests.map((test) => [test.slug, test])), []);
  const areas = useMemo(
    () => Array.from(new Set(selfTests.map((test) => test.bodyArea))).sort((a, b) => a.localeCompare(b)),
    [],
  );

  const selectedTests = selectedSlugs
    .map((slug) => testBySlug.get(slug))
    .filter((test): test is SelfTest => Boolean(test));

  const suggestedTests = recommendedSlugs
    .filter((slug) => !selectedSet.has(slug) && !dismissedSet.has(slug))
    .map((slug) => testBySlug.get(slug))
    .filter((test): test is SelfTest => Boolean(test));

  const query = search.trim().toLowerCase();
  const galleryTests = selfTests
    .filter((test) => !selectedSet.has(test.slug) && !suggestedTests.some((suggested) => suggested.slug === test.slug))
    .filter((test) => area === "All" || test.bodyArea === area)
    .filter((test) => matchesSearch(test, query))
    .sort((a, b) => {
      const recommendationDifference = Number(recommendedSet.has(b.slug)) - Number(recommendedSet.has(a.slug));
      return recommendationDifference || a.name.localeCompare(b.name);
    });

  function addTest(slug: string) {
    if (selectedSet.has(slug)) return;
    onSelectedChange([...selectedSlugs, slug]);
  }

  function removeTest(slug: string) {
    onSelectedChange(selectedSlugs.filter((item) => item !== slug));
    onResultsChange(results.filter((result) => result.slug !== slug));
  }

  function setResult(slug: string, result: "positive" | "negative") {
    const existing = results.find((item) => item.slug === slug);
    const next = results.filter((item) => item.slug !== slug);
    next.push(existing?.notes ? { slug, result, notes: existing.notes } : { slug, result });
    onResultsChange(next);
  }

  return (
    <div className="clinical-picker">
      <section className="clinical-picker__section" aria-labelledby="selected-tests-title">
        <div className="clinical-picker__heading">
          <div>
            <span className="clinical-picker__eyebrow">Selected for this session</span>
            <h3 id="selected-tests-title">Test list</h3>
            <p>{selectedTests.length} test{selectedTests.length === 1 ? "" : "s"} ready to use. Remove anything that is not relevant.</p>
          </div>
          {selectedTests.length > 0 && (
            <button type="button" className="button small secondary" onClick={() => onPresent(selectedTests[0].slug)}>
              Present selected tests
            </button>
          )}
        </div>

        {selectedTests.length === 0 ? (
          <div className="clinical-picker__empty">
            <strong>No tests selected</strong>
            <span>Add a suggested test or choose one from the full library below.</span>
          </div>
        ) : (
          <div className="clinical-picker__grid">
            {selectedTests.map((test) => {
              const current = results.find((result) => result.slug === test.slug);
              return (
                <article key={test.slug} className="clinical-picker-card is-selected">
                  {test.steps[0] && (
                    <SelfTestImage imageId={test.steps[0].imageId} label={test.name} stepNumber={1} />
                  )}
                  <div className="clinical-picker-card__body">
                    <div className="clinical-picker-card__badges">
                      <span>{test.bodyArea}</span>
                      {recommendedSet.has(test.slug) && <span className="is-suggested">Suggested</span>}
                    </div>
                    <h4>{test.name}</h4>
                    <p>{test.assesses}</p>
                  </div>
                  <div className="clinical-picker-card__results" aria-label={`Result for ${test.name}`}>
                    <button
                      type="button"
                      className={current?.result === "positive" ? "is-positive" : ""}
                      aria-pressed={current?.result === "positive"}
                      onClick={() => setResult(test.slug, "positive")}
                    >
                      Positive
                    </button>
                    <button
                      type="button"
                      className={current?.result === "negative" ? "is-negative" : ""}
                      aria-pressed={current?.result === "negative"}
                      onClick={() => setResult(test.slug, "negative")}
                    >
                      Negative
                    </button>
                  </div>
                  <div className="clinical-picker-card__actions">
                    <button type="button" className="session-text-button" onClick={() => onPresent(test.slug)}>
                      Present
                    </button>
                    <button type="button" className="session-text-button session-text-button--danger" onClick={() => removeTest(test.slug)}>
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {suggestedTests.length > 0 && (
        <section className="clinical-picker__section clinical-picker__section--suggested" aria-labelledby="suggested-tests-title">
          <div className="clinical-picker__heading">
            <div>
              <span className="clinical-picker__eyebrow">Matched to the assessment</span>
              <h3 id="suggested-tests-title">Suggested tests</h3>
              <p>Add a useful check or cancel a suggestion without removing it from the full library.</p>
            </div>
          </div>
          <div className="clinical-picker__grid clinical-picker__grid--compact">
            {suggestedTests.map((test) => (
              <article key={test.slug} className="clinical-picker-card is-suggested">
                <button
                  type="button"
                  className="clinical-picker-card__dismiss"
                  aria-label={`Cancel ${test.name} suggestion`}
                  title="Cancel suggestion"
                  onClick={() => setDismissed((current) => [...current, test.slug])}
                >
                  ×
                </button>
                {test.steps[0] && (
                  <SelfTestImage imageId={test.steps[0].imageId} label={test.name} stepNumber={1} />
                )}
                <div className="clinical-picker-card__body">
                  <div className="clinical-picker-card__badges"><span>{test.bodyArea}</span></div>
                  <h4>{test.name}</h4>
                  <p>{test.assesses}</p>
                </div>
                <button type="button" className="button small primary" onClick={() => addTest(test.slug)}>
                  Add test
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="clinical-picker__section" aria-labelledby="all-tests-title">
        <div className="clinical-picker__heading">
          <div>
            <span className="clinical-picker__eyebrow">Complete catalogue</span>
            <h3 id="all-tests-title">All available tests</h3>
            <p>Search the full test library and add any clinically appropriate check.</p>
          </div>
          <label className="clinical-picker__search">
            <span className="sr-only">Search tests</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tests, body area or condition"
            />
          </label>
        </div>
        <div className="exercise-filter-row" role="tablist" aria-label="Filter tests by body area">
          {["All", ...areas].map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={area === option}
              className={`exercise-filter-pill${area === option ? " active" : ""}`}
              onClick={() => setArea(option)}
            >
              {option}
            </button>
          ))}
        </div>
        {galleryTests.length === 0 ? (
          <div className="clinical-picker__empty"><strong>No tests match this search</strong></div>
        ) : (
          <div className="clinical-picker__grid clinical-picker__grid--compact">
            {galleryTests.map((test) => (
              <article key={test.slug} className="clinical-picker-card">
                {test.steps[0] && (
                  <SelfTestImage imageId={test.steps[0].imageId} label={test.name} stepNumber={1} />
                )}
                <div className="clinical-picker-card__body">
                  <div className="clinical-picker-card__badges">
                    <span>{test.bodyArea}</span>
                    {recommendedSet.has(test.slug) && <span className="is-suggested">Suggested</span>}
                  </div>
                  <h4>{test.name}</h4>
                  <p>{test.assesses}</p>
                </div>
                <button type="button" className="button small secondary" onClick={() => addTest(test.slug)}>
                  Add test
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
