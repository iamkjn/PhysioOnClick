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
      <p>
        <strong>© {year} PhysioOnClick.</strong> {content} our original work. They are free to
        view for your own personal use. They may not be copied, screenshotted for redistribution, or reused in
        professional, clinical or commercial material without our written permission.
      </p>
      <p>
        Are you a professional who would like to use our content?{" "}
        <Link href="/contact">Contact us</Link>. Full details are in our{" "}
        <Link href="/terms#intellectual-property">terms</Link>.
      </p>
    </aside>
  );
}
