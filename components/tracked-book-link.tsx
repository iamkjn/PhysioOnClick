"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { track } from "@/lib/analytics";

/**
 * A drop-in <Link> that logs an analytics event before navigating. Defaults to
 * `service_book_click` with `{ service_slug, source }`; callers can override the
 * event name and merge extra params (e.g. the exercise-library CTA fires
 * `library_cta_click` with a `slug`). Client component so it can call the
 * (browser-only) track(); safe to render inside server components.
 */
export function TrackedBookLink({
  href,
  className,
  serviceSlug,
  source,
  event = "service_book_click",
  params,
  children,
}: {
  href: string;
  className?: string;
  serviceSlug: string;
  source: string;
  event?: string;
  params?: Record<string, unknown>;
  children: ReactNode;
}) {
  return (
    <Link
      className={className}
      href={href}
      onClick={() =>
        track(event, { service_slug: serviceSlug, source, ...params })
      }
    >
      {children}
    </Link>
  );
}
