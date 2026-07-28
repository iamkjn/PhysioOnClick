"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { track } from "@/lib/analytics";

/**
 * A drop-in <Link> that logs a `service_book_click` analytics event before
 * navigating. Client component so it can call the (browser-only) track(); safe
 * to render inside server components like the /services page.
 */
export function TrackedBookLink({
  href,
  className,
  serviceSlug,
  source,
  children,
}: {
  href: string;
  className?: string;
  serviceSlug: string;
  source: string;
  children: ReactNode;
}) {
  return (
    <Link
      className={className}
      href={href}
      onClick={() => track("service_book_click", { service_slug: serviceSlug, source })}
    >
      {children}
    </Link>
  );
}
