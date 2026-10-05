/** A cited source shown under a guide or landing page. Every URL must also be
 *  recorded, with a quote, in docs/seo/phase-b-sources.md. */
export type Source = { label: string; url: string };
/** An internal "related reading" link. `href` is a site-relative path. */
export type RelatedLink = { label: string; href: string };

/** Removes markdown-style `[label](/path)` links, keeping the label. Use for
 *  plain-text destinations such as JSON-LD, where link syntax must not leak. */
export function stripLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1");
}
