import type { ReactNode } from "react";

// Prices stay visible to patients, but `data-nosnippet` asks Google not to quote
// them in search snippets or its AI answers (owner decision, 2026-11-25).
// Google only honours it on span, div and section.

/** Wrap a price element. */
export function NoSnippet({ children }: { children: ReactNode }) {
  return <span data-nosnippet="">{children}</span>;
}

const PRICE = /((?:£\s?\d[\d,]*(?:\.\d+)?(?:[–-]£?\d+)?)|(?:\b\d+ pounds\b))/;

/** Same, for copy that has prices inside a sentence. */
export function noSnippetPrices(text: string): ReactNode {
  const parts = text.split(PRICE);
  if (parts.length === 1) return text;
  return parts.map((part, i) => (i % 2 ? <NoSnippet key={i}>{part}</NoSnippet> : part));
}
