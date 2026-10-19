// Ownership + permitted-use notice shown under every /exercises/** page
// (mounted once in app/exercises/layout.tsx) and under every blog article.
// Server component.

import Link from "next/link";

export function LibraryCopyrightNotice({
  content = "The exercise descriptions, illustrations and self-check guides in this library are",
  inset = false,
}: {
  /** Subject of the ownership sentence, ending in "is"/"are". */
  content?: string;
  /** True when already inside a `.site-shell` (skips the extra width clamp). */
  inset?: boolean;
}) {
  const year = new Date().getFullYear();
  return (
    <aside
      className={inset ? "exlib-copyright" : "site-shell exlib-copyright"}
      aria-label="Copyright notice"
    >
      {/* Kept to one line: it repeats on every exercise, blog and service page,
          and the full permitted-use wording lives in the terms. */}
      <p>
        <strong>© {year} PhysioOnClick.</strong> {content} our original work, free to view for
        personal use. Any other use needs our written permission:{" "}
        <Link href="/contact">contact us</Link> or see our{" "}
        <Link href="/terms#intellectual-property">terms</Link>.
      </p>
    </aside>
  );
}
