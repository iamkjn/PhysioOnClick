/** A cited source shown under a guide or landing page. Every URL must also be
 *  recorded, with a quote, in docs/seo/phase-b-sources.md. */
export type Source = { label: string; url: string };
/** An internal "related reading" link. `href` is a site-relative path. */
export type RelatedLink = { label: string; href: string };
