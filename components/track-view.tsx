"use client";

import { useEffect } from "react";

import { trackLibraryEvent, type LibraryEvent } from "@/lib/analytics";

/**
 * Fires a library *_view analytics event once on mount. Renders nothing, so it
 * can be dropped into a server-rendered page body without affecting the DOM.
 */
export function TrackView({
  event,
  slug,
}: {
  event: LibraryEvent;
  slug: string;
}) {
  useEffect(() => {
    trackLibraryEvent(event, slug);
  }, [event, slug]);

  return null;
}
