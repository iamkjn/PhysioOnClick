"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { track } from "@/lib/analytics";

/**
 * A drop-in <Link> that logs an analytics event before navigating. Defaults to
 * `service_book_click` with `{ service_slug, source }` -- `serviceSlug` is
 * optional, for CTAs that aren't tied to one specific service, and is only
 * included in the fired params when given. Callers can override the event
 * name and merge extra params (e.g. the exercise-library CTA fires
 * `library_cta_click` with a `slug`).
 *
 * `extraEvent` (with an optional `extraSource` override) fires a *second*,
 * sitewide rollup event from the same click -- e.g. every primary "book now"
 * CTA also logs `book_now_click` so it can be analysed as one event across
 * pages, without replacing the page/CTA-specific event above. Client
 * component so it can call the (browser-only) track(); safe to render inside
 * server components.
 */
export function TrackedBookLink({
  href,
  className,
  serviceSlug,
  source,
  event = "service_book_click",
  params,
  extraEvent,
  extraSource,
  children,
}: {
  href: string;
  className?: string;
  serviceSlug?: string;
  source: string;
  event?: string;
  params?: Record<string, unknown>;
  extraEvent?: string;
  extraSource?: string;
  children: ReactNode;
}) {
  return (
    <Link
      className={className}
      href={href}
      onClick={() => {
        track(event, {
          ...(serviceSlug ? { service_slug: serviceSlug } : {}),
          source,
          ...params,
        });
        if (extraEvent) {
          track(extraEvent, { source: extraSource ?? source });
        }
      }}
    >
      {children}
    </Link>
  );
}
